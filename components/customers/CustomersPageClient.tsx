"use client";

import { useState } from "react";
import SearchInput from "@/components/dashboard/SearchInput";
import TableEmptyState from "@/components/dashboard/TableEmptyState";
import {
  pageHeaderActionWrapClassName,
  pageHeaderRowClassName,
  pageHeaderTitleClassName,
} from "@/components/dashboard/ui";
import AddCustomerModal from "@/components/customers/AddCustomerModal";
import DeleteCustomerButton from "@/components/customers/DeleteCustomerButton";
import type { Customer } from "@/types/database";

type CustomerRecord = Omit<Customer, "total_spent"> & {
  total_spent: number;
};

type CustomersPageClientProps = {
  customers: CustomerRecord[];
  canManage: boolean;
  searchKeyword: string;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("zh-TW", {
    style: "currency",
    currency: "TWD",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value: string | null) {
  if (!value) {
    return "尚未建立";
  }

  return new Intl.DateTimeFormat("zh-TW", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
}

function getCustomerTier(totalSpent: number) {
  if (totalSpent >= 500_000) {
    return {
      label: "核心客戶",
      tone: "border-emerald-400/20 bg-emerald-400/10 text-emerald-200",
    };
  }

  if (totalSpent >= 100_000) {
    return {
      label: "成長客戶",
      tone: "border-cyan-400/20 bg-cyan-400/10 text-cyan-200",
    };
  }

  return {
    label: "一般客戶",
    tone: "border-amber-400/20 bg-amber-400/10 text-amber-200",
  };
}

export default function CustomersPageClient({
  customers,
  canManage,
  searchKeyword,
}: CustomersPageClientProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const hasSearch = Boolean(searchKeyword.trim());
  const tableDescription = hasSearch
    ? `已依「${searchKeyword}」篩選客戶資料。`
    : "整合客戶基本資料、國別與累積消費資訊。";

  return (
    <>
      <section className="w-full overflow-hidden rounded-[28px] border border-white/10 bg-slate-900/80 shadow-lg shadow-slate-950/20">
        <div className="border-b border-white/10 px-6 py-5 sm:px-8">
          <div className={pageHeaderRowClassName}>
            <div className="min-w-0">
              <h2 className={pageHeaderTitleClassName}>客戶名單總覽</h2>
            </div>

            {canManage ? (
              <div className={pageHeaderActionWrapClassName}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(true)}
                  className="inline-flex items-center justify-center rounded-2xl bg-amber-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-amber-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
                >
                  + 新增客戶
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
                {canManage
                  ? "系統管理員與主管可以新增或刪除客戶。"
                  : "目前帳號僅能檢視客戶資料。"}
              </p>
            </div>

            <div className="w-full lg:max-w-xl">
              <SearchInput ariaLabel="搜尋客戶" placeholder="搜尋客戶名稱" />
            </div>
          </div>
        </div>

        <div className="w-full overflow-x-auto">
          <table className="min-w-[860px] w-full border-collapse text-left">
            <thead className="bg-slate-950/60 text-xs uppercase tracking-[0.2em] text-slate-400">
              <tr>
                <th className="px-6 py-4 font-medium sm:px-8">客戶名稱</th>
                <th className="px-6 py-4 font-medium">國家 / 地區</th>
                <th className="px-6 py-4 font-medium">客戶分級</th>
                <th className="px-6 py-4 font-medium">累積消費</th>
                <th className="px-6 py-4 font-medium">建立日期</th>
                <th className="px-6 py-4 font-medium">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10 text-sm text-slate-200">
              {customers.length === 0 ? (
                <TableEmptyState
                  colSpan={6}
                  hasSearch={hasSearch}
                  hint={
                    hasSearch
                      ? "請調整搜尋條件後再試一次"
                      : "新增客戶後會顯示於此"
                  }
                />
              ) : (
                customers.map((customerRecord) => {
                  const customerTier = getCustomerTier(customerRecord.total_spent);

                  return (
                    <tr key={customerRecord.id} className="hover:bg-white/5">
                      <td className="px-6 py-4 font-medium text-white sm:px-8">
                        {customerRecord.name}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-200">
                          {customerRecord.country_code?.trim().toUpperCase() ??
                            "未設定"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${customerTier.tone}`}
                        >
                          {customerTier.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-300">
                        {formatCurrency(customerRecord.total_spent)}
                      </td>
                      <td className="px-6 py-4 text-slate-400">
                        {formatDate(customerRecord.created_at)}
                      </td>
                      <td className="px-6 py-4">
                        {canManage ? (
                          <DeleteCustomerButton
                            customerId={customerRecord.id}
                            customerName={customerRecord.name}
                          />
                        ) : (
                          <span className="text-xs text-slate-500">無操作權限</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {isModalOpen ? <AddCustomerModal onClose={() => setIsModalOpen(false)} /> : null}
    </>
  );
}
