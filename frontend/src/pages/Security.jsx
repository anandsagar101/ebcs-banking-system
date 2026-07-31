import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import PageHeader from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { mfaStatus, mfaEnroll, mfaVerify, mfaDisable, loginHistory, listDevices, trustDevice, revokeDevice } from "@/lib/services";
import { formatDate } from "@/lib/format";
import { ShieldCheck, ShieldOff, Smartphone, Monitor, Trash2, CheckCircle2 } from "lucide-react";
import { useState } from "react";

export default function Security() {
  return (
    <>
      <PageHeader title="Security & Sessions" description="Multi-factor authentication, login history and trusted devices." />
      <Tabs defaultValue="mfa">
        <TabsList data-testid="security-tabs">
          <TabsTrigger value="mfa" data-testid="tab-mfa">Multi-factor auth</TabsTrigger>
          <TabsTrigger value="history" data-testid="tab-history">Login history</TabsTrigger>
          <TabsTrigger value="devices" data-testid="tab-devices">Devices</TabsTrigger>
        </TabsList>
        <TabsContent value="mfa"><MfaPanel /></TabsContent>
        <TabsContent value="history"><HistoryPanel /></TabsContent>
        <TabsContent value="devices"><DevicesPanel /></TabsContent>
      </Tabs>
    </>
  );
}

function MfaPanel() {
  const qc = useQueryClient();
  const status = useQuery({ queryKey: ["mfa-status"], queryFn: mfaStatus });
  const [secret, setSecret] = useState(null);
  const [otp, setOtp] = useState(null);
  const [code, setCode] = useState("");
  const enrollMut = useMutation({
    mutationFn: mfaEnroll,
    onSuccess: (d) => { setSecret(d.secret); setOtp(d.otpauthUrl); },
    onError: (e) => toast.error(e?.response?.data?.message || "Enroll failed"),
  });
  const verifyMut = useMutation({
    mutationFn: (c) => mfaVerify(c),
    onSuccess: () => { toast.success("MFA enabled"); setSecret(null); setOtp(null); setCode(""); qc.invalidateQueries({ queryKey: ["mfa-status"] }); },
    onError: (e) => toast.error(e?.response?.data?.message || "Invalid code"),
  });
  const disableMut = useMutation({
    mutationFn: mfaDisable,
    onSuccess: () => { toast.success("MFA disabled"); qc.invalidateQueries({ queryKey: ["mfa-status"] }); },
  });

  const qrUrl = otp ? `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(otp)}` : null;

  return (
    <Card className="p-6 max-w-2xl">
      <div className="flex items-center gap-3 mb-4">
        <div className={`h-11 w-11 rounded-lg flex items-center justify-center ${status.data?.enabled ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"}`}>
          {status.data?.enabled ? <ShieldCheck className="h-6 w-6" /> : <ShieldOff className="h-6 w-6" />}
        </div>
        <div>
          <div className="font-semibold text-lg">Two-factor authentication</div>
          <div className="text-xs text-muted-foreground">Protect your account with a TOTP authenticator app (Google Authenticator, Authy, 1Password).</div>
        </div>
        <Badge className="ml-auto" variant={status.data?.enabled ? "default" : "secondary"}>{status.data?.enabled ? "Enabled" : "Disabled"}</Badge>
      </div>

      {!status.data?.enabled && !secret && (
        <Button onClick={() => enrollMut.mutate()} disabled={enrollMut.isPending} data-testid="mfa-start">
          {enrollMut.isPending ? "Generating..." : "Start setup"}
        </Button>
      )}

      {secret && (
        <div className="space-y-4 mt-2">
          <div className="rounded-lg border p-4 flex items-start gap-4">
            {qrUrl && <img src={qrUrl} alt="MFA QR" className="rounded" width={160} height={160} />}
            <div className="text-sm space-y-2">
              <div>1. Scan the QR code in your authenticator app.</div>
              <div>2. Or add manually with this secret:</div>
              <code className="block bg-muted px-2 py-1 rounded font-mono text-xs break-all" data-testid="mfa-secret">{secret}</code>
              <div>3. Enter the 6-digit code below to activate.</div>
            </div>
          </div>
          <div className="flex gap-2">
            <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="123456" maxLength={6} data-testid="mfa-code" />
            <Button onClick={() => verifyMut.mutate(code)} disabled={verifyMut.isPending || code.length !== 6} data-testid="mfa-verify">
              <CheckCircle2 className="h-4 w-4 mr-1" /> Verify & enable
            </Button>
          </div>
        </div>
      )}

      {status.data?.enabled && (
        <Button variant="destructive" onClick={() => disableMut.mutate()} data-testid="mfa-disable"><ShieldOff className="h-4 w-4 mr-2" />Disable MFA</Button>
      )}
    </Card>
  );
}

function HistoryPanel() {
  const { data } = useQuery({ queryKey: ["login-history"], queryFn: () => loginHistory(0, 50) });
  const items = data?.content || [];
  return (
    <Card className="p-0">
      <div className="divide-y">
        {items.length === 0 && <div className="p-8 text-sm text-muted-foreground text-center">No login history yet</div>}
        {items.map((h) => (
          <div key={h.id} className="p-4 flex items-center gap-3">
            <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${h.success ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"}`}>
              {h.success ? <CheckCircle2 className="h-4 w-4" /> : <ShieldOff className="h-4 w-4" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{h.success ? "Successful login" : `Failed login · ${h.failureReason || "unknown"}`}</div>
              <div className="text-xs text-muted-foreground truncate">{h.userAgent || "unknown UA"}</div>
            </div>
            <div className="text-right text-xs text-muted-foreground">
              <div>{formatDate(h.createdAt)}</div>
              <div>{h.ipAddress}</div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function DevicesPanel() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["devices"], queryFn: listDevices });
  const trustMut = useMutation({ mutationFn: trustDevice, onSuccess: () => { toast.success("Device trusted"); qc.invalidateQueries({ queryKey: ["devices"] }); } });
  const revokeMut = useMutation({ mutationFn: revokeDevice, onSuccess: () => { toast.success("Device revoked"); qc.invalidateQueries({ queryKey: ["devices"] }); } });
  const items = data || [];
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {items.length === 0 && <Card className="p-8 text-sm text-muted-foreground text-center col-span-full">No devices recorded yet</Card>}
      {items.map((d) => {
        const Icon = /mobile|android|iphone|ipad/i.test(d.deviceName || "") ? Smartphone : Monitor;
        return (
          <Card key={d.id} className="p-5">
            <div className="flex items-start gap-3">
              <div className="h-11 w-11 rounded-lg bg-primary/10 text-primary flex items-center justify-center"><Icon className="h-5 w-5" /></div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <div className="font-medium truncate">{d.deviceName || "Unknown device"}</div>
                  {d.trusted && <Badge variant="default" className="text-[10px]">Trusted</Badge>}
                </div>
                <div className="text-xs text-muted-foreground truncate">{d.userAgent}</div>
                <div className="text-[10px] text-muted-foreground mt-1">IP {d.ipAddress} · Last seen {formatDate(d.lastSeenAt)}</div>
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              {!d.trusted && <Button size="sm" variant="outline" onClick={() => trustMut.mutate(d.id)} data-testid={`trust-${d.id}`}>Trust</Button>}
              <Button size="sm" variant="destructive" onClick={() => revokeMut.mutate(d.id)} data-testid={`revoke-${d.id}`}><Trash2 className="h-3 w-3 mr-1" /> Revoke</Button>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
