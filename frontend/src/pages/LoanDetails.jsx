import { useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import PageHeader from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { getLoan, approveLoan, rejectLoan, disburseLoan, settleLoan, loanSchedule, accountsByCustomer } from "@/lib/services";
import { formatCurrency, formatDate, formatDateShort } from "@/lib/format";
import { CheckCircle2, XCircle, Send, Landmark } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useState } from "react";

export default function LoanDetails() {
  const { id } = useParams();
  const qc = useQueryClient();
  const { isAdmin } = useAuth();
  const [disburseOpen, setDisburseOpen] = useState(false);

  const loan = useQuery({ queryKey: ["loan", id], queryFn: () => getLoan(id) });
  const schedule = useQuery({ queryKey: ["loan-schedule", id], queryFn: () => loanSchedule(id) });
  const accounts = useQuery({
    enabled: !!loan.data?.customerId,
    queryKey: ["accounts", "customer", loan.data?.customerId],
    queryFn: () => accountsByCustomer(loan.data.customerId),
  });

  const invalidate = () => { qc.invalidateQueries({ queryKey: ["loan", id] }); qc.invalidateQueries({ queryKey: ["loans"] }); };

  const approveMut = useMutation({ mutationFn: () => approveLoan(id), onSuccess: () => { toast.success("Loan approved"); invalidate(); }, onError: (e) => toast.error(e?.response?.data?.message || "Failed") });
  const rejectMut = useMutation({ mutationFn: () => rejectLoan(id), onSuccess: () => { toast.success("Loan rejected"); invalidate(); }, onError: (e) => toast.error(e?.response?.data?.message || "Failed") });
  const settleMut = useMutation({ mutationFn: () => settleLoan(id), onSuccess: () => { toast.success("Loan settled"); invalidate(); qc.invalidateQueries({ queryKey: ["loan-schedule", id] }); }, onError: (e) => toast.error(e?.response?.data?.message || "Failed") });

  if (loan.isLoading) return <div className="p-8 text-muted-foreground">Loading...</div>;
  if (!loan.data) return <div className="p-8">Not found</div>;
  const l = loan.data;

  return (
    <>
      <PageHeader title={`Loan #${l.id}`} description={`Customer #${l.customerId} · ${formatCurrency(l.principal)} @ ${l.interestRate}% for ${l.termMonths} months`}
        actions={
          <>
            {l.status === "APPLIED" && isAdmin() && (
              <>
                <Button variant="outline" onClick={() => rejectMut.mutate()} disabled={rejectMut.isPending} data-testid="loan-reject">
                  <XCircle className="h-4 w-4 mr-2" /> Reject
                </Button>
                <Button onClick={() => approveMut.mutate()} disabled={approveMut.isPending} data-testid="loan-approve">
                  <CheckCircle2 className="h-4 w-4 mr-2" /> Approve
                </Button>
              </>
            )}
            {l.status === "APPROVED" && isAdmin() && (
              <Dialog open={disburseOpen} onOpenChange={setDisburseOpen}>
                <DialogTrigger asChild>
                  <Button data-testid="loan-disburse-btn"><Send className="h-4 w-4 mr-2" /> Disburse</Button>
                </DialogTrigger>
                <DisburseDialog id={id} accounts={accounts.data || []}
                  onSuccess={() => { setDisburseOpen(false); invalidate(); qc.invalidateQueries({ queryKey: ["loan-schedule", id] }); qc.invalidateQueries({ queryKey: ["accounts"] }); }} />
              </Dialog>
            )}
            {l.status === "DISBURSED" && (
              <Button variant="outline" onClick={() => settleMut.mutate()} data-testid="loan-settle">Mark settled</Button>
            )}
          </>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="p-5"><div className="text-xs text-muted-foreground">Status</div><Badge className="mt-2">{l.status}</Badge></Card>
        <Card className="p-5"><div className="text-xs text-muted-foreground">Principal</div><div className="mt-1 text-lg font-bold tabular-nums">{formatCurrency(l.principal)}</div></Card>
        <Card className="p-5"><div className="text-xs text-muted-foreground">Rate</div><div className="mt-1 text-lg font-bold">{l.interestRate}%</div></Card>
        <Card className="p-5"><div className="text-xs text-muted-foreground">Term</div><div className="mt-1 text-lg font-bold">{l.termMonths} months</div></Card>
      </div>

      <Tabs defaultValue="schedule">
        <TabsList>
          <TabsTrigger value="schedule" data-testid="tab-schedule">EMI schedule</TabsTrigger>
          <TabsTrigger value="details" data-testid="tab-details">Details</TabsTrigger>
        </TabsList>
        <TabsContent value="schedule">
          <Card className="p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40">
                  <tr>
                    <th className="text-left px-4 py-3">#</th>
                    <th className="text-left px-4 py-3">Due date</th>
                    <th className="text-right px-4 py-3">Principal</th>
                    <th className="text-right px-4 py-3">Interest</th>
                    <th className="text-right px-4 py-3">EMI</th>
                    <th className="text-center px-4 py-3">Paid</th>
                  </tr>
                </thead>
                <tbody>
                  {(schedule.data || []).length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">No schedule yet. Disburse to generate EMIs.</td></tr>
                  ) : (schedule.data || []).map((e) => (
                    <tr key={e.installmentNo} className="border-t">
                      <td className="px-4 py-3 tabular-nums">{e.installmentNo}</td>
                      <td className="px-4 py-3">{formatDateShort(e.dueDate)}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{formatCurrency(e.principalComponent)}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{formatCurrency(e.interestComponent)}</td>
                      <td className="px-4 py-3 text-right tabular-nums font-medium">{formatCurrency(e.totalAmount)}</td>
                      <td className="px-4 py-3 text-center">{e.paid ? <Badge>Paid</Badge> : <Badge variant="outline">Pending</Badge>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>
        <TabsContent value="details">
          <Card className="p-6 space-y-3 text-sm">
            <Row k="Loan ID" v={`#${l.id}`} />
            <Row k="Customer" v={`#${l.customerId}`} />
            <Row k="Product" v={`#${l.productId}`} />
            <Row k="Disbursement account" v={l.disbursementAccountId ? `#${l.disbursementAccountId}` : "—"} />
            <Row k="Applied on" v={formatDate(l.createdAt)} />
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}

function Row({ k, v }) {
  return <div className="flex items-center justify-between border-b pb-2"><span className="text-muted-foreground">{k}</span><span className="font-medium">{v}</span></div>;
}

function DisburseDialog({ id, accounts, onSuccess }) {
  const { handleSubmit, setValue, watch, register, formState: { errors } } = useForm();
  const accountId = watch("accountId");
  const mutation = useMutation({
    mutationFn: (v) => disburseLoan(id, { accountId: Number(v.accountId) }),
    onSuccess: () => { toast.success("Loan disbursed"); onSuccess(); },
    onError: (e) => toast.error(e?.response?.data?.message || "Failed"),
  });
  return (
    <DialogContent>
      <DialogHeader><DialogTitle>Disburse loan</DialogTitle></DialogHeader>
      <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-3">
        <div>
          <Label>Disburse into account</Label>
          <Select value={accountId} onValueChange={(v) => setValue("accountId", v, { shouldValidate: true })}>
            <SelectTrigger data-testid="disburse-account"><SelectValue placeholder="Select account" /></SelectTrigger>
            <SelectContent>
              {accounts.map((a) => <SelectItem key={a.id} value={String(a.id)}>{a.accountNumber}</SelectItem>)}
            </SelectContent>
          </Select>
          <input type="hidden" {...register("accountId", { required: "Required" })} />
          {errors.accountId && <p className="text-xs text-destructive mt-1">{errors.accountId.message}</p>}
        </div>
        <DialogFooter>
          <Button type="submit" disabled={mutation.isPending} data-testid="disburse-submit"><Landmark className="h-4 w-4 mr-2" />{mutation.isPending ? "Disbursing..." : "Disburse"}</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
