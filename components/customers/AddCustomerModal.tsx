"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { submitAddCustomer } from "@/app/actions/erp";
import LoadingSpinner from "@/components/dashboard/LoadingSpinner";
import ModalFrame from "@/components/dashboard/ModalFrame";
import {
  modalFieldClassName,
  modalSecondaryButtonClassName,
  modalSelectClassName,
} from "@/components/dashboard/ui";
import { INITIAL_MUTATION_STATE } from "@/types/actions";

type AddCustomerModalProps = {
  onClose: () => void;
};

const COUNTRY_OPTIONS = [
  { value: "TW", label: "台灣" },
  { value: "US", label: "美國" },
  { value: "JP", label: "日本" },
  { value: "CN", label: "中國" },
  { value: "VN", label: "越南" },
] as const;

const primaryButtonClassName =
  "inline-flex items-center justify-center gap-2 rounded-2xl bg-amber-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-amber-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 disabled:cursor-not-allowed disabled:bg-amber-400/60";

export default function AddCustomerModal({
  onClose,
}: AddCustomerModalProps) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(
    submitAddCustomer,
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

    toast.success("客戶已成功新增");
    router.refresh();
    onClose();
  }, [onClose, router, state.success]);

  return (
    <ModalFrame
      title="新增客戶"
      description="建立新的客戶主檔，初始累積消費會自動設為 0。"
      onClose={onClose}
      isBusy={isPending}
    >
      <form action={formAction} className="space-y-5 pt-6">
        {state.error ? (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {state.error}
          </div>
        ) : null}

        <div className="space-y-2">
          <label htmlFor="customer-name" className="text-sm font-medium text-slate-200">
            客戶名稱
          </label>
          <input
            id="customer-name"
            name="name"
            type="text"
            required
            disabled={isPending}
            placeholder="例如 台北國際貿易股份有限公司"
            className={modalFieldClassName}
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="customer-country-code"
            className="text-sm font-medium text-slate-200"
          >
            國家 / 地區
          </label>
          <select
            id="customer-country-code"
            name="country_code"
            defaultValue="TW"
            disabled={isPending}
            className={modalSelectClassName}
          >
            {COUNTRY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label} ({option.value})
              </option>
            ))}
          </select>
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
              "新增客戶"
            )}
          </button>
        </div>
      </form>
    </ModalFrame>
  );
}
