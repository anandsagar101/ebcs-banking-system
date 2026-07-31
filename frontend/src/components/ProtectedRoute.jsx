import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export default function ProtectedRoute({ children, roles }) {
  const { user, ready } = useAuth();
  const location = useLocation();

  if (!ready) return null;
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  if (roles && roles.length > 0) {
    const ok = roles.some((r) => (user.roles || []).includes(r));
    if (!ok) return <Navigate to="/forbidden" replace />;
  }
  return children;
}
