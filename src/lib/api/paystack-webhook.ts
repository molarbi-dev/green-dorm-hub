/**
 * POST /api/paystack/webhook
 *
 * Paystack sends charge.success (and other events) here.
 * This is the authoritative source of truth for activation.
 *
 * Security:
 *  1. Verify HMAC-SHA512 signature on raw body before parsing JSON.
 *  2. Insert event key into webhook_events first — if it exists, return 200 and stop.
 *  3. Verify amount and currency match server config before settling.
 *  4. Always return 200 quickly — Paystack retries on non-200.
 */

import { getSupabaseAdmin } from "../supabase.server";
import { getEnv } from "../env.server";
import { sendSms } from "../mnotify.server";

const ACTIVATION_FEE_PESEWAS = 8000;

async function isValidSignature(raw: string, sig: string, secret: string): Promise<boolean> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-512" },
    false,
    ["sign"],
  );
  const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(raw));
  const hex = [...new Uint8Array(mac)].map((b) => b.toString(16).padStart(2, "0")).join("");
  if (hex.length !== sig.length) return false;
  let diff = 0;
  for (let i = 0; i < hex.length; i++) diff |= hex.charCodeAt(i) ^ sig.charCodeAt(i);
  return diff === 0;
}

export async function handlePaystackWebhook(request: Request): Promise<Response> {
  const env = getEnv();
  const ok = new Response("ok", { status: 200 });

  if (!env.PAYSTACK_SECRET_KEY) {
    console.error("[paystack-webhook] PAYSTACK_SECRET_KEY not set");
    return ok;
  }

  const rawBody = await request.text();
  const signature = request.headers.get("x-paystack-signature") ?? "";

  const valid = await isValidSignature(rawBody, signature, env.PAYSTACK_SECRET_KEY);
  if (!valid) {
    console.warn("[paystack-webhook] invalid signature — rejected");
    return new Response("unauthorized", { status: 401 });
  }

  let payload: {
    event: string;
    data: {
      id: number;
      reference: string;
      status: string;
      amount: number;
      currency: string;
      channel: string;
      paid_at: string;
      metadata?: { student_id?: string; purpose?: string };
    };
  };

  try {
    payload = JSON.parse(rawBody);
  } catch {
    console.error("[paystack-webhook] invalid JSON");
    return ok;
  }

  if (payload.event !== "charge.success") return ok;

  const tx = payload.data;
  const eventKey = `charge.success:${tx.id}`;
  const db = getSupabaseAdmin();

  // Idempotency — skip if already processed
  const { error: dupErr } = await db.from("webhook_events").insert({ event_key: eventKey });
  if (dupErr) {
    console.log(`[paystack-webhook] duplicate event ${eventKey} — skipped`);
    return ok;
  }

  if (tx.metadata?.purpose !== "activation") return ok;

  if (tx.amount !== ACTIVATION_FEE_PESEWAS || tx.currency !== "GHS") {
    console.error(`[paystack-webhook] amount mismatch: ${tx.amount} ${tx.currency}`);
    return ok;
  }

  const { data: result } = await db.rpc("settle_activation_payment", {
    p_reference: tx.reference,
    p_paystack_txn_id: String(tx.id),
    p_amount_pesewas: tx.amount,
    p_channel: tx.channel,
    p_paid_at: tx.paid_at,
  });

  console.log(`[paystack-webhook] settle result: ${result} for ${tx.reference}`);

  if (result === "settled") {
    try {
      const { data: payment } = await db
        .from("activation_payments")
        .select("student_id")
        .eq("reference", tx.reference)
        .single();

      if (payment?.student_id) {
        const { data: student } = await db
          .from("students")
          .select("full_name, phone")
          .eq("id", payment.student_id)
          .single();

        if (student?.phone) {
          await sendSms({
            to: student.phone,
            message:
              `Congratulations ${student.full_name.split(" ")[0]}! ` +
              `Your SME Hostels account is now activated. ` +
              `Sign in at https://sme-hostel.site`,
          });
        }
      }
    } catch (smsErr) {
      console.error("[paystack-webhook] SMS failed", smsErr);
    }
  }

  return ok;
}
