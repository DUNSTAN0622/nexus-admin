import { redirect } from "next/navigation";
import { getDashboardStats } from "@/app/actions/analytics";
import GlobalCustomerMap from "@/components/GlobalCustomerMap";
import RevenueChartWrapper from "@/components/RevenueChartWrapper";
import StatCards from "@/components/StatCards";
import { getUserProfile } from "@/utils/auth";
import { canAccessAnalytics } from "@/utils/rbac";

export default async function AnalyticsPage() {
  const profile = await getUserProfile();

  if (!profile) {
    redirect("/login");
  }

  if (!canAccessAnalytics(profile.role)) {
    redirect("/dashboard");
  }

  const stats = await getDashboardStats();

  return (
    <div className="space-y-6">
      <section className="w-full overflow-hidden rounded-[34px] border border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(6,182,212,0.22)_0%,_rgba(15,23,42,0)_28%),linear-gradient(135deg,_rgba(15,23,42,0.98)_0%,_rgba(30,41,59,0.94)_48%,_rgba(8,47,73,0.92)_100%)] shadow-[0_24px_90px_rgba(8,47,73,0.32)]">
        <div className="flex flex-col gap-6 px-6 py-8 sm:px-8 lg:px-10 lg:py-10">
          <div className="space-y-4">
            <div className="inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-cyan-200">
              Command Center
            </div>
            <div className="space-y-3">
              <h1 className="max-w-4xl text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                營運分析總覽
              </h1>
              <p className="max-w-3xl text-sm leading-7 text-slate-300">
                彙整客戶規模、在製工單與庫存價值，提供管理層快速掌握營運節奏與異常訊號的共同視角。
              </p>
            </div>
          </div>

          <StatCards
            totalCustomers={stats.totalCustomers}
            openWorkOrders={stats.openWorkOrders}
            totalInventoryValue={stats.totalInventoryValue}
          />
        </div>
      </section>

      <section className="flex w-full flex-col gap-6 xl:flex-row">
        <div className="w-full xl:flex-1">
          <GlobalCustomerMap countryData={stats.countryData} />
        </div>
        <div className="w-full xl:flex-1">
          <RevenueChartWrapper initialChartData={stats.revenueChartData ?? []} />
        </div>
      </section>
    </div>
  );
}
