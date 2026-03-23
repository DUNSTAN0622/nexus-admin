"use client";

import { useState } from "react";
import LogoutButton from "@/components/dashboard/LogoutButton";
import SidebarLink from "@/components/dashboard/SidebarLink";
import {
  BuildingIcon,
  CloseIcon,
  MenuIcon,
  type DashboardIconName,
} from "@/components/dashboard/icons";

export type DashboardNavItem = {
  href: string;
  icon: DashboardIconName;
  label: string;
};

type DashboardShellProps = {
  children: React.ReactNode;
  displayName: string;
  navItems: DashboardNavItem[];
  roleLabel: string;
};

function getInitials(displayName: string) {
  const nameParts = displayName.trim().split(/\s+/).filter(Boolean);

  if (nameParts.length === 0) {
    return "NA";
  }

  return nameParts
    .slice(0, 2)
    .map((namePart) => namePart.charAt(0).toUpperCase())
    .join("");
}

export default function DashboardShell({
  children,
  displayName,
  navItems,
  roleLabel,
}: DashboardShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#0f172a] text-slate-200">
      {isSidebarOpen ? (
        <div
          className="fixed inset-0 z-40 bg-black/50 transition-opacity lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      ) : null}

      <aside
        id="mobile-dashboard-sidebar"
        className={`fixed inset-y-0 left-0 z-50 flex w-80 transform flex-col overflow-hidden border-r border-slate-800/80 bg-[#1e293b] p-4 shadow-2xl transition-transform duration-300 ease-in-out ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:static lg:block lg:translate-x-0 lg:p-5`}
      >
        <div className="flex h-full flex-col gap-4">
          <div className="flex items-center justify-between rounded-2xl bg-slate-900/40 p-4 lg:hidden">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-200">
                <BuildingIcon className="size-5" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">
                  NexusAdmin
                </p>
                <p className="truncate text-xs text-slate-400">企業營運後台</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsSidebarOpen(false)}
              className="inline-flex size-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-slate-100 transition hover:bg-white/10"
              aria-label="關閉側邊欄"
            >
              <CloseIcon className="size-5" />
            </button>
          </div>

          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <div className="flex flex-col gap-4">
              <div className="w-full rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-4">
                <div className="flex items-start gap-4">
                  <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-cyan-400/20 bg-slate-950/40 text-cyan-100">
                    <BuildingIcon className="size-5" />
                  </span>
                  <div className="min-w-0 break-words">
                    <div className="inline-flex rounded-full border border-cyan-400/20 bg-slate-950/40 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-200">
                      NexusAdmin
                    </div>
                    <p className="mt-4 break-words text-lg font-semibold text-white">
                      企業營運後台
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex-1">
                <div className="w-full rounded-2xl bg-slate-900/40 p-2">
                  <nav className="flex flex-col space-y-2">
                    {navItems.map((navItem) => (
                      <SidebarLink
                        key={navItem.href}
                        href={navItem.href}
                        icon={navItem.icon}
                        label={navItem.label}
                        onNavigate={() => setIsSidebarOpen(false)}
                      />
                    ))}
                  </nav>
                </div>
              </div>
            </div>

            <div className="mt-auto pt-4 pb-2">
              <div className="flex w-full items-center justify-between rounded-xl bg-slate-800/50 p-3">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-cyan-500 text-sm font-bold text-slate-900">
                    {getInitials(displayName)}
                  </div>
                  <div className="flex flex-col overflow-hidden">
                    <span className="truncate text-sm font-semibold text-slate-200">
                      {displayName}
                    </span>
                    <span className="truncate text-xs text-slate-400">
                      {roleLabel}
                    </span>
                  </div>
                </div>

                <LogoutButton variant="icon" />
              </div>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex items-center bg-[#1e293b] p-4 lg:hidden">
          <button
            type="button"
            onClick={() => setIsSidebarOpen(true)}
            className="inline-flex size-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-slate-100 transition hover:bg-white/10"
            aria-controls="mobile-dashboard-sidebar"
            aria-expanded={isSidebarOpen}
            aria-label="開啟側邊欄"
          >
            <MenuIcon className="size-5" />
          </button>

          <div className="ml-4 flex min-w-0 items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-200">
              <BuildingIcon className="size-5" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">
                NexusAdmin
              </p>
              <p className="truncate text-xs text-slate-400">企業營運後台</p>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
