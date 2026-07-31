import { Card } from "@/components/ui/card";

export function TableSkeleton({ rows = 6, cols = 5 }) {
  return (
    <Card className="overflow-hidden">
      <div className="border-b p-4">
        <div className="h-4 w-40 rounded bg-muted animate-pulse" />
      </div>
      <div className="divide-y">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex gap-4 p-4">
            {Array.from({ length: cols }).map((__, j) => (
              <div key={j} className="h-3 flex-1 rounded bg-muted animate-pulse" style={{ opacity: 1 - j * 0.1 }} />
            ))}
          </div>
        ))}
      </div>
    </Card>
  );
}

export function CardSkeleton({ count = 4 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="p-6">
          <div className="h-3 w-24 rounded bg-muted animate-pulse mb-3" />
          <div className="h-7 w-32 rounded bg-muted animate-pulse mb-2" />
          <div className="h-3 w-40 rounded bg-muted animate-pulse" />
        </Card>
      ))}
    </div>
  );
}
