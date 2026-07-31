import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import PageHeader from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { listConfigs, upsertConfig } from "@/lib/services";
import { formatDate } from "@/lib/format";
import { Settings2, Save } from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";

export default function AdminConfig() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["configs"], queryFn: listConfigs });
  const [open, setOpen] = useState(false);

  return (
    <>
      <PageHeader title="System Configuration" description="Key-value platform configuration."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button data-testid="config-new-btn"><Settings2 className="h-4 w-4 mr-2" />Add / update config</Button>
            </DialogTrigger>
            <ConfigDialog onSuccess={() => { setOpen(false); qc.invalidateQueries({ queryKey: ["configs"] }); }} />
          </Dialog>
        }
      />
      {isLoading ? (
        <Card className="p-6"><div className="h-4 w-40 bg-muted animate-pulse rounded" /></Card>
      ) : (data || []).length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">No configuration keys yet</Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(data || []).map((c) => (
            <Card key={c.id} className="p-5">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">{c.key}</div>
              <div className="mt-1 font-mono text-sm break-words">{c.value}</div>
              <div className="mt-3 text-[10px] text-muted-foreground">Set {formatDate(c.createdAt)}</div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}

function ConfigDialog({ onSuccess }) {
  const { register, handleSubmit, formState: { errors }, reset } = useForm();
  const mutation = useMutation({
    mutationFn: upsertConfig,
    onSuccess: () => { toast.success("Configuration saved"); reset(); onSuccess(); },
    onError: (e) => toast.error(e?.response?.data?.message || "Failed"),
  });
  return (
    <DialogContent>
      <DialogHeader><DialogTitle>Set configuration</DialogTitle></DialogHeader>
      <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-3">
        <div>
          <Label>Key</Label>
          <Input data-testid="config-key" {...register("key", { required: "Required" })} placeholder="e.g. bank.daily.limit" />
          {errors.key && <p className="text-xs text-destructive mt-1">{errors.key.message}</p>}
        </div>
        <div>
          <Label>Value</Label>
          <Input data-testid="config-value" {...register("value", { required: "Required" })} />
          {errors.value && <p className="text-xs text-destructive mt-1">{errors.value.message}</p>}
        </div>
        <DialogFooter>
          <Button type="submit" disabled={mutation.isPending} data-testid="config-submit">
            <Save className="h-4 w-4 mr-2" /> {mutation.isPending ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
