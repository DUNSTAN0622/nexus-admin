import { redirect } from "next/navigation";
import { getFinishedGoods, getWorkOrders } from "@/app/actions/erp";
import ProductionPageClient from "@/components/production/ProductionPageClient";
import type { FinishedGood } from "@/types/database";
import { getUserProfile } from "@/utils/auth";
import { canManageWorkOrders } from "@/utils/rbac";
import { getSearchKeyword, type PageSearchParams } from "@/utils/search";

type ProductionPageProps = {
  searchParams: PageSearchParams;
};

export default async function ProductionPage({
  searchParams,
}: ProductionPageProps) {
  const profile = await getUserProfile();

  if (!profile) {
    redirect("/login");
  }

  const searchKeyword = await getSearchKeyword(searchParams);
  const canManageOrders = canManageWorkOrders(profile.role);
  const finishedGoodsPromise: Promise<FinishedGood[]> = canManageOrders
    ? getFinishedGoods()
    : Promise.resolve([]);
  const [workOrders, finishedGoods] = await Promise.all([
    getWorkOrders(searchKeyword),
    finishedGoodsPromise,
  ]);
  const openCount = workOrders.filter(
    (order) =>
      order.status === "pending" || order.status === "in_progress",
  ).length;
  const totalTargetQuantity = workOrders.reduce(
    (sum, order) => sum + order.target_quantity,
    0,
  );
  const summaryText = searchKeyword
    ? `已依「${searchKeyword}」顯示篩選後的工單結果，方便快速追蹤生產進度。`
    : "掌握工單建立、在製數量與完工節點，讓生產排程與現場回報保持一致。";
  const workOrderCountLabel = searchKeyword ? "符合筆數" : "工單筆數";

  return (
    <>
      <section className="w-full overflow-hidden rounded-[32px] border border-white/10 bg-[linear-gradient(135deg,_rgba(15,23,42,0.98)_0%,_rgba(51,65,85,0.94)_55%,_rgba(6,95,70,0.9)_100%)] shadow-[0_24px_80px_rgba(15,23,42,0.42)]">
        <div className="grid gap-6 px-6 py-8 sm:px-8 lg:grid-cols-[1.25fr_0.75fr] lg:px-10 lg:py-10">
          <div className="space-y-4">
            <div className="inline-flex rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-emerald-200">
              Production Control
            </div>
            <div className="space-y-3">
              <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                生產工單總覽
              </h1>
              <p className="max-w-3xl text-sm leading-7 text-slate-300">
                {summaryText}
              </p>
            </div>
          </div>

          <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-1">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-sm font-medium text-slate-300">
                {workOrderCountLabel}
              </p>
              <p className="mt-3 text-3xl font-semibold text-white">
                {workOrders.length}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-sm font-medium text-slate-300">進行中工單</p>
              <p className="mt-3 text-3xl font-semibold text-white">
                {openCount}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-sm font-medium text-slate-300">總目標數量</p>
              <p className="mt-3 text-3xl font-semibold text-white">
                {totalTargetQuantity.toLocaleString("zh-TW")}
              </p>
            </div>
          </div>
        </div>
      </section>

      <ProductionPageClient
        canManageOrders={canManageOrders}
        currentRole={profile.role}
        finishedGoods={finishedGoods}
        searchKeyword={searchKeyword}
        workOrders={workOrders}
      />
    </>
  );
}
