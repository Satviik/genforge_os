import { OverviewDashboard } from "@/components/dashboard/OverviewDashboard";
import { overviewDashboardData } from "@/lib/data/overview";

export default function OverviewPage() {
  return <OverviewDashboard data={overviewDashboardData} />;
}
