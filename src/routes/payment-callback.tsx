import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

// Payment callback — Hubtel integration coming soon.
// This route receives the redirect after a payment attempt.
// For now it just redirects back to the portal.

export const Route = createFileRoute("/payment-callback")({
  head: () => ({ meta: [{ title: "Payment — SME Hostels" }] }),
  component: PaymentCallback,
});

function PaymentCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const t = setTimeout(() => navigate({ to: "/student-home" }), 1500);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="grid min-h-screen place-items-center bg-background px-4">
      <div className="w-full max-w-sm squircle bg-white p-8 text-center shadow-glass">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
        <div className="mt-4 text-sm text-muted-foreground">Redirecting…</div>
      </div>
    </div>
  );
}
