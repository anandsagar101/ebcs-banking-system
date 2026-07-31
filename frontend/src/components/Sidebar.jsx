import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutDashboard, Users, Landmark, ArrowLeftRight, Wallet, PiggyBank,
  Banknote, FileCheck2, ShieldCheck, Settings2, ClipboardList, Package,
  BarChart3, Bell, Flag,
} from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, testId: "nav-dashboard" },
  { to: "/customers", label: "Customers", icon: Users, testId: "nav-customers" },
  { to: "/accounts", label: "Accounts", icon: Landmark, testId: "nav-accounts" },
  { to: "/transactions", label: "Transactions", icon: ArrowLeftRight, testId: "nav-transactions" },
  { to: "/deposits", label: "Deposits", icon: PiggyBank, testId: "nav-deposits" },
  { to: "/loans", label: "Loans", icon: Banknote, testId: "nav-loans" },
  { to: "/products", label: "Products", icon: Package, testId: "nav-products" },
  { to: "/kyc", label: "KYC", icon: FileCheck2, testId: "nav-kyc" },
  { to: "/reports", label: "Reports", icon: BarChart3, testId: "nav-reports" },
];
const userNav = [
  { to: "/notifications", label: "Notifications", icon: Bell, testId: "nav-notifications" },
  { to: "/security", label: "Security", icon: ShieldCheck, testId: "nav-security" },
];
const adminNav = [
  { to: "/admin/users", label: "User Management", icon: Users, testId: "nav-admin-users" },
  { to: "/admin/config", label: "Configuration", icon: Settings2, testId: "nav-admin-config" },
  { to: "/admin/feature-flags", label: "Feature Flags", icon: Flag, testId: "nav-admin-flags" },
  { to: "/admin/audit", label: "Audit Logs", icon: ClipboardList, testId: "nav-admin-audit" },
];

export default function Sidebar({ onNavigate }) {
  const { isAdmin } = useAuth();
  const location = useLocation();

  const renderItem = (item) => {
    const Icon = item.icon;
    const active = location.pathname === item.to || (item.to !== "/" && location.pathname.startsWith(item.to));
    return (
      <NavLink
        key={item.to}
        to={item.to}
        onClick={onNavigate}
        data-testid={item.testId}
        className={cn(
          "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
          active
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-muted-foreground hover:bg-accent hover:text-foreground",
        )}
      >
        <Icon className="h-4 w-4 shrink-0" />
        <span className="truncate">{item.label}</span>
      </NavLink>
    );
  };

  return (
    <aside className="hidden md:flex md:w-64 lg:w-72 shrink-0 flex-col border-r bg-card">
      <div className="flex h-16 items-center gap-2 border-b px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Landmark className="h-5 w-5" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold tracking-tight">EBCS</span>
          <span className="text-[10px] text-muted-foreground uppercase tracking-widest">Core Banking</span>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto p-3">
        <div className="mb-3 px-3 text-[10px] uppercase tracking-wider text-muted-foreground">Overview</div>
        <div className="space-y-1">{nav.map(renderItem)}</div>
        <div className="mt-6 mb-3 px-3 text-[10px] uppercase tracking-wider text-muted-foreground">Account</div>
        <div className="space-y-1">{userNav.map(renderItem)}</div>
        {isAdmin() && (
          <>
            <div className="mt-6 mb-3 px-3 text-[10px] uppercase tracking-wider text-muted-foreground">Administration</div>
            <div className="space-y-1">{adminNav.map(renderItem)}</div>
          </>
        )}
      </nav>
      <div className="border-t p-4 text-[11px] text-muted-foreground">
        v1.0.0 · Java 21 · Spring Boot 3.3
      </div>
    </aside>
  );
}
