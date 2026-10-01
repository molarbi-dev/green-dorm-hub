/**
 * Paystack Inline v2 helper.
 *
 * Script:  https://js.paystack.co/v2/inline.js
 * Global:  window.PaystackPop  (constructor)
 *
 * Primary flow (server-initialized):
 *   1. Backend calls POST /transaction/initialize → returns access_code
 *   2. Frontend calls loadPaystackInline() to ensure script is ready
 *   3. Frontend calls new PaystackPop()
 *   4. popup.resumeTransaction(accessCode, { onSuccess, onCancel, onError })
 *
 * Fallback:
 *   If resumeTransaction is unavailable, redirect to authorizationUrl.
 *
 * Removed: Popup, popup.js, callback, onClose (all v1 / wrong-script artifacts).
 */

export type PaystackTx = { reference: string; status?: string };

// Verified against alexasomba/paystack-inline TypeScript wrapper
// and Paystack v2 inline.js runtime behaviour.
interface PaystackPopInstance {
  resumeTransaction(
    accessCode: string,
    callbacks?: {
      onSuccess?: (tx: PaystackTx) => void;
      onCancel?: () => void;
      onError?: (err: { message?: string } | string) => void;
    },
  ): void;
}

interface PaystackPopConstructor {
  new (): PaystackPopInstance;
}

declare global {
  interface Window {
    PaystackPop?: PaystackPopConstructor;
  }
}

// ── Load ──────────────────────────────────────────────────────────────────────

export function loadPaystackInline(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("loadPaystackInline must be called in the browser."));
  }

  // Already loaded
  if (window.PaystackPop) return Promise.resolve();

  // Script tag already injected — wait for it
  if (document.querySelector('script[src*="js.paystack.co/v2/inline.js"]')) {
    return waitForPaystackPop();
  }

  return new Promise(function (resolve, reject) {
    var script = document.createElement("script");
    script.src = "https://js.paystack.co/v2/inline.js";
    script.async = true;
    script.onload = function () {
      waitForPaystackPop().then(resolve, reject);
    };
    script.onerror = function () {
      reject(new Error("Failed to load Paystack. Check your internet connection."));
    };
    document.head.appendChild(script);
  });
}

function waitForPaystackPop(timeoutMs?: number): Promise<void> {
  var limit = timeoutMs !== undefined ? timeoutMs : 8000;
  return new Promise(function (resolve, reject) {
    var start = Date.now();
    function tick() {
      if (window.PaystackPop) { resolve(); return; }
      if (Date.now() - start > limit) {
        reject(new Error("Paystack did not finish loading. Please try again."));
        return;
      }
      window.setTimeout(tick, 50);
    }
    tick();
  });
}

// ── Start checkout ────────────────────────────────────────────────────────────

export function startPaystackCheckout(opts: {
  publicKey: string;       // kept in signature for API compatibility, not used with resumeTransaction
  email: string;           // kept for API compatibility
  amount: number;          // kept for API compatibility
  reference: string;
  accessCode?: string;
  authorizationUrl?: string;
  metadata?: Record<string, unknown>;
  onSuccess: (tx: PaystackTx) => void;
  onCancel: () => void;
  onError: (message: string) => void;
}): void {

  // Primary: resumeTransaction with server-issued access code
  if (opts.accessCode && window.PaystackPop) {
    try {
      var popup = new window.PaystackPop();
      popup.resumeTransaction(opts.accessCode, {
        onSuccess: function (tx) {
          opts.onSuccess({
            reference: (tx && tx.reference) ? tx.reference : opts.reference,
            status: (tx && tx.status) ? tx.status : "success",
          });
        },
        onCancel: function () {
          opts.onCancel();
        },
        onError: function (err) {
          var message = typeof err === "string"
            ? err
            : (err && err.message ? err.message : "Payment failed.");
          opts.onError(message);
        },
      });
      return;
    } catch (err) {
      console.warn("[paystack] resumeTransaction threw, falling back to hosted checkout:", err);
    }
  }

  // Fallback: hosted checkout page
  if (opts.authorizationUrl) {
    window.location.assign(opts.authorizationUrl);
    return;
  }

  opts.onError("Could not open payment. Please try again.");
}
