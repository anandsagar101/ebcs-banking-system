import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronLeft, ChevronRight, Download, Search, ArrowUpDown } from "lucide-react";
import { exportCsv, exportExcel, exportPdf } from "@/lib/exporters";
import { cn } from "@/lib/utils";

export default function DataTable({
  data = [],
  columns = [],
  searchable = true,
  searchKeys,
  pageSize = 10,
  exportable = true,
  exportName = "export",
  emptyMessage = "No records found",
  toolbar,
  testId,
}) {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState({ key: null, dir: "asc" });

  const filtered = useMemo(() => {
    if (!q.trim()) return data;
    const keys = searchKeys || columns.map((c) => c.key);
    const needle = q.toLowerCase();
    return data.filter((row) =>
      keys.some((k) => {
        const v = row[k];
        return v !== null && v !== undefined && String(v).toLowerCase().includes(needle);
      }),
    );
  }, [data, q, searchKeys, columns]);

  const sorted = useMemo(() => {
    if (!sort.key) return filtered;
    const copy = [...filtered];
    copy.sort((a, b) => {
      const va = a[sort.key], vb = b[sort.key];
      if (va === vb) return 0;
      if (va === null || va === undefined) return 1;
      if (vb === null || vb === undefined) return -1;
      const na = typeof va === "number" ? va : String(va);
      const nb = typeof vb === "number" ? vb : String(vb);
      const cmp = na > nb ? 1 : -1;
      return sort.dir === "asc" ? cmp : -cmp;
    });
    return copy;
  }, [filtered, sort]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const pageData = sorted.slice((page - 1) * pageSize, page * pageSize);

  const flatRows = () =>
    sorted.map((row) => {
      const o = {};
      columns.forEach((c) => { o[c.label || c.key] = c.exportValue ? c.exportValue(row) : row[c.key]; });
      return o;
    });

  const toggleSort = (key) => {
    setSort((s) => s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" });
  };

  return (
    <Card className="overflow-hidden" data-testid={testId}>
      <div className="flex flex-col md:flex-row md:items-center gap-3 border-b p-4">
        {searchable && (
          <div className="relative flex-1 max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={q}
              onChange={(e) => { setQ(e.target.value); setPage(1); }}
              className="pl-9"
              data-testid="datatable-search"
            />
          </div>
        )}
        {toolbar}
        {exportable && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="ml-auto" data-testid="datatable-export">
                <Download className="h-4 w-4 mr-2" /> Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => exportCsv(exportName, flatRows())}>CSV</DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportExcel(exportName, flatRows())}>Excel (.xlsx)</DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportPdf(exportName, flatRows(), exportName)}>PDF</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((c) => (
                <TableHead key={c.key} className={cn("whitespace-nowrap", c.className)}>
                  {c.sortable === false ? c.label : (
                    <button
                      onClick={() => toggleSort(c.key)}
                      className="inline-flex items-center gap-1 hover:text-foreground"
                    >
                      {c.label} <ArrowUpDown className="h-3 w-3 opacity-50" />
                    </button>
                  )}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-32 text-center text-muted-foreground">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : pageData.map((row, ri) => (
              <TableRow key={row.id ?? ri} className="hover:bg-accent/40">
                {columns.map((c) => (
                  <TableCell key={c.key} className={cn("py-3", c.cellClassName)}>
                    {c.render ? c.render(row) : row[c.key]}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between border-t px-4 py-3 text-sm">
        <div className="text-muted-foreground">
          Showing {sorted.length === 0 ? 0 : (page - 1) * pageSize + 1}–{Math.min(page * pageSize, sorted.length)} of {sorted.length}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-xs tabular-nums text-muted-foreground">Page {page} / {totalPages}</span>
          <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
