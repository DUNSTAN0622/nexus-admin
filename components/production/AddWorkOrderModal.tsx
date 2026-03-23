"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { submitCreateWorkOrder } from "@/app/actions/production";
import LoadingSpinner from "@/components/dashboard/LoadingSpinner";
import ModalFrame from "@/components/dashboard/ModalFrame";
import {
  modalFieldClassName,
  modalSecondaryButtonClassName,
  modalSelectClassName,
} from "@/components/dashboard/ui";
import { INITIAL_MUTATION_STATE } from "@/types/actions";
import type { FinishedGood } from "@/types/database";

type AddWorkOrderModalProps = {
  finishedGoods: FinishedGood[];
  onClose: () => void;
};

const primaryButtonClassName =
  "inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 disabled:cursor-not-allowed disabled:bg-emerald-400/60";

export default function AddWorkOrderModal({
  finishedGoods,
  onClose,
}: AddWorkOrderModalProps) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(
    submitCreateWorkOrder,
    INITIAL_MUTATION_STATE,
  );

  useEffect(() => {
    if (!state.error) {
      return;
    }

    toast.error(state.error);
  }, [state.error]);

  useEffect(() => {
    if (!state.success) {
      return;
    }

    toast.success("工單已成功建立");
    router.refresh();
    onClose();
  }, [onClose, router, state.success]);

  return (
    <ModalFrame
      title="建立工單"
      description="選擇成品與目標數量後，系統會建立新的生產工單。"
      onClose={onClose}
      isBusy={isPending}
      maxWidthClassName="max-w-xl"
    >
      <form action={formAction} className="space-y-5 pt-6">
        {state.error ? (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {state.error}
          </div>
        ) : null}

        <div className="space-y-2">
          <label
            htmlFor="work-order-product"
            className="text-sm font-medium text-slate-200"
          >
            成品
          </label>
          <select
            id="work-order-product"
            name="product_id"
            defaultValue={finishedGoods[0]?.id ?? ""}
            disabled={isPending}
            required
            className={modalSelectClassName}
          >
            {finishedGoods.map((product) => (
              <option key={product.id} value={product.id}>
                {product.sku} - {product.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="work-order-target-quantity"
            className="text-sm font-medium text-slate-200"
          >
            目標數量
          </label>
          <input
            id="work-order-target-quantity"
            name="target_quantity"
            type="number"
            min="1"
            step="1"
            required
            disabled={isPending}
            placeholder="例如 500"
            className={modalFieldClassName}
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className={modalSecondaryButtonClassName}
          >
            取消
          </button>
          <button
            type="submit"
            disabled={isPending}
            className={primaryButtonClassName}
          >
            {isPending ? (
              <>
                <LoadingSpinner />
                處理中...
              </>
            ) : (
              "建立工單"
            )}
          </button>
        </div>
      </form>
    </ModalFrame>
  );
}
