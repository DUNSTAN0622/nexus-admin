type StatCardsProps = {
  totalCustomers: number;
  openWorkOrders: number;
  totalInventoryValue: number;
};

function formatNumber(value: number) {
  return new Intl.NumberFormat("zh-TW").format(value);
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("zh-TW", {
    style: "currency",
    currency: "TWD",
    maximumFractionDigits: 0,
  }).format(value);
}

const summaryCards = [
  {
    eyebrow: "Customer Base",
    title: "客戶總數",
    valueKey: "totalCustomers",
    accent:
      "from-cyan-500/18 via-cyan-400/10 to-slate-900/10 border-cyan-400/18",
    glow: "shadow-[0_18px_60px_rgba(6,182,212,0.14)]",
  },
  {
    eyebrow: "Open Orders",
    title: "進行中工單",
    valueKey: "openWorkOrders",
    accent:
      "from-amber-500/18 via-amber-400/10 to-slate-900/10 border-amber-400/18",
    glow: "shadow-[0_18px_60px_rgba(245,158,11,0.14)]",
  },
  {
    eyebrow: "Inventory Value",
    title: "庫存總值",
    valueKey: "totalInventoryValue",
    accent:
      "from-emerald-500/18 via-emerald-400/10 to-slate-900/10 border-emerald-400/18",
    glow: "shadow-[0_18px_60px_rgba(16,185,129,0.14)]",
  },
] as const;

export default function StatCards({
  totalCustomers,
  openWorkOrders,
  totalInventoryValue,
}: StatCardsProps) {
  const summaryValues = {
    totalCustomers: formatNumber(totalCustomers),
    openWorkOrders: formatNumber(openWorkOrders),
    totalInventoryValue: formatCurrency(totalInventoryValue),
  };

  return (
    <section className="grid w-full grid-cols-1 gap-4 md:grid-cols-3">
      {summaryCards.map((summaryCard) => (
        <article
          key={summaryCard.title}
          className={`relative w-full overflow-hidden rounded-[28px] border bg-[linear-gradient(145deg,var(--tw-gradient-stops))] p-6 ${summaryCard.accent} ${summaryCard.glow}`}
        >
          <div className="absolute inset-x-6 top-0 h-px bg-white/20" />
          <div className="space-y-4">
            <div className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-300">
              {summaryCard.eyebrow}
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-300">
                {summaryCard.title}
              </p>
              <p className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                {summaryValues[summaryCard.valueKey]}
              </p>
            </div>
          </div>
        </article>
      ))}
    </section>
  );
}
