"use server";

import { revalidatePath } from "next/cache";
import { createAdminSupabaseClient, getUserProfile } from "@/utils/auth";
import type { MutationState } from "@/types/actions";
import type {
  Customer,
  FinishedGood,
  WorkOrderWithFinishedGood,
} from "@/types/database";
import { canManageCustomers } from "@/utils/rbac";
import { buildSearchPattern } from "@/utils/search";
import {
  normalizeWorkOrderRow,
  type WorkOrderWithFinishedGoodRow,
} from "@/utils/work-orders";

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

async function requireAuthenticatedProfile() {
  const profile = await getUserProfile();

  if (!profile) {
    throw new Error("Unauthorized");
  }

  return profile;
}

export async function getCustomers(): Promise<Customer[]> {
  await requireAuthenticatedProfile();

  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("customers")
    .select("id, name, country_code, total_spent, created_at")
    .order("name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as Customer[];
}

export async function getFinishedGoods(): Promise<FinishedGood[]> {
  await requireAuthenticatedProfile();

  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("finished_goods")
    .select("id, sku, name, stock, price, created_at")
    .order("name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as FinishedGood[];
}

export async function getWorkOrders(
  searchKeyword = "",
): Promise<WorkOrderWithFinishedGood[]> {
  await requireAuthenticatedProfile();

  const supabase = createAdminSupabaseClient();
  const normalizedSearchKeyword = searchKeyword.trim();
  let workOrdersQuery = supabase
    .from("work_orders")
    .select("*, finished_goods(name)")
    .order("created_at", { ascending: false });

  if (normalizedSearchKeyword) {
    workOrdersQuery = workOrdersQuery.ilike(
      "order_number",
      buildSearchPattern(normalizedSearchKeyword),
    );
  }

  const { data, error } = await workOrdersQuery;

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as WorkOrderWithFinishedGoodRow[];

  return rows.map(normalizeWorkOrderRow);
}

export async function addCustomer(formData: FormData): Promise<MutationState> {
  const profile = await getUserProfile();

  if (!profile) {
    return createErrorState("請先登入後再新增客戶。");
  }

  if (!canManageCustomers(profile.role)) {
    return createErrorState("只有系統管理員與主管可以新增客戶。");
  }

  const name = String(formData.get("name") ?? "").trim();
  const countryCode = String(formData.get("country_code") ?? "")
    .trim()
    .toUpperCase();

  if (!name) {
    return createErrorState("請輸入客戶名稱。");
  }

  if (!/^[A-Z]{2}$/.test(countryCode)) {
    return createErrorState("請選擇有效的國家代碼。");
  }

  const supabase = createAdminSupabaseClient();
  const { error } = await supabase.from("customers").insert([
    {
      name,
      country_code: countryCode,
      total_spent: 0,
    },
  ]);

  if (error) {
    return createErrorState(error.message);
  }

  revalidatePath("/dashboard/customers");

  return createSuccessState();
}

export async function submitAddCustomer(
  _previousState: MutationState,
  formData: FormData,
): Promise<MutationState> {
  return addCustomer(formData);
}

export async function deleteCustomer(id: string): Promise<MutationState> {
  const profile = await getUserProfile();

  if (!profile) {
    return createErrorState("請先登入後再刪除客戶。");
  }

  if (!canManageCustomers(profile.role)) {
    return createErrorState("只有系統管理員與主管可以刪除客戶。");
  }

  const customerId = id.trim();

  if (!customerId) {
    return createErrorState("缺少客戶識別碼。");
  }

  const supabase = createAdminSupabaseClient();
  const { error } = await supabase
    .from("customers")
    .delete()
    .eq("id", customerId);

  if (error) {
    return createErrorState(error.message);
  }

  revalidatePath("/dashboard/customers");

  return createSuccessState();
}
