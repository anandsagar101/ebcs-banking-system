import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import PageHeader from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { listFeatureFlags, toggleFeatureFlag } from "@/lib/services";
import { formatDate } from "@/lib/format";
import { toast } from "sonner";
import { Flag } from "lucide-react";

export default function FeatureFlags() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["feature-flags"], queryFn: listFeatureFlags });
  const mut = useMutation({
    mutationFn: ({ key, enabled }) => toggleFeatureFlag(key, enabled),
    onSuccess: () => { toast.success("Flag updated"); qc.invalidateQueries({ queryKey: ["feature-flags"] }); },
    onError: (e) => toast.error(e?.response?.data?.message || "Failed"),
  });

  return (
    <>
      <PageHeader title="Feature flags" description="Toggle capabilities without redeploying." />
      {isLoading ? (
        <Card className="p-6"><div className="h-4 w-40 bg-muted animate-pulse rounded" /></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(data || []).map((f) => (
            <Card key={f.id} className="p-5" data-testid={`flag-${f.key}`}>
              <div className="flex items-start gap-3">
                <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${f.enabled ? "bg-emerald-500/10 text-emerald-500" : "bg-muted text-muted-foreground"}`}>
                  <Flag className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <code className="font-mono text-sm">{f.key}</code>
                    <Badge variant={f.enabled ? "default" : "secondary"} className="text-[10px]">{f.enabled ? "On" : "Off"}</Badge>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">{f.description}</div>
                  <div className="mt-1 text-[10px] text-muted-foreground">Updated {formatDate(f.updatedAt)}</div>
                </div>
                <Switch checked={f.enabled} onCheckedChange={(v) => mut.mutate({ key: f.key, enabled: v })} data-testid={`flag-toggle-${f.key}`} />
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
