import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import PageHeader from "@/components/PageHeader";
import DataTable from "@/components/DataTable";
import { TableSkeleton } from "@/components/Skeletons";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { listProducts, createProduct } from "@/lib/services";
import { PackagePlus } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

const TYPES = ["SAVINGS", "CURRENT", "FIXED_DEPOSIT", "RECURRING_DEPOSIT", "LOAN"];

export default function Products() {
  const qc = useQueryClient();
  const { isAdmin } = useAuth();
  const [open, setOpen] = useState(false);
  const { data, isLoading } = useQuery({ queryKey: ["products"], queryFn: listProducts });

  const columns = [
    { key: "code", label: "Code", render: (r) => <span className="font-mono text-xs">{r.code}</span> },
    { key: "name", label: "Name" },
    { key: "productType", label: "Type", render: (r) => <Badge variant="outline">{r.productType}</Badge> },
    { key: "interestRate", label: "Rate", render: (r) => <span className="tabular-nums">{r.interestRate}%</span> },
    { key: "active", label: "Status", render: (r) => <Badge variant={r.active ? "default" : "secondary"}>{r.active ? "Active" : "Inactive"}</Badge> },
  ];

  return (
    <>
      <PageHeader
        title="Products"
        description="Savings, current, deposit and loan product catalog."
        actions={
          isAdmin() && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button data-testid="product-new-btn"><PackagePlus className="h-4 w-4 mr-2" /> New product</Button>
              </DialogTrigger>
              <NewProductDialog onSuccess={() => { setOpen(false); qc.invalidateQueries({ queryKey: ["products"] }); }} />
            </Dialog>
          )
        }
      />
      {isLoading ? <TableSkeleton /> : (
        <>
          {(data || []).length === 0 && (
            <Card className="p-6 mb-4 text-sm text-muted-foreground text-center">
              No products yet. {isAdmin() ? "Create one to enable account opening and lending." : "Ask an administrator to create products."}
            </Card>
          )}
          <DataTable data={data || []} columns={columns} exportName="products" testId="products-table" />
        </>
      )}
    </>
  );
}

function NewProductDialog({ onSuccess }) {
  const { register, handleSubmit, formState: { errors }, control, setValue, watch, reset } = useForm({
    defaultValues: { productType: "SAVINGS", interestRate: 3.5 },
  });
  const type = watch("productType");
  const mutation = useMutation({
    mutationFn: createProduct,
    onSuccess: () => { toast.success("Product created"); reset(); onSuccess(); },
    onError: (e) => toast.error(e?.response?.data?.message || "Failed"),
  });

  return (
    <DialogContent>
      <DialogHeader><DialogTitle>New product</DialogTitle></DialogHeader>
      <form onSubmit={handleSubmit((v) => mutation.mutate({ ...v, interestRate: Number(v.interestRate) }))} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Code</Label>
            <Input data-testid="new-product-code" {...register("code", { required: "Required" })} />
            {errors.code && <p className="text-xs text-destructive mt-1">{errors.code.message}</p>}
          </div>
          <div>
            <Label>Type</Label>
            <Select value={type} onValueChange={(v) => setValue("productType", v)}>
              <SelectTrigger data-testid="new-product-type"><SelectValue /></SelectTrigger>
              <SelectContent>
                {TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div>
          <Label>Name</Label>
          <Input data-testid="new-product-name" {...register("name", { required: "Required" })} />
        </div>
        <div>
          <Label>Interest rate (%)</Label>
          <Input type="number" step="0.01" data-testid="new-product-rate" {...register("interestRate", { required: "Required", min: 0 })} />
        </div>
        <DialogFooter>
          <Button type="submit" disabled={mutation.isPending} data-testid="new-product-submit">
            {mutation.isPending ? "Creating..." : "Create product"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
