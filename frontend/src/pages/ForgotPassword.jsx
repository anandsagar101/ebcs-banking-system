import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Landmark, Mail, KeyRound, LockKeyhole, Loader2, CheckCircle2, ArrowLeft, RefreshCw } from "lucide-react";
import { forgotPassword, resendResetOtp, verifyResetOtp, resetPassword } from "@/lib/services";

const STEP_EMAIL = "email";
const STEP_OTP = "otp";
const STEP_RESET = "reset";
const STEP_DONE = "done";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState(STEP_EMAIL);

  // form state
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");

  // meta
  const [submitting, setSubmitting] = useState(false);
  const [cooldown, setCooldown] = useState(0); // seconds until resend allowed
  const [ttlSeconds, setTtlSeconds] = useState(300);
  const [otpExpiresAt, setOtpExpiresAt] = useState(0);
  const [otpRemaining, setOtpRemaining] = useState(0);
  const [maxAttempts, setMaxAttempts] = useState(5);

  // cooldown ticker
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  // OTP TTL ticker
  useEffect(() => {
    if (!otpExpiresAt) return;
    const tick = () => setOtpRemaining(Math.max(0, Math.ceil((otpExpiresAt - Date.now()) / 1000)));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [otpExpiresAt]);

  const submitEmail = async (e) => {
    e?.preventDefault?.();
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      toast.error("Enter a valid email address");
      return;
    }
    setSubmitting(true);
    try {
      const res = await forgotPassword(email.trim().toLowerCase());
      setCooldown(res.cooldownSeconds ?? 60);
      setTtlSeconds(res.ttlSeconds ?? 300);
      setMaxAttempts(res.maxAttempts ?? 5);
      setOtpExpiresAt(Date.now() + (res.ttlSeconds ?? 300) * 1000);
      setStep(STEP_OTP);
      toast.success("If the email is registered, a 6-digit code was just sent.");
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to start reset");
    } finally {
      setSubmitting(false);
    }
  };

  const resendCode = async () => {
    if (cooldown > 0) return;
    setSubmitting(true);
    try {
      const res = await resendResetOtp(email.trim().toLowerCase());
      setCooldown(res.cooldownSeconds ?? 60);
      setOtpExpiresAt(Date.now() + (res.ttlSeconds ?? ttlSeconds) * 1000);
      setOtp("");
      toast.success("A fresh code was sent.");
    } catch (e) {
      toast.error(e?.response?.data?.message || "Could not resend code");
    } finally {
      setSubmitting(false);
    }
  };

  const submitOtp = async (e) => {
    e?.preventDefault?.();
    if (!/^\d{6}$/.test(otp)) {
      toast.error("Enter the 6-digit code");
      return;
    }
    setSubmitting(true);
    try {
      const res = await verifyResetOtp(email.trim().toLowerCase(), otp);
      setResetToken(res.resetToken);
      setStep(STEP_RESET);
      toast.success("Code verified. Choose a new password.");
    } catch (e) {
      const msg = e?.response?.data?.message || "Invalid code";
      toast.error(msg);
      // Clear the input on any verify error so the user can retry cleanly.
      setOtp("");
    } finally {
      setSubmitting(false);
    }
  };

  const submitNewPassword = async (e) => {
    e?.preventDefault?.();
    if (newPw.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    if (newPw !== confirmPw) { toast.error("Passwords don't match"); return; }
    setSubmitting(true);
    try {
      await resetPassword(resetToken, newPw);
      setStep(STEP_DONE);
      toast.success("Password updated. You can now sign in.");
    } catch (e) {
      toast.error(e?.response?.data?.message || "Reset failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md p-6 md:p-8 shadow-lg">
        <div className="flex items-center gap-3 mb-1">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 text-white">
            <Landmark className="h-5 w-5" />
          </div>
          <div>
            <div className="font-semibold">EBCS</div>
            <div className="text-xs text-muted-foreground">Password recovery</div>
          </div>
        </div>

        <ol className="mt-6 mb-6 flex items-center gap-2 text-[11px] font-medium uppercase tracking-wide">
          <StepDot label="Email" active={step === STEP_EMAIL} done={step !== STEP_EMAIL} />
          <div className="h-px flex-1 bg-border" />
          <StepDot label="Code" active={step === STEP_OTP} done={step === STEP_RESET || step === STEP_DONE} />
          <div className="h-px flex-1 bg-border" />
          <StepDot label="New password" active={step === STEP_RESET} done={step === STEP_DONE} />
        </ol>

        {step === STEP_EMAIL && (
          <form onSubmit={submitEmail} className="space-y-4" data-testid="fp-step-email">
            <div className="flex items-center gap-2 text-lg font-semibold"><Mail className="h-5 w-5" /> Forgot your password?</div>
            <p className="text-sm text-muted-foreground">
              Enter the email tied to your EBCS account. We'll email a 6-digit code that expires in {Math.round(ttlSeconds / 60)} minutes.
            </p>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoFocus
                required
                data-testid="fp-email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>
            <Button type="submit" className="w-full" disabled={submitting} data-testid="fp-send-code">
              {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Send verification code
            </Button>
          </form>
        )}

        {step === STEP_OTP && (
          <form onSubmit={submitOtp} className="space-y-4" data-testid="fp-step-otp">
            <div className="flex items-center gap-2 text-lg font-semibold"><KeyRound className="h-5 w-5" /> Enter the 6-digit code</div>
            <p className="text-sm text-muted-foreground">
              We emailed a code to <b>{email}</b>. It expires in{" "}
              <span className="font-mono">{fmtTimeLeft(otpRemaining)}</span>. You have up to {maxAttempts} attempts.
            </p>
            <div>
              <Label htmlFor="otp">Verification code</Label>
              <Input
                id="otp"
                autoFocus
                inputMode="numeric"
                pattern="\d{6}"
                maxLength={6}
                required
                data-testid="fp-otp-input"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                className="text-center text-2xl tracking-[0.5em] font-mono"
                placeholder="••••••"
              />
            </div>
            <div className="flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={resendCode}
                disabled={cooldown > 0 || submitting}
                className="inline-flex items-center gap-1 text-primary disabled:text-muted-foreground disabled:cursor-not-allowed hover:underline"
                data-testid="fp-resend-btn"
              >
                <RefreshCw className={`h-3 w-3 ${submitting ? "animate-spin" : ""}`} />
                {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
              </button>
              <button
                type="button"
                onClick={() => { setStep(STEP_EMAIL); setOtp(""); }}
                className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
                data-testid="fp-change-email-btn"
              >
                <ArrowLeft className="h-3 w-3" /> Change email
              </button>
            </div>
            <Button type="submit" className="w-full" disabled={submitting || otp.length !== 6} data-testid="fp-verify-otp">
              {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Verify code
            </Button>
          </form>
        )}

        {step === STEP_RESET && (
          <form onSubmit={submitNewPassword} className="space-y-4" data-testid="fp-step-reset">
            <div className="flex items-center gap-2 text-lg font-semibold"><LockKeyhole className="h-5 w-5" /> Choose a new password</div>
            <p className="text-sm text-muted-foreground">Use at least 6 characters. Passwords are stored hashed with BCrypt.</p>
            <div>
              <Label htmlFor="newPw">New password</Label>
              <Input id="newPw" type="password" required minLength={6} data-testid="fp-new-password"
                     value={newPw} onChange={(e) => setNewPw(e.target.value)} autoFocus autoComplete="new-password" />
            </div>
            <div>
              <Label htmlFor="confirmPw">Confirm password</Label>
              <Input id="confirmPw" type="password" required minLength={6} data-testid="fp-confirm-password"
                     value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} autoComplete="new-password" />
              {confirmPw && newPw !== confirmPw && (
                <p className="mt-1 text-xs text-destructive">Passwords don't match</p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={submitting || newPw.length < 6 || newPw !== confirmPw} data-testid="fp-update-password">
              {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Update password
            </Button>
          </form>
        )}

        {step === STEP_DONE && (
          <div className="text-center py-6" data-testid="fp-step-done">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">Password updated</h3>
            <p className="mt-1 text-sm text-muted-foreground">Sign in with your new password.</p>
            <Button className="mt-6 w-full" onClick={() => navigate("/login")} data-testid="fp-goto-login">Back to sign in</Button>
          </div>
        )}

        {step !== STEP_DONE && (
          <div className="mt-6 text-center text-xs text-muted-foreground">
            Remembered it? <Link to="/login" className="text-primary hover:underline">Sign in</Link>
          </div>
        )}
      </Card>
    </div>
  );
}

function StepDot({ label, active, done }) {
  return (
    <div className={`flex items-center gap-1.5 ${done ? "text-emerald-600" : active ? "text-primary" : "text-muted-foreground"}`}>
      <span
        className={`inline-block h-2 w-2 rounded-full ${
          done ? "bg-emerald-500" : active ? "bg-primary" : "bg-muted-foreground/40"
        }`}
      />
      {label}
    </div>
  );
}

function fmtTimeLeft(s) {
  if (s <= 0) return "0:00";
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
}
