"use server";

import { revalidatePath } from "next/cache";
import { createAdminSupabaseClient, getUserProfile } from "@/utils/auth";
import { canAccessUsers, type UserRole } from "@/utils/rbac";

const ALLOWED_ROLES = new Set<UserRole>(["admin", "manager", "operator"]);

export async function updateUserRole(userId: string, newRole: UserRole) {
  const profile = await getUserProfile();

  if (!profile) {
    return { error: "請先登入後再調整使用者角色。" };
  }

  if (!canAccessUsers(profile.role)) {
    return { error: "只有系統管理員可以調整使用者角色。" };
  }

  const trimmedUserId = userId.trim();

  if (!trimmedUserId) {
    return { error: "缺少使用者識別碼。" };
  }

  if (!ALLOWED_ROLES.has(newRole)) {
    return { error: "指定的角色無效。" };
  }

  const supabase = createAdminSupabaseClient();
  const { error } = await supabase
    .from("employees")
    .update({ role: newRole })
    .eq("id", trimmedUserId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/users");

  return { success: true as const };
}
