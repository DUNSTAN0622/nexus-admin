"use server";

import { revalidatePath } from "next/cache";
import type { MutationState } from "@/types/actions";
import { createAdminSupabaseClient, getUserProfile } from "@/utils/auth";
import { canInboundMaterials, canManageMaterials } from "@/utils/rbac";

type CreateMaterialInput = {
  sku: string;
  name: string;
  quantity: number;
  unit: string;
};

type MaterialQuantityRow = {
  quantity: number | null;
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

export async function createMaterial(
  input: CreateMaterialInput,
): Promise<MutationState> {
  const profile = await getUserProfile();

  if (!profile) {
    return createErrorState("請先登入後再新增物料。");
  }

  if (!canManageMaterials(profile.role)) {
    return createErrorState("只有系統管理員可以新增物料。");
  }

  const sku = input.sku.trim();
  const name = input.name.trim();
  const unit = input.unit.trim();
  const quantity = Number(input.quantity);

  if (!sku) {
    return createErrorState("請輸入物料 SKU。");
  }

  if (!name) {
    return createErrorState("請輸入物料名稱。");
  }

  if (!unit) {
    return createErrorState("請輸入單位。");
  }

  if (!Number.isFinite(quantity) || quantity < 0) {
    return createErrorState("期初庫存必須是大於或等於 0 的數字。");
  }

  const supabase = createAdminSupabaseClient();
  const { error } = await supabase.from("materials").insert([
    {
      sku,
      name,
      quantity,
      unit,
    },
  ]);

  if (error) {
    return createErrorState(error.message);
  }

  revalidatePath("/dashboard/materials");

  return createSuccessState();
}

export async function addMaterialStock(
  id: string,
  addAmount: number,
): Promise<MutationState> {
  const profile = await getUserProfile();

  if (!profile) {
    return createErrorState("請先登入後再進行入庫。");
  }

  if (!canInboundMaterials(profile.role)) {
    return createErrorState("目前的帳號權限無法進行入庫。");
  }

  const materialId = id.trim();
  const inboundAmount = Number(addAmount);

  if (!materialId) {
    return createErrorState("缺少物料識別碼。");
  }

  if (!Number.isFinite(inboundAmount) || inboundAmount <= 0) {
    return createErrorState("入庫數量必須大於 0。");
  }

  const supabase = createAdminSupabaseClient();
  const { data: material, error: materialError } = await supabase
    .from("materials")
    .select("quantity")
    .eq("id", materialId)
    .maybeSingle<MaterialQuantityRow>();

  if (materialError) {
    return createErrorState(materialError.message);
  }

  if (!material) {
    return createErrorState("找不到指定的物料資料。");
  }

  const currentQuantity = Number(material.quantity ?? 0);
  const nextQuantity = currentQuantity + inboundAmount;
  const { error: updateError } = await supabase
    .from("materials")
    .update({ quantity: nextQuantity })
    .eq("id", materialId);

  if (updateError) {
    return createErrorState(updateError.message);
  }

  revalidatePath("/dashboard/materials");

  return createSuccessState();
}
