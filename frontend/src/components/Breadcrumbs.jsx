import { Link, useLocation } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";

const labelMap = {
  customers: "Customers", accounts: "Accounts", transactions: "Transactions",
  deposits: "Deposits", loans: "Loans", products: "Products", kyc: "KYC",
  admin: "Administration", users: "User Management", config: "Configuration",
  audit: "Audit Logs", "change-password": "Change Password", calculator: "EMI Calculator",
  fd: "Fixed Deposit", rd: "Recurring Deposit", new: "New", search: "Search",
  register: "Register", forbidden: "Forbidden", "500": "Server Error",
};

export default function Breadcrumbs() {
  const { pathname } = useLocation();
  const parts = pathname.split("/").filter(Boolean);

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1 px-4 md:px-6 py-3 text-sm text-muted-foreground border-b bg-card/40">
      <Link to="/" className="flex items-center hover:text-foreground" data-testid="breadcrumb-home">
        <Home className="h-3.5 w-3.5" />
      </Link>
      {parts.map((p, i) => {
        const to = "/" + parts.slice(0, i + 1).join("/");
        const label = labelMap[p] || (/^\d+$/.test(p) ? `#${p}` : p.charAt(0).toUpperCase() + p.slice(1));
        return (
          <span key={to} className="flex items-center gap-1">
            <ChevronRight className="h-3.5 w-3.5" />
            {i === parts.length - 1
              ? <span className="text-foreground font-medium">{label}</span>
              : <Link to={to} className="hover:text-foreground">{label}</Link>}
          </span>
        );
      })}
    </nav>
  );
}
