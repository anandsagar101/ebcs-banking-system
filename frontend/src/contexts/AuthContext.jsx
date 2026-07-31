import { createContext, useContext, useEffect, useState, useCallback } from "react";
import api, { tokenStore, userStore, setUnauthorizedHandler } from "@/lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => userStore.get());
  const [token, setToken] = useState(() => tokenStore.get());
  const [lockout, setLockout] = useState({ count: 0, until: 0 });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      tokenStore.clear();
      setToken(null);
      setUser(null);
    });
    setReady(true);
  }, []);

  const applySession = useCallback((data, remember) => {
    tokenStore.set(data.accessToken, !!remember);
    const u = { username: data.username, roles: data.roles || [] };
    userStore.set(u, !!remember);
    setToken(data.accessToken);
    setUser(u);
    setLockout({ count: 0, until: 0 });
    return u;
  }, []);

  const login = useCallback(async (username, password, remember) => {
    if (lockout.until && Date.now() < lockout.until) {
      const secs = Math.ceil((lockout.until - Date.now()) / 1000);
      throw new Error(`Account locked. Try again in ${secs}s.`);
    }
    try {
      const { data } = await api.post("/auth/login", { username, password });
      if (data.mfaRequired) {
        // Password accepted, MFA still required. Caller must call `verifyMfaLogin`.
        return {
          mfaRequired: true,
          challengeToken: data.challengeToken,
          challengeExpiresInMs: data.challengeExpiresInMs,
          username: data.username,
          remember: !!remember,
        };
      }
      return { mfaRequired: false, user: applySession(data, remember) };
    } catch (e) {
      const nextCount = lockout.count + 1;
      const next = nextCount >= 5
        ? { count: 0, until: Date.now() + 60_000 }
        : { count: nextCount, until: 0 };
      setLockout(next);
      throw e;
    }
  }, [lockout, applySession]);

  const verifyMfaLogin = useCallback(async (challengeToken, code, remember) => {
    const { data } = await api.post("/auth/mfa/login-verify", { challengeToken, code });
    return applySession(data, remember);
  }, [applySession]);

  const register = useCallback(async (username, email, password) => {
    const { data } = await api.post("/auth/register", { username, email, password });
    return applySession(data, false);
  }, [applySession]);

  const logout = useCallback(() => {
    tokenStore.clear();
    setToken(null);
    setUser(null);
  }, []);

  const hasRole = useCallback((role) => (user?.roles || []).includes(role), [user]);
  const isAdmin = useCallback(() => hasRole("ROLE_ADMIN"), [hasRole]);

  const value = { user, token, ready, login, verifyMfaLogin, register, logout, hasRole, isAdmin, lockout };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
