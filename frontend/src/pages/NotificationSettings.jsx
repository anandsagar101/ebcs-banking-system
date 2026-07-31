import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import PageHeader from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { getNotifPreferences, setNotifPreferences, listNotifications, markNotificationRead } from "@/lib/services";
import { formatDate } from "@/lib/format";
import { Mail, MessageSquare, Bell, Check } from "lucide-react";

export default function NotificationSettings() {
  const qc = useQueryClient();
  const prefs = useQuery({ queryKey: ["notif-prefs"], queryFn: getNotifPreferences });
  const items = useQuery({ queryKey: ["my-notifs"], queryFn: () => listNotifications(0, 50) });

  const mutation = useMutation({
    mutationFn: setNotifPreferences,
    onSuccess: () => { toast.success("Preferences saved"); qc.invalidateQueries({ queryKey: ["notif-prefs"] }); },
  });

  const readMut = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["my-notifs"] }),
  });

  const toggle = (key, value) => {
    if (!prefs.data) return;
    mutation.mutate({
      email: key === "email" ? value : prefs.data.emailEnabled,
      sms: key === "sms" ? value : prefs.data.smsEnabled,
      push: key === "push" ? value : prefs.data.pushEnabled,
    });
  };

  return (
    <>
      <PageHeader title="Notifications" description="Preferences and in-app inbox." />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-6 lg:col-span-1">
          <div className="font-semibold mb-4">Channels</div>
          <ChannelRow icon={Mail} label="Email" description="Transactional and marketing email"
            checked={!!prefs.data?.emailEnabled} onChange={(v) => toggle("email", v)} testId="pref-email" />
          <ChannelRow icon={MessageSquare} label="SMS" description="Time-sensitive account alerts"
            checked={!!prefs.data?.smsEnabled} onChange={(v) => toggle("sms", v)} testId="pref-sms" />
          <ChannelRow icon={Bell} label="Push" description="Mobile and browser push"
            checked={!!prefs.data?.pushEnabled} onChange={(v) => toggle("push", v)} testId="pref-push" />
        </Card>

        <Card className="p-0 lg:col-span-2">
          <div className="border-b p-4 font-semibold">Inbox</div>
          <div className="divide-y max-h-[520px] overflow-y-auto">
            {(items.data?.content || []).length === 0 && (
              <div className="p-8 text-sm text-muted-foreground text-center">No notifications delivered to you yet</div>
            )}
            {(items.data?.content || []).map((n) => (
              <div key={n.id} className="p-4 flex items-start gap-3 hover:bg-accent/40">
                <div className={`mt-1 h-2 w-2 rounded-full shrink-0 ${n.readAt ? "bg-transparent" : "bg-primary"}`} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{n.subject || n.eventType}</div>
                  <div className="text-xs text-muted-foreground mt-0.5 line-clamp-3">{n.body}</div>
                  <div className="text-[10px] text-muted-foreground mt-1">{n.channel} · {formatDate(n.createdAt)}</div>
                </div>
                {!n.readAt && (
                  <Button size="sm" variant="ghost" onClick={() => readMut.mutate(n.id)}><Check className="h-3.5 w-3.5" /></Button>
                )}
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}

function ChannelRow({ icon: Icon, label, description, checked, onChange, testId }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b last:border-b-0">
      <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center"><Icon className="h-4 w-4" /></div>
      <div className="flex-1 min-w-0">
        <Label className="text-sm font-medium">{label}</Label>
        <div className="text-xs text-muted-foreground">{description}</div>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} data-testid={testId} />
    </div>
  );
}
