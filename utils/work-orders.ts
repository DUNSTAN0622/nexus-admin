import type {
  FinishedGood,
  WorkOrderStatus,
  WorkOrderWithFinishedGood,
} from "@/types/database";
import {
  canCancelWorkOrders,
  canCompleteWorkOrders,
  canStartWorkOrders,
  type UserRole,
} from "@/utils/rbac";

type WorkOrderStatusMeta = {
  label: string;
  badgeClassName: string;
};

export type WorkOrderWithFinishedGoodRow = Omit<
  WorkOrderWithFinishedGood,
  "finished_goods"
> & {
  finished_goods:
    | Pick<FinishedGood, "name">
    | Array<Pick<FinishedGood, "name">>
    | null;
};

const DEFAULT_STATUS_META: WorkOrderStatusMeta = {
  label: "未設定",
  badgeClassName: "border-slate-400/20 bg-slate-400/10 text-slate-300",
};

export const WORK_ORDER_STATUS_META: Record<
  WorkOrderStatus,
  WorkOrderStatusMeta
> = {
  pending: {
    label: "待開始",
    badgeClassName: "border-sky-400/20 bg-sky-400/10 text-sky-200",
  },
  in_progress: {
    label: "生產中",
    badgeClassName: "border-amber-400/20 bg-amber-400/10 text-amber-200",
  },
  completed: {
    label: "已完成",
    badgeClassName: "border-emerald-400/20 bg-emerald-400/10 text-emerald-200",
  },
  cancelled: {
    label: "已取消",
    badgeClassName: "border-rose-400/20 bg-rose-400/10 text-rose-200",
  },
};

export const WORK_ORDER_ALLOWED_TRANSITIONS: Record<
  WorkOrderStatus,
  readonly WorkOrderStatus[]
> = {
  pending: ["in_progress", "cancelled"],
  in_progress: ["completed"],
  completed: [],
  cancelled: [],
};

export function isWorkOrderStatus(value: string): value is WorkOrderStatus {
  return Object.prototype.hasOwnProperty.call(WORK_ORDER_STATUS_META, value);
}

export function getWorkOrderStatusMeta(status: string | null): WorkOrderStatusMeta {
  if (status && isWorkOrderStatus(status)) {
    return WORK_ORDER_STATUS_META[status];
  }

  return DEFAULT_STATUS_META;
}

export function canTransitionWorkOrderStatus(
  currentStatus: WorkOrderStatus | null,
  nextStatus: WorkOrderStatus,
) {
  if (!currentStatus) {
    return false;
  }

  return WORK_ORDER_ALLOWED_TRANSITIONS[currentStatus].includes(nextStatus);
}

export function canMutateWorkOrderStatus(
  role: UserRole | null,
  currentStatus: WorkOrderStatus | null,
  nextStatus: WorkOrderStatus,
) {
  if (!canTransitionWorkOrderStatus(currentStatus, nextStatus)) {
    return false;
  }

  if (nextStatus === "in_progress") {
    return currentStatus === "pending" && canStartWorkOrders(role);
  }

  if (nextStatus === "cancelled") {
    return currentStatus === "pending" && canCancelWorkOrders(role);
  }

  if (nextStatus === "completed") {
    return currentStatus === "in_progress" && canCompleteWorkOrders(role);
  }

  return false;
}

export function normalizeWorkOrderRow(
  row: WorkOrderWithFinishedGoodRow,
): WorkOrderWithFinishedGood {
  const finishedGoods = Array.isArray(row.finished_goods)
    ? row.finished_goods[0] ?? null
    : row.finished_goods;

  return {
    ...row,
    finished_goods: finishedGoods,
  };
}
