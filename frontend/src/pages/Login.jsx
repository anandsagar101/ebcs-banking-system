import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Landmark, Loader2, ShieldAlert, Eye, EyeOff, KeyRound, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, verifyMfaLogin, lockout } = useAuth();
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // MFA challenge state - populated when the backend says mfaRequired.
  const [challenge, setChallenge] = useState(null); // { challengeToken, username, remember }
  const [mfaCode, setMfaCode] = useState("");
  const [mfaSubmitting, setMfaSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: { username: "admin", password: "" },
  });

  const locked = Boolean(lockout.until) && Date.now() < lockout.until;

  const onSubmit = async (values) => {
    setSubmitting(true);
    try {
      const result = await login(values.username, values.password, remember);
      if (result.mfaRequired) {
        setChallenge({ ...result, remember });
        toast.message("Enter the 6-digit code from your authenticator app.");
      } else {
        const dest = location.state?.from || "/";
        toast.success("Welcome back!");
        navigate(dest, { replace: true });
      }
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || "Login failed";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const onVerify = async (e) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(mfaCode)) {
      toast.error("Enter the 6-digit code");
      return;
    }
    setMfaSubmitting(true);
    try {
      await verifyMfaLogin(challenge.challengeToken, mfaCode, challenge.remember);
      const dest = location.state?.from || "/";
      toast.success("MFA verified. Welcome back!");
      navigate(dest, { replace: true });
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || "Invalid code";
      toast.error(msg);
      setMfaCode("");
    } finally {
      setMfaSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-background">
      {/* Left brand panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white p-12">
        <div className="absolute inset-0 opacity-30" style={{
          backgroundImage: "radial-gradient(circle at 20% 20%, rgba(56,189,248,0.25), transparent 40%), radial-gradient(circle at 80% 80%, rgba(16,185,129,0.2), transparent 45%)",
        }} />
        <div className="relative z-10 flex flex-col justify-between w-full">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-slate-900">
              <Landmark className="h-6 w-6" />
            </div>
            <div>
              <div className="text-lg font-semibold">EBCS</div>
              <div className="text-xs text-slate-300">Enterprise Banking Core System</div>
            </div>
          </div>
          <div className="max-w-md">
            <h1 className="text-4xl xl:text-5xl font-bold leading-tight tracking-tight">
              Banking infrastructure <br /> built for the modern enterprise.
            </h1>
            <p className="mt-4 text-slate-300 text-[15px] leading-relaxed">
              Manage customers, accounts, transactions, deposits and loans — all
              from a secure, modular monolith powered by Spring Boot 3.3 and PostgreSQL.
            </p>
            <div className="mt-8 flex flex-col gap-3 text-sm text-slate-200">
              <div className="flex items-center gap-3"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Real-time ledger with immutable double-entry</div>
              <div className="flex items-center gap-3"><span className="h-1.5 w-1.5 rounded-full bg-sky-400" /> Role-based access, JWT, audit-ready</div>
              <div className="flex items-center gap-3"><span className="h-1.5 w-1.5 rounded-full bg-amber-400" /> FD, RD, loans with EMI scheduling</div>
            </div>
          </div>
         <div className="text-xs text-slate-400">© {new Date().getFullYear()} EBCS · All rights reserved</div>
        <div className="mb-2 text-center"><p className="text-xs text-slate-300 tracking-wide">Made with<span className="mx-1 text-red-500">❤️</span>by<span className="font-semibold text-white">Anand Sagar</span></p></div>
      </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <Card className="w-full max-w-md p-6 md:p-8 shadow-lg">
          <div className="mb-6 flex items-center gap-3 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Landmark className="h-5 w-5" />
            </div>
            <div className="font-semibold">EBCS</div>
          </div>

          {!challenge ? (
            <>
              <h2 className="text-2xl font-bold tracking-tight">Sign in to your account</h2>
              <p className="mt-1 text-sm text-muted-foreground">Enter your credentials to continue.</p>

              {locked && (
                <div className="mt-4 flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                  <ShieldAlert className="h-4 w-4 mt-0.5" />
                  <span>Too many failed attempts. Account locked for {Math.max(1, Math.ceil((lockout.until - Date.now()) / 1000))}s.</span>
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
                <div>
                  <Label htmlFor="username">Username or email</Label>
                  <Input
                    id="username"
                    data-testid="login-username"
                    autoComplete="username"
                    autoFocus
                    {...register("username", { required: "Username is required" })}
                  />
                  {errors.username && <p className="mt-1 text-xs text-destructive">{errors.username.message}</p>}
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      data-testid="login-password"
                      type={showPw ? "text" : "password"}
                      autoComplete="current-password"
                      {...register("password", { required: "Password is required", minLength: { value: 4, message: "Min 4 chars" } })}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw((s) => !s)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
                      aria-label="Toggle password"
                    >
                      {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password && <p className="mt-1 text-xs text-destructive">{errors.password.message}</p>}
                </div>
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={remember}
                      onCheckedChange={(v) => setRemember(!!v)}
                      data-testid="login-remember"
                    />
                    Remember me
                  </label>
                  <Link to="/forgot-password" className="text-xs text-primary hover:underline" data-testid="login-forgot-link">Forgot password?</Link>
                </div>
                <Button type="submit" className="w-full" disabled={submitting || locked} data-testid="login-submit">
                  {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Sign in
                </Button>

                <div className="mt-5 text-center"><span className="text-sm text-muted-foreground">Don't have an account?{" "} </span><Link to="/register" className="text-sm hover:underline font-medium">Create account</Link></div>

                <div className="text-center text-xs text-muted-foreground">
                  Default admin: <b>admin</b>  <b></b>
                </div>
              </form>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-1">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <KeyRound className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold tracking-tight">Two-factor verification</h2>
                  <p className="text-xs text-muted-foreground">Signed in as <b>{challenge.username}</b></p>
                </div>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                Enter the 6-digit code from your authenticator app to finish signing in.
              </p>
              <form onSubmit={onVerify} className="mt-6 space-y-4" data-testid="mfa-challenge-form">
                <div>
                  <Label htmlFor="mfaCode">Authentication code</Label>
                  <Input
                    id="mfaCode"
                    data-testid="mfa-code-input"
                    autoFocus
                    inputMode="numeric"
                    pattern="\d{6}"
                    maxLength={6}
                    placeholder="123456"
                    value={mfaCode}
                    onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    className="text-center text-2xl tracking-[0.5em] font-mono"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={mfaSubmitting || mfaCode.length !== 6}
                  data-testid="mfa-verify-submit"
                >
                  {mfaSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Verify and sign in
                </Button>
                <button
                  type="button"
                  onClick={() => { setChallenge(null); setMfaCode(""); }}
                  className="w-full flex items-center justify-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                  data-testid="mfa-back-btn"
                >
                  <ArrowLeft className="h-3 w-3" /> Back to sign in
                </button>
              </form>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
