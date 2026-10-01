/**
 * Paystack Inline helper.
 *
 * The CDN still runs v1 validation in some builds ("Attribute callback must be a valid function").
 * We always pass real functions as both `callback`/`onSuccess` and `onClose`/`onCancel`,
 * prefer resumeTransaction after a server initialize, and fall back to hosted checkout.
 */

export type PaystackTx = { reference: string; status?: string };

type PaystackPopupInstance = {
  newTransaction?: (opts: Record<string, unknown>) => void;
  resumeTransaction?: (accessCode: string, cbs?: Record<string, unknown>) => void;
};

type PaystackPopGlobal = (new () => PaystackPopupInstance) & {
  setup?: (opts: Record<string, unknown>) => { openIframe: () => void };
};

declare global {
  interface Window {
    PaystackPop?: PaystackPopGlobal;
  }
}

export function loadPaystackInline(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("Not in browser."));
  if (window.PaystackPop) return Promise.resolve();

  const existing = document.querySelector<HTMLScriptElement>('script[src*="js.paystack.co"]');
  if (existing) return waitForPaystack();

  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://js.paystack.co/v2/inline.js";
    s.async = true;
    s.onload = () => waitForPaystack().then(resolve, reject);
    s.onerror = () => reject(new Error("Failed to load payment provider."));
    document.head.appendChild(s);
  });
}

function waitForPaystack(timeoutMs = 8000): Promise<void> {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const tick = () => {
      if (window.PaystackPop) {
        resolve();
        return;
      }
      if (Date.now() - start > timeoutMs) {
        reject(new Error("Payment provider did not finish loading."));
        return;
      }
      window.setTimeout(tick, 50);
    };
    tick();
  });
}

export function startPaystackCheckout(opts: {
  publicKey: string;
  email: string;
  amount: number;
  reference: string;
  accessCode?: string;
  authorizationUrl?: string;
  metadata?: Record<string, unknown>;
  onSuccess: (tx: PaystackTx) => void;
  onCancel: () => void;
  onError: (message: string) => void;
}): void {
  const onSuccess = (tx: PaystackTx | undefined) => {
    opts.onSuccess({
      reference: tx?.reference || opts.reference,
      status: tx?.status ?? "success",
    });
  };
  const onCancel = () => opts.onCancel();
  const onError = (err: { message?: string } | string) => {
    const message = typeof err === "string" ? err : (err?.message ?? "Payment failed to load.");
    opts.onError(message);
  };

  const callbacks = {
    callback: onSuccess,
    onSuccess,
    onClose: onCancel,
    onCancel,
    onError,
  };

  const Pop = window.PaystackPop;

  if (typeof Pop === "function") {
    try {
      const popup = new Pop();

      if (opts.accessCode && typeof popup.resumeTransaction === "function") {
        popup.resumeTransaction(opts.accessCode, callbacks);
        return;
      }

      if (typeof popup.newTransaction === "function") {
        popup.newTransaction({
          key: opts.publicKey,
          email: opts.email,
          amount: Number(opts.amount),
          currency: "GHS",
          ref: opts.reference,
          reference: opts.reference,
          channels: ["card", "mobile_money"],
          metadata: opts.metadata,
          ...callbacks,
        });
        return;
      }
    } catch (err) {
      if (opts.authorizationUrl) {
        window.location.assign(opts.authorizationUrl);
        return;
      }
      onError(err instanceof Error ? err.message : "Payment popup failed.");
      return;
    }
  }

  if (Pop && typeof Pop.setup === "function") {
    const handler = Pop.setup({
      key: opts.publicKey,
      email: opts.email,
      amount: Number(opts.amount),
      currency: "GHS",
      ref: opts.reference,
      channels: ["card", "mobile_money"],
      metadata: opts.metadata,
      callback: onSuccess,
      onClose: onCancel,
    });
    handler.openIframe();
    return;
  }

  if (opts.authorizationUrl) {
    window.location.assign(opts.authorizationUrl);
    return;
  }

  throw new Error("Payment popup could not start. Please try again.");
}
