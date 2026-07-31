import { useState } from "react";
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
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { listFds, listRds, bookFd, bookRd, listAccounts } from "@/lib/services";
import { formatCurrency, formatDateShort } from "@/lib/format";
import { PiggyBank, PlusCircle } from "lucide-react";
import { toast } from "sonner";

export default function Deposits() {
  const qc = useQueryClient();
  const [fdOpen, setFdOpen] = useState(false);
  const [rdOpen, setRdOpen] = useState(false);
  const fds = useQuery({ queryKey: ["fds"], queryFn: listFds });
  const rds = useQuery({ queryKey: ["rds"], queryFn: listRds });
  const accounts = useQuery({ queryKey: ["accounts"], queryFn: listAccounts });

  const fdCols = [
    { key: "id", label: "FD ID", render: (r) => `#${r.id}` },
    { key: "accountId", label: "Account", render: (r) => `#${r.accountId}` },
    { key: "principal", label: "Principal", cellClassName: "text-right", className: "text-right",
      render: (r) => <span className="tabular-nums">{formatCurrency(r.principal)}</span> },
    { key: "interestRate", label: "Rate", render: (r) => `${r.interestRate}%` },
    { key: "termMonths", label: "Term", render: (r) => `${r.termMonths} mo` },
    { key: "startDate", label: "Start", render: (r) => formatDateShort(r.startDate) },
    { key: "maturityDate", label: "Maturity", render: (r) => formatDateShort(r.maturityDate) },
    { key: "status", label: "Status", render: (r) => <Badge variant={r.status === "ACTIVE" ? "default" : "secondary"}>{r.status}</Badge> },
  ];
  const rdCols = [
    { key: "id", label: "RD ID", render: (r) => `#${r.id}` },
    { key: "accountId", label: "Account", render: (r) => `#${r.accountId}` },
    { key: "installmentAmount", label: "Installment", render: (r) => <span className="tabular-nums">{formatCurrency(r.installmentAmount)}</span> },
    { key: "interestRate", label: "Rate", render: (r) => `${r.interestRate}%` },
    { key: "termMonths", label: "Term", render: (r) => `${r.termMonths} mo` },
    { key: "startDate", label: "Start", render: (r) => formatDateShort(r.startDate) },
    { key: "status", label: "Status", render: (r) => <Badge>{r.status}</Badge> },
  ];

  return (
    <>
      <PageHeader title="Deposits" description="Fixed and Recurring deposits."
        actions={
          <>
            <Dialog open={fdOpen} onOpenChange={setFdOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" data-testid="fd-new-btn"><PlusCircle className="h-4 w-4 mr-2" />Book FD</Button>
              </DialogTrigger>
              <BookFdDialog accounts={accounts.data || []} onSuccess={() => { setFdOpen(false); qc.invalidateQueries({ queryKey: ["fds"] }); qc.invalidateQueries({ queryKey: ["accounts"] }); }} />
            </Dialog>
            <Dialog open={rdOpen} onOpenChange={setRdOpen}>
              <DialogTrigger asChild>
                <Button data-testid="rd-new-btn"><PiggyBank className="h-4 w-4 mr-2" />Book RD</Button>
              </DialogTrigger>
              <BookRdDialog accounts={accounts.data || []} onSuccess={() => { setRdOpen(false); qc.invalidateQueries({ queryKey: ["rds"] }); }} />
            </Dialog>
          </>
        }
      />

      <Tabs defaultValue="fd">
        <TabsList data-testid="deposits-tabs">
          <TabsTrigger value="fd" data-testid="tab-fd">Fixed deposits</TabsTrigger>
          <TabsTrigger value="rd" data-testid="tab-rd">Recurring deposits</TabsTrigger>
        </TabsList>
        <TabsContent value="fd">
          {fds.isLoading ? <TableSkeleton /> : (
            <DataTable data={fds.data || []} columns={fdCols} exportName="fixed-deposits" testId="fd-table" />
          )}
        </TabsContent>
        <TabsContent value="rd">
          {rds.isLoading ? <TableSkeleton /> : (
            <DataTable data={rds.data || []} columns={rdCols} exportName="recurring-deposits" testId="rd-table" />
          )}
        </TabsContent>
      </Tabs>
    </>
  );
}

function BookFdDialog({ accounts, onSuccess }) {
  const { register, handleSubmit, setValue, watch, formState: { errors }, reset } = useForm({
    defaultValues: { interestRate: 6.5, termMonths: 12 },
  });
  const accountId = watch("accountId");
  const mutation = useMutation({
    mutationFn: bookFd,
    onSuccess: () => { toast.success("FD booked"); reset(); onSuccess(); },
    onError: (e) => toast.error(e?.response?.data?.message || "Failed"),
  });
  return (
    <DialogContent>
      <DialogHeader><DialogTitle>Book Fixed Deposit</DialogTitle></DialogHeader>
      <form onSubmit={handleSubmit((v) => mutation.mutate({
        accountId: Number(v.accountId), principal: Number(v.principal),
        interestRate: Number(v.interestRate), termMonths: Number(v.termMonths),
      }))} className="space-y-3">
        <div>
          <Label>Account</Label>
          <Select value={accountId} onValueChange={(v) => setValue("accountId", v, { shouldValidate: true })}>
            <SelectTrigger data-testid="fd-account"><SelectValue placeholder="Select account" /></SelectTrigger>
            <SelectContent>
              {accounts.map((a) => <SelectItem key={a.id} value={String(a.id)}>{a.accountNumber} · {formatCurrency(a.balance)}</SelectItem>)}
            </SelectContent>
          </Select>
          <input type="hidden" {...register("accountId", { required: "Required" })} />
          {errors.accountId && <p className="text-xs text-destructive mt-1">{errors.accountId.message}</p>}
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <Label>Principal</Label>
            <Input type="number" step="0.01" data-testid="fd-principal" {...register("principal", { required: true, min: 0.01 })} />
          </div>
          <div>
            <Label>Rate (%)</Label>
            <Input type="number" step="0.01" data-testid="fd-rate" {...register("interestRate", { required: true, min: 0 })} />
          </div>
          <div>
            <Label>Term (months)</Label>
            <Input type="number" data-testid="fd-term" {...register("termMonths", { required: true, min: 1 })} />
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" disabled={mutation.isPending} data-testid="fd-submit">
            {mutation.isPending ? "Booking..." : "Book FD"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

function BookRdDialog({ accounts, onSuccess }) {
  const { register, handleSubmit, setValue, watch, formState: { errors }, reset } = useForm({
    defaultValues: { interestRate: 5.5, termMonths: 24 },
  });
  const accountId = watch("accountId");
  const mutation = useMutation({
    mutationFn: bookRd,
    onSuccess: () => { toast.success("RD booked"); reset(); onSuccess(); },
    onError: (e) => toast.error(e?.response?.data?.message || "Failed"),
  });
  return (
    <DialogContent>
      <DialogHeader><DialogTitle>Book Recurring Deposit</DialogTitle></DialogHeader>
      <form onSubmit={handleSubmit((v) => mutation.mutate({
        accountId: Number(v.accountId), installmentAmount: Number(v.installmentAmount),
        interestRate: Number(v.interestRate), termMonths: Number(v.termMonths),
      }))} className="space-y-3">
        <div>
          <Label>Account</Label>
          <Select value={accountId} onValueChange={(v) => setValue("accountId", v, { shouldValidate: true })}>
            <SelectTrigger data-testid="rd-account"><SelectValue placeholder="Select account" /></SelectTrigger>
            <SelectContent>
              {accounts.map((a) => <SelectItem key={a.id} value={String(a.id)}>{a.accountNumber}</SelectItem>)}
            </SelectContent>
          </Select>
          <input type="hidden" {...register("accountId", { required: "Required" })} />
          {errors.accountId && <p className="text-xs text-destructive mt-1">{errors.accountId.message}</p>}
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <Label>Installment</Label>
            <Input type="number" step="0.01" data-testid="rd-installment" {...register("installmentAmount", { required: true, min: 0.01 })} />
          </div>
          <div>
            <Label>Rate (%)</Label>
            <Input type="number" step="0.01" data-testid="rd-rate" {...register("interestRate", { required: true, min: 0 })} />
          </div>
          <div>
            <Label>Term (months)</Label>
            <Input type="number" data-testid="rd-term" {...register("termMonths", { required: true, min: 1 })} />
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" disabled={mutation.isPending} data-testid="rd-submit">
            {mutation.isPending ? "Booking..." : "Book RD"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
