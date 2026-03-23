"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { getRevenueData } from "@/app/actions/analytics";
import LoadingSpinner from "@/components/dashboard/LoadingSpinner";
import RevenueChart from "@/components/RevenueChart";
import type { RevenueChartDatum, RevenueInterval } from "@/types/analytics";

const intervalLabels: Record<RevenueInterval, string> = {
  day: "日",
  month: "月",
  year: "年",
};

const intervalDescriptions: Record<RevenueInterval, string> = {
  day: "統計近十四天依據工單完工入庫所產生的預估營收總值。",
  month: "統計近六個月依據工單完工入庫所產生的預估營收總值。",
  year: "統計近三年依據工單完工入庫所產生的預估營收總值。",
};

type RevenueChartWrapperProps = {
  initialChartData?: RevenueChartDatum[] | null;
};

export default function RevenueChartWrapper({
  initialChartData = [],
}: RevenueChartWrapperProps) {
  const [activeInterval, setActiveInterval] = useState<RevenueInterval>("month");
  const [pendingInterval, setPendingInterval] = useState<RevenueInterval | null>(
    null,
  );
  const [chartData, setChartData] = useState<RevenueChartDatum[]>(
    initialChartData ?? [],
  );
  const [isPending, startTransition] = useTransition();
  const isRefreshing = pendingInterval !== null || isPending;

  function handleIntervalChange(nextInterval: RevenueInterval) {
    if (nextInterval === activeInterval || isRefreshing) {
      return;
    }

    setPendingInterval(nextInterval);

    startTransition(async () => {
      try {
        const nextChartData = await getRevenueData(nextInterval);
        setActiveInterval(nextInterval);
        setChartData(nextChartData ?? []);
      } catch {
        toast.error("無法更新營收趨勢，請稍後再試。");
      } finally {
        setPendingInterval(null);
      }
    });
  }

  return (
    <div className="w-full overflow-hidden rounded-[30px] border border-white/10 bg-[linear-gradient(145deg,_rgba(15,23,42,0.96)_0%,_rgba(8,47,73,0.94)_100%)] p-5 shadow-[0_20px_70px_rgba(6,182,212,0.16)] sm:p-6">
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <div className="inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-200">
            Revenue Trend
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">近期營收趨勢</h2>
            <p className="mt-1 text-sm leading-6 text-slate-400">
              {intervalDescriptions[activeInterval]}
            </p>
          </div>
        </div>

        <div className="inline-flex shrink-0 items-center rounded-full border border-white/10 bg-slate-950/65 p-1">
          {(Object.keys(intervalLabels) as RevenueInterval[]).map(
            (intervalOption) => {
              const isActive = intervalOption === activeInterval;
              const isLoading = intervalOption === pendingInterval;

              return (
                <button
                  key={intervalOption}
                  type="button"
                  onClick={() => handleIntervalChange(intervalOption)}
                  disabled={isRefreshing}
                  className={`inline-flex min-w-11 items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
                    isActive
                      ? "bg-cyan-400 text-slate-950 shadow-[0_10px_30px_rgba(6,182,212,0.32)]"
                      : "text-slate-300 hover:bg-white/5 hover:text-white"
                  } ${isRefreshing ? "cursor-not-allowed opacity-80" : ""}`}
                >
                  {isLoading ? <LoadingSpinner className="size-3.5" /> : null}
                  <span>{intervalLabels[intervalOption]}</span>
                </button>
              );
            },
          )}
        </div>
      </div>

      <RevenueChart chartData={chartData ?? []} />
    </div>
  );
}
