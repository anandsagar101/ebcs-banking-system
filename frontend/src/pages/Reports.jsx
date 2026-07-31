import { useQuery } from "@tanstack/react-query";
import PageHeader from "@/components/PageHeader";
import KpiCard from "@/components/KpiCard";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { CardSkeleton } from "@/components/Skeletons";
import { formatCurrency } from "@/lib/format";
import {
  reportOverview, reportCustomerGrowth, reportTxAnalytics,
  reportDeposits, reportLoans, reportRevenue,
} from "@/lib/services";
import { exportCsv, exportExcel, exportPdf } from "@/lib/exporters";
import {
  Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid,
  Bar, BarChart, Legend, PieChart, Pie, Cell, Line, LineChart,
} from "recharts";
import { Users, Landmark, ArrowLeftRight, Banknote, TrendingUp, PiggyBank, Download } from "lucide-react";

const COLORS = ["#0ea5e9", "#22c55e", "#f59e0b", "#ef4444", "#a855f7"];

export default function Reports() {
  const overview = useQuery({ queryKey: ["r-overview"], queryFn: reportOverview });
  const growth = useQuery({ queryKey: ["r-growth"], queryFn: () => reportCustomerGrowth(6) });
  const tx = useQuery({ queryKey: ["r-tx"], queryFn: () => reportTxAnalytics(14) });
  const dep = useQuery({ queryKey: ["r-dep"], queryFn: reportDeposits });
  const loans = useQuery({ queryKey: ["r-loans"], queryFn: reportLoans });
  const revenue = useQuery({ queryKey: ["r-rev"], queryFn: () => reportRevenue(6) });

  return (
    <>
      <PageHeader title="Reports & Analytics" description="Executive dashboards, growth, revenue, portfolio pipelines." />

      {overview.isLoading ? <CardSkeleton /> : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard label="Customers" value={overview.data?.customers ?? 0} icon={Users} tone="info" testId="r-kpi-customers" />
          <KpiCard label="Total balance" value={formatCurrency(overview.data?.totalBalance ?? 0)} icon={Landmark} tone="success" testId="r-kpi-balance" />
          <KpiCard label="Transactions" value={overview.data?.transactions ?? 0} icon={ArrowLeftRight} testId="r-kpi-tx" />
          <KpiCard label="Loans" value={overview.data?.loans ?? 0} icon={Banknote} tone="warn" testId="r-kpi-loans" />
        </div>
      )}

      <Tabs defaultValue="growth" className="mt-6">
        <TabsList data-testid="reports-tabs">
          <TabsTrigger value="growth" data-testid="tab-growth">Customer growth</TabsTrigger>
          <TabsTrigger value="tx" data-testid="tab-tx">Transaction analytics</TabsTrigger>
          <TabsTrigger value="revenue" data-testid="tab-revenue">Revenue</TabsTrigger>
          <TabsTrigger value="deposits" data-testid="tab-deposits">Deposits</TabsTrigger>
          <TabsTrigger value="loans" data-testid="tab-loans">Loans</TabsTrigger>
        </TabsList>

        <TabsContent value="growth">
          <ReportChart
            title="Customer growth (6 months)"
            data={growth.data?.series || []}
            actions={<DownloadMenu name="customer-growth" rows={growth.data?.series} />}
            testId="chart-growth"
          >
            <LineChart data={growth.data?.series || []}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="month" fontSize={11} />
              <YAxis fontSize={11} allowDecimals={false} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
              <Legend />
              <Line type="monotone" dataKey="new" stroke="#0ea5e9" strokeWidth={2} name="New this month" />
              <Line type="monotone" dataKey="total" stroke="#22c55e" strokeWidth={2} name="Running total" />
            </LineChart>
          </ReportChart>
        </TabsContent>

        <TabsContent value="tx">
          <ReportChart
            title={`Transaction analytics — Volume $${tx.data?.totalVolume ?? 0} across ${tx.data?.totalCount ?? 0} txs (14 days)`}
            data={tx.data?.series || []}
            actions={<DownloadMenu name="transaction-analytics" rows={tx.data?.series} />}
            testId="chart-tx"
          >
            <AreaChart data={tx.data?.series || []}>
              <defs>
                <linearGradient id="ad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#22c55e" stopOpacity={0.4} /><stop offset="95%" stopColor="#22c55e" stopOpacity={0} /></linearGradient>
                <linearGradient id="aw" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} /><stop offset="95%" stopColor="#ef4444" stopOpacity={0} /></linearGradient>
                <linearGradient id="at" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} /><stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} /></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="day" fontSize={10} tickFormatter={(d) => (d || "").slice(5)} />
              <YAxis fontSize={11} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
              <Legend />
              <Area type="monotone" dataKey="DEPOSIT" stroke="#22c55e" fill="url(#ad)" />
              <Area type="monotone" dataKey="WITHDRAWAL" stroke="#ef4444" fill="url(#aw)" />
              <Area type="monotone" dataKey="TRANSFER" stroke="#0ea5e9" fill="url(#at)" />
            </AreaChart>
          </ReportChart>
        </TabsContent>

        <TabsContent value="revenue">
          <ReportChart
            title={`Estimated revenue — ${formatCurrency(revenue.data?.totalEstimated || 0)} projected interest`}
            data={revenue.data?.series || []}
            actions={<DownloadMenu name="revenue" rows={revenue.data?.series} />}
            testId="chart-revenue"
          >
            <BarChart data={revenue.data?.series || []}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="month" fontSize={11} />
              <YAxis fontSize={11} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} formatter={(v) => formatCurrency(v)} />
              <Bar dataKey="estimatedInterest" fill="#f59e0b" radius={[6, 6, 0, 0]} name="Est. interest" />
            </BarChart>
          </ReportChart>
        </TabsContent>

        <TabsContent value="deposits">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-5"><div className="text-xs uppercase tracking-wide text-muted-foreground">Fixed Deposits</div><div className="mt-2 text-2xl font-bold tabular-nums">{dep.data?.fdCount ?? 0}</div><div className="mt-1 text-xs text-muted-foreground">Principal: {formatCurrency(dep.data?.fdTotalPrincipal ?? 0)}</div></Card>
            <Card className="p-5"><div className="text-xs uppercase tracking-wide text-muted-foreground">Recurring Deposits</div><div className="mt-2 text-2xl font-bold tabular-nums">{dep.data?.rdCount ?? 0}</div><div className="mt-1 text-xs text-muted-foreground">Installments: {formatCurrency(dep.data?.rdTotalInstallments ?? 0)}</div></Card>
          </div>
        </TabsContent>

        <TabsContent value="loans">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-5">
              <div className="text-sm font-semibold mb-4">Loans by status</div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={Object.entries(loans.data?.byStatus || {}).map(([k, v]) => ({ name: k, value: v }))}
                         dataKey="value" nameKey="name" innerRadius={45} outerRadius={90} paddingAngle={2}>
                      {Object.keys(loans.data?.byStatus || {}).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>
            <Card className="p-5">
              <div className="text-sm font-semibold mb-4">Portfolio totals</div>
              <div className="space-y-3 text-sm">
                <Row k="Total disbursed" v={formatCurrency(loans.data?.totalDisbursed || 0)} />
                <Row k="Currently outstanding" v={formatCurrency(loans.data?.outstanding || 0)} />
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </>
  );
}

function ReportChart({ title, children, actions, testId }) {
  return (
    <Card className="p-5" data-testid={testId}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
          <div className="text-sm font-semibold">{title}</div>
        </div>
        {actions}
      </div>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">{children}</ResponsiveContainer>
      </div>
    </Card>
  );
}

function Row({ k, v }) {
  return <div className="flex justify-between border-b pb-2"><span className="text-muted-foreground">{k}</span><span className="font-medium tabular-nums">{v}</span></div>;
}

function DownloadMenu({ name, rows }) {
  const data = rows || [];
  return (
    <div className="flex items-center gap-1">
      <Button variant="outline" size="sm" onClick={() => exportCsv(name, data)} disabled={!data.length} data-testid={`export-csv-${name}`}>
        <Download className="h-3.5 w-3.5 mr-1" /> CSV
      </Button>
      <Button variant="outline" size="sm" onClick={() => exportExcel(name, data)} disabled={!data.length}>Excel</Button>
      <Button variant="outline" size="sm" onClick={() => exportPdf(name, data, name)} disabled={!data.length}>PDF</Button>
    </div>
  );
}
