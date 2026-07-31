import { useQueryClient } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import PageHeader from "@/components/PageHeader";
import KpiCard from "@/components/KpiCard";
import { Card } from "@/components/ui/card";
import { CardSkeleton } from "@/components/Skeletons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Landmark, ArrowLeftRight, Banknote, PiggyBank, PlusCircle, FileCheck2, TrendingUp, Wifi, WifiOff } from "lucide-react";
import { Link } from "react-router-dom";
import { listCustomers, listAccounts, listTransactions, listLoans } from "@/lib/services";
import { formatCurrency, formatDate } from "@/lib/format";
import {
  Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, Legend, BarChart, Bar,
} from "recharts";
import { useAuth } from "@/contexts/AuthContext";
import useStomp from "@/hooks/useStomp";

const CHART_COLORS = ["#0ea5e9", "#22c55e", "#f59e0b", "#ef4444", "#a855f7"];

function buildTrend(txs) {
  const buckets = new Map();
  txs.forEach((t) => {
    const d = new Date(t.createdAt);
    const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const v = buckets.get(k) || { date: k, deposit: 0, withdrawal: 0, transfer: 0 };
    const amt = parseFloat(t.amount) || 0;
    if (t.txType === "DEPOSIT") v.deposit += amt;
    else if (t.txType === "WITHDRAWAL") v.withdrawal += amt;
    else if (t.txType === "TRANSFER" || t.txType === "IMPS") v.transfer += amt;
    buckets.set(k, v);
  });
  return [...buckets.values()].sort((a, b) => a.date.localeCompare(b.date)).slice(-14);
}

export default function Dashboard() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const customers = useQuery({ queryKey: ["customers"], queryFn: listCustomers });
  const accounts = useQuery({ queryKey: ["accounts"], queryFn: listAccounts });
  const txs = useQuery({ queryKey: ["transactions"], queryFn: listTransactions });
  const loans = useQuery({ queryKey: ["loans"], queryFn: listLoans });

  // Live push channel — every MoneyMovedEvent from the backend flashes the KPIs
  // and refetches the raw lists so the tables/charts stay accurate.
  const [livePulse, setLivePulse] = useState(false);
  const [lastMovement, setLastMovement] = useState(null);
  const { connected: wsConnected } = useStomp(
    ["/topic/money-moved", "/topic/kpis"],
    (payload, topic) => {
      if (topic === "/topic/money-moved") {
        setLastMovement(payload);
        setLivePulse(true);
        setTimeout(() => setLivePulse(false), 1200);
        qc.invalidateQueries({ queryKey: ["transactions"] });
        qc.invalidateQueries({ queryKey: ["accounts"] });
      } else if (topic === "/topic/kpis") {
        qc.invalidateQueries({ queryKey: ["accounts"] });
      }
    }
  );

  const loading = customers.isLoading || accounts.isLoading || txs.isLoading || loans.isLoading;

  const totalBalance = (accounts.data || []).reduce((s, a) => s + (parseFloat(a.balance) || 0), 0);
  const pendingKyc = (customers.data || []).filter((c) => c.kycStatus === "PENDING").length;
  const activeLoans = (loans.data || []).filter((l) => ["APPLIED", "APPROVED", "DISBURSED"].includes(l.status));
  const pendingLoans = activeLoans.filter((l) => l.status === "APPLIED").length;

  const trend = buildTrend(txs.data || []);
  const txTypePie = ["DEPOSIT", "WITHDRAWAL", "TRANSFER", "IMPS", "REVERSAL"].map((t, i) => ({
    name: t,
    value: (txs.data || []).filter((x) => x.txType === t).length,
    color: CHART_COLORS[i % CHART_COLORS.length],
  })).filter((x) => x.value > 0);

  const loanStatusData = ["APPLIED", "APPROVED", "DISBURSED", "SETTLED", "REJECTED"].map((s) => ({
    status: s, count: (loans.data || []).filter((l) => l.status === s).length,
  }));

  return (
    <>
      <PageHeader
        title={`Welcome back, ${user?.username || "there"}`}
        description="Real-time overview of the EBCS platform."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant={wsConnected ? "default" : "secondary"}
              className={`gap-1 ${wsConnected ? "bg-emerald-500 hover:bg-emerald-500 text-white" : ""}`}
              data-testid="ws-status-badge"
            >
              {wsConnected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
              {wsConnected ? "Live" : "Offline"}
            </Badge>
            <Button asChild variant="outline" size="sm" data-testid="quick-open-account">
              <Link to="/accounts"><PlusCircle className="h-4 w-4 mr-1.5" /> Open account</Link>
            </Button>
            <Button asChild size="sm" data-testid="quick-transfer">
              <Link to="/transactions"><ArrowLeftRight className="h-4 w-4 mr-1.5" /> New transaction</Link>
            </Button>
          </div>
        }
      />

      {lastMovement && (
        <div
          data-testid="ws-last-event"
          className={`mt-1 mb-4 flex items-center gap-3 rounded-md border p-3 text-sm transition-all ${
            livePulse ? "ring-2 ring-emerald-500/60 bg-emerald-500/5" : "bg-card"
          }`}
        >
          <div className="h-8 w-8 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
            <ArrowLeftRight className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium truncate">
              {lastMovement.kind} · {formatCurrency(lastMovement.amount)}
              {lastMovement.reference ? <span className="text-muted-foreground"> · {lastMovement.reference}</span> : null}
            </div>
            <div className="text-xs text-muted-foreground">
              Live · just now
              {lastMovement.fromAccountId ? ` · from #${lastMovement.fromAccountId}` : ""}
              {lastMovement.toAccountId ? ` · to #${lastMovement.toAccountId}` : ""}
            </div>
          </div>
          <Badge variant="outline" className="text-[10px]">WS</Badge>
        </div>
      )}

      {loading ? <CardSkeleton /> : (
        <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 ${livePulse ? "kpi-pulse" : ""}`}>
          <KpiCard label="Customers" value={customers.data?.length ?? 0} delta={12} icon={Users} tone="info" testId="kpi-customers" />
          <KpiCard label="Total balance" value={formatCurrency(totalBalance)} delta={4.2} icon={Landmark} tone="success" testId="kpi-balance" />
          <KpiCard label="Transactions" value={txs.data?.length ?? 0} delta={8} icon={ArrowLeftRight} testId="kpi-transactions" />
          <KpiCard label="Active loans" value={activeLoans.length} delta={-1.5} icon={Banknote} tone="warn" testId="kpi-loans" />
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm font-semibold">Transaction volume (last 14 days)</div>
              <div className="text-xs text-muted-foreground">Deposits, withdrawals, transfers by day</div>
            </div>
            <Badge variant="secondary" className="gap-1"><TrendingUp className="h-3 w-3" /> Live</Badge>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend}>
                <defs>
                  <linearGradient id="gDep" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gWd" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gTr" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="date" fontSize={10} tickFormatter={(d) => d.slice(5)} />
                <YAxis fontSize={10} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                <Area type="monotone" dataKey="deposit" stroke="#22c55e" fill="url(#gDep)" />
                <Area type="monotone" dataKey="withdrawal" stroke="#ef4444" fill="url(#gWd)" />
                <Area type="monotone" dataKey="transfer" stroke="#0ea5e9" fill="url(#gTr)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <div className="text-sm font-semibold mb-1">Transaction mix</div>
          <div className="text-xs text-muted-foreground mb-4">Distribution by type</div>
          <div className="h-72">
            {txTypePie.length === 0 ? (
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground">No transactions yet</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={txTypePie} dataKey="value" nameKey="name" innerRadius={45} outerRadius={80} paddingAngle={2}>
                    {txTypePie.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="p-5">
          <div className="text-sm font-semibold mb-1">Loans by status</div>
          <div className="text-xs text-muted-foreground mb-4">Portfolio pipeline snapshot</div>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={loanStatusData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="status" fontSize={10} />
                <YAxis fontSize={10} allowDecimals={false} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                <Bar dataKey="count" fill="#0ea5e9" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-sm font-semibold">Recent customers</div>
              <div className="text-xs text-muted-foreground">Latest onboarded</div>
            </div>
            <Button asChild variant="link" size="sm" className="h-auto p-0"><Link to="/customers">View all</Link></Button>
          </div>
          <div className="space-y-3">
            {(customers.data || []).slice(-5).reverse().map((c) => (
              <Link key={c.id} to={`/customers/${c.id}`} className="flex items-center gap-3 hover:bg-accent/50 rounded-md p-2 -m-2">
                <div className="h-9 w-9 rounded-full bg-primary/10 text-primary text-xs font-semibold flex items-center justify-center">
                  {c.firstName?.[0]}{c.lastName?.[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{c.firstName} {c.lastName}</div>
                  <div className="text-xs text-muted-foreground truncate">{c.email}</div>
                </div>
                <KycBadge status={c.kycStatus} />
              </Link>
            ))}
            {(customers.data || []).length === 0 && (
              <div className="text-sm text-muted-foreground text-center py-6">No customers yet</div>
            )}
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-sm font-semibold">Pending approvals</div>
              <div className="text-xs text-muted-foreground">Requires action</div>
            </div>
            <Badge variant={pendingKyc + pendingLoans > 0 ? "destructive" : "secondary"}>
              {pendingKyc + pendingLoans}
            </Badge>
          </div>
          <div className="space-y-3">
            <Link to="/kyc" className="flex items-center justify-between p-3 rounded-md border hover:bg-accent/50">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-md bg-amber-500/10 text-amber-500 flex items-center justify-center"><FileCheck2 className="h-4 w-4" /></div>
                <div>
                  <div className="text-sm font-medium">KYC pending</div>
                  <div className="text-xs text-muted-foreground">Documents awaiting review</div>
                </div>
              </div>
              <Badge variant="secondary">{pendingKyc}</Badge>
            </Link>
            <Link to="/loans" className="flex items-center justify-between p-3 rounded-md border hover:bg-accent/50">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-md bg-sky-500/10 text-sky-500 flex items-center justify-center"><Banknote className="h-4 w-4" /></div>
                <div>
                  <div className="text-sm font-medium">Loans to approve</div>
                  <div className="text-xs text-muted-foreground">Applications awaiting decision</div>
                </div>
              </div>
              <Badge variant="secondary">{pendingLoans}</Badge>
            </Link>
            <Link to="/deposits" className="flex items-center justify-between p-3 rounded-md border hover:bg-accent/50">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-md bg-emerald-500/10 text-emerald-500 flex items-center justify-center"><PiggyBank className="h-4 w-4" /></div>
                <div>
                  <div className="text-sm font-medium">Deposits</div>
                  <div className="text-xs text-muted-foreground">Manage FDs & RDs</div>
                </div>
              </div>
              <span className="text-xs text-muted-foreground">Open →</span>
            </Link>
          </div>
        </Card>
      </div>

      <Card className="mt-6 p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-sm font-semibold">Recent transactions</div>
            <div className="text-xs text-muted-foreground">Last 8 movements</div>
          </div>
          <Button asChild variant="link" size="sm" className="h-auto p-0"><Link to="/transactions">View all</Link></Button>
        </div>
        <div className="divide-y">
          {[...(txs.data || [])].slice(-8).reverse().map((t) => (
            <div key={t.id} className="py-3 flex items-center gap-3 text-sm">
              <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                t.txType === "DEPOSIT" ? "bg-emerald-500/10 text-emerald-500" :
                t.txType === "WITHDRAWAL" ? "bg-rose-500/10 text-rose-500" :
                "bg-sky-500/10 text-sky-500"
              }`}>
                <ArrowLeftRight className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{t.reference}</div>
                <div className="text-xs text-muted-foreground truncate">{t.description || t.txType}</div>
              </div>
              <div className="text-right">
                <div className="tabular-nums font-medium">{formatCurrency(t.amount)}</div>
                <div className="text-[10px] text-muted-foreground">{formatDate(t.createdAt)}</div>
              </div>
              <Badge variant="outline" className="ml-2 text-[10px]">{t.txType}</Badge>
            </div>
          ))}
          {(txs.data || []).length === 0 && (
            <div className="text-sm text-muted-foreground text-center py-8">No transactions yet</div>
          )}
        </div>
      </Card>
    </>
  );
}

function KycBadge({ status }) {
  const map = {
    PENDING: "bg-amber-500/10 text-amber-600 border-amber-500/30",
    VERIFIED: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
    REJECTED: "bg-rose-500/10 text-rose-600 border-rose-500/30",
  };
  return <span className={`text-[10px] rounded-full border px-2 py-0.5 ${map[status] || ""}`}>{status}</span>;
}
