import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSupabaseAdmin } from "../supabase.server";

const PaymentSchema = z.object({
  id: z.string().min(1),
  student_id: z.string().min(1),
  type: z.enum(["registration", "hostel"]),
  amount: z.number().positive(),
  method: z.enum(["bank", "momo", "cash"]),
  payment_date: z.string().datetime().optional(),
});

export const getPayments = createServerFn({ method: "GET" })
  .inputValidator(z.object({ studentId: z.string().optional() }))
  .handler(async ({ data }) => {
    const db = getSupabaseAdmin();
    let query = db.from("payments").select("*").order("payment_date", { ascending: false });

    if (data.studentId) {
      query = query.eq("student_id", data.studentId);
    }

    const { data: payments, error } = await query;
    if (error) throw new Error(error.message);
    return payments;
  });

export const recordPayment = createServerFn({ method: "POST" })
  .inputValidator(PaymentSchema)
  .handler(async ({ data }) => {
    const db = getSupabaseAdmin();

    const payment = {
      ...data,
      payment_date: data.payment_date ?? new Date().toISOString(),
    };

    // Insert payment
    const { data: inserted, error: payErr } = await db
      .from("payments")
      .insert(payment)
      .select()
      .single();

    if (payErr) throw new Error(payErr.message);

    // Update student's paid amount and status
    const { data: student, error: stuErr } = await db
      .from("students")
      .select("reg_paid, hostel_paid")
      .eq("id", data.student_id)
      .single();

    if (stuErr) throw new Error(stuErr.message);

    // Get settings for fee totals
    const { data: settings, error: setErr } = await db
      .from("settings")
      .select("registration_fee, hostel_fee")
      .eq("id", 1)
      .maybeSingle();

    if (setErr) throw new Error(setErr.message);
    if (!settings) throw new Error("System settings not configured. Please complete setup before recording payments.");

    if (data.type === "registration") {
      const newPaid = (student.reg_paid ?? 0) + data.amount;
      const regStatus =
        newPaid >= settings.registration_fee
          ? "paid"
          : newPaid > 0
            ? "partial"
            : "unpaid";

      await db
        .from("students")
        .update({
          reg_paid: newPaid,
          reg_status: regStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", data.student_id);
    } else {
      const newPaid = (student.hostel_paid ?? 0) + data.amount;
      await db
        .from("students")
        .update({
          hostel_paid: newPaid,
          updated_at: new Date().toISOString(),
        })
        .eq("id", data.student_id);
    }

    return inserted;
  });
