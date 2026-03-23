import { redirect } from "next/navigation";
import MaterialsPageClient from "@/components/materials/MaterialsPageClient";
import type { MaterialRecord } from "@/components/materials/types";
import type { Material } from "@/types/database";
import { createAdminSupabaseClient, getUserProfile } from "@/utils/auth";
import {
  canInboundMaterials,
  canManageMaterials,
  getRoleLabel,
} from "@/utils/rbac";
import {
  buildSearchPattern,
  getSearchKeyword,
  type PageSearchParams,
} from "@/utils/search";

type MaterialsPageProps = {
  searchParams: PageSearchParams;
};

export default async function MaterialsPage({
  searchParams,
}: MaterialsPageProps) {
  const profile = await getUserProfile();

  if (!profile) {
    redirect("/login");
  }

  const searchKeyword = await getSearchKeyword(searchParams);
  const supabase = createAdminSupabaseClient();
  let materialsQuery = supabase
    .from("materials")
    .select("id, sku, name, quantity, unit, created_at")
    .order("created_at", { ascending: false });

  if (searchKeyword) {
    const searchPattern = buildSearchPattern(searchKeyword);
    materialsQuery = materialsQuery.or(
      `name.ilike.${searchPattern},sku.ilike.${searchPattern}`,
    );
  }

  const { data, error } = await materialsQuery;

  if (error) {
    throw new Error(error.message);
  }

  const materials = ((data ?? []) as Material[]).map((materialRecord) => ({
    ...materialRecord,
    quantity: materialRecord.quantity ?? 0,
    created_at: materialRecord.created_at ?? null,
  })) as MaterialRecord[];

  const totalQuantity = materials.reduce(
    (sum, materialRecord) => sum + materialRecord.quantity,
    0,
  );
  const lowStockCount = materials.filter(
    (materialRecord) => materialRecord.quantity < 100,
  ).length;
  const canCreate = canManageMaterials(profile.role);
  const canInbound = canInboundMaterials(profile.role);
  const roleLabel = getRoleLabel(profile.role);
  const inventorySummary = searchKeyword
    ? `已依「${searchKeyword}」顯示篩選結果，方便快速確認庫存與補貨需求。`
    : "集中管理物料主檔、庫存水位與入庫紀錄，讓採購與生產協作保持同步。";
  const itemCountLabel = searchKeyword ? "符合筆數" : "物料筆數";

  return (
    <>
      <section className="w-full overflow-hidden rounded-[32px] border border-white/10 bg-[linear-gradient(135deg,_rgba(15,23,42,0.98)_0%,_rgba(30,41,59,0.94)_50%,_rgba(12,74,110,0.9)_100%)] shadow-[0_24px_80px_rgba(15,23,42,0.42)]">
        <div className="grid gap-6 px-6 py-8 sm:px-8 lg:grid-cols-[1.25fr_0.75fr] lg:px-10 lg:py-10">
          <div className="space-y-4">
            <div className="inline-flex rounded-full border border-cyan-400/25 bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200">
              Materials Overview
            </div>
            <div className="space-y-3">
              <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                物料與庫存總覽
              </h1>
              <p className="max-w-3xl text-sm leading-7 text-slate-300">
                {inventorySummary}
              </p>
              <p className="text-sm text-slate-400">
                目前登入角色：
                <span className="font-semibold text-cyan-200"> {roleLabel}</span>
              </p>
            </div>
          </div>

          <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-1">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-sm font-medium text-slate-300">
                {itemCountLabel}
              </p>
              <p className="mt-3 text-3xl font-semibold text-white">
                {materials.length}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-sm font-medium text-slate-300">總庫存量</p>
              <p className="mt-3 text-3xl font-semibold text-white">
                {totalQuantity.toLocaleString("zh-TW")}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-sm font-medium text-slate-300">低庫存項目</p>
              <p className="mt-3 text-3xl font-semibold text-white">
                {lowStockCount}
              </p>
            </div>
          </div>
        </div>
      </section>

      <MaterialsPageClient
        materials={materials}
        canCreate={canCreate}
        canInbound={canInbound}
        searchKeyword={searchKeyword}
      />
    </>
  );
}
