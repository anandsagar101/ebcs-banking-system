import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import PageHeader from "@/components/PageHeader";
import DataTable from "@/components/DataTable";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getAccount, ledgerByAccount, getCustomer } from "@/lib/services";
import { formatCurrency, formatDate } from "@/lib/format";
import { ArrowLeftRight, Wallet } from "lucide-react";

export default function AccountDetails() {
  const { id } = useParams();
  const a = useQuery({ queryKey: ["account", id], queryFn: () => getAccount(id) });
  const ledger = useQuery({ queryKey: ["ledger", id], queryFn: () => ledgerByAccount(id) });
  const customer = useQuery({
    enabled: !!a.data?.customerId,
    queryKey: ["customer", a.data?.customerId],
    queryFn: () => getCustomer(a.data.customerId),
  });

  if (a.isLoading) return <div className="p-8 text-muted-foreground">Loading...</div>;
  if (!a.data) return <div className="p-8">Not found</div>;
  const acc = a.data;

  const miniStatement = (ledger.data || []).slice(0, 10);

  const cols = [
    { key: "createdAt", label: "Date", render: (r) => <span className="text-xs">{formatDate(r.createdAt)}</span> },
    { key: "transactionRef", label: "Reference", render: (r) => <span className="font-mono text-xs">{r.transactionRef}</span> },
    { key: "description", label: "Description" },
    { key: "entryType", label: "Type", render: (r) => (
      <Badge variant={r.entryType === "CREDIT" ? "default" : "destructive"}>{r.entryType}</Badge>
    ) },
    { key: "amount", label: "Amount", cellClassName: "text-right", className: "text-right",
      render: (r) => (
        <span className={`tabular-nums font-medium ${r.entryType === "CREDIT" ? "text-emerald-600" : "text-rose-600"}`}>
          {r.entryType === "CREDIT" ? "+" : "-"}{formatCurrency(r.amount)}
        </span>
      ) },
    { key: "balanceAfter", label: "Balance after", cellClassName: "text-right", className: "text-right",
      render: (r) => <span className="tabular-nums">{formatCurrency(r.balanceAfter)}</span> },
  ];

  return (
    <>
      <PageHeader
        title={`Account ${acc.accountNumber}`}
        description={customer.data ? `Held by ${customer.data.firstName} ${customer.data.lastName}` : `Customer #${acc.customerId}`}
        actions={
          <>
            <Button asChild variant="outline" size="sm"><Link to="/transactions">New transaction</Link></Button>
          </>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="p-5 md:col-span-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wide"><Wallet className="h-3.5 w-3.5" /> Available balance</div>
          <div className="mt-2 text-3xl md:text-4xl font-bold tabular-nums">{formatCurrency(acc.balance)}</div>
          <div className="mt-2 text-xs text-muted-foreground">Daily limit: {formatCurrency(acc.dailyLimit)}</div>
        </Card>
        <Card className="p-5">
          <div className="text-xs text-muted-foreground uppercase tracking-wide">Status</div>
          <div className="mt-2"><Badge variant={acc.status === "ACTIVE" ? "default" : "secondary"} className="text-sm">{acc.status}</Badge></div>
          <div className="mt-3 text-xs text-muted-foreground">Opened: {formatDate(acc.createdAt)}</div>
        </Card>
        <Card className="p-5">
          <div className="text-xs text-muted-foreground uppercase tracking-wide">Customer</div>
          {customer.data ? (
            <Link to={`/customers/${customer.data.id}`} className="mt-2 block text-sm font-medium hover:underline">
              {customer.data.firstName} {customer.data.lastName}
            </Link>
          ) : (
            <div className="mt-2 text-sm">#{acc.customerId}</div>
          )}
          <div className="mt-1 text-xs text-muted-foreground">{customer.data?.email}</div>
        </Card>
      </div>

      <Tabs defaultValue="statement">
        <TabsList>
          <TabsTrigger value="statement" data-testid="tab-statement">Full statement</TabsTrigger>
          <TabsTrigger value="mini" data-testid="tab-mini">Mini statement</TabsTrigger>
        </TabsList>
        <TabsContent value="statement">
          <DataTable data={ledger.data || []} columns={cols}
            searchKeys={["transactionRef", "description"]}
            exportName={`statement-${acc.accountNumber}`}
            testId="account-statement-table" />
        </TabsContent>
        <TabsContent value="mini">
          <Card className="divide-y">
            {miniStatement.length === 0 ? (
              <div className="p-6 text-sm text-muted-foreground text-center">No transactions</div>
            ) : miniStatement.map((e) => (
              <div key={e.id} className="p-4 flex items-center gap-3">
                <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                  e.entryType === "CREDIT" ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
                }`}>
                  <ArrowLeftRight className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{e.description || e.transactionRef}</div>
                  <div className="text-xs text-muted-foreground">{formatDate(e.createdAt)} · {e.transactionRef}</div>
                </div>
                <div className={`text-right tabular-nums ${e.entryType === "CREDIT" ? "text-emerald-600" : "text-rose-600"}`}>
                  {e.entryType === "CREDIT" ? "+" : "-"}{formatCurrency(e.amount)}
                </div>
              </div>
            ))}
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}
