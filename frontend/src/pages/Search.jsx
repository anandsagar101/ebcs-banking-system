import { useSearchParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import PageHeader from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { listCustomers, listAccounts, listTransactions, listLoans } from "@/lib/services";
import { formatCurrency, formatDate } from "@/lib/format";

export default function Search() {
  const [sp] = useSearchParams();
  const q = (sp.get("q") || "").toLowerCase().trim();

  const customers = useQuery({ queryKey: ["customers"], queryFn: listCustomers });
  const accounts = useQuery({ queryKey: ["accounts"], queryFn: listAccounts });
  const txs = useQuery({ queryKey: ["transactions"], queryFn: listTransactions });
  const loans = useQuery({ queryKey: ["loans"], queryFn: listLoans });

  const match = (v) => v && String(v).toLowerCase().includes(q);

  const custHits = q ? (customers.data || []).filter((c) => match(c.firstName) || match(c.lastName) || match(c.email) || match(c.phone)) : [];
  const accHits = q ? (accounts.data || []).filter((a) => match(a.accountNumber) || match(String(a.customerId))) : [];
  const txHits = q ? (txs.data || []).filter((t) => match(t.reference) || match(t.description) || match(t.txType)) : [];
  const loanHits = q ? (loans.data || []).filter((l) => match(String(l.id)) || match(String(l.customerId)) || match(l.status)) : [];

  const total = custHits.length + accHits.length + txHits.length + loanHits.length;

  return (
    <>
      <PageHeader title="Global search" description={q ? `${total} results for "${q}"` : "Enter a term in the top search bar."} />
      {!q ? (
        <Card className="p-8 text-center text-muted-foreground">Start typing in the search bar to find customers, accounts, transactions or loans.</Card>
      ) : total === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">No results found.</Card>
      ) : (
        <div className="space-y-6">
          {custHits.length > 0 && (
            <Section title={`Customers (${custHits.length})`}>
              {custHits.slice(0, 10).map((c) => (
                <Link key={c.id} to={`/customers/${c.id}`} className="flex items-center justify-between rounded-md hover:bg-accent/40 p-3 -mx-3">
                  <div>
                    <div className="text-sm font-medium">{c.firstName} {c.lastName}</div>
                    <div className="text-xs text-muted-foreground">{c.email} · {c.phone}</div>
                  </div>
                  <Badge variant="outline">{c.kycStatus}</Badge>
                </Link>
              ))}
            </Section>
          )}
          {accHits.length > 0 && (
            <Section title={`Accounts (${accHits.length})`}>
              {accHits.slice(0, 10).map((a) => (
                <Link key={a.id} to={`/accounts/${a.id}`} className="flex items-center justify-between rounded-md hover:bg-accent/40 p-3 -mx-3">
                  <div>
                    <div className="text-sm font-mono">{a.accountNumber}</div>
                    <div className="text-xs text-muted-foreground">Customer #{a.customerId}</div>
                  </div>
                  <div className="text-sm tabular-nums">{formatCurrency(a.balance)}</div>
                </Link>
              ))}
            </Section>
          )}
          {txHits.length > 0 && (
            <Section title={`Transactions (${txHits.length})`}>
              {txHits.slice(0, 10).map((t) => (
                <div key={t.id} className="flex items-center justify-between p-3 -mx-3 rounded-md hover:bg-accent/40">
                  <div>
                    <div className="text-sm font-mono">{t.reference}</div>
                    <div className="text-xs text-muted-foreground">{t.description || t.txType} · {formatDate(t.createdAt)}</div>
                  </div>
                  <div className="text-sm tabular-nums">{formatCurrency(t.amount)}</div>
                </div>
              ))}
            </Section>
          )}
          {loanHits.length > 0 && (
            <Section title={`Loans (${loanHits.length})`}>
              {loanHits.slice(0, 10).map((l) => (
                <Link key={l.id} to={`/loans/${l.id}`} className="flex items-center justify-between p-3 -mx-3 rounded-md hover:bg-accent/40">
                  <div>
                    <div className="text-sm font-medium">Loan #{l.id}</div>
                    <div className="text-xs text-muted-foreground">{l.termMonths} mo @ {l.interestRate}%</div>
                  </div>
                  <Badge>{l.status}</Badge>
                </Link>
              ))}
            </Section>
          )}
        </div>
      )}
    </>
  );
}

function Section({ title, children }) {
  return (
    <Card className="p-5">
      <div className="text-sm font-semibold mb-3">{title}</div>
      <div className="divide-y">{children}</div>
    </Card>
  );
}
