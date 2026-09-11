import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";import { ShieldCheck, User, Lock, Key, Loader2, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { useCreateFirstAdmin, useCheckAdminExists } from "@/lib/queries";
import logo from "@/assets/logo.jpg";

export const Route = createFileRoute("/setup")({
  head: () => ({ meta: [{ title: "Admin Setup — SME Hostels" }] }),
  component: Setup,
});

function Setup() {
  const navigate = useNavigate();
  const { data: adminCheck, isLoading: checking, error: checkError } = useCheckAdminExists();
  const createAdmin = useCreateFirstAdmin();

  const [form, setForm] = useState({ fullName: "", username: "", password: "", confirmPassword: "", setupKey: "" });
  const [done, setDone] = useState(false);

  const upd = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      alert("Passwords do not match.");
      return;
    }
    createAdmin.mutate(
      { username: form.username, password: form.password, fullName: form.fullName, setupKey: form.setupKey },
      {
        onSuccess: () => {
          setDone(true);
          setTimeout(() => navigate({ to: "/" }), 2500);
        },
        onError: () => {
          // error is displayed via createAdmin.error below
        },
      },
    );
  }

  if (checking) {
    return <div className="grid min-h-screen place-items-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (checkError) {
    return (
      <div className="grid min-h-screen place-items-center bg-background px-4">
        <div className="w-full max-w-sm squircle bg-white p-8 text-center shadow-glass">
          <div className="text-lg font-semibold text-destructive">Connection error</div>
          <div className="mt-2 text-sm text-muted-foreground">{(checkError as Error).message}</div>
          <div className="mt-3 text-xs text-muted-foreground">Check that your Supabase env vars are set in .dev.vars and restart the dev server.</div>
        </div>
      </div>
    );
  }

  if (adminCheck?.exists) {
    return (
      <div className="grid min-h-screen place-items-center bg-background px-4">
        <div className="w-full max-w-sm squircle bg-white p-8 text-center shadow-glass">
          <ShieldCheck className="mx-auto h-12 w-12 text-primary" />
          <div className="mt-4 text-lg font-semibold">Admin already set up</div>
          <div className="mt-1 text-sm text-muted-foreground">An admin account already exists. Sign in normally.</div>
          <button onClick={() => navigate({ to: "/" })} className="mt-5 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground">
            Go to sign in
          </button>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="grid min-h-screen place-items-center bg-background px-4">
        <div className="w-full max-w-sm squircle bg-white p-8 text-center shadow-glass">
          <CheckCircle2 className="mx-auto h-12 w-12 text-primary" />
          <div className="mt-4 text-lg font-semibold text-primary">Admin account created!</div>
          <div className="mt-1 text-sm text-muted-foreground">Redirecting to sign in…</div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid min-h-screen place-items-center bg-gradient-to-br from-primary/20 to-background px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center gap-3">
          <img src={logo} alt="SME Hostels" className="h-12 w-auto squircle bg-white p-2 shadow-soft" />
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground">First-time setup</div>
            <div className="text-xl font-bold">Create admin account</div>
          </div>
        </div>

        <div className="squircle bg-white p-6 shadow-glass">
          <div className="mb-4 rounded-2xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800">
            This page is only accessible once — when no admin exists. After setup it will be locked.
          </div>

          <form onSubmit={submit} className="space-y-4">
            <Field icon={User} label="Full name" placeholder="Kofi Kwaw" value={form.fullName} onChange={upd("fullName")} required />
            <Field icon={User} label="Username" placeholder="KOFIKWAW" value={form.username} onChange={upd("username")} required />
            <Field icon={Lock} type="password" label="Password" placeholder="Min 6 characters" value={form.password} onChange={upd("password")} required minLength={6} />
            <Field icon={Lock} type="password" label="Confirm password" placeholder="Repeat password" value={form.confirmPassword} onChange={upd("confirmPassword")} required />
            <div className="border-t border-border pt-4">
              <Field icon={Key} type="password" label="Setup key" placeholder="From your .env ADMIN_SETUP_KEY" value={form.setupKey} onChange={upd("setupKey")} required />
              <div className="mt-1 text-xs text-muted-foreground">Add <code className="rounded bg-muted px-1">ADMIN_SETUP_KEY=any-secret-you-choose</code> to your .dev.vars</div>
            </div>
            <button type="submit" disabled={createAdmin.isPending}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-primary py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50">
              {createAdmin.isPending ? <><Loader2 className="h-4 w-4 animate-spin" /> Creating…</> : "Create admin account"}
            </button>
            {createAdmin.isError && (
              <div className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive break-words">
                <span className="font-semibold">Error: </span>
                {(createAdmin.error as Error)?.message ?? "Unknown error. Check Cloudflare logs."}
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}

function Field({ icon: Icon, label, ...props }: { icon: typeof User; label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  const [show, setShow] = useState(false);
  const isPassword = props.type === "password";
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium">{label}</span>
      <div className="relative">
        <Icon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input {...props} type={isPassword ? (show ? "text" : "password") : props.type}
          className={`w-full rounded-2xl border border-border bg-white px-3 py-3 pl-10 text-sm outline-none focus:ring-2 focus:ring-primary/30 ${isPassword ? "pr-10" : ""}`} />
        {isPassword && (
          <button type="button" onClick={() => setShow((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition">
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </div>
    </label>
  );
}
