"use client";

import { useState } from "react";
import SearchInput from "@/components/dashboard/SearchInput";
import TableEmptyState from "@/components/dashboard/TableEmptyState";
import {
  pageHeaderActionWrapClassName,
  pageHeaderRowClassName,
  pageHeaderTitleClassName,
} from "@/components/dashboard/ui";
import AddWorkOrderModal from "@/components/production/AddWorkOrderModal";
import WorkOrderActions from "@/components/production/WorkOrderActions";
import type {
  FinishedGood,
  WorkOrderWithFinishedGood,
} from "@/types/database";
import type { UserRole } from "@/utils/rbac";
import { getWorkOrderStatusMeta } from "@/utils/work-orders";

type ProductionPageClientProps = {
  canManageOrders: boolean;
  currentRole: UserRole | null;
  finishedGoods: FinishedGood[];
  searchKeyword: string;
  workOrders: WorkOrderWithFinishedGood[];
};

const createButtonClassName =
  "inline-flex items-center justify-center rounded-2xl bg-emerald-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 disabled:cursor-not-allowed disabled:bg-emerald-400/50";

export default function ProductionPageClient({
  canManageOrders,
  currentRole,
  finishedGoods,
  searchKeyword,
  workOrders,
}: ProductionPageClientProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const hasFinishedGoods = finishedGoods.length > 0;
  const hasSearch = Boolean(searchKeyword.trim());
  const tableDescription = hasSearch
    ? `已依「${searchKeyword}」篩選工單資料。`
    : "追蹤工單建立、生產進度與完工狀態。";

  return (
    <>
      <section className="w-full overflow-hidden rounded-[28px] border border-white/10 bg-slate-900/80 shadow-lg shadow-slate-950/20">
        <div className="border-b border-white/10 px-6 py-5 sm:px-8">
          <div className={pageHeaderRowClassName}>
            <div className="min-w-0">
              <h2 className={pageHeaderTitleClassName}>生產工單總覽</h2>
            </div>

            {canManageOrders ? (
              <div className={pageHeaderActionWrapClassName}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(true)}
                  disabled={!hasFinishedGoods}
                  className={createButtonClassName}
                >
                  + 新增工單
                </button>
              </div>
            ) : (
              <div className={pageHeaderActionWrapClassName} />
            )}
          </div>

          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0 space-y-1">
              <p className="text-sm text-slate-400">{tableDescription}</p>
              <p className="text-xs text-slate-500">
                {canManageOrders
                  ? "系統管理員與主管可建立工單；現場人員可回報完工。"
                  : currentRole === "operator"
                    ? "目前帳號可回報完工，但無法建立與取消工單。"
                    : "目前帳號僅能檢視工單資料。"}
              </p>
            </div>

            <div className="w-full lg:max-w-xl">
              <SearchInput ariaLabel="搜尋工單" placeholder="搜尋工單編號" />
            </div>
          </div>
        </div>

        {canManageOrders && !hasFinishedGoods ? (
          <div className="border-b border-white/10 px-6 py-4 text-sm text-amber-200 sm:px-8">
            尚未建立任何成品資料，請先維護 finished goods 後再建立工單。
          </div>
        ) : null}

        <div className="w-full overflow-x-auto">
          <table className="min-w-[820px] w-full border-collapse text-left">
            <thead className="bg-slate-950/60 text-xs uppercase tracking-[0.2em] text-slate-400">
              <tr>
                <th className="px-6 py-4 font-medium sm:px-8">工單編號</th>
                <th className="px-6 py-4 font-medium">成品名稱</th>
                <th className="px-6 py-4 font-medium">目標數量</th>
                <th className="px-6 py-4 font-medium">狀態</th>
                <th className="px-6 py-4 font-medium">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10 text-sm text-slate-200">
              {workOrders.length === 0 ? (
                <TableEmptyState
                  colSpan={5}
                  hasSearch={hasSearch}
                  hint={
                    hasSearch
                      ? "請調整搜尋條件後再試一次"
                      : "建立工單後會顯示於此"
                  }
                />
              ) : (
                workOrders.map((workOrder) => {
                  const statusMeta = getWorkOrderStatusMeta(workOrder.status);

                  return (
                    <tr key={workOrder.id} className="hover:bg-white/5">
                      <td className="px-6 py-4 font-mono text-emerald-200 sm:px-8">
                        {workOrder.order_number}
                      </td>
                      <td className="px-6 py-4 font-medium text-white">
                        {workOrder.finished_goods?.name ?? "未指定成品"}
                      </td>
                      <td className="px-6 py-4 text-slate-300">
                        {workOrder.target_quantity.toLocaleString("zh-TW")}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${statusMeta.badgeClassName}`}
                        >
                          {statusMeta.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center">
                          <WorkOrderActions
                            currentRole={currentRole}
                            orderId={workOrder.id}
                            currentStatus={workOrder.status}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {isModalOpen && hasFinishedGoods ? (
        <AddWorkOrderModal
          finishedGoods={finishedGoods}
          onClose={() => setIsModalOpen(false)}
        />
      ) : null}
    </>
  );
}
