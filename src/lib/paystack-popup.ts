/**
 * Paystack Popup v2 helper.
 *
 * CDN: https://js.paystack.co/v2/popup.js
 * API: new Popup(config) then popup.open()
 * Callbacks: callback (success), onClose (cancelled)
 * Falls back to hosted authorization_url if popup fails.
 */

export type PaystackTx = { reference: string; status?: string };

type PopupConfig = {
  key: string;
  email: string;
  amount: number;
  currency: string;
  ref: string;
  channels: string[];
  metadata?: Record<string, unknown>;
  callback: (tx: PaystackTx) => void;
  onClose: () => void;
};

type PopupInstance = {
  open: () => void;
};

type PopupConstructor = new (config: PopupConfig) => PopupInstance;

declare global {
  interface Window {
    Popup?: PopupConstructor;
  }
}

export function loadPaystackInline(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("Not in browser."));
  if (window.Popup) return Promise.resolve();

  const existing = document.querySelector<HTMLScriptElement>('script[src*="js.paystack.co"]');
  if (existing) return waitForPopup();

  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://js.paystack.co/v2/popup.js";
    s.async = true;
    s.onload = () => waitForPopup().then(resolve, reject);
    s.onerror = () => reject(new Error("Failed to load payment provider."));
    document.head.appendChild(s);
  });
}

function waitForPopup(timeoutMs = 8000): Promise<void> {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const tick = () => {
      if (window.Popup) { resolve(); return; }
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
  if (!window.Popup) {
    if (opts.authorizationUrl) {
      window.location.assign(opts.authorizationUrl);
      return;
    }
    opts.onError("Payment provider not loaded. Please try again.");
    return;
  }

  try {
    const popup = new window.Popup({
      key: opts.publicKey,
      email: opts.email,
      amount: opts.amount,
      currency: "GHS",
      ref: opts.reference,
      channels: ["card", "mobile_money"],
      metadata: opts.metadata,
      callback: function(tx) {
        opts.onSuccess({ reference: tx?.reference || opts.reference, status: tx?.status });
      },
      onClose: function() {
        opts.onCancel();
      },
    });
    popup.open();
  } catch (err) {
    if (opts.authorizationUrl) {
      window.location.assign(opts.authorizationUrl);
      return;
    }
    opts.onError(err instanceof Error ? err.message : "Payment popup failed.");
  }
}
