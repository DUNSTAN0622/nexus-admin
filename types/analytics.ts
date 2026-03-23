export type CountryData = Record<string, number>;

export type RevenueInterval = "day" | "month" | "year";

export type RevenueChartDatum = {
  name: string;
  total: number;
};

export type DashboardStats = {
  totalCustomers: number;
  openWorkOrders: number;
  totalInventoryValue: number;
  countryData: CountryData;
  revenueChartData: RevenueChartDatum[];
};
