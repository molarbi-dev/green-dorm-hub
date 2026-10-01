/**
 * /payment-callback
 *
 * Paystack redirects here after the hosted checkout page (if used).
 * For inline popup, this page isn't used — but we keep it as a fallback.
 * It reads ?reference= from the URL and calls verifyActivationPayment.
 */
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { verifyActivationPayment } from "@/lib/api/activation.functions";

export const Route = createFileRoute("/payment-callback")({
  head: () => ({ meta: [{ title: "Activating Account — SME Hostels" }] }),
  component: PaymentCallback,
});

function PaymentCallback() {
  const navigate = useNavigate();
  const [state, setState] = useState<"verifying" | "active" | "pending" | "failed">("verifying");
  const [message, setMessage] = useState("Verifying your payment…");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const reference = params.get("reference") ?? params.get("trxref");
    const studentId = sessionStorage.getItem("sme_student_id");

    if (!reference || !studentId) {
      setState("failed");
      setMessage("Missing payment reference. Please contact management.");
      return;
    }

    verifyActivationPayment({ data: { reference, student_id: studentId } })
      .then((res) => {
        setState(res.status === "active" ? "active" : res.status === "failed" ? "failed" : "pending");
        setMessage(res.message);
        if (res.status === "active") {
          setTimeout(() => navigate({ to: "/student-home" }), 2000);
        }
      })
      .catch(() => {
        setState("pending");
        setMessage("Could not verify payment. If you paid, your account will activate shortly.");
      });
  }, []);

  return (
    <div className="grid min-h-screen place-items-center bg-background px-4">
      <div className="w-full max-w-sm rounded-3xl bg-white p-8 text-center shadow-glass">
        {state === "verifying" && (
          <>
            <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
            <p className="mt-4 text-sm text-muted-foreground">{message}</p>
          </>
        )}
        {state === "active" && (
          <>
            <CheckCircle2 className="h-12 w-12 text-primary mx-auto" />
            <h2 className="mt-4 text-lg font-bold">Account Activated!</h2>
            <p className="mt-2 text-sm text-muted-foreground">Redirecting you now…</p>
          </>
        )}
        {state === "pending" && (
          <>
            <Loader2 className="h-10 w-10 animate-spin text-amber-500 mx-auto" />
            <h2 className="mt-4 text-lg font-bold">Payment Processing</h2>
            <p className="mt-2 text-sm text-muted-foreground">{message}</p>
            <button
              onClick={() => navigate({ to: "/" })}
              className="mt-6 w-full rounded-2xl bg-primary py-3 text-sm font-semibold text-white"
            >
              Go to sign in
            </button>
          </>
        )}
        {state === "failed" && (
          <>
            <XCircle className="h-12 w-12 text-destructive mx-auto" />
            <h2 className="mt-4 text-lg font-bold">Payment Failed</h2>
            <p className="mt-2 text-sm text-muted-foreground">{message}</p>
            <button
              onClick={() => navigate({ to: "/onboarding" })}
              className="mt-6 w-full rounded-2xl bg-primary py-3 text-sm font-semibold text-white"
            >
              Try again
            </button>
          </>
        )}
      </div>
    </div>
  );
}
