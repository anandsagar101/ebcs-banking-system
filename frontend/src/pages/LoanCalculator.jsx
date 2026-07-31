import { useMemo, useState } from "react";
import PageHeader from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/format";
import {
  Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";
import { RefreshCcw } from "lucide-react";

export default function LoanCalculator() {
  const [p, setP] = useState(500000);
  const [r, setR] = useState(10.5);
  const [n, setN] = useState(60);

  const { emi, totalInterest, totalPayable, schedule } = useMemo(() => {
    const P = Number(p) || 0;
    const R = (Number(r) || 0) / 12 / 100;
    const N = Number(n) || 0;
    if (!P || !N) return { emi: 0, totalInterest: 0, totalPayable: 0, schedule: [] };
    const emiCalc = R === 0 ? P / N : (P * R * Math.pow(1 + R, N)) / (Math.pow(1 + R, N) - 1);
    let balance = P;
    const rows = [];
    for (let i = 1; i <= N; i++) {
      const interest = balance * R;
      const principal = emiCalc - interest;
      balance = Math.max(0, balance - principal);
      rows.push({ month: i, principal: +principal.toFixed(2), interest: +interest.toFixed(2), balance: +balance.toFixed(2), emi: +emiCalc.toFixed(2) });
    }
    return {
      emi: emiCalc,
      totalInterest: emiCalc * N - P,
      totalPayable: emiCalc * N,
      schedule: rows,
    };
  }, [p, r, n]);

  return (
    <>
      <PageHeader title="EMI Calculator" description="Estimate monthly repayments before applying." />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="p-6 lg:col-span-1">
          <div className="space-y-4">
            <div>
              <Label>Principal amount</Label>
              <Input type="number" value={p} onChange={(e) => setP(e.target.value)} data-testid="calc-principal" />
            </div>
            <div>
              <Label>Interest rate (annual %)</Label>
              <Input type="number" step="0.01" value={r} onChange={(e) => setR(e.target.value)} data-testid="calc-rate" />
            </div>
            <div>
              <Label>Term (months)</Label>
              <Input type="number" value={n} onChange={(e) => setN(e.target.value)} data-testid="calc-term" />
            </div>
            <Button variant="outline" className="w-full" onClick={() => { setP(500000); setR(10.5); setN(60); }}>
              <RefreshCcw className="h-4 w-4 mr-2" /> Reset
            </Button>
          </div>
        </Card>
        <Card className="p-6 lg:col-span-2">
          <div className="grid grid-cols-3 gap-4">
            <Stat label="Monthly EMI" value={formatCurrency(emi)} tone="sky" />
            <Stat label="Total interest" value={formatCurrency(totalInterest)} tone="amber" />
            <Stat label="Total payable" value={formatCurrency(totalPayable)} tone="emerald" />
          </div>
          <div className="mt-6 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={schedule}>
                <defs>
                  <linearGradient id="cPrin" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="cInt" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="month" fontSize={10} />
                <YAxis fontSize={10} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                <Area type="monotone" dataKey="principal" stroke="#0ea5e9" fill="url(#cPrin)" name="Principal" />
                <Area type="monotone" dataKey="interest" stroke="#f59e0b" fill="url(#cInt)" name="Interest" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </>
  );
}

function Stat({ label, value, tone }) {
  const map = { sky: "text-sky-500", amber: "text-amber-500", emerald: "text-emerald-500" };
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={`mt-1 text-xl md:text-2xl font-bold tabular-nums ${map[tone]}`}>{value}</div>
    </div>
  );
}
