import { redirect } from "next/navigation";
import CustomersPageClient from "@/components/customers/CustomersPageClient";
import type { Customer } from "@/types/database";
import { createAdminSupabaseClient, getUserProfile } from "@/utils/auth";
import { canAccessCustomers, canManageCustomers } from "@/utils/rbac";
import {
  buildSearchPattern,
  getSearchKeyword,
  type PageSearchParams,
} from "@/utils/search";

type CustomersPageProps = {
  searchParams: PageSearchParams;
};

type CustomerRecord = Omit<Customer, "total_spent"> & {
  total_spent: number;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("zh-TW", {
    style: "currency",
    currency: "TWD",
    maximumFractionDigits: 0,
  }).format(value);
}

export default async function CustomersPage({
  searchParams,
}: CustomersPageProps) {
  const profile = await getUserProfile();

  if (!profile) {
    redirect("/login");
  }

  if (!canAccessCustomers(profile.role)) {
    redirect("/dashboard");
  }

  const searchKeyword = await getSearchKeyword(searchParams);
  const supabase = createAdminSupabaseClient();
  let customersQuery = supabase
    .from("customers")
    .select("id, name, country_code, total_spent, created_at")
    .order("created_at", { ascending: false });

  if (searchKeyword) {
    customersQuery = customersQuery.ilike(
      "name",
      buildSearchPattern(searchKeyword),
    );
  }

  const { data, error } = await customersQuery;

  if (error) {
    throw new Error(error.message);
  }

  const customers = ((data ?? []) as Customer[]).map((customer) => ({
    ...customer,
    total_spent: Number(customer.total_spent ?? 0),
    created_at: customer.created_at ?? null,
  })) as CustomerRecord[];
  const coveredMarkets = new Set(
    customers
      .map((customer) => customer.country_code?.trim().toUpperCase())
      .filter(Boolean),
  ).size;
  const totalRevenue = customers.reduce(
    (sum, customer) => sum + customer.total_spent,
    0,
  );
  const summaryText = searchKeyword
    ? `已依「${searchKeyword}」顯示篩選後的客戶結果，方便快速鎖定目標帳戶。`
    : "整合客戶名單、區域分布與累積消費，協助業務與營運持續追蹤商機。";
  const resultCountLabel = searchKeyword ? "符合筆數" : "客戶筆數";
  const canManage = canManageCustomers(profile.role);

  return (
    <>
      <section className="w-full overflow-hidden rounded-[32px] border border-white/10 bg-[linear-gradient(135deg,_rgba(15,23,42,0.98)_0%,_rgba(30,41,59,0.92)_55%,_rgba(180,83,9,0.84)_100%)] shadow-[0_24px_80px_rgba(15,23,42,0.42)]">
        <div className="grid gap-6 px-6 py-8 sm:px-8 lg:grid-cols-[1.25fr_0.75fr] lg:px-10 lg:py-10">
          <div className="space-y-4">
            <div className="inline-flex rounded-full border border-amber-400/25 bg-amber-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-amber-200">
              Customer Hub
            </div>
            <div className="space-y-3">
              <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                客戶營運總覽
              </h1>
              <p className="max-w-3xl text-sm leading-7 text-slate-300">
                {summaryText}
              </p>
            </div>
          </div>

          <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-1">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-sm font-medium text-slate-300">
                {resultCountLabel}
              </p>
              <p className="mt-3 text-3xl font-semibold text-white">
                {customers.length}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-sm font-medium text-slate-300">覆蓋市場數</p>
              <p className="mt-3 text-3xl font-semibold text-white">
                {coveredMarkets}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-sm font-medium text-slate-300">累積營收</p>
              <p className="mt-3 text-3xl font-semibold text-white">
                {formatCurrency(totalRevenue)}
              </p>
            </div>
          </div>
        </div>
      </section>

      <CustomersPageClient
        customers={customers}
        canManage={canManage}
        searchKeyword={searchKeyword}
      />
    </>
  );
}
