"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  DashboardNavIcon,
  type DashboardIconName,
} from "@/components/dashboard/icons";

type SidebarLinkProps = {
  href: string;
  icon: DashboardIconName;
  label: string;
  onNavigate?: () => void;
};

function isActivePath(pathname: string, href: string) {
  if (href === "/dashboard") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function SidebarLink({
  href,
  icon,
  label,
  onNavigate,
}: SidebarLinkProps) {
  const pathname = usePathname();
  const active = isActivePath(pathname, href);

  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={`flex w-full items-start gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${
        active
          ? "bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-900/20"
          : "text-slate-300 hover:bg-white/5 hover:text-white"
      }`}
    >
      <span
        className={`flex size-9 items-center justify-center rounded-2xl ${
          active ? "bg-slate-950/12" : "bg-white/5 text-slate-400"
        }`}
      >
        <DashboardNavIcon name={icon} className="size-4" />
      </span>
      <span className="min-w-0 flex-1 break-words leading-5">{label}</span>
    </Link>
  );
}
