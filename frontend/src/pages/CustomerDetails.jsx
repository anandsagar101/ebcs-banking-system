import { useParams, Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import PageHeader from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { getCustomer, accountsByCustomer, listLoans, updateKyc, listDocuments, uploadDocument, documentPreviewUrl, documentDownloadUrl, runDocumentOcr } from "@/lib/services";
import { formatDate, formatCurrency, initials } from "@/lib/format";
import { Mail, Phone, Calendar, UserCheck, Upload, FileText, Download, Image as ImgIcon } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

export default function CustomerDetails() {
  const { id } = useParams();
  const qc = useQueryClient();
  const { isAdmin } = useAuth();
  const c = useQuery({ queryKey: ["customer", id], queryFn: () => getCustomer(id) });
  const accounts = useQuery({ queryKey: ["accounts", "customer", id], queryFn: () => accountsByCustomer(id) });
  const loans = useQuery({ queryKey: ["loans"], queryFn: listLoans });

  const kycMut = useMutation({
    mutationFn: (status) => updateKyc(id, status),
    onSuccess: () => { toast.success("KYC status updated"); qc.invalidateQueries({ queryKey: ["customer", id] }); },
    onError: (e) => toast.error(e?.response?.data?.message || "Update failed"),
  });

  if (c.isLoading) return <div className="p-8 text-muted-foreground">Loading...</div>;
  if (!c.data) return <div className="p-8">Not found</div>;
  const cust = c.data;

  const customerLoans = (loans.data || []).filter((l) => l.customerId === cust.id);

  return (
    <>
      <PageHeader
        title={`${cust.firstName} ${cust.lastName}`}
        description={`Customer #${cust.id} · ${cust.email}`}
        actions={
          isAdmin() && (
            <Select onValueChange={(v) => kycMut.mutate(v)}>
              <SelectTrigger className="w-44" data-testid="customer-kyc-set">
                <SelectValue placeholder={`KYC: ${cust.kycStatus}`} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="VERIFIED">Verified</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
              </SelectContent>
            </Select>
          )
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
        <Card className="p-6 lg:col-span-1 flex flex-col items-center text-center">
          <div className="h-20 w-20 rounded-full bg-primary/10 text-primary text-2xl font-semibold flex items-center justify-center">
            {initials(`${cust.firstName} ${cust.lastName}`)}
          </div>
          <div className="mt-4 font-semibold">{cust.firstName} {cust.lastName}</div>
          <div className="text-xs text-muted-foreground">Customer #{cust.id}</div>
          <Badge className="mt-3">{cust.kycStatus}</Badge>
          <div className="mt-4 text-xs text-muted-foreground">Relationship Manager</div>
          <div className="text-sm font-medium">Not assigned</div>
        </Card>
        <Card className="p-6 lg:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex items-start gap-3">
            <Mail className="h-4 w-4 mt-0.5 text-muted-foreground" />
            <div>
              <div className="text-xs text-muted-foreground">Email</div>
              <div className="text-sm font-medium">{cust.email}</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Phone className="h-4 w-4 mt-0.5 text-muted-foreground" />
            <div>
              <div className="text-xs text-muted-foreground">Phone</div>
              <div className="text-sm font-medium">{cust.phone}</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Calendar className="h-4 w-4 mt-0.5 text-muted-foreground" />
            <div>
              <div className="text-xs text-muted-foreground">Onboarded</div>
              <div className="text-sm font-medium">{formatDate(cust.createdAt)}</div>
            </div>
          </div>
        </Card>
      </div>

      <Tabs defaultValue="timeline">
        <TabsList data-testid="customer-tabs">
          <TabsTrigger value="timeline" data-testid="tab-timeline">Timeline</TabsTrigger>
          <TabsTrigger value="accounts" data-testid="tab-accounts">Accounts ({accounts.data?.length || 0})</TabsTrigger>
          <TabsTrigger value="loans" data-testid="tab-loans">Loans ({customerLoans.length})</TabsTrigger>
          <TabsTrigger value="kyc" data-testid="tab-kyc">KYC & Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="timeline">
          <Card className="p-6">
            <div className="relative pl-6 border-l space-y-6">
              <div className="relative">
                <div className="absolute -left-[27px] top-1 h-3 w-3 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20" />
                <div className="text-sm font-medium">Customer created</div>
                <div className="text-xs text-muted-foreground">{formatDate(cust.createdAt)}</div>
              </div>
              {(accounts.data || []).map((a) => (
                <div key={a.id} className="relative">
                  <div className="absolute -left-[27px] top-1 h-3 w-3 rounded-full bg-sky-500 ring-4 ring-sky-500/20" />
                  <div className="text-sm font-medium">Account opened · {a.accountNumber}</div>
                  <div className="text-xs text-muted-foreground">{formatDate(a.createdAt)}</div>
                </div>
              ))}
              {customerLoans.map((l) => (
                <div key={l.id} className="relative">
                  <div className="absolute -left-[27px] top-1 h-3 w-3 rounded-full bg-amber-500 ring-4 ring-amber-500/20" />
                  <div className="text-sm font-medium">Loan {l.status.toLowerCase()} · {formatCurrency(l.principal)}</div>
                  <div className="text-xs text-muted-foreground">{formatDate(l.createdAt)}</div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="accounts">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(accounts.data || []).map((a) => (
              <Card key={a.id} className="p-5">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-xs text-muted-foreground">Account</div>
                    <Link to={`/accounts/${a.id}`} className="font-mono text-sm hover:underline">{a.accountNumber}</Link>
                  </div>
                  <Badge variant={a.status === "ACTIVE" ? "default" : "secondary"}>{a.status}</Badge>
                </div>
                <div className="mt-4 text-2xl font-bold tabular-nums">{formatCurrency(a.balance)}</div>
                <div className="mt-1 text-xs text-muted-foreground">Daily limit: {formatCurrency(a.dailyLimit)}</div>
              </Card>
            ))}
            {(accounts.data || []).length === 0 && (
              <div className="col-span-full text-center text-muted-foreground py-12">No accounts linked</div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="loans">
          <Card className="p-4 divide-y">
            {customerLoans.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">No loans on record</div>
            ) : customerLoans.map((l) => (
              <Link key={l.id} to={`/loans/${l.id}`} className="flex items-center justify-between p-3 hover:bg-accent/40 -m-1 rounded">
                <div>
                  <div className="font-medium text-sm">Loan #{l.id} · {formatCurrency(l.principal)}</div>
                  <div className="text-xs text-muted-foreground">{l.termMonths} months @ {l.interestRate}%</div>
                </div>
                <Badge variant="outline">{l.status}</Badge>
              </Link>
            ))}
          </Card>
        </TabsContent>

        <TabsContent value="kyc">
          <DocumentsPanel customerId={cust.id} />
        </TabsContent>
      </Tabs>
    </>
  );
}

function DocumentsPanel({ customerId }) {
  const qc = useQueryClient();
  const docs = useQuery({
    queryKey: ["docs", customerId],
    queryFn: () => listDocuments("CUSTOMER", customerId),
    // Poll while any OCR job is in-flight so the extracted text appears the moment it lands.
    refetchInterval: (q) => {
      const list = q.state?.data || [];
      return list.some((d) => ["QUEUED", "PROCESSING"].includes(d.ocrStatus)) ? 2500 : false;
    },
  });
  const uploadMut = useMutation({
    mutationFn: ({ file, docType }) => uploadDocument("CUSTOMER", customerId, docType, file),
    onSuccess: () => { toast.success("Document uploaded"); qc.invalidateQueries({ queryKey: ["docs", customerId] }); },
    onError: (e) => toast.error(e?.response?.data?.message || "Upload failed"),
  });
  const ocrMut = useMutation({
    mutationFn: (id) => runDocumentOcr(id),
    onSuccess: (d) => {
      const msg = d.ocrStatus === "DISABLED"
        ? "OCR feature flag is off — enable `documents.ocr.enabled` first"
        : d.ocrStatus === "SKIPPED"
          ? "OCR skipped (unsupported file type)"
          : "OCR queued";
      d.ocrStatus === "QUEUED" ? toast.success(msg) : toast.info(msg);
      qc.invalidateQueries({ queryKey: ["docs", customerId] });
    },
    onError: (e) => toast.error(e?.response?.data?.message || "OCR failed to start"),
  });

  const onFile = (e, docType) => {
    const file = e.target.files?.[0];
    if (file) uploadMut.mutate({ file, docType });
    e.target.value = "";
  };

  const types = ["ID_PROOF", "ADDRESS_PROOF", "PAN", "PASSPORT", "OTHER"];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <Card className="p-5 lg:col-span-1">
        <div className="font-semibold mb-3">Upload KYC document</div>
        <div className="space-y-2">
          {types.map((t) => (
            <label key={t} className="flex items-center justify-between rounded-md border p-3 hover:bg-accent/40 cursor-pointer">
              <div>
                <div className="text-sm font-medium">{t.replaceAll("_", " ")}</div>
                <div className="text-xs text-muted-foreground">PDF or image · up to 15MB</div>
              </div>
              <input type="file" accept="image/*,application/pdf" className="hidden"
                onChange={(e) => onFile(e, t)} data-testid={`upload-${t}`} />
              <span className="inline-flex items-center gap-1 text-primary text-sm"><Upload className="h-3.5 w-3.5" /> Choose</span>
            </label>
          ))}
        </div>
      </Card>
      <Card className="p-0 lg:col-span-2">
        <div className="border-b p-4 font-semibold">Documents on file</div>
        <div className="divide-y">
          {(docs.data || []).length === 0 && (
            <div className="p-8 text-sm text-muted-foreground text-center">No documents uploaded yet</div>
          )}
          {(docs.data || []).map((d) => {
            const isPdf = d.contentType === "application/pdf";
            const isImage = d.contentType?.startsWith("image/");
            return (
              <div key={d.id} className="p-4" data-testid={`doc-row-${d.id}`}>
                <div className="flex items-center gap-4">
                  <div className="h-11 w-11 rounded-lg bg-muted flex items-center justify-center">
                    {isPdf ? <FileText className="h-5 w-5" /> : <ImgIcon className="h-5 w-5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="font-medium text-sm truncate">{d.filename}</div>
                      <Badge variant="outline" className="text-[10px]">{d.docType}</Badge>
                      <Badge className="text-[10px]">v{d.version}</Badge>
                      <OcrBadge status={d.ocrStatus} />
                    </div>
                    <div className="text-xs text-muted-foreground">{d.contentType} · {(d.sizeBytes / 1024).toFixed(1)} KB · {formatDate(d.createdAt)}</div>
                  </div>
                  <Button asChild variant="outline" size="sm">
                    <a href={documentPreviewUrl(d.id)} target="_blank" rel="noopener noreferrer" data-testid={`doc-preview-${d.id}`}>Preview</a>
                  </Button>
                  <Button asChild variant="outline" size="sm">
                    <a href={documentDownloadUrl(d.id)} data-testid={`doc-download-${d.id}`}><Download className="h-3.5 w-3.5 mr-1" /> Download</a>
                  </Button>
                  {isImage && (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={ocrMut.isPending || d.ocrStatus === "QUEUED"}
                      onClick={() => ocrMut.mutate(d.id)}
                      data-testid={`doc-ocr-${d.id}`}
                    >
                      Run OCR
                    </Button>
                  )}
                </div>
                {(d.ocrText || d.ocrError || d.ocrStatus === "QUEUED") && (
                  <div className="mt-3 ml-14">
                    {d.ocrStatus === "QUEUED" && (
                      <div className="text-xs text-muted-foreground italic">Extracting text…</div>
                    )}
                    {d.ocrText && (
                      <details className="text-xs">
                        <summary className="cursor-pointer text-primary hover:underline" data-testid={`doc-ocr-toggle-${d.id}`}>
                          View extracted text ({d.ocrText.length} chars)
                        </summary>
                        <pre
                          data-testid={`doc-ocr-text-${d.id}`}
                          className="mt-2 max-h-56 overflow-auto whitespace-pre-wrap rounded-md border bg-muted/50 p-3 font-mono text-[11px] leading-relaxed"
                        >{d.ocrText}</pre>
                      </details>
                    )}
                    {d.ocrError && (
                      <div className="text-xs text-destructive">OCR error: {d.ocrError}</div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

function OcrBadge({ status }) {
  if (!status || status === "NONE") return null;
  const map = {
    QUEUED: { className: "bg-amber-500/15 text-amber-700 border-amber-500/30", label: "OCR queued" },
    PROCESSING: { className: "bg-sky-500/15 text-sky-700 border-sky-500/30", label: "OCR running" },
    COMPLETED: { className: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30", label: "OCR done" },
    EMPTY: { className: "bg-muted text-muted-foreground border-border", label: "OCR empty" },
    FAILED: { className: "bg-rose-500/15 text-rose-700 border-rose-500/30", label: "OCR failed" },
    SKIPPED: { className: "bg-muted text-muted-foreground border-border", label: "OCR skipped" },
    DISABLED: { className: "bg-muted text-muted-foreground border-border", label: "OCR off" },
  };
  const m = map[status] || { className: "bg-muted text-muted-foreground border-border", label: status };
  return <span className={`text-[10px] rounded-full border px-2 py-0.5 ${m.className}`}>{m.label}</span>;
}
