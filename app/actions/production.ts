"use server";

import { revalidatePath } from "next/cache";
import type { MutationState } from "@/types/actions";
import type { WorkOrderStatus } from "@/types/database";
import { createAdminSupabaseClient, getUserProfile } from "@/utils/auth";
import { canManageWorkOrders } from "@/utils/rbac";
import {
  canMutateWorkOrderStatus,
  canTransitionWorkOrderStatus,
  getWorkOrderStatusMeta,
  isWorkOrderStatus,
} from "@/utils/work-orders";

type WorkOrderStatusMutationResult =
  | {
      success: true;
      error: null;
      status: WorkOrderStatus;
    }
  | {
      success: false;
      error: string;
      status?: never;
    };

type OrderNumberRow = {
  order_number: string | null;
};

function createErrorState(error: string): MutationState {
  return {
    success: false,
    error,
  };
}

function createSuccessState(): MutationState {
  return {
    success: true,
    error: null,
  };
}

function formatWorkOrderDateStamp(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}${month}${day}`;
}

function isDuplicateKeyError(message: string) {
  return /duplicate key|unique/i.test(message);
}

export async function createWorkOrder(
  formData: FormData,
): Promise<MutationState> {
  const profile = await getUserProfile();

  if (!profile) {
    return createErrorState("請先登入後再建立工單。");
  }

  if (!canManageWorkOrders(profile.role)) {
    return createErrorState("只有系統管理員與主管可以建立工單。");
  }

  const productId = String(formData.get("product_id") ?? "").trim();
  const targetQuantity = Number.parseInt(
    String(formData.get("target_quantity") ?? "").trim(),
    10,
  );

  if (!productId) {
    return createErrorState("請選擇要生產的成品。");
  }

  if (!Number.isInteger(targetQuantity) || targetQuantity <= 0) {
    return createErrorState("目標數量必須是大於 0 的整數。");
  }

  const supabase = createAdminSupabaseClient();
  const { data: product, error: productError } = await supabase
    .from("finished_goods")
    .select("id")
    .eq("id", productId)
    .maybeSingle<{ id: string }>();

  if (productError) {
    return createErrorState(productError.message);
  }

  if (!product) {
    return createErrorState("找不到指定的成品資料。");
  }

  const dateStamp = formatWorkOrderDateStamp(new Date());
  const orderPrefix = `WO-${dateStamp}-`;
  const { data: latestOrders, error: latestOrderError } = await supabase
    .from("work_orders")
    .select("order_number")
    .like("order_number", `${orderPrefix}%`)
    .order("order_number", { ascending: false })
    .limit(1);

  if (latestOrderError) {
    return createErrorState(latestOrderError.message);
  }

  const latestOrderNumber =
    ((latestOrders ?? []) as OrderNumberRow[])[0]?.order_number ?? null;
  const parsedSequence = Number.parseInt(latestOrderNumber?.slice(-4) ?? "0", 10);
  const baseSequence = Number.isInteger(parsedSequence) ? parsedSequence : 0;

  for (let attempt = 1; attempt <= 5; attempt += 1) {
    const orderNumber = `${orderPrefix}${String(baseSequence + attempt).padStart(4, "0")}`;
    const { error } = await supabase.from("work_orders").insert([
      {
        order_number: orderNumber,
        product_id: productId,
        target_quantity: targetQuantity,
        status: "pending",
        created_by: profile.id,
      },
    ]);

    if (!error) {
      revalidatePath("/dashboard/production");
      return createSuccessState();
    }

    if (!isDuplicateKeyError(error.message)) {
      return createErrorState(error.message);
    }
  }

  return createErrorState("工單編號產生失敗，請稍後再試。");
}

export async function submitCreateWorkOrder(
  _previousState: MutationState,
  formData: FormData,
): Promise<MutationState> {
  return createWorkOrder(formData);
}

export async function updateWorkOrderStatus(
  orderId: string,
  newStatus: string,
): Promise<WorkOrderStatusMutationResult> {
  const profile = await getUserProfile();

  if (!profile) {
    return { success: false, error: "請先登入後再更新工單狀態。" };
  }

  const trimmedOrderId = orderId.trim();
  const normalizedStatus = newStatus.trim();

  if (!trimmedOrderId) {
    return { success: false, error: "缺少工單識別碼。" };
  }

  if (!normalizedStatus) {
    return { success: false, error: "缺少目標狀態。" };
  }

  if (!isWorkOrderStatus(normalizedStatus)) {
    return { success: false, error: "指定的工單狀態無效。" };
  }

  const supabase = createAdminSupabaseClient();
  const { data: workOrder, error: workOrderError } = await supabase
    .from("work_orders")
    .select("status")
    .eq("id", trimmedOrderId)
    .maybeSingle<{ status: WorkOrderStatus | null }>();

  if (workOrderError) {
    return { success: false, error: workOrderError.message };
  }

  if (!workOrder) {
    return { success: false, error: "找不到指定的工單。" };
  }

  const currentStatus = workOrder.status;

  if (currentStatus === normalizedStatus) {
    return {
      success: true,
      error: null,
      status: normalizedStatus,
    };
  }

  if (!canTransitionWorkOrderStatus(currentStatus, normalizedStatus)) {
    return {
      success: false,
      error: `工單目前為「${getWorkOrderStatusMeta(currentStatus).label}」，無法切換為「${getWorkOrderStatusMeta(normalizedStatus).label}」。`,
    };
  }

  if (!canMutateWorkOrderStatus(profile.role, currentStatus, normalizedStatus)) {
    return {
      success: false,
      error: "目前的帳號權限無法執行這個工單操作。",
    };
  }

  const updatePayload: {
    status: WorkOrderStatus;
    completed_at?: string | null;
  } = {
    status: normalizedStatus,
  };

  if (normalizedStatus === "completed") {
    updatePayload.completed_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from("work_orders")
    .update(updatePayload)
    .eq("id", trimmedOrderId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard/production");

  if (normalizedStatus === "completed") {
    revalidatePath("/dashboard/materials");
  }

  return {
    success: true,
    error: null,
    status: normalizedStatus,
  };
}
