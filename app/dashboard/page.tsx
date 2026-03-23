import Link from "next/link";
import RoleGuard from "@/components/RoleGuard";
import { getUserProfile } from "@/utils/auth";
import { getRoleLabel } from "@/utils/rbac";

const overviewCards = [
  {
    title: "物料與庫存",
    description:
      "快速進入庫存主檔與入庫作業，掌握低庫存項目與現場補料節點。",
  },
  {
    title: "客戶與訂單節奏",
    description:
      "檢視客戶名單、區域分布與累積消費，協助業務與管理層掌握重點帳戶。",
  },
  {
    title: "工單進度",
    description:
      "追蹤待開始、進行中與已完成工單，讓現場回報與管理決策維持同步。",
  },
] as const;

export default async function DashboardPage() {
  const profile = await getUserProfile();
  const displayName = profile?.fullName ?? "未設定姓名";
  const roleLabel = getRoleLabel(profile?.role ?? null);

  return (
    <>
      <section className="w-full overflow-hidden rounded-[32px] border border-white/10 bg-[linear-gradient(135deg,_rgba(15,23,42,0.98)_0%,_rgba(30,41,59,0.94)_50%,_rgba(8,47,73,0.92)_100%)] shadow-[0_24px_80px_rgba(15,23,42,0.45)]">
        <div className="grid gap-8 px-6 py-8 sm:px-8 lg:grid-cols-[1.25fr_0.75fr] lg:px-10 lg:py-10">
          <div className="space-y-5">
            <div className="inline-flex rounded-full border border-cyan-400/25 bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200">
              Workbench
            </div>
            <div className="space-y-3">
              <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                歡迎回到工作台
              </h1>
              <p className="text-base text-slate-300">
                {displayName}
                <span className="mx-2 text-slate-500">·</span>
                <span className="font-semibold text-cyan-200">{roleLabel}</span>
              </p>
              <p className="max-w-2xl text-sm leading-7 text-slate-400">
                集中追蹤庫存、客戶與工單節點，協助廠務、後勤與管理單位在同一個視角完成例行決策與異常應變。
              </p>

              <div className="max-w-2xl rounded-3xl border border-amber-400/20 bg-amber-400/10 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-100">
                  今日重點
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-200">
                  從左側選單進入物料、工單、客戶或分析頁面，即可延續昨日作業脈絡並快速處理待辦事項。
                </p>
              </div>
            </div>
          </div>

          <div className="grid w-full gap-4 self-start">
            <Link
              href="/dashboard/materials"
              className="inline-flex items-center justify-center rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-300/30"
            >
              查看物料與庫存
            </Link>

            <Link
              href="/dashboard/production"
              className="inline-flex items-center justify-center rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-400/15 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-300/20"
            >
              查看工單進度
            </Link>

            <RoleGuard allowedRoles={["admin"]}>
              <Link
                href="/dashboard/users"
                className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/15"
              >
                管理使用者權限
              </Link>
            </RoleGuard>
          </div>
        </div>
      </section>

      <div className="mt-6 grid w-full grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {overviewCards.map((overviewCard) => (
          <article
            key={overviewCard.title}
            className="w-full rounded-3xl border border-white/10 bg-slate-900/80 p-6 shadow-lg shadow-slate-950/20"
          >
            <p className="text-sm font-medium text-white">{overviewCard.title}</p>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              {overviewCard.description}
            </p>
          </article>
        ))}
      </div>
    </>
  );
}
