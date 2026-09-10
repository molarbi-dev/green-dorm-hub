import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSupabaseAdmin } from "../supabase.server";
import { hashPassword, verifyPassword } from "../crypto.server";
import { getEnv } from "../env.server";
import { sendSms } from "../mnotify.server";
// ── Admin login ───────────────────────────────────────────────────────────────

export const loginAdmin = createServerFn({ method: "POST" })
  .inputValidator(z.object({ username: z.string().min(1), password: z.string().min(1) }))
  .handler(async ({ data }) => {
    const db = getSupabaseAdmin();
    const { data: admin } = await db
      .from("admins")
      .select("id, username, password_hash, full_name")
      .eq("username", data.username)
      .maybeSingle();

    if (!admin) throw new Error("Invalid username or password.");
    const valid = await verifyPassword(data.password, admin.password_hash);
    if (!valid) throw new Error("Invalid username or password.");

    return { id: admin.id, username: admin.username, fullName: admin.full_name };
  });

// ── Student login ─────────────────────────────────────────────────────────────

export const loginStudent = createServerFn({ method: "POST" })
  .inputValidator(z.object({ username: z.string().min(1), password: z.string().min(1) }))
  .handler(async ({ data }) => {
    const db = getSupabaseAdmin();
    const { data: student } = await db
      .from("students")
      .select("id, full_name, username, password_hash")
      .eq("username", data.username)
      .maybeSingle();

    if (!student) throw new Error("Invalid username or password.");
    const hash = student.password_hash ?? "";
    if (!hash) throw new Error("Account not fully set up. Please contact management.");
    const valid = await verifyPassword(data.password, hash);
    if (!valid) throw new Error("Invalid username or password.");

    return { id: student.id, fullName: student.full_name };
  });

// ── Create first admin (only works when no admins exist yet) ──────────────────

export const createFirstAdmin = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      username: z.string().min(3),
      password: z.string().min(6),
      fullName: z.string().min(1),
      setupKey: z.string().min(1),
    }),
  )
  .handler(async ({ data }) => {
    const setupKey = getEnv().ADMIN_SETUP_KEY;
    if (!setupKey || data.setupKey !== setupKey) {
      throw new Error("Invalid setup key.");
    }

    const db = getSupabaseAdmin();

    // Only allow if no admins exist yet
    const { count, error: countErr } = await db
      .from("admins")
      .select("id", { count: "exact", head: true });

    if (countErr) throw new Error(`Database error during setup: ${countErr.message}`);

    if ((count ?? 0) > 0) {
      throw new Error("An admin account already exists. Use the admin panel to add more.");
    }

    const hash = await hashPassword(data.password);

    const { data: admin, error } = await db
      .from("admins")
      .insert({ username: data.username, password_hash: hash, full_name: data.fullName })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return { id: admin.id, username: admin.username };
  });

// ── Check if any admin exists ─────────────────────────────────────────────────

export const checkAdminExists = createServerFn({ method: "GET" })
  .handler(async () => {
    const db = getSupabaseAdmin();
    const { count } = await db
      .from("admins")
      .select("id", { count: "exact", head: true });
    return { exists: (count ?? 0) > 0 };
  });

// ── Register student (hashes password server-side) ────────────────────────────

export const registerStudent = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      id: z.string().min(1),
      full_name: z.string().min(1),
      phone: z.string().min(1),
      whatsapp: z.string(),
      course: z.string(),
      level: z.string(),
      room_no: z.string().nullable(),
      meter_no: z.string().nullable(),
      guardian_phone: z.string(),
      guardian_name: z.string().optional(),
      username: z.string().min(1),
      password: z.string().min(6),
      accepted_at: z.string(),
      avatar_url: z.string().url().optional(),
      gender: z.enum(["male", "female", "other"]).optional(),
    }),
  )
  .handler(async ({ data }) => {
    const db = getSupabaseAdmin();

    // Check username not already taken
    const { data: existing } = await db
      .from("students")
      .select("id")
      .eq("username", data.username)
      .maybeSingle();
    if (existing) throw new Error("Username already taken. Choose a different one.");

    const hash = await hashPassword(data.password);

    const { data: student, error } = await db
      .from("students")
      .insert({
        id: data.id,
        full_name: data.full_name,
        phone: data.phone,
        whatsapp: data.whatsapp,
        course: data.course,
        level: data.level,
        room_no: data.room_no,
        meter_no: data.meter_no,
        guardian_name: data.guardian_name ?? "",
        guardian_phone: data.guardian_phone,
        username: data.username,
        password_hash: hash,
        reg_status: "unpaid",
        reg_paid: 0,
        hostel_paid: 0,
        check_status: "out",
        policy_accepted: true,
        accepted_at: data.accepted_at,
        avatar_url: data.avatar_url ?? null,
        gender: data.gender ?? null,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    // Send welcome SMS synchronously so it completes before the response
    try {
      const welcomeMsg =
        `Welcome to SME Hostels, ${data.full_name.split(" ")[0]}! ` +
        `Your account is created. Student ID: ${student.id}. ` +
        `Room: ${data.room_no ?? "TBA"}. ` +
        `Pay your registration fee to management to activate your account. ` +
        `– SME Hostels`;
      await sendSms({ to: data.phone, message: welcomeMsg });
    } catch (smsErr) {
      // Log but don't fail — account is already created
      console.error("Welcome SMS failed:", smsErr);
    }

    return { id: student.id, full_name: student.full_name };
  });

// ── Admin: reset a student's password ────────────────────────────────────────

export const resetStudentPassword = createServerFn({ method: "POST" })
  .inputValidator(z.object({ studentId: z.string().min(1), newPassword: z.string().min(6) }))
  .handler(async ({ data }) => {
    const db = getSupabaseAdmin();
    const hash = await hashPassword(data.newPassword);
    const { error } = await db
      .from("students")
      .update({ password_hash: hash, updated_at: new Date().toISOString() })
      .eq("id", data.studentId);
    if (error) throw new Error(error.message);
    return { success: true };
  });
