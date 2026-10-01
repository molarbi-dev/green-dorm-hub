/**
 * Activation payment functions — GHS 80 via Paystack inline popup.
 *
 * Amount is ALWAYS read from server config. Never trust a client-supplied amount.
 *
 * Flow:
 *  1. getPaystackPublicKey        — returns pk_test_/pk_live_ to browser
 *  2. initializeActivationPayment — creates DB row + reference, browser opens Paystack popup
 *  3. verifyActivationPayment     — called after popup closes, verifies with Paystack, settles
 *  4. /api/paystack/webhook       — backup: settles if browser callback is missed
 */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSupabaseAdmin } from "../supabase.server";
import { getEnv } from "../env.server";
import { sendSms } from "../mnotify.server";

// GHS 80 in pesewas — change here only, never accept from client
const ACTIVATION_FEE_PESEWAS = 8000;

function makeReference(studentId: string): string {
  const short = studentId.replace(/[^A-Za-z0-9]/g, "").slice(0, 8).toUpperCase();
  return `ACT-${short}-${Date.now()}`;
}

// ── 1. Get public key (safe to send to browser) ───────────────────────────────

export const getPaystackPublicKey = createServerFn({ method: "GET" })
  .handler(async (): Promise<{ publicKey: string }> => {
    const key = getEnv().PAYSTACK_PUBLIC_KEY;
    if (!key) throw new Error("Payment provider not configured.");
    return { publicKey: key };
  });

// ── 2. Initialize — create DB row, return reference to browser ────────────────

export const initializeActivationPayment = createServerFn({ method: "POST" })
  .validator(z.object({ student_id: z.string().min(1) }))
  .handler(async ({ data }): Promise<{
    reference: string;
    email: string;
    amount: number;
  }> => {
    const db = getSupabaseAdmin();

    const { data: student, error: stuErr } = await db
      .from("students")
      .select("id, full_name, phone, username, activation_status")
      .eq("id", data.student_id)
      .single();

    if (stuErr || !student) throw new Error("Student not found.");
    if (student.activation_status === "active") throw new Error("Account is already activated.");

    // Reuse existing pending payment — handles tab close + retry
    const { data: existing } = await db
      .from("activation_payments")
      .select("reference")
      .eq("student_id", data.student_id)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    let reference: string;

    if (existing) {
      reference = existing.reference;
    } else {
      reference = makeReference(student.id);

      const { error: insErr } = await db.from("activation_payments").insert({
        student_id: data.student_id,
        reference,
        amount_pesewas: ACTIVATION_FEE_PESEWAS,
        status: "pending",
        provider: "paystack",
      });
      if (insErr) throw new Error("Failed to create payment record.");

      await db
        .from("students")
        .update({ activation_status: "pending", updated_at: new Date().toISOString() })
        .eq("id", data.student_id);
    }

    // Paystack requires an email — generate placeholder
    const email = `${student.username}@students.sme-hostel.site`;

    return { reference, email, amount: ACTIVATION_FEE_PESEWAS };
  });

// ── 3. Verify — called by UI after popup closes ───────────────────────────────

export const verifyActivationPayment = createServerFn({ method: "POST" })
  .validator(z.object({
    reference: z.string().min(1),
    student_id: z.string().min(1),
  }))
  .handler(async ({ data }): Promise<{
    status: "active" | "pending" | "failed";
    message: string;
  }> => {
    const env = getEnv();
    if (!env.PAYSTACK_SECRET_KEY) throw new Error("Payment provider not configured.");

    const db = getSupabaseAdmin();

    // Check DB first — webhook may have already settled
    const { data: payment } = await db
      .from("activation_payments")
      .select("status, student_id")
      .eq("reference", data.reference)
      .eq("student_id", data.student_id)
      .maybeSingle();

    if (!payment) return { status: "failed", message: "Payment record not found." };
    if (payment.status === "success") return { status: "active", message: "Account activated." };
    if (payment.status === "failed") return { status: "failed", message: "Payment failed." };
    if (payment.status === "abandoned") return { status: "failed", message: "Payment was abandoned." };

    // Still pending — verify with Paystack API
    const res = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(data.reference)}`,
      { headers: { Authorization: `Bearer ${env.PAYSTACK_SECRET_KEY}` } },
    );

    const json = await res.json() as {
      status: boolean;
      data?: {
        status: string;
        amount: number;
        currency: string;
        id: number;
        channel: string;
        paid_at: string;
      };
    };

    if (!res.ok || !json.status || !json.data) {
      return { status: "pending", message: "Payment not confirmed yet. Check back shortly." };
    }

    const tx = json.data;

    if (tx.status !== "success") {
      if (tx.status === "failed" || tx.status === "abandoned") {
        await db
          .from("activation_payments")
          .update({ status: tx.status as "failed" | "abandoned" })
          .eq("reference", data.reference);
        await db
          .from("students")
          .update({ activation_status: "unpaid", updated_at: new Date().toISOString() })
          .eq("id", data.student_id);
        return { status: "failed", message: "Payment failed. Please try again." };
      }
      return { status: "pending", message: "Payment not confirmed yet. Check back shortly." };
    }

    // Verify amount and currency match server config — never trust client
    if (tx.amount !== ACTIVATION_FEE_PESEWAS || tx.currency !== "GHS") {
      console.error(`[activation] amount mismatch: got ${tx.amount} ${tx.currency}`);
      return { status: "failed", message: "Payment amount mismatch. Contact management." };
    }

    // Settle atomically
    const { data: result } = await db.rpc("settle_activation_payment", {
      p_reference: data.reference,
      p_paystack_txn_id: String(tx.id),
      p_amount_pesewas: tx.amount,
      p_channel: tx.channel,
      p_paid_at: tx.paid_at,
    });

    if (result === "settled" || result === "duplicate") {
      try {
        const { data: student } = await db
          .from("students")
          .select("full_name, phone")
          .eq("id", data.student_id)
          .single();
        if (student?.phone) {
          await sendSms({
            to: student.phone,
            message:
              `Congratulations ${student.full_name.split(" ")[0]}! ` +
              `Your SME Hostels account is now activated. ` +
              `You can now access all features at https://sme-hostel.site`,
          });
        }
      } catch (_) {}
      return { status: "active", message: "Account activated successfully." };
    }

    return { status: "pending", message: "Payment not confirmed yet. Check back shortly." };
  });
