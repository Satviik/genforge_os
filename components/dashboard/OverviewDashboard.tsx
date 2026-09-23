import { ExpensesPanel } from "@/components/dashboard/ExpensesPanel";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { NetworkPreview } from "@/components/dashboard/NetworkPreview";
import { ProfitBreakdown } from "@/components/dashboard/ProfitBreakdown";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { RecentOrders } from "@/components/dashboard/RecentOrders";
import { RevenueByChannel } from "@/components/dashboard/RevenueByChannel";
import { TeamPerformance } from "@/components/dashboard/TeamPerformance";
import { TopProducts } from "@/components/dashboard/TopProducts";
import type { OverviewDashboardData } from "@/lib/types/dashboard";

export function OverviewDashboard({ data }: { data: OverviewDashboardData }) {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-[26px] font-medium tracking-tight text-gf-text">
          Good morning, {data.operatorName}.
        </h1>
        <p className="mt-1 text-[13px] text-gf-secondary">{data.greetingTagline}</p>
      </div>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {data.kpis.map((metric) => (
          <KpiCard key={metric.id} metric={metric} />
        ))}
      </section>

      <section className="grid grid-cols-1 gap-3 xl:grid-cols-12">
        <div className="xl:col-span-7">
          <RevenueByChannel data={data.revenueByChannel} />
        </div>
        <div className="xl:col-span-5">
          <RecentOrders orders={data.recentOrders} />
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3 xl:grid-cols-12">
        <div className="xl:col-span-4">
          <TopProducts products={data.topProducts} />
        </div>
        <div className="xl:col-span-4">
          <ProfitBreakdown data={data.profitBreakdown} />
        </div>
        <div className="xl:col-span-4">
          <QuickActions actions={data.quickActions} quote={data.mascotQuote} />
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3 xl:grid-cols-12">
        <div className="xl:col-span-4">
          <TeamPerformance members={data.teamPerformance} />
        </div>
        <div className="xl:col-span-4">
          <ExpensesPanel items={data.expenses} total={data.expenseTotal} />
        </div>
        <div className="xl:col-span-4">
          <NetworkPreview nodes={data.networkNodes} hubValue={data.networkHubValue} />
        </div>
      </section>
    </div>
  );
}
