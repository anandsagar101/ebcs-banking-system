import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppShell from "@/components/AppShell";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { Toaster } from "sonner";
import { Loader2 } from "lucide-react";
import useKeyboardShortcuts from "@/hooks/useKeyboardShortcuts";

const Login = lazy(() => import("@/pages/Login"));
const Register = lazy(() => import("@/pages/Register"));
const ForgotPassword = lazy(() => import("@/pages/ForgotPassword"));
const ChangePassword = lazy(() => import("@/pages/ChangePassword"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Customers = lazy(() => import("@/pages/Customers"));
const CustomerDetails = lazy(() => import("@/pages/CustomerDetails"));
const Products = lazy(() => import("@/pages/Products"));
const Accounts = lazy(() => import("@/pages/Accounts"));
const AccountDetails = lazy(() => import("@/pages/AccountDetails"));
const Transactions = lazy(() => import("@/pages/Transactions"));
const Deposits = lazy(() => import("@/pages/Deposits"));
const Loans = lazy(() => import("@/pages/Loans"));
const LoanDetails = lazy(() => import("@/pages/LoanDetails"));
const LoanCalculator = lazy(() => import("@/pages/LoanCalculator"));
const Kyc = lazy(() => import("@/pages/Kyc"));
const AdminUsers = lazy(() => import("@/pages/AdminUsers"));
const AdminConfig = lazy(() => import("@/pages/AdminConfig"));
const AdminAudit = lazy(() => import("@/pages/AdminAudit"));
const Search = lazy(() => import("@/pages/Search"));
const Reports = lazy(() => import("@/pages/Reports"));
const Security = lazy(() => import("@/pages/Security"));
const NotificationSettings = lazy(() => import("@/pages/NotificationSettings"));
const FeatureFlags = lazy(() => import("@/pages/FeatureFlags"));

import { NotFound, Forbidden, ServerError } from "@/pages/ErrorPages";

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-64 text-muted-foreground">
      <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading…
    </div>
  );
}

function Protected({ children, roles }) {
  return (
    <ProtectedRoute roles={roles}>
      <AppShell><Suspense fallback={<PageLoader />}>{children}</Suspense></AppShell>
    </ProtectedRoute>
  );
}

function AppRoutes() {
  useKeyboardShortcuts();
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        <Route path="/" element={<Protected><Dashboard /></Protected>} />
        <Route path="/change-password" element={<Protected><ChangePassword /></Protected>} />
        <Route path="/customers" element={<Protected><Customers /></Protected>} />
        <Route path="/customers/:id" element={<Protected><CustomerDetails /></Protected>} />
        <Route path="/products" element={<Protected><Products /></Protected>} />
        <Route path="/accounts" element={<Protected><Accounts /></Protected>} />
        <Route path="/accounts/:id" element={<Protected><AccountDetails /></Protected>} />
        <Route path="/transactions" element={<Protected><Transactions /></Protected>} />
        <Route path="/deposits" element={<Protected><Deposits /></Protected>} />
        <Route path="/loans" element={<Protected><Loans /></Protected>} />
        <Route path="/loans/calculator" element={<Protected><LoanCalculator /></Protected>} />
        <Route path="/loans/:id" element={<Protected><LoanDetails /></Protected>} />
        <Route path="/kyc" element={<Protected><Kyc /></Protected>} />
        <Route path="/search" element={<Protected><Search /></Protected>} />
        <Route path="/reports" element={<Protected><Reports /></Protected>} />
        <Route path="/security" element={<Protected><Security /></Protected>} />
        <Route path="/notifications" element={<Protected><NotificationSettings /></Protected>} />

        <Route path="/admin/users" element={<Protected roles={["ROLE_ADMIN"]}><AdminUsers /></Protected>} />
        <Route path="/admin/config" element={<Protected roles={["ROLE_ADMIN"]}><AdminConfig /></Protected>} />
        <Route path="/admin/audit" element={<Protected roles={["ROLE_ADMIN"]}><AdminAudit /></Protected>} />
        <Route path="/admin/feature-flags" element={<Protected roles={["ROLE_ADMIN"]}><FeatureFlags /></Protected>} />

        <Route path="/forbidden" element={<Forbidden />} />
        <Route path="/500" element={<ServerError />} />
        <Route path="/404" element={<NotFound />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
          <Toaster richColors position="top-right" />
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}
