import { useQuery } from "@tanstack/react-query";
import PageHeader from "@/components/PageHeader";
import DataTable from "@/components/DataTable";
import { TableSkeleton } from "@/components/Skeletons";
import { Badge } from "@/components/ui/badge";
import { listUsers } from "@/lib/services";
import { formatDate, initials } from "@/lib/format";

export default function AdminUsers() {
  const { data, isLoading } = useQuery({ queryKey: ["admin-users"], queryFn: listUsers });

  const cols = [
    { key: "username", label: "User", render: (r) => (
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-full bg-primary/10 text-primary text-xs font-semibold flex items-center justify-center">
          {initials(r.username)}
        </div>
        <div>
          <div className="font-medium">{r.username}</div>
          <div className="text-xs text-muted-foreground">{r.email}</div>
        </div>
      </div>
    ) },
    { key: "enabled", label: "Status", render: (r) => <Badge variant={r.enabled ? "default" : "secondary"}>{r.enabled ? "Active" : "Disabled"}</Badge> },
    { key: "roles", label: "Roles", render: (r) => (
      <div className="flex flex-wrap gap-1">
        {(r.roles || []).map((role) => <Badge key={role} variant="outline" className="text-[10px]">{role.replace("ROLE_", "")}</Badge>)}
      </div>
    ) },
    { key: "createdAt", label: "Created", render: (r) => <span className="text-xs">{formatDate(r.createdAt)}</span> },
  ];

  return (
    <>
      <PageHeader title="User Management" description="All EBCS platform users and their roles." />
      {isLoading ? <TableSkeleton /> : (
        <DataTable data={data || []} columns={cols} searchKeys={["username", "email"]} exportName="users" testId="admin-users-table" />
      )}
    </>
  );
}
