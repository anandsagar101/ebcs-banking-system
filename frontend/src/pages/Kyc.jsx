import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import PageHeader from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { listCustomers, updateKyc } from "@/lib/services";
import { formatDate, initials } from "@/lib/format";
import { Check, X, Upload, FileText, Image as ImgIcon } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

export default function Kyc() {
  const qc = useQueryClient();
  const { isAdmin } = useAuth();
  const [status, setStatus] = useState("PENDING");
  const customers = useQuery({ queryKey: ["customers"], queryFn: listCustomers });
  const list = (customers.data || []).filter((c) => c.kycStatus === status);

  const kycMut = useMutation({
    mutationFn: ({ id, status }) => updateKyc(id, status),
    onSuccess: () => { toast.success("KYC updated"); qc.invalidateQueries({ queryKey: ["customers"] }); },
    onError: (e) => toast.error(e?.response?.data?.message || "Failed"),
  });

  return (
    <>
      <PageHeader title="KYC Management" description="Verify customer identity documents and update status." />

      <Tabs value={status} onValueChange={setStatus}>
        <TabsList data-testid="kyc-tabs">
          <TabsTrigger value="PENDING" data-testid="tab-kyc-pending">Pending ({(customers.data || []).filter((c) => c.kycStatus === "PENDING").length})</TabsTrigger>
          <TabsTrigger value="VERIFIED" data-testid="tab-kyc-verified">Verified ({(customers.data || []).filter((c) => c.kycStatus === "VERIFIED").length})</TabsTrigger>
          <TabsTrigger value="REJECTED" data-testid="tab-kyc-rejected">Rejected ({(customers.data || []).filter((c) => c.kycStatus === "REJECTED").length})</TabsTrigger>
        </TabsList>
        <TabsContent value={status}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {list.length === 0 && (
              <Card className="p-8 text-sm text-muted-foreground text-center col-span-full">No customers in this bucket</Card>
            )}
            {list.map((c) => (
              <Card key={c.id} className="p-5">
                <div className="flex items-start gap-3">
                  <div className="h-11 w-11 rounded-full bg-primary/10 text-primary text-sm font-semibold flex items-center justify-center">
                    {initials(`${c.firstName} ${c.lastName}`)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link to={`/customers/${c.id}`} className="font-medium hover:underline truncate block">{c.firstName} {c.lastName}</Link>
                    <div className="text-xs text-muted-foreground truncate">{c.email}</div>
                    <div className="text-xs text-muted-foreground">{c.phone}</div>
                  </div>
                  <Badge variant={c.kycStatus === "VERIFIED" ? "default" : c.kycStatus === "REJECTED" ? "destructive" : "secondary"}>
                    {c.kycStatus}
                  </Badge>
                </div>
                <div className="mt-4 flex items-center gap-2 rounded-md border border-dashed p-3 text-xs text-muted-foreground">
                  <div className="flex gap-1">
                    <FileText className="h-3.5 w-3.5" />
                    <ImgIcon className="h-3.5 w-3.5" />
                  </div>
                  <span>Documents & OCR available in the customer panel</span>
                  <Button asChild size="sm" variant="ghost" className="ml-auto h-6 px-2" data-testid={`kyc-view-docs-${c.id}`}>
                    <Link to={`/customers/${c.id}`}>Open</Link>
                  </Button>
                </div>
                <div className="mt-3 text-[11px] text-muted-foreground">Onboarded {formatDate(c.createdAt)}</div>
                {isAdmin() && (
                  <div className="mt-4 flex gap-2">
                    {c.kycStatus !== "VERIFIED" && (
                      <Button size="sm" className="flex-1" onClick={() => kycMut.mutate({ id: c.id, status: "VERIFIED" })} data-testid={`kyc-approve-${c.id}`}>
                        <Check className="h-4 w-4 mr-1" /> Approve
                      </Button>
                    )}
                    {c.kycStatus !== "REJECTED" && (
                      <Button size="sm" variant="destructive" className="flex-1" onClick={() => kycMut.mutate({ id: c.id, status: "REJECTED" })} data-testid={`kyc-reject-${c.id}`}>
                        <X className="h-4 w-4 mr-1" /> Reject
                      </Button>
                    )}
                  </div>
                )}
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </>
  );
}
