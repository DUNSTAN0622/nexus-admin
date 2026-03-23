"use client";

import { type FormEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  addMaterialStock,
  createMaterial,
} from "@/app/actions/materials";
import LoadingSpinner from "@/components/dashboard/LoadingSpinner";
import ModalFrame from "@/components/dashboard/ModalFrame";
import SearchInput from "@/components/dashboard/SearchInput";
import TableEmptyState from "@/components/dashboard/TableEmptyState";
import {
  modalFieldClassName,
  modalSecondaryButtonClassName,
  pageHeaderActionWrapClassName,
  pageHeaderRowClassName,
  pageHeaderTitleClassName,
} from "@/components/dashboard/ui";
import type { MaterialRecord } from "@/components/materials/types";

type MaterialsPageClientProps = {
  materials: MaterialRecord[];
  canCreate: boolean;
  canInbound: boolean;
  searchKeyword: string;
};

type MaterialFormState = {
  sku: string;
  name: string;
  quantity: string;
  unit: string;
};

const initialFormState: MaterialFormState = {
  sku: "",
  name: "",
  quantity: "0",
  unit: "",
};

const primaryButtonClassName =
  "inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 disabled:cursor-not-allowed disabled:bg-cyan-400/60";

const actionButtonClassName =
  "inline-flex items-center justify-center rounded-2xl border border-cyan-400/25 bg-cyan-400/10 px-3 py-2 text-xs font-semibold text-cyan-100 transition hover:bg-cyan-400/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 disabled:cursor-not-allowed disabled:opacity-60";

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

export default function MaterialsPageClient({
  materials,
  canCreate,
  canInbound,
  searchKeyword,
}: MaterialsPageClientProps) {
  const router = useRouter();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createFormState, setCreateFormState] = useState<MaterialFormState>(
    initialFormState,
  );
  const [createErrorMessage, setCreateErrorMessage] = useState("");
  const [selectedMaterial, setSelectedMaterial] = useState<MaterialRecord | null>(
    null,
  );
  const [inboundAmount, setInboundAmount] = useState("1");
  const [inboundErrorMessage, setInboundErrorMessage] = useState("");
  const [isCreating, startCreateTransition] = useTransition();
  const [isInbounding, startInboundTransition] = useTransition();
  const hasSearch = Boolean(searchKeyword.trim());
  const tableDescription = hasSearch
    ? `已依「${searchKeyword}」篩選物料資料。`
    : "集中管理物料主檔、庫存量與入庫作業。";
  const permissionHint = canCreate
    ? "系統管理員可新增物料，現場人員可執行入庫。"
    : canInbound
      ? "目前帳號可執行入庫，但無法新增物料主檔。"
      : "目前帳號僅能檢視物料資料。";

  function updateFormField<Field extends keyof MaterialFormState>(
    field: Field,
    value: MaterialFormState[Field],
  ) {
    setCreateFormState((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function openCreateModal() {
    setCreateErrorMessage("");
    setCreateFormState(initialFormState);
    setIsCreateModalOpen(true);
  }

  function closeCreateModal(force = false) {
    if (isCreating && !force) {
      return;
    }

    setIsCreateModalOpen(false);
    setCreateErrorMessage("");
    setCreateFormState(initialFormState);
  }

  function openInboundModal(material: MaterialRecord) {
    setInboundErrorMessage("");
    setInboundAmount("1");
    setSelectedMaterial(material);
  }

  function closeInboundModal(force = false) {
    if (isInbounding && !force) {
      return;
    }

    setSelectedMaterial(null);
    setInboundErrorMessage("");
    setInboundAmount("1");
  }

  function handleCreateSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isCreating) {
      return;
    }

    setCreateErrorMessage("");

    startCreateTransition(async () => {
      const result = await createMaterial({
        sku: createFormState.sku,
        name: createFormState.name,
        quantity: Number(createFormState.quantity),
        unit: createFormState.unit,
      });

      if (result.error) {
        setCreateErrorMessage(result.error);
        toast.error(result.error ?? "操作失敗，請重試。");
        return;
      }

      closeCreateModal(true);
      toast.success("物料已成功新增");
      router.refresh();
    });
  }

  function handleInboundSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedMaterial || isInbounding) {
      return;
    }

    setInboundErrorMessage("");

    startInboundTransition(async () => {
      const result = await addMaterialStock(
        selectedMaterial.id,
        Number(inboundAmount),
      );

      if (result.error) {
        setInboundErrorMessage(result.error);
        toast.error(result.error ?? "操作失敗，請重試。");
        return;
      }

      closeInboundModal(true);
      toast.success("物料已成功入庫");
      router.refresh();
    });
  }

  return (
    <>
      <section className="w-full overflow-hidden rounded-[28px] border border-white/10 bg-slate-900/80 shadow-lg shadow-slate-950/20">
        <div className="border-b border-white/10 px-6 py-5 sm:px-8">
          <div className={pageHeaderRowClassName}>
            <div className="min-w-0">
              <h2 className={pageHeaderTitleClassName}>物料庫存總覽</h2>
            </div>

            {canCreate ? (
              <div className={pageHeaderActionWrapClassName}>
                <button
                  type="button"
                  onClick={openCreateModal}
                  className={primaryButtonClassName}
                >
                  + 新增物料
                </button>
              </div>
            ) : (
              <div className={pageHeaderActionWrapClassName} />
            )}
          </div>

          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0 space-y-1">
              <p className="text-sm text-slate-400">{tableDescription}</p>
              <p className="text-xs text-slate-500">{permissionHint}</p>
            </div>

            <div className="w-full lg:max-w-xl">
              <SearchInput
                ariaLabel="搜尋物料"
                placeholder="搜尋 SKU 或物料名稱"
              />
            </div>
          </div>
        </div>

        <div className="w-full overflow-x-auto">
          <table className="min-w-[860px] w-full border-collapse text-left">
            <thead className="bg-slate-950/60 text-xs uppercase tracking-[0.2em] text-slate-400">
              <tr>
                <th className="px-6 py-4 font-medium sm:px-8">物料 SKU</th>
                <th className="px-6 py-4 font-medium">物料名稱</th>
                <th className="px-6 py-4 font-medium">庫存數量</th>
                <th className="px-6 py-4 font-medium">單位</th>
                <th className="px-6 py-4 font-medium">建立日期</th>
                <th className="px-6 py-4 font-medium">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10 text-sm text-slate-200">
              {materials.length === 0 ? (
                <TableEmptyState
                  colSpan={6}
                  hasSearch={hasSearch}
                  hint={
                    hasSearch
                      ? "請調整搜尋條件後再試一次"
                      : "新增物料後會顯示於此"
                  }
                />
              ) : (
                materials.map((materialRecord) => {
                  const stockTone =
                    materialRecord.quantity < 100
                      ? "bg-rose-500/15 text-rose-200"
                      : "bg-emerald-500/15 text-emerald-200";

                  return (
                    <tr key={materialRecord.id} className="hover:bg-white/5">
                      <td className="px-6 py-4 font-mono text-cyan-200 sm:px-8">
                        {materialRecord.sku}
                      </td>
                      <td className="px-6 py-4 font-medium text-white">
                        {materialRecord.name}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${stockTone}`}
                        >
                          {materialRecord.quantity.toLocaleString("zh-TW")}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-300">
                        {materialRecord.unit}
                      </td>
                      <td className="px-6 py-4 text-slate-400">
                        {formatDate(materialRecord.created_at)}
                      </td>
                      <td className="px-6 py-4">
                        {canInbound ? (
                          <button
                            type="button"
                            onClick={() => openInboundModal(materialRecord)}
                            className={actionButtonClassName}
                          >
                            進貨入庫
                          </button>
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

      {isCreateModalOpen ? (
        <ModalFrame
          title="新增物料"
          description="建立新的物料主檔，作為後續採購與入庫管理基礎。"
          onClose={() => closeCreateModal()}
          isBusy={isCreating}
        >
          <form onSubmit={handleCreateSubmit} className="space-y-5 pt-6">
            {createErrorMessage ? (
              <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {createErrorMessage}
              </div>
            ) : null}

            <div className="space-y-2">
              <label htmlFor="sku" className="text-sm font-medium text-slate-200">
                物料 SKU
              </label>
              <input
                id="sku"
                name="sku"
                type="text"
                value={createFormState.sku}
                onChange={(event) => updateFormField("sku", event.target.value)}
                required
                disabled={isCreating}
                placeholder="例如 RM-004"
                className={modalFieldClassName}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium text-slate-200">
                物料名稱
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={createFormState.name}
                onChange={(event) => updateFormField("name", event.target.value)}
                required
                disabled={isCreating}
                placeholder="例如 高強度樹脂顆粒"
                className={modalFieldClassName}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label
                  htmlFor="quantity"
                  className="text-sm font-medium text-slate-200"
                >
                  期初庫存
                </label>
                <input
                  id="quantity"
                  name="quantity"
                  type="number"
                  min="0"
                  step="1"
                  value={createFormState.quantity}
                  onChange={(event) =>
                    updateFormField("quantity", event.target.value)
                  }
                  required
                  disabled={isCreating}
                  className={modalFieldClassName}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="unit" className="text-sm font-medium text-slate-200">
                  單位
                </label>
                <input
                  id="unit"
                  name="unit"
                  type="text"
                  value={createFormState.unit}
                  onChange={(event) => updateFormField("unit", event.target.value)}
                  required
                  disabled={isCreating}
                  placeholder="例如 pcs、kg"
                  className={modalFieldClassName}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => closeCreateModal()}
                disabled={isCreating}
                className={modalSecondaryButtonClassName}
              >
                取消
              </button>
              <button
                type="submit"
                disabled={isCreating}
                className={primaryButtonClassName}
              >
                {isCreating ? (
                  <>
                    <LoadingSpinner />
                    處理中...
                  </>
                ) : (
                  "新增物料"
                )}
              </button>
            </div>
          </form>
        </ModalFrame>
      ) : null}

      {selectedMaterial ? (
        <ModalFrame
          title="進貨入庫"
          description="更新物料庫存，完成本次入庫登錄。"
          onClose={() => closeInboundModal()}
          isBusy={isInbounding}
          maxWidthClassName="max-w-md"
        >
          <form onSubmit={handleInboundSubmit} className="space-y-5 pt-6">
            {inboundErrorMessage ? (
              <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {inboundErrorMessage}
              </div>
            ) : null}

            <div className="rounded-2xl border border-slate-700 bg-slate-950/60 px-4 py-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                物料名稱
              </p>
              <p className="mt-2 text-base font-semibold text-white">
                {selectedMaterial.name}
              </p>
              <p className="mt-2 text-sm text-slate-400">
                目前庫存 {selectedMaterial.quantity.toLocaleString("zh-TW")}{" "}
                {selectedMaterial.unit}
              </p>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="inbound-amount"
                className="text-sm font-medium text-slate-200"
              >
                入庫數量
              </label>
              <input
                id="inbound-amount"
                type="number"
                min="1"
                step="1"
                value={inboundAmount}
                onChange={(event) => setInboundAmount(event.target.value)}
                required
                disabled={isInbounding}
                className={modalFieldClassName}
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => closeInboundModal()}
                disabled={isInbounding}
                className={modalSecondaryButtonClassName}
              >
                取消
              </button>
              <button
                type="submit"
                disabled={isInbounding}
                className={primaryButtonClassName}
              >
                {isInbounding ? (
                  <>
                    <LoadingSpinner />
                    處理中...
                  </>
                ) : (
                  "確認入庫"
                )}
              </button>
            </div>
          </form>
        </ModalFrame>
      ) : null}
    </>
  );
}
