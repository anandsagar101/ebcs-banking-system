import { useState } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDate } from "@/lib/format";

const seed = [
  { id: 1, title: "Welcome to EBCS", body: "You're signed in successfully.", ts: new Date().toISOString(), unread: true },
  { id: 2, title: "System", body: "PostgreSQL migration V1 applied.", ts: new Date(Date.now() - 3600e3).toISOString(), unread: true },
  { id: 3, title: "Reminder", body: "Review pending KYC applications weekly.", ts: new Date(Date.now() - 86400e3).toISOString(), unread: false },
];

export default function NotificationsPanel() {
  const [items, setItems] = useState(seed);
  const unread = items.filter((i) => i.unread).length;

  const markAll = () => setItems((s) => s.map((i) => ({ ...i, unread: false })));

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" data-testid="topbar-notifications" aria-label="Notifications" className="relative">
          <Bell className="h-5 w-5" />
          {unread > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 min-w-5 px-1 text-[10px]" variant="destructive">
              {unread}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="font-semibold text-sm">Notifications</div>
          <Button variant="link" size="sm" className="h-auto p-0 text-xs" onClick={markAll}>
            Mark all read
          </Button>
        </div>
        <ScrollArea className="h-72">
          {items.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">No notifications</div>
          ) : (
            items.map((n) => (
              <div key={n.id} className="flex gap-3 border-b px-4 py-3 hover:bg-accent/50">
                <div className={`mt-1.5 h-2 w-2 rounded-full ${n.unread ? "bg-primary" : "bg-transparent"}`} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{n.title}</div>
                  <div className="text-xs text-muted-foreground line-clamp-2">{n.body}</div>
                  <div className="mt-1 text-[10px] text-muted-foreground">{formatDate(n.ts)}</div>
                </div>
              </div>
            ))
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
