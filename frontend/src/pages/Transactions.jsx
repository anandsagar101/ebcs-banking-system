import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import PageHeader from "@/components/PageHeader";
import DataTable from "@/components/DataTable";
import { TableSkeleton } from "@/components/Skeletons";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { listTransactions, listAccounts, deposit, withdraw, transfer, imps, reverseTx } from "@/lib/services";
import { formatCurrency, formatDate } from "@/lib/format";
import { ArrowDownCircle, ArrowUpCircle, ArrowLeftRight, RotateCcw, Zap } from "lucide-react";
import { toast } from "sonner";

export default function Transactions() {
  const qc = useQueryClient();
  const txs = useQuery({ queryKey: ["transactions"], queryFn: listTransactions });
  const accounts = useQuery({ queryKey: ["accounts"], queryFn: listAccounts });

  const [type, setType] = useState("ALL");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const filtered = useMemo(() => {
    return (txs.data || []).filter((t) => {
      if (type !== "ALL" && t.txType !== type) return false;
      if (dateFrom && new Date(t.createdAt) < new Date(dateFrom)) return false;
      if (dateTo && new Date(t.createdAt) > new Date(dateTo + "T23:59:59")) return false;
      return true;
    });
  }, [txs.data, type, dateFrom, dateTo]);

  const reverseMut = useMutation({
    mutationFn: reverseTx,
    onSuccess: () => { toast.success("Reversal booked"); qc.invalidateQueries({ queryKey: ["transactions"] }); qc.invalidateQueries({ queryKey: ["accounts"] }); },
    onError: (e) => toast.error(e?.response?.data?.message || "Reversal failed"),
  });

  const columns = [
    { key: "reference", label: "Reference", render: (r) => <span className="font-mono text-xs">{r.reference}</span> },
    { key: "txType", label: "Type", render: (r) => <Badge variant="outline">{r.txType}</Badge> },
    { key: "fromAccountId", label: "From", render: (r) => r.fromAccountId ? `#${r.fromAccountId}` : "—" },
    { key: "toAccountId", label: "To", render: (r) => r.toAccountId ? `#${r.toAccountId}` : "—" },
    { key: "amount", label: "Amount", cellClassName: "text-right", className: "text-right",
      render: (r) => <span className="tabular-nums font-medium">{formatCurrency(r.amount)}</span> },
    { key: "status", label: "Status", render: (r) => (
      <Badge variant={r.status === "COMPLETED" ? "default" : r.status === "REVERSED" ? "secondary" : "destructive"}>{r.status}</Badge>
    ) },
    { key: "createdAt", label: "Time", render: (r) => <span className="text-xs">{formatDate(r.createdAt)}</span> },
    { key: "actions", label: "", sortable: false, render: (r) =>
      r.status === "COMPLETED" && r.txType !== "REVERSAL" ? (
        <Button variant="ghost" size="sm" onClick={() => reverseMut.mutate(r.reference)}
                data-testid={`tx-reverse-${r.reference}`}>
          <RotateCcw className="h-3.5 w-3.5 mr-1" /> Reverse
        </Button>
      ) : null,
    },
  ];

  return (
    <>
      <PageHeader title="Transactions" description="Deposits, withdrawals, transfers, IMPS and reversals." />

      <Tabs defaultValue="list" className="mb-6">
        <TabsList data-testid="tx-tabs">
          <TabsTrigger value="list" data-testid="tab-tx-list">Transaction log</TabsTrigger>
          <TabsTrigger value="new" data-testid="tab-tx-new">New transaction</TabsTrigger>
        </TabsList>

        <TabsContent value="list">
          <Card className="p-4 mb-4 grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <Label className="text-xs">Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger data-testid="tx-filter-type"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All types</SelectItem>
                  <SelectItem value="DEPOSIT">Deposit</SelectItem>
                  <SelectItem value="WITHDRAWAL">Withdrawal</SelectItem>
                  <SelectItem value="TRANSFER">Transfer</SelectItem>
                  <SelectItem value="IMPS">IMPS</SelectItem>
                  <SelectItem value="REVERSAL">Reversal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">From date</Label>
              <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} data-testid="tx-filter-from" />
            </div>
            <div>
              <Label className="text-xs">To date</Label>
              <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} data-testid="tx-filter-to" />
            </div>
            <div className="flex items-end">
              <Button variant="outline" onClick={() => { setType("ALL"); setDateFrom(""); setDateTo(""); }} className="w-full">Reset filters</Button>
            </div>
          </Card>
          {txs.isLoading ? <TableSkeleton /> : (
            <DataTable data={filtered} columns={columns}
              searchKeys={["reference", "description"]}
              exportName="transactions" testId="transactions-table" />
          )}
        </TabsContent>

        <TabsContent value="new">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <TxForm title="Deposit" description="Credit funds into an account" icon={ArrowDownCircle} tone="emerald"
              submit={(v) => deposit({ accountId: Number(v.accountId), amount: Number(v.amount), description: v.description })}
              accounts={accounts.data || []} fields={["account", "amount", "description"]} qc={qc} testIdPrefix="deposit" />
            <TxForm title="Withdraw" description="Debit funds from an account" icon={ArrowUpCircle} tone="rose"
              submit={(v) => withdraw({ accountId: Number(v.accountId), amount: Number(v.amount), description: v.description })}
              accounts={accounts.data || []} fields={["account", "amount", "description"]} qc={qc} testIdPrefix="withdraw" />
            <TxForm title="Transfer" description="Move funds between EBCS accounts" icon={ArrowLeftRight} tone="sky"
              submit={(v) => transfer({ fromAccountId: Number(v.fromAccountId), toAccountId: Number(v.toAccountId), amount: Number(v.amount), description: v.description })}
              accounts={accounts.data || []} fields={["from", "to", "amount", "description"]} qc={qc} testIdPrefix="transfer" />
            <TxForm title="IMPS transfer" description="Instant interbank movement" icon={Zap} tone="amber"
              submit={(v) => imps({ fromAccountId: Number(v.fromAccountId), toAccountId: Number(v.toAccountId), amount: Number(v.amount), description: v.description })}
              accounts={accounts.data || []} fields={["from", "to", "amount", "description"]} qc={qc} testIdPrefix="imps" />
          </div>
        </TabsContent>
      </Tabs>
    </>
  );
}

function TxForm({ title, description, icon: Icon, tone, submit, accounts, fields, qc, testIdPrefix }) {
  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting }, reset } = useForm();
  const accountId = watch("accountId");
  const fromAccountId = watch("fromAccountId");
  const toAccountId = watch("toAccountId");

  const toneMap = {
    emerald: "bg-emerald-500/10 text-emerald-500",
    rose: "bg-rose-500/10 text-rose-500",
    sky: "bg-sky-500/10 text-sky-500",
    amber: "bg-amber-500/10 text-amber-500",
  };

  const onSubmit = async (v) => {
    try {
      const res = await submit(v);
      toast.success(`${title} completed · ${res.reference}`);
      reset();
      qc.invalidateQueries({ queryKey: ["transactions"] });
      qc.invalidateQueries({ queryKey: ["accounts"] });
    } catch (e) {
      toast.error(e?.response?.data?.message || `${title} failed`);
    }
  };

  return (
    <Card className="p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${toneMap[tone]}`}><Icon className="h-5 w-5" /></div>
        <div>
          <div className="font-semibold">{title}</div>
          <div className="text-xs text-muted-foreground">{description}</div>
        </div>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        {fields.includes("account") && (
          <div>
            <Label>Account</Label>
            <Select value={accountId} onValueChange={(v) => setValue("accountId", v, { shouldValidate: true })}>
              <SelectTrigger data-testid={`${testIdPrefix}-account`}><SelectValue placeholder="Select account" /></SelectTrigger>
              <SelectContent>
                {accounts.map((a) => <SelectItem key={a.id} value={String(a.id)}>{a.accountNumber} · {formatCurrency(a.balance)}</SelectItem>)}
              </SelectContent>
            </Select>
            <input type="hidden" {...register("accountId", { required: "Required" })} />
            {errors.accountId && <p className="text-xs text-destructive mt-1">{errors.accountId.message}</p>}
          </div>
        )}
        {fields.includes("from") && (
          <div>
            <Label>From account</Label>
            <Select value={fromAccountId} onValueChange={(v) => setValue("fromAccountId", v, { shouldValidate: true })}>
              <SelectTrigger data-testid={`${testIdPrefix}-from`}><SelectValue placeholder="Select account" /></SelectTrigger>
              <SelectContent>
                {accounts.map((a) => <SelectItem key={a.id} value={String(a.id)}>{a.accountNumber} · {formatCurrency(a.balance)}</SelectItem>)}
              </SelectContent>
            </Select>
            <input type="hidden" {...register("fromAccountId", { required: "Required" })} />
            {errors.fromAccountId && <p className="text-xs text-destructive mt-1">{errors.fromAccountId.message}</p>}
          </div>
        )}
        {fields.includes("to") && (
          <div>
            <Label>To account</Label>
            <Select value={toAccountId} onValueChange={(v) => setValue("toAccountId", v, { shouldValidate: true })}>
              <SelectTrigger data-testid={`${testIdPrefix}-to`}><SelectValue placeholder="Select account" /></SelectTrigger>
              <SelectContent>
                {accounts.map((a) => <SelectItem key={a.id} value={String(a.id)}>{a.accountNumber} · {formatCurrency(a.balance)}</SelectItem>)}
              </SelectContent>
            </Select>
            <input type="hidden" {...register("toAccountId", { required: "Required" })} />
            {errors.toAccountId && <p className="text-xs text-destructive mt-1">{errors.toAccountId.message}</p>}
          </div>
        )}
        {fields.includes("amount") && (
          <div>
            <Label>Amount</Label>
            <Input type="number" step="0.01" min="0.01" data-testid={`${testIdPrefix}-amount`}
                   {...register("amount", { required: "Required", min: { value: 0.01, message: "> 0" } })} />
            {errors.amount && <p className="text-xs text-destructive mt-1">{errors.amount.message}</p>}
          </div>
        )}
        {fields.includes("description") && (
          <div>
            <Label>Description</Label>
            <Textarea rows={2} data-testid={`${testIdPrefix}-description`} {...register("description")} />
          </div>
        )}
        <Button type="submit" disabled={isSubmitting} className="w-full" data-testid={`${testIdPrefix}-submit`}>
          {isSubmitting ? "Processing..." : title}
        </Button>
      </form>
    </Card>
  );
}
