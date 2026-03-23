"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { updateWorkOrderStatus } from "@/app/actions/production";
import LoadingSpinner from "@/components/dashboard/LoadingSpinner";
import type { WorkOrderStatus } from "@/types/database";
import type { UserRole } from "@/utils/rbac";
import { canMutateWorkOrderStatus } from "@/utils/work-orders";

type WorkOrderActionsProps = {
  currentRole: UserRole | null;
  orderId: string;
  currentStatus: WorkOrderStatus | null;
};

type ActionButtonConfig = {
  label: string;
  nextStatus: WorkOrderStatus;
  className: string;
};

const ACTION_BUTTONS: readonly ActionButtonConfig[] = [
  {
    label: "開始生產",
    nextStatus: "in_progress",
    className:
      "bg-amber-400 text-slate-950 hover:bg-amber-300 focus-visible:ring-amber-300/30",
  },
  {
    label: "完成工單",
    nextStatus: "completed",
    className:
      "bg-emerald-400 text-slate-950 hover:bg-emerald-300 focus-visible:ring-emerald-300/30",
  },
  {
    label: "取消工單",
    nextStatus: "cancelled",
    className:
      "border border-rose-400/30 bg-rose-400/10 text-rose-200 hover:bg-rose-400/20 focus-visible:ring-rose-300/20",
  },
];

function getSuccessMessage(status: WorkOrderStatus) {
  if (status === "in_progress") {
    return "工單已開始生產";
  }

  if (status === "completed") {
    return "工單已標記為完成";
  }

  return "工單已取消";
}

export default function WorkOrderActions({
  currentRole,
  orderId,
  currentStatus,
}: WorkOrderActionsProps) {
  const router = useRouter();
  const [status, setStatus] = useState<WorkOrderStatus | null>(currentStatus);
  const [pendingStatus, setPendingStatus] = useState<WorkOrderStatus | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isPending, startTransition] = useTransition();
  const buttons = ACTION_BUTTONS.filter((button) =>
    canMutateWorkOrderStatus(currentRole, status, button.nextStatus),
  );
  const inactiveLabel =
    status === "completed"
      ? "工單已完成"
      : status === "cancelled"
        ? "工單已取消"
        : currentRole === "operator"
          ? "目前帳號只能回報完工中的工單"
          : currentRole === "manager"
            ? "主管帳號無法變更此工單狀態"
            : "目前沒有可執行的操作";

  function handleStatusUpdate(nextStatus: WorkOrderStatus) {
    if (isPending) {
      return;
    }

    setErrorMessage("");
    setPendingStatus(nextStatus);

    startTransition(async () => {
      try {
        const result = await updateWorkOrderStatus(orderId, nextStatus);

        if (result?.error) {
          setErrorMessage(result.error);
          toast.error(result.error);
          return;
        }

        if (!result?.status) {
          const fallbackMessage = "操作失敗，請重試。";
          setErrorMessage(fallbackMessage);
          toast.error(fallbackMessage);
          return;
        }

        setStatus(result.status);
        toast.success(getSuccessMessage(nextStatus));
        router.refresh();
      } finally {
        setPendingStatus(null);
      }
    });
  }

  return (
    <div className="flex min-w-[15rem] flex-col items-center gap-2">
      {buttons.length === 0 ? (
        <span className="text-center text-xs font-medium text-slate-500">
          {inactiveLabel}
        </span>
      ) : (
        <div className="flex flex-wrap justify-center gap-2">
          {buttons.map((button) => (
            <button
              key={button.label}
              type="button"
              onClick={() => handleStatusUpdate(button.nextStatus)}
              disabled={isPending}
              className={`inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-4 disabled:cursor-not-allowed disabled:opacity-60 ${button.className}`}
            >
              {isPending && pendingStatus === button.nextStatus ? (
                <>
                  <LoadingSpinner />
                  處理中...
                </>
              ) : (
                button.label
              )}
            </button>
          ))}
        </div>
      )}

      {errorMessage ? (
        <p className="text-center text-xs text-red-300">{errorMessage}</p>
      ) : null}
    </div>
  );
}
