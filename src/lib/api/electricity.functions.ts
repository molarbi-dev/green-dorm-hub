import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSupabaseAdmin } from "../supabase.server";
import { sendBulkSms } from "../mnotify.server";

export const logElectricityTopup = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      studentId: z.string().min(1),
      meterNo: z.string().min(1),
      amount: z.number().positive(),
      confirmation: z.string().min(1), // pasted confirmation SMS
    }),
  )
  .handler(async ({ data }) => {
    const db = getSupabaseAdmin();

    // Fetch the student who bought
    const { data: student, error: stuErr } = await db
      .from("students")
      .select("id, full_name, room_no")
      .eq("id", data.studentId)
      .single();
    if (stuErr) throw new Error(stuErr.message);

    // Fetch all students on the same meter to broadcast to
    const { data: meterStudents, error: msErr } = await db
      .from("students")
      .select("id, full_name, phone")
      .eq("meter_no", data.meterNo);
    if (msErr) throw new Error(msErr.message);

    // Fetch settings for sender ID
    const { data: settings } = await db
      .from("settings")
      .select("sms_sender_id")
      .eq("id", 1)
      .maybeSingle();

    const broadcastMsg =
      `SME Hostels Meter ${data.meterNo}: ${student.full_name} (${student.room_no ?? "TBA"}) ` +
      `topped up GHS ${data.amount.toFixed(2)} of prepaid electricity. ` +
      `Confirmation: ${data.confirmation.slice(0, 80)}`;

    const phones = meterStudents.map((s) => s.phone).filter(Boolean);
    let smsStatus: "sent" | "failed" = "sent";

    if (phones.length > 0) {
      const result = await sendBulkSms(phones, broadcastMsg, settings?.sms_sender_id);
      if (!result.success) smsStatus = "failed";
    }

    // Log it
    const { data: log, error: logErr } = await db
      .from("electricity_logs")
      .insert({
        student_id: data.studentId,
        meter_no: data.meterNo,
        amount: data.amount,
        confirmation: data.confirmation,
        broadcast_sms: broadcastMsg,
        sms_status: smsStatus,
      })
      .select()
      .single();

    if (logErr) throw new Error(logErr.message);
    return { log, broadcastedTo: phones.length, smsStatus };
  });

export const getElectricityLogs = createServerFn({ method: "GET" })
  .inputValidator(z.object({ meterNo: z.string().optional(), studentId: z.string().optional() }))
  .handler(async ({ data }) => {
    const db = getSupabaseAdmin();
    let query = db
      .from("electricity_logs")
      .select("*, students(full_name, room_no)")
      .order("logged_at", { ascending: false });

    if (data.meterNo) query = query.eq("meter_no", data.meterNo);
    if (data.studentId) query = query.eq("student_id", data.studentId);

    const { data: logs, error } = await query;
    if (error) throw new Error(error.message);
    return logs;
  });
