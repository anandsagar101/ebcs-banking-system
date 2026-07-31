import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import PageHeader from "@/components/PageHeader";
import DataTable from "@/components/DataTable";
import { TableSkeleton } from "@/components/Skeletons";
import { Badge } from "@/components/ui/badge";
import { listAudit } from "@/lib/services";
import { formatDate } from "@/lib/format";

export default function AdminAudit() {
  const [page, setPage] = useState(0);
  const { data, isLoading } = useQuery({ queryKey: ["audit", page], queryFn: () => listAudit(page, 100) });

  const cols = [
    { key: "createdAt", label: "When", render: (r) => <span className="text-xs">{formatDate(r.createdAt)}</span> },
    { key: "actor", label: "Actor", render: (r) => <Badge variant="outline" className="text-[10px]">{r.actor || "system"}</Badge> },
    { key: "action", label: "Action", render: (r) => <span className="font-medium text-sm">{r.action}</span> },
    { key: "resource", label: "Resource", render: (r) => <span className="font-mono text-xs">{r.resource || "—"}</span> },
    { key: "payload", label: "Payload", render: (r) => <span className="text-xs text-muted-foreground truncate max-w-md block">{r.payload || "—"}</span> },
  ];

  return (
    <>
      <PageHeader title="Audit Logs" description={`Immutable audit trail · ${data?.totalElements ?? 0} events recorded`} />
      {isLoading ? <TableSkeleton /> : (
        <DataTable data={data?.content || []} columns={cols}
          searchKeys={["actor", "action", "resource", "payload"]}
          exportName="audit-logs" testId="audit-table" pageSize={20} />
      )}
    </>
  );
}
