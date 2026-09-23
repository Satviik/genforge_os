export type TrendDirection = "up" | "down";

export type KpiMetric = {
  id: string;
  label: string;
  value: string;
  delta: number;
  direction: TrendDirection;
  sparkline: number[];
};

export type ChannelRevenue = {
  channel: string;
  revenue: number;
};

export type OrderStatus = "Paid" | "Pending";

export type RecentOrder = {
  id: string;
  customerName: string;
  amount: number;
  status: OrderStatus;
  relativeTime: string;
};

export type TopProduct = {
  id: string;
  name: string;
  unitsSold: number;
  revenue: number;
};

export type CostSlice = {
  id: string;
  label: string;
  amount: number;
  color: string;
};

export type ProfitBreakdown = {
  profitPercent: number;
  slices: CostSlice[];
  totalCosts: number;
};

export type QuickAction = {
  id: string;
  label: string;
  href: string;
};

export type TeamMemberPerformance = {
  id: string;
  name: string;
  role: string;
  metricLabel: string;
  metricValue: string;
  attributedRevenue: number;
};

export type ExpenseItem = {
  id: string;
  category: string;
  label: string;
  amount: number;
};

export type NetworkNodeKind =
  | "hub"
  | "products"
  | "customers"
  | "orders"
  | "production"
  | "channels"
  | "expenses"
  | "profit";

export type NetworkPreviewNode = {
  id: NetworkNodeKind;
  label: string;
  meta: string;
  accent?: "orange" | "green";
};

export type OverviewDashboardData = {
  operatorName: string;
  operatorRole: string;
  dateRangeLabel: string;
  greetingTagline: string;
  kpis: KpiMetric[];
  revenueByChannel: ChannelRevenue[];
  recentOrders: RecentOrder[];
  topProducts: TopProduct[];
  profitBreakdown: ProfitBreakdown;
  quickActions: QuickAction[];
  mascotQuote: string;
  teamPerformance: TeamMemberPerformance[];
  expenses: ExpenseItem[];
  expenseTotal: number;
  networkNodes: NetworkPreviewNode[];
  networkHubValue: string;
};
