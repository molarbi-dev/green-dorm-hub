/**
 * /activate
 *
 * Shown when a student logs in but their activation_status is not 'active'.
 * Lets them pay the GHS 80 activation fee or check if a pending payment cleared.
 */
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  CheckCircle2, Loader2, MessageCircle, Zap, LogOut,
} from "lucide-react";
import logo from "@/assets/logo.jpg";
import { useSettings } from "@/lib/queries";
import {
  getPaystackPublicKey,
  initializeActivationPayment,
  verifyActivationPayment,
} from "@/lib/api/activation.functions";

export const Route = createFileRoute("/activate")({
  head: () => ({ meta: [{ title: "Activate Account — SME Hostels" }] }),
  component: ActivatePage,
});

declare global {
  interface Window {
    PaystackPop?: {
      setup(opts: {
        key: string;
        email: string;
        amount: number;
        currency: string;
        ref: string;
        metadata?: Record<string, unknown>;
        onClose: () => void;
        callback: (response: { reference: string }) => void;
      }): { openIframe(): void };
    };
  }
}

const BENEFITS = [
  "First week of Wi-Fi access free",
  "First prepaid electricity top-up free",
  "Electricity meter info & top-up history",
  "Internship opportunities portal",
  "Transport agencies & schedules",
  "Hostel announcements & emergency contacts",
];

function ActivatePage() {
  const navigate = useNavigate();
  const { data: settings } = useSettings();
  const [joined, setJoined] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "paying" | "verifying" | "done" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const channelUrl = settings?.whatsapp_channel_url ?? "https://whatsapp.com/channel/";

  function getCurrentStudentId() {
    if (typeof window === "undefined") return "";
    return sessionStorage.getItem("sme_student_id") ?? "";
  }

  useEffect(() => {
    if (!getCurrentStudentId()) navigate({ to: "/" });
  }, []);

  function signOut() {
    sessionStorage.removeItem("sme_student_id");
    localStorage.removeItem("sme_student_profile");
    navigate({ to: "/" });
  }

  async function handlePay() {
    const studentId = getCurrentStudentId();
    if (!studentId) { navigate({ to: "/" }); return; }

    setStatus("loading");
    setErrorMsg(null);

    try {
      if (!window.PaystackPop) {
        await new Promise<void>((resolve, reject) => {
          const s = document.createElement("script");
          s.src = "https://js.paystack.co/v1/inline.js";
          s.onload = () => resolve();
          s.onerror = () => reject(new Error("Failed to load payment provider."));
          document.head.appendChild(s);
        });
      }

      const [{ publicKey }, { reference, email, amount }] = await Promise.all([
        getPaystackPublicKey(),
        initializeActivationPayment({ data: { student_id: studentId } }),
      ]);

      setStatus("paying");

      window.PaystackPop!.setup({
        key: publicKey,
        email,
        amount,
        currency: "GHS",
        ref: reference,
        metadata: { student_id: studentId, purpose: "activation" },
        onClose: () => {
          setStatus("idle");
          setErrorMsg("Payment was cancelled. Tap 'Pay GHS 80' to try again.");
        },
        callback: async (response) => {
          setStatus("verifying");
          try {
            const result = await verifyActivationPayment({
              data: { reference: response.reference, student_id: studentId },
            });
            if (result.status === "active") {
              setStatus("done");
              setTimeout(() => navigate({ to: "/student-home" }), 1500);
            } else if (result.status === "failed") {
              setStatus("error");
              setErrorMsg(result.message);
            } else {
              setStatus("idle");
              setErrorMsg("Payment is processing. Please wait a moment then sign in again.");
            }
          } catch (_) {
            setStatus("idle");
            setErrorMsg("Could not verify payment. If you paid, your account will activate shortly — sign in again to check.");
          }
        },
      }).openIframe();
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    }
  }

  if (status === "done") {
    return (
      <div className="grid min-h-screen place-items-center bg-background px-4">
        <div className="w-full max-w-sm rounded-3xl bg-white p-8 text-center shadow-glass space-y-4">
          <div className="grid h-16 w-16 place-items-center rounded-full bg-primary/10 text-primary mx-auto">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-bold">Account Activated!</h2>
          <p className="text-sm text-muted-foreground">Welcome to SME Hostels. Redirecting you now…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-primary px-4 py-6">
        <div className="mx-auto max-w-md flex items-center justify-between">
          <img src={logo} alt="SME Hostels" className="h-10 w-auto rounded-xl bg-white p-1.5 object-contain shadow-soft" />
          <button onClick={signOut}
            className="flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-2 text-xs font-medium text-white hover:bg-white/25 transition">
            <LogOut className="h-3.5 w-3.5" /> Sign out
          </button>
        </div>
        <div className="mx-auto max-w-md mt-5 text-white">
          <h1 className="text-2xl font-bold">Activate your account</h1>
          <p className="mt-1 text-sm text-white/80">
            One-time fee to unlock full access to SME Hostels.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-md px-4 py-6 space-y-4">

        {/* WhatsApp join */}
        <div className="rounded-2xl border-2 border-[#25D366]/40 bg-[#25D366]/5 p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <MessageCircle className="h-4 w-4 text-[#25D366]" />
            Step 1 — Join our WhatsApp channel
          </div>
          <p className="text-xs text-muted-foreground">
            All hostel announcements and updates go through our WhatsApp channel.
          </p>
          <a href={channelUrl} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition">
            <MessageCircle className="h-4 w-4" />
            Join {settings?.hostel_name ?? "SME Hostels"} channel
          </a>
          <label className="flex cursor-pointer items-start gap-3 rounded-xl bg-white/60 p-3">
            <input type="checkbox" checked={joined} onChange={(e) => setJoined(e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-[oklch(0.68_0.17_145)]" />
            <span className="text-xs text-muted-foreground">I have joined the WhatsApp channel.</span>
          </label>
        </div>

        {/* What you get */}
        <div className={`rounded-2xl border border-border bg-white p-5 space-y-4 transition ${!joined ? "opacity-50 pointer-events-none" : ""}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Zap className="h-4 w-4 text-primary" />
              Step 2 — Pay GHS 80 once
            </div>
            <span className="text-lg font-bold text-primary">GHS 80</span>
          </div>

          <div className="space-y-2">
            {BENEFITS.map((b) => (
              <div key={b} className="flex items-center gap-2 text-xs text-muted-foreground">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-primary" />
                <span>{b}</span>
              </div>
            ))}
          </div>

          <p className="text-xs text-muted-foreground border-t border-border/60 pt-3">
            Secure payment via Paystack. Supports Mobile Money and cards.
          </p>

          {errorMsg && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {errorMsg}
            </div>
          )}

          <button
            onClick={handlePay}
            disabled={!joined || status === "loading" || status === "paying" || status === "verifying"}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-4 text-base font-bold text-white shadow-soft transition hover:opacity-95 active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {status === "loading" && <><Loader2 className="h-4 w-4 animate-spin" /> Loading…</>}
            {status === "paying" && <><Loader2 className="h-4 w-4 animate-spin" /> Opening payment…</>}
            {status === "verifying" && <><Loader2 className="h-4 w-4 animate-spin" /> Verifying…</>}
            {(status === "idle" || status === "error") && <>Pay GHS 80 to activate</>}
          </button>
        </div>

      </div>
    </div>
  );
}
