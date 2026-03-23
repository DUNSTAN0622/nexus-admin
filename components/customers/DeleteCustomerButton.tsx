"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { deleteCustomer } from "@/app/actions/erp";
import LoadingSpinner from "@/components/dashboard/LoadingSpinner";
import { TrashIcon } from "@/components/dashboard/icons";

type DeleteCustomerButtonProps = {
  customerId: string;
  customerName: string;
};

export default function DeleteCustomerButton({
  customerId,
  customerName,
}: DeleteCustomerButtonProps) {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    const confirmed = window.confirm(
      `確定要刪除客戶「${customerName}」嗎？此操作無法復原。`,
    );

    if (!confirmed || isPending) {
      return;
    }

    setErrorMessage("");

    startTransition(async () => {
      const result = await deleteCustomer(customerId);

      if (result.error) {
        setErrorMessage(result.error);
        toast.error(result.error);
        return;
      }

      toast.success("客戶已成功刪除");
      router.refresh();
    });
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleDelete}
        disabled={isPending}
        className="inline-flex items-center justify-center rounded-full border border-rose-400/30 bg-rose-400/10 p-2.5 text-rose-200 transition hover:bg-rose-400/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 disabled:cursor-not-allowed disabled:opacity-60"
        aria-label={`刪除客戶 ${customerName}`}
        title="刪除客戶"
      >
        {isPending ? <LoadingSpinner className="size-4" /> : <TrashIcon className="size-4" />}
      </button>

      {errorMessage ? (
        <p className="max-w-44 text-xs text-red-300">{errorMessage}</p>
      ) : null}
    </div>
  );
}
