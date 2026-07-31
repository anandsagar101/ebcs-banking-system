import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import PageHeader from "@/components/PageHeader";
import DataTable from "@/components/DataTable";
import { TableSkeleton } from "@/components/Skeletons";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { UserPlus, Eye } from "lucide-react";
import { listCustomers, createCustomer } from "@/lib/services";
import { formatDate } from "@/lib/format";
import { toast } from "sonner";

const KycBadge = ({ status }) => {
  const variant = { PENDING: "secondary", VERIFIED: "default", REJECTED: "destructive" }[status] || "outline";
  return <Badge variant={variant} data-testid={`kyc-badge-${status}`}>{status}</Badge>;
};

export default function CustomersPage() {
  const [kycFilter, setKycFilter] = useState("ALL");
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["customers"], queryFn: listCustomers });

  const filtered = (data || []).filter((c) => kycFilter === "ALL" ? true : c.kycStatus === kycFilter);

  const columns = [
    { key: "id", label: "ID", className: "w-16", render: (r) => <span className="tabular-nums text-muted-foreground">#{r.id}</span> },
    { key: "firstName", label: "Name", render: (r) => (
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-full bg-primary/10 text-primary text-xs font-semibold flex items-center justify-center">
          {r.firstName?.[0]}{r.lastName?.[0]}
        </div>
        <div>
          <div className="font-medium">{r.firstName} {r.lastName}</div>
          <div className="text-xs text-muted-foreground">{r.phone}</div>
        </div>
      </div>
    ) },
    { key: "email", label: "Email" },
    { key: "kycStatus", label: "KYC", render: (r) => <KycBadge status={r.kycStatus} /> },
    { key: "createdAt", label: "Onboarded", render: (r) => <span className="text-xs">{formatDate(r.createdAt)}</span> },
    { key: "actions", label: "", sortable: false, render: (r) => (
      <Button asChild variant="ghost" size="sm" data-testid={`customer-view-${r.id}`}>
        <Link to={`/customers/${r.id}`}><Eye className="h-4 w-4 mr-1" /> View</Link>
      </Button>
    ) },
  ];

  return (
    <>
      <PageHeader
        title="Customers"
        description="Manage all customer profiles and KYC status."
        actions={
          <>
            <Select value={kycFilter} onValueChange={setKycFilter}>
              <SelectTrigger className="w-40" data-testid="customer-kyc-filter"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All KYC status</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="VERIFIED">Verified</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button data-testid="customer-new-btn"><UserPlus className="h-4 w-4 mr-2" /> New customer</Button>
              </DialogTrigger>
              <NewCustomerDialog onSuccess={() => { setOpen(false); qc.invalidateQueries({ queryKey: ["customers"] }); }} />
            </Dialog>
          </>
        }
      />
      {isLoading ? <TableSkeleton /> : (
        <DataTable
          data={filtered}
          columns={columns}
          searchKeys={["firstName", "lastName", "email", "phone"]}
          exportName="customers"
          testId="customers-table"
        />
      )}
    </>
  );
}

function NewCustomerDialog({ onSuccess }) {
  const { register, handleSubmit, formState: { errors }, reset } = useForm();
  const mutation = useMutation({
    mutationFn: createCustomer,
    onSuccess: () => { toast.success("Customer created"); reset(); onSuccess(); },
    onError: (e) => toast.error(e?.response?.data?.message || "Failed to create"),
  });

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>New customer</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>First name</Label>
            <Input data-testid="new-customer-first" {...register("firstName", { required: "Required" })} />
            {errors.firstName && <p className="text-xs text-destructive mt-1">{errors.firstName.message}</p>}
          </div>
          <div>
            <Label>Last name</Label>
            <Input data-testid="new-customer-last" {...register("lastName", { required: "Required" })} />
            {errors.lastName && <p className="text-xs text-destructive mt-1">{errors.lastName.message}</p>}
          </div>
        </div>
        <div>
          <Label>Email</Label>
          <Input type="email" data-testid="new-customer-email" {...register("email", { required: "Required" })} />
          {errors.email && <p className="text-xs text-destructive mt-1">{errors.email.message}</p>}
        </div>
        <div>
          <Label>Phone</Label>
          <Input data-testid="new-customer-phone" {...register("phone", { required: "Required" })} />
          {errors.phone && <p className="text-xs text-destructive mt-1">{errors.phone.message}</p>}
        </div>
        <DialogFooter>
          <Button type="submit" disabled={mutation.isPending} data-testid="new-customer-submit">
            {mutation.isPending ? "Creating..." : "Create customer"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
