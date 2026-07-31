import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import PageHeader from "@/components/PageHeader";
import DataTable from "@/components/DataTable";
import { TableSkeleton } from "@/components/Skeletons";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { listLoans, listCustomers, listProducts, applyLoan } from "@/lib/services";
import { formatCurrency, formatDate } from "@/lib/format";
import { Calculator, FilePlus, Eye } from "lucide-react";
import { toast } from "sonner";

export default function Loans() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const loans = useQuery({ queryKey: ["loans"], queryFn: listLoans });
  const customers = useQuery({ queryKey: ["customers"], queryFn: listCustomers });
  const products = useQuery({ queryKey: ["products"], queryFn: listProducts });
  const loanProducts = (products.data || []).filter((p) => p.productType === "LOAN");

  const cmap = new Map((customers.data || []).map((c) => [c.id, `${c.firstName} ${c.lastName}`]));

  const cols = [
    { key: "id", label: "Loan #", render: (r) => <Link to={`/loans/${r.id}`} className="font-medium hover:underline">#{r.id}</Link> },
    { key: "customerId", label: "Customer", render: (r) => cmap.get(r.customerId) || `#${r.customerId}` },
    { key: "principal", label: "Principal", cellClassName: "text-right", className: "text-right",
      render: (r) => <span className="tabular-nums">{formatCurrency(r.principal)}</span> },
    { key: "interestRate", label: "Rate", render: (r) => `${r.interestRate}%` },
    { key: "termMonths", label: "Term", render: (r) => `${r.termMonths} mo` },
    { key: "status", label: "Status", render: (r) => <StatusBadge status={r.status} /> },
    { key: "createdAt", label: "Applied", render: (r) => <span className="text-xs">{formatDate(r.createdAt)}</span> },
    { key: "actions", label: "", sortable: false, render: (r) => (
      <Button asChild variant="ghost" size="sm"><Link to={`/loans/${r.id}`}><Eye className="h-4 w-4" /></Link></Button>
    ) },
  ];

  return (
    <>
      <PageHeader title="Loans" description="Applications, approvals, disbursements and settlements."
        actions={
          <>
            <Button asChild variant="outline"><Link to="/loans/calculator" data-testid="loan-calculator-link"><Calculator className="h-4 w-4 mr-2" /> EMI calculator</Link></Button>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button data-testid="loan-new-btn"><FilePlus className="h-4 w-4 mr-2" /> Apply for loan</Button>
              </DialogTrigger>
              <ApplyLoanDialog customers={customers.data || []} loanProducts={loanProducts}
                onSuccess={() => { setOpen(false); qc.invalidateQueries({ queryKey: ["loans"] }); }} />
            </Dialog>
          </>
        }
      />
      {loans.isLoading ? <TableSkeleton /> : (
        <>
          {loanProducts.length === 0 && (
            <Card className="p-4 mb-4 text-sm text-amber-600 bg-amber-500/5 border-amber-500/30">
              No LOAN products yet. Create one under Products to enable applications.
            </Card>
          )}
          <DataTable data={loans.data || []} columns={cols} exportName="loans" testId="loans-table" />
        </>
      )}
    </>
  );
}

function StatusBadge({ status }) {
  const v = {
    APPLIED: "secondary", APPROVED: "default", DISBURSED: "default",
    SETTLED: "outline", REJECTED: "destructive",
  }[status] || "outline";
  return <Badge variant={v}>{status}</Badge>;
}

function ApplyLoanDialog({ customers, loanProducts, onSuccess }) {
  const { register, handleSubmit, setValue, watch, formState: { errors }, reset } = useForm({
    defaultValues: { interestRate: 10.5, termMonths: 24 },
  });
  const customerId = watch("customerId");
  const productId = watch("productId");
  const mutation = useMutation({
    mutationFn: applyLoan,
    onSuccess: () => { toast.success("Loan application submitted"); reset(); onSuccess(); },
    onError: (e) => toast.error(e?.response?.data?.message || "Failed"),
  });
  return (
    <DialogContent>
      <DialogHeader><DialogTitle>Apply for a loan</DialogTitle></DialogHeader>
      <form onSubmit={handleSubmit((v) => mutation.mutate({
        customerId: Number(v.customerId), productId: Number(v.productId),
        principal: Number(v.principal), interestRate: Number(v.interestRate),
        termMonths: Number(v.termMonths),
      }))} className="space-y-3">
        <div>
          <Label>Customer</Label>
          <Select value={customerId} onValueChange={(v) => setValue("customerId", v, { shouldValidate: true })}>
            <SelectTrigger data-testid="loan-customer"><SelectValue placeholder="Select customer" /></SelectTrigger>
            <SelectContent>
              {customers.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.firstName} {c.lastName}</SelectItem>)}
            </SelectContent>
          </Select>
          <input type="hidden" {...register("customerId", { required: "Required" })} />
          {errors.customerId && <p className="text-xs text-destructive mt-1">{errors.customerId.message}</p>}
        </div>
        <div>
          <Label>Loan product</Label>
          <Select value={productId} onValueChange={(v) => setValue("productId", v, { shouldValidate: true })}>
            <SelectTrigger data-testid="loan-product"><SelectValue placeholder="Select product" /></SelectTrigger>
            <SelectContent>
              {loanProducts.map((p) => <SelectItem key={p.id} value={String(p.id)}>{p.code} · {p.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <input type="hidden" {...register("productId", { required: "Required" })} />
          {errors.productId && <p className="text-xs text-destructive mt-1">{errors.productId.message}</p>}
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <Label>Principal</Label>
            <Input type="number" step="0.01" data-testid="loan-principal" {...register("principal", { required: true, min: 0.01 })} />
          </div>
          <div>
            <Label>Rate (%)</Label>
            <Input type="number" step="0.01" data-testid="loan-rate" {...register("interestRate", { required: true, min: 0 })} />
          </div>
          <div>
            <Label>Term (months)</Label>
            <Input type="number" data-testid="loan-term" {...register("termMonths", { required: true, min: 1 })} />
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" disabled={mutation.isPending} data-testid="loan-submit">
            {mutation.isPending ? "Submitting..." : "Submit application"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
