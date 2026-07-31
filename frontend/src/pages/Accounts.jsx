import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import PageHeader from "@/components/PageHeader";
import DataTable from "@/components/DataTable";
import { TableSkeleton } from "@/components/Skeletons";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { listAccounts, listCustomers, listProducts, openAccount } from "@/lib/services";
import { formatCurrency, formatDate } from "@/lib/format";
import { Plus, Eye } from "lucide-react";
import { toast } from "sonner";

export default function Accounts() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const accounts = useQuery({ queryKey: ["accounts"], queryFn: listAccounts });
  const customers = useQuery({ queryKey: ["customers"], queryFn: listCustomers });
  const products = useQuery({ queryKey: ["products"], queryFn: listProducts });

  const customerMap = new Map((customers.data || []).map((c) => [c.id, `${c.firstName} ${c.lastName}`]));
  const productMap = new Map((products.data || []).map((p) => [p.id, `${p.code} · ${p.name}`]));

  const columns = [
    { key: "accountNumber", label: "Account #", render: (r) =>
      <Link to={`/accounts/${r.id}`} className="font-mono text-xs hover:underline">{r.accountNumber}</Link> },
    { key: "customerId", label: "Customer", render: (r) => customerMap.get(r.customerId) || `#${r.customerId}` },
    { key: "productId", label: "Product", render: (r) => productMap.get(r.productId) || `#${r.productId}` },
    { key: "status", label: "Status", render: (r) => <Badge variant={r.status === "ACTIVE" ? "default" : "secondary"}>{r.status}</Badge> },
    { key: "balance", label: "Balance", cellClassName: "text-right", className: "text-right",
      render: (r) => <span className="tabular-nums font-medium">{formatCurrency(r.balance)}</span> },
    { key: "createdAt", label: "Opened", render: (r) => <span className="text-xs">{formatDate(r.createdAt)}</span> },
    { key: "actions", label: "", sortable: false, render: (r) => (
      <Button asChild variant="ghost" size="sm"><Link to={`/accounts/${r.id}`}><Eye className="h-4 w-4" /></Link></Button>
    ) },
  ];

  return (
    <>
      <PageHeader
        title="Accounts"
        description="All bank accounts — savings, current, FD and RD."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button data-testid="account-new-btn"><Plus className="h-4 w-4 mr-2" /> Open account</Button>
            </DialogTrigger>
            <OpenAccountDialog
              customers={customers.data || []}
              products={products.data || []}
              onSuccess={() => { setOpen(false); qc.invalidateQueries({ queryKey: ["accounts"] }); }}
            />
          </Dialog>
        }
      />
      {accounts.isLoading ? <TableSkeleton /> : (
        <DataTable data={accounts.data || []} columns={columns}
          searchKeys={["accountNumber"]}
          exportName="accounts" testId="accounts-table" />
      )}
    </>
  );
}

function OpenAccountDialog({ customers, products, onSuccess }) {
  const { handleSubmit, setValue, watch, register, formState: { errors }, reset } = useForm();
  const customerId = watch("customerId");
  const productId = watch("productId");

  const mutation = useMutation({
    mutationFn: openAccount,
    onSuccess: () => { toast.success("Account opened"); reset(); onSuccess(); },
    onError: (e) => toast.error(e?.response?.data?.message || "Failed"),
  });

  return (
    <DialogContent>
      <DialogHeader><DialogTitle>Open new account</DialogTitle></DialogHeader>
      <form onSubmit={handleSubmit((v) => mutation.mutate({ customerId: Number(v.customerId), productId: Number(v.productId) }))} className="space-y-3">
        <div>
          <Label>Customer</Label>
          <Select value={customerId} onValueChange={(v) => setValue("customerId", v, { shouldValidate: true })}>
            <SelectTrigger data-testid="open-account-customer"><SelectValue placeholder="Select customer" /></SelectTrigger>
            <SelectContent>
              {customers.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.firstName} {c.lastName} · {c.email}</SelectItem>)}
            </SelectContent>
          </Select>
          <input type="hidden" {...register("customerId", { required: "Required" })} />
          {errors.customerId && <p className="text-xs text-destructive mt-1">{errors.customerId.message}</p>}
        </div>
        <div>
          <Label>Product</Label>
          <Select value={productId} onValueChange={(v) => setValue("productId", v, { shouldValidate: true })}>
            <SelectTrigger data-testid="open-account-product"><SelectValue placeholder="Select product" /></SelectTrigger>
            <SelectContent>
              {products.map((p) => <SelectItem key={p.id} value={String(p.id)}>{p.code} · {p.name} ({p.productType})</SelectItem>)}
            </SelectContent>
          </Select>
          <input type="hidden" {...register("productId", { required: "Required" })} />
          {errors.productId && <p className="text-xs text-destructive mt-1">{errors.productId.message}</p>}
        </div>
        <DialogFooter>
          <Button type="submit" disabled={mutation.isPending} data-testid="open-account-submit">
            {mutation.isPending ? "Opening..." : "Open account"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
