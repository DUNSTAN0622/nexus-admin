import { redirect } from "next/navigation";
import DashboardShell, {
  type DashboardNavItem,
} from "@/components/dashboard/DashboardShell";
import { getUserProfile } from "@/utils/auth";
import {
  getRoleLabel,
  hasRole,
  type UserRole,
} from "@/utils/rbac";

type DashboardNavConfig = DashboardNavItem & {
  allowedRoles?: readonly UserRole[];
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getUserProfile();

  if (!profile) {
    redirect("/login");
  }

  const displayName = profile.fullName ?? "未設定姓名";
  const roleLabel = getRoleLabel(profile.role);
  const navConfigs: DashboardNavConfig[] = [
    { href: "/dashboard", icon: "dashboard", label: "工作台" },
    {
      href: "/dashboard/analytics",
      icon: "analytics",
      label: "分析總覽",
      allowedRoles: ["admin", "manager"],
    },
    { href: "/dashboard/production", icon: "production", label: "生產管理" },
    {
      href: "/dashboard/customers",
      icon: "customers",
      label: "客戶管理",
      allowedRoles: ["admin", "manager"],
    },
    { href: "/dashboard/materials", icon: "materials", label: "物料管理" },
    {
      href: "/dashboard/users",
      icon: "users",
      label: "使用者管理",
      allowedRoles: ["admin"],
    },
  ];
  const navigationItems: DashboardNavItem[] = navConfigs
    .filter(
      (navigationItem) =>
        !navigationItem.allowedRoles ||
        hasRole(profile.role, navigationItem.allowedRoles),
    )
    .map(({ href, icon, label }) => ({
      href,
      icon,
      label,
    }));

  return (
    <DashboardShell
      displayName={displayName}
      navItems={navigationItems}
      roleLabel={roleLabel}
    >
      {children}
    </DashboardShell>
  );
}
