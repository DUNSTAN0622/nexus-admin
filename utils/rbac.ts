export const ROLE_MAP = {
  admin: "系統管理員",
  manager: "部門主管",
  operator: "現場操作員",
} as const;

export type UserRole = keyof typeof ROLE_MAP;

export type StoredUserRole = UserRole | "warehouse";

export const ROLE_OPTIONS = (
  Object.entries(ROLE_MAP) as Array<[UserRole, string]>
).map(([value, label]) => ({
  value,
  label,
}));

export function normalizeUserRole(role: string | null | undefined): UserRole | null {
  if (!role) {
    return null;
  }

  if (role === "warehouse") {
    return "manager";
  }

  return role in ROLE_MAP ? (role as UserRole) : null;
}

export function getRoleLabel(role: UserRole | null) {
  if (!role) {
    return "尚未設定";
  }

  return ROLE_MAP[role];
}

export function hasRole(
  role: UserRole | null,
  allowedRoles: readonly UserRole[],
) {
  return !!role && allowedRoles.includes(role);
}

export function canAccessUsers(role: UserRole | null) {
  return hasRole(role, ["admin"]);
}

export function canAccessAnalytics(role: UserRole | null) {
  return hasRole(role, ["admin", "manager"]);
}

export function canAccessCustomers(role: UserRole | null) {
  return hasRole(role, ["admin", "manager"]);
}

export function canManageMaterials(role: UserRole | null) {
  return hasRole(role, ["admin"]);
}

export function canInboundMaterials(role: UserRole | null) {
  return hasRole(role, ["admin", "operator"]);
}

export function canManageCustomers(role: UserRole | null) {
  return hasRole(role, ["admin", "manager"]);
}

export function canManageWorkOrders(role: UserRole | null) {
  return hasRole(role, ["admin", "manager"]);
}

export function canOperateWorkOrders(role: UserRole | null) {
  return hasRole(role, ["admin", "operator"]);
}

export function canStartWorkOrders(role: UserRole | null) {
  return hasRole(role, ["admin"]);
}

export function canCancelWorkOrders(role: UserRole | null) {
  return hasRole(role, ["admin"]);
}

export function canCompleteWorkOrders(role: UserRole | null) {
  return hasRole(role, ["admin", "operator"]);
}
