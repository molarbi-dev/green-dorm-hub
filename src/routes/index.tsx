import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Lock, User, ShieldCheck, GraduationCap, Phone,
  Sparkles, CheckCircle2, ArrowRight, Loader2, AlertCircle, Eye, EyeOff,
} from "lucide-react";
import logo from "@/assets/logo.jpg";
import building from "@/assets/building.jpg";
import { useLoginAdmin, useLoginStudent } from "@/lib/queries";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SME Hostels — Sign In" },
      { name: "description", content: "Sign in to your SME Hostels portal." },
    ],
  }),
  component: Login,
});

function Login() {
  const navigate = useNavigate();
  const [role, setRole] = useState<"student" | "admin">("student");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Saved profile from this device
  const [savedProfile, setSavedProfile] = useState<{ id: string; fullName: string; username?: string } | null>(null);

  const loginAdminMut = useLoginAdmin();
  const loginStudentMut = useLoginStudent();
  const isPending = loginAdminMut.isPending || loginStudentMut.isPending;

  useEffect(() => {
    try {
      const raw = localStorage.getItem("sme_student_profile");
      if (raw) {
        const p = JSON.parse(raw);
        setSavedProfile(p);
        // Pre-fill username if saved
        if (p?.username) setUsername(p.username);
      }
    } catch {}
  }, []);

  useEffect(() => { setErrorMsg(""); }, [role, username, password]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg("");

    const trimmedUsername = username.trim();
    const trimmedPassword = password.trim();

    if (!trimmedUsername || !trimmedPassword) {
      setErrorMsg("Please enter both username and password.");
      return;
    }

    if (role === "admin") {
      loginAdminMut.mutate({ username: trimmedUsername, password: trimmedPassword }, {
        onSuccess: (admin) => {
          sessionStorage.setItem("sme_admin_id", admin.id);
          sessionStorage.setItem("sme_admin_name", admin.fullName);
          navigate({ to: "/admin" });
        },
        onError: (err) => setErrorMsg(err.message),
      });
    } else {
      loginStudentMut.mutate({ username: trimmedUsername, password: trimmedPassword }, {
        onSuccess: (student) => {
          sessionStorage.setItem("sme_student_id", student.id);
          try {
            localStorage.setItem("sme_student_profile", JSON.stringify({
              id: student.id,
              fullName: student.fullName,
              username: trimmedUsername,
            }));
          } catch {}
          navigate({ to: "/student-home" });
        },
        onError: (err) => setErrorMsg(err.message),
      });
    }
  }

  // Quick-login: go to student home hub
  function quickLogin() {
    if (!savedProfile) return;
    sessionStorage.setItem("sme_student_id", savedProfile.id);
    navigate({ to: "/student-home" });
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      <img src={building} alt="SME Hostels building" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-br from-primary/60 via-primary/30 to-background/80" />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col items-center justify-center px-4 py-10 lg:flex-row lg:gap-12">
        {/* Left hero — desktop only */}
        <div className="hidden lg:flex flex-1 flex-col gap-6 text-white animate-fade-in">
          <div className="flex items-center gap-4 self-start">
            <img src="/umat logo.png" alt="UMaT Logo" className="h-16 w-auto object-contain drop-shadow-lg" />
            <img src={logo} alt="SME Hostels logo" className="h-16 w-auto max-w-[160px] object-contain rounded-2xl border-4 border-white/40 bg-white p-2 shadow-glass" />
          </div>
          <h1 className="text-5xl font-bold leading-tight tracking-tight drop-shadow">A home away from home.</h1>
          <p className="max-w-md text-lg text-white/90">Premium student living, simplified. Book rooms, pay fees, and stay updated — all in one place.</p>
          <div className="flex items-center gap-3 text-white/90">
            <ShieldCheck className="h-5 w-5" />
            <span className="text-sm">Secure portal · 24/7 hostel support</span>
          </div>
        </div>

        {/* Login card */}
        <div className="w-full max-w-md animate-slide-up">
          <div className="glass squircle p-8 shadow-glass">
            <div className="mb-6 flex flex-col items-center gap-3 text-center lg:hidden">
              <img src="/umat logo.png" alt="UMaT Logo" className="h-20 w-auto object-contain drop-shadow-lg" />
              <img src={logo} alt="SME Hostels logo" className="h-20 w-auto object-contain rounded-2xl border-4 border-primary/30 bg-white p-2 shadow-glass" />
            </div>
            <h2 className="text-2xl font-semibold text-foreground">Welcome back</h2>
            <p className="mt-1 text-sm text-muted-foreground">Sign in to continue to your dashboard.</p>

            {/* Role toggle */}
            <div className="mt-6 grid grid-cols-2 gap-2 rounded-2xl bg-secondary p-1">
              <button type="button" onClick={() => setRole("student")}
                className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition ${role === "student" ? "bg-white text-primary shadow-soft" : "text-muted-foreground"}`}>
                <GraduationCap className="h-4 w-4" /> Student
              </button>
              <button type="button" onClick={() => setRole("admin")}
                className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition ${role === "admin" ? "bg-white text-primary shadow-soft" : "text-muted-foreground"}`}>
                <ShieldCheck className="h-4 w-4" /> Admin
              </button>
            </div>

            {/* Quick-login banner for saved profile */}
            {role === "student" && savedProfile && (
              <button onClick={quickLogin}
                className="mt-4 flex w-full items-center justify-between rounded-2xl border border-primary/30 bg-primary/5 px-4 py-3 text-left transition hover:bg-primary/10">
                <div className="flex items-center gap-3">
                  <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-primary text-xs font-bold text-white">
                    {savedProfile.fullName.split(" ").map((p: string) => p[0]).slice(0, 2).join("").toUpperCase()}
                  </div>
                  <div>
                    <div className="text-sm font-semibold">{savedProfile.fullName}</div>
                    <div className="text-xs text-muted-foreground">Saved on this device · tap to continue</div>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-primary" />
              </button>
            )}

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input type="text" required value={username} onChange={(e) => setUsername(e.target.value)}
                  placeholder="Username" autoComplete="username"
                  className="w-full rounded-2xl border border-border bg-white/80 py-3 pl-10 pr-4 text-sm outline-none ring-primary/30 focus:ring-2" />
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input type={showPassword ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password" autoComplete="current-password"
                  className="w-full rounded-2xl border border-border bg-white/80 py-3 pl-10 pr-10 text-sm outline-none ring-primary/30 focus:ring-2" />
                <button type="button" onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {errorMsg && (
                <div className="flex items-center gap-2 rounded-2xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0" /> {errorMsg}
                </div>
              )}

              <button type="submit" disabled={isPending}
                className="w-full rounded-2xl bg-gradient-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-soft transition hover:opacity-95 active:scale-[.98] disabled:opacity-60">
                {isPending
                  ? <span className="inline-flex items-center justify-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Signing in…</span>
                  : `Sign in to ${role === "admin" ? "admin dashboard" : "student portal"}`}
              </button>

              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <Link to="/contact" className="hover:text-primary">Need help?</Link>
                <a href="tel:+233200000000" className="inline-flex items-center gap-1 hover:text-primary">
                  <Phone className="h-3 w-3" /> Emergency
                </a>
              </div>
            </form>

            {/* Onboarding CTA — always visible for student role */}
            {role === "student" && (
              <Link to="/onboarding"
                className="group relative mt-5 flex items-center justify-between gap-3 overflow-hidden rounded-2xl bg-gradient-primary p-4 text-left text-primary-foreground shadow-soft ring-2 ring-primary/40 ring-offset-2 ring-offset-white/40 transition hover:scale-[1.01] active:scale-[.99]">
                <span className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/20 blur-2xl" />
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/20">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      New student? Start here
                      <span className="rounded-full bg-white/25 px-2 py-0.5 text-[10px] uppercase tracking-wide">Required</span>
                    </div>
                    <p className="mt-0.5 text-xs text-white/90">Set up your profile in under 2 minutes.</p>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 transition group-hover:translate-x-1" />
              </Link>
            )}
          </div>

          <p className="mt-4 text-center text-xs text-white/80 drop-shadow">
            © {new Date().getFullYear()} SME Hostels. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
