"use server";

import type {
  DashboardStats,
  RevenueChartDatum,
  RevenueInterval,
} from "@/types/analytics";
import { createAdminSupabaseClient, getUserProfile } from "@/utils/auth";
import { canAccessAnalytics } from "@/utils/rbac";

type AdminSupabaseClient = ReturnType<typeof createAdminSupabaseClient>;

type CustomerCountryRow = {
  country_code: string | null;
};

type InventoryValueRow = {
  stock: number | null;
  price: number | string | null;
};

type CompletedWorkOrderRow = {
  target_quantity: number | null;
  completed_at: string | null;
  finished_goods:
    | {
        price: number | string | null;
      }
    | Array<{
        price: number | string | null;
      }>
    | null;
};

type RevenueBucket = RevenueChartDatum & {
  bucketKey: string;
  bucketStart: Date;
};

type RevenueIntervalConfig = {
  bucketCount: number;
  getBucketKey: (date: Date) => string;
  getBucketLabel: (date: Date) => string;
  shiftBucket: (date: Date, offset: number) => Date;
  startOfBucket: (date: Date) => Date;
};

async function requireAuthenticatedProfile() {
  const profile = await getUserProfile();

  if (!profile) {
    throw new Error("Unauthorized");
  }

  if (!canAccessAnalytics(profile.role)) {
    throw new Error("Forbidden");
  }

  return profile;
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function startOfYear(date: Date) {
  return new Date(date.getFullYear(), 0, 1);
}

function shiftDay(date: Date, offset: number) {
  const shiftedDate = new Date(date);
  shiftedDate.setDate(shiftedDate.getDate() + offset);
  return startOfDay(shiftedDate);
}

function shiftMonth(date: Date, offset: number) {
  return new Date(date.getFullYear(), date.getMonth() + offset, 1);
}

function shiftYear(date: Date, offset: number) {
  return new Date(date.getFullYear() + offset, 0, 1);
}

function getDayKey(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function getMonthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function getYearKey(date: Date) {
  return String(date.getFullYear());
}

function getDayLabel(date: Date) {
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

function getMonthLabel(date: Date) {
  return `${date.getMonth() + 1}月`;
}

function getYearLabel(date: Date) {
  return `${date.getFullYear()}年`;
}

const revenueIntervalConfig: Record<RevenueInterval, RevenueIntervalConfig> = {
  day: {
    bucketCount: 14,
    getBucketKey: getDayKey,
    getBucketLabel: getDayLabel,
    shiftBucket: shiftDay,
    startOfBucket: startOfDay,
  },
  month: {
    bucketCount: 6,
    getBucketKey: getMonthKey,
    getBucketLabel: getMonthLabel,
    shiftBucket: shiftMonth,
    startOfBucket: startOfMonth,
  },
  year: {
    bucketCount: 3,
    getBucketKey: getYearKey,
    getBucketLabel: getYearLabel,
    shiftBucket: shiftYear,
    startOfBucket: startOfYear,
  },
};

function createRevenueBuckets(
  interval: RevenueInterval,
  referenceDate: Date,
): RevenueBucket[] {
  const intervalConfig = revenueIntervalConfig[interval];
  const currentBucketStart = intervalConfig.startOfBucket(referenceDate);

  return Array.from({ length: intervalConfig.bucketCount }, (_, bucketIndex) => {
    const bucketStart = intervalConfig.shiftBucket(
      currentBucketStart,
      bucketIndex - intervalConfig.bucketCount + 1,
    );

    return {
      bucketKey: intervalConfig.getBucketKey(bucketStart),
      bucketStart,
      name: intervalConfig.getBucketLabel(bucketStart),
      total: 0,
    };
  });
}

function getFinishedGoodPrice(
  finishedGoods: CompletedWorkOrderRow["finished_goods"] | undefined,
) {
  const finishedGoodRecord = Array.isArray(finishedGoods)
    ? finishedGoods[0] ?? null
    : finishedGoods;

  return Number(finishedGoodRecord?.price ?? 0);
}

async function getRevenueDataForInterval({
  supabase,
  interval,
  referenceDate = new Date(),
}: {
  supabase: AdminSupabaseClient;
  interval: RevenueInterval;
  referenceDate?: Date;
}): Promise<RevenueChartDatum[]> {
  const revenueBuckets = createRevenueBuckets(interval, referenceDate);
  const firstRevenueBucket = revenueBuckets[0];

  if (!firstRevenueBucket) {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from("work_orders")
      .select("target_quantity, completed_at, finished_goods(price)")
      .eq("status", "completed")
      .not("completed_at", "is", null)
      .gte("completed_at", firstRevenueBucket.bucketStart.toISOString());

    if (error) {
      return [];
    }

    const completedWorkOrderRows = (data ?? []) as CompletedWorkOrderRow[];
    const intervalConfig = revenueIntervalConfig[interval];
    const revenueBucketMap = new Map(
      revenueBuckets.map((revenueBucket) => [
        revenueBucket.bucketKey,
        revenueBucket,
      ]),
    );

    for (const completedWorkOrder of completedWorkOrderRows) {
      if (!completedWorkOrder.completed_at) {
        continue;
      }

      const completedDate = new Date(completedWorkOrder.completed_at);

      if (Number.isNaN(completedDate.valueOf())) {
        continue;
      }

      const revenueBucket = revenueBucketMap.get(
        intervalConfig.getBucketKey(completedDate),
      );

      if (!revenueBucket) {
        continue;
      }

      revenueBucket.total +=
        Number(completedWorkOrder.target_quantity ?? 0) *
        getFinishedGoodPrice(completedWorkOrder.finished_goods);
    }

    return revenueBuckets.map(({ name, total }) => ({
      name,
      total,
    }));
  } catch {
    return [];
  }
}

export async function getRevenueData(
  interval: RevenueInterval,
): Promise<RevenueChartDatum[]> {
  await requireAuthenticatedProfile();

  return getRevenueDataForInterval({
    supabase: createAdminSupabaseClient(),
    interval,
  });
}

export async function getDashboardStats(): Promise<DashboardStats> {
  await requireAuthenticatedProfile();

  const supabase = createAdminSupabaseClient();

  const [
    customersResult,
    workOrdersResult,
    finishedGoodsResult,
    revenueChartData,
  ] = await Promise.all([
    supabase.from("customers").select("country_code", { count: "exact" }),
    supabase
      .from("work_orders")
      .select("id", { count: "exact", head: true })
      .in("status", ["pending", "in_progress"]),
    supabase.from("finished_goods").select("stock, price"),
    getRevenueDataForInterval({ supabase, interval: "month" }),
  ]);

  if (customersResult.error) {
    throw new Error(customersResult.error.message);
  }

  if (workOrdersResult.error) {
    throw new Error(workOrdersResult.error.message);
  }

  if (finishedGoodsResult.error) {
    throw new Error(finishedGoodsResult.error.message);
  }

  const customerRows = (customersResult.data ?? []) as CustomerCountryRow[];
  const countryData = customerRows.reduce<Record<string, number>>(
    (countryCountMap, customerRow) => {
      const countryCode = customerRow.country_code?.trim().toUpperCase();

      if (!countryCode) {
        return countryCountMap;
      }

      countryCountMap[countryCode] = (countryCountMap[countryCode] ?? 0) + 1;
      return countryCountMap;
    },
    {},
  );

  const inventoryRows = (finishedGoodsResult.data ?? []) as InventoryValueRow[];
  const totalInventoryValue = inventoryRows.reduce((sum, inventoryRow) => {
    const stock = Number(inventoryRow.stock ?? 0);
    const price = Number(inventoryRow.price ?? 0);

    return sum + stock * price;
  }, 0);

  return {
    totalCustomers: customersResult.count ?? customerRows.length,
    openWorkOrders: workOrdersResult.count ?? 0,
    totalInventoryValue,
    countryData,
    revenueChartData: revenueChartData ?? [],
  };
}
