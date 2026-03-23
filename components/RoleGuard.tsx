import { ReactNode } from "react";
import { getUserProfile } from "@/utils/auth";
import { type UserRole } from "@/utils/rbac";

type RoleGuardProps = {
  allowedRoles: UserRole[];
  children: ReactNode;
  fallback?: ReactNode;
};

export default async function RoleGuard({
  allowedRoles,
  children,
  fallback = null,
}: RoleGuardProps) {
  const profile = await getUserProfile();

  if (!profile?.role || !allowedRoles.includes(profile.role)) {
    return fallback;
  }

  return <>{children}</>;
}
