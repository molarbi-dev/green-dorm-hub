import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSupabaseAdmin } from "../supabase.server";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface WifiPackage {
  id: string;
  name: string;
  description: string | null;
  price: number;
  duration_hours: number;
  bandwidth_limit_mbps: number;
  data_limit_gb: number | null;
  max_devices: number;
  is_active: boolean;
  created_at: string;
}

export interface WifiSubscription {
  id: string;
  wifi_account_id: string;
  package_id: string;
  status: "pending" | "active" | "expired" | "cancelled" | "suspended";
  starts_at: string | null;
  expires_at: string | null;
  price_paid: number;
  created_at: string;
  // joined
  student_name: string | null;
  student_id: string | null;
  room_no: string | null;
  package_name: string | null;
  max_devices: number;
}

export interface WifiPayment {
  id: string;
  student_id: string;
  subscription_id: string | null;
  amount: number;
  reference: string;
  provider: string;
  status: string;
  created_at: string;
  verified_at: string | null;
  // joined
  student_name: string | null;
  room_no: string | null;
  package_name: string | null;
}

export interface WifiAccount {
  id: string;
  student_id: string;
  username: string;
  max_devices: number;
  is_active: boolean;
  created_at: string;
  // joined
  student_name: string | null;
  room_no: string | null;
  // computed
  active_subscription: string | null;
  expires_at: string | null;
}

// ── Packages ──────────────────────────────────────────────────────────────────

const PackageInput = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  price: z.number().min(0),
  duration_hours: z.number().int().min(1),
  bandwidth_limit_mbps: z.number().min(0.1),
  data_limit_gb: z.number().min(0.1).nullable().optional(),
  is_active: z.boolean().optional(),
  max_devices: z.number().int().min(1).max(10).optional(),
});

export const getWifiPackages = createServerFn({ method: "GET" }).handler(async (): Promise<WifiPackage[]> => {
  const db = getSupabaseAdmin();
  const { data, error } = await db
    .from("wifi_packages")
    .select("*")
    .order("price", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as WifiPackage[];
});

export const createWifiPackage = createServerFn({ method: "POST" })
  .inputValidator(PackageInput)
  .handler(async ({ data }): Promise<WifiPackage> => {
    const db = getSupabaseAdmin();
    const { data: pkg, error } = await db
      .from("wifi_packages")
      .insert({ ...data, is_active: data.is_active ?? true })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return pkg as WifiPackage;
  });

export const updateWifiPackage = createServerFn({ method: "POST" })
  .inputValidator(z.object({ id: z.string(), patch: PackageInput.partial() }))
  .handler(async ({ data }): Promise<WifiPackage> => {
    const db = getSupabaseAdmin();
    const { data: pkg, error } = await db
      .from("wifi_packages")
      .update({ ...data.patch, updated_at: new Date().toISOString() })
      .eq("id", data.id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return pkg as WifiPackage;
  });

export const deleteWifiPackage = createServerFn({ method: "POST" })
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    const db = getSupabaseAdmin();
    const { error } = await db.from("wifi_packages").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { success: true };
  });

// ── Subscriptions ─────────────────────────────────────────────────────────────

export const getWifiSubscriptions = createServerFn({ method: "GET" })
  .inputValidator(z.object({ status: z.string().optional() }))
  .handler(async ({ data }): Promise<WifiSubscription[]> => {
    const db = getSupabaseAdmin();
    let q = db
      .from("subscriptions")
      .select(`
        id, wifi_account_id, package_id, status, starts_at, expires_at, price_paid, created_at,
        wifi_accounts ( student_id, students ( id, full_name, room_no ) ),
        wifi_packages ( name, max_devices )
      `)
      .order("created_at", { ascending: false });

    if (data.status && data.status !== "all") {
      q = q.eq("status", data.status);
    }

    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);

    return (rows ?? []).map((row: any) => ({
      id: row.id,
      wifi_account_id: row.wifi_account_id,
      package_id: row.package_id,
      status: row.status,
      starts_at: row.starts_at,
      expires_at: row.expires_at,
      price_paid: row.price_paid,
      created_at: row.created_at,
      student_name: row.wifi_accounts?.students?.full_name ?? null,
      student_id: row.wifi_accounts?.students?.id ?? null,
      room_no: row.wifi_accounts?.students?.room_no ?? null,
      package_name: row.wifi_packages?.name ?? null,
      max_devices: row.wifi_packages?.max_devices ?? 1,
    }));
  });

// ── Payments ──────────────────────────────────────────────────────────────────

export const getWifiPayments = createServerFn({ method: "GET" })
  .inputValidator(z.object({ status: z.string().optional() }))
  .handler(async ({ data }): Promise<WifiPayment[]> => {
    const db = getSupabaseAdmin();
    let q = db
      .from("payments")
      .select(`
        id, student_id, subscription_id, amount, reference, provider, status, created_at, verified_at,
        students ( full_name, room_no ),
        subscriptions ( wifi_packages ( name ) )
      `)
      .eq("type", "wifi")
      .order("created_at", { ascending: false });

    if (data.status && data.status !== "all") {
      q = q.eq("status", data.status);
    }

    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);

    return (rows ?? []).map((row: any) => ({
      id: row.id,
      student_id: row.student_id,
      subscription_id: row.subscription_id,
      amount: row.amount,
      reference: row.reference,
      provider: row.provider,
      status: row.status,
      created_at: row.created_at,
      verified_at: row.verified_at,
      student_name: row.students?.full_name ?? null,
      room_no: row.students?.room_no ?? null,
      package_name: row.subscriptions?.wifi_packages?.name ?? null,
    }));
  });

// ── Accounts ──────────────────────────────────────────────────────────────────

export const getWifiAccounts = createServerFn({ method: "GET" }).handler(
  async (): Promise<WifiAccount[]> => {
    const db = getSupabaseAdmin();
    const { data: accounts, error } = await db
      .from("wifi_accounts")
      .select(`
        id, student_id, username, max_devices, is_active, created_at,
        students ( full_name, room_no ),
        subscriptions ( status, expires_at, wifi_packages ( name ) )
      `)
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);

    return (accounts ?? []).map((row: any) => {
      const subs: any[] = row.subscriptions ?? [];
      const active = subs.find((s: any) => s.status === "active");
      return {
        id: row.id,
        student_id: row.student_id,
        username: row.username,
        max_devices: row.max_devices,
        is_active: row.is_active,
        created_at: row.created_at,
        student_name: row.students?.full_name ?? null,
        room_no: row.students?.room_no ?? null,
        active_subscription: active?.wifi_packages?.name ?? null,
        expires_at: active?.expires_at ?? null,
      };
    });
  },
);

export const setWifiAccountActive = createServerFn({ method: "POST" })
  .inputValidator(z.object({ id: z.string(), is_active: z.boolean() }))
  .handler(async ({ data }) => {
    const db = getSupabaseAdmin();
    const { error } = await db
      .from("wifi_accounts")
      .update({ is_active: data.is_active, updated_at: new Date().toISOString() })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { success: true };
  });

// ── Student's own Wi-Fi info (for student portal) ─────────────────────────────

export const getStudentWifiInfo = createServerFn({ method: "GET" })
  .inputValidator(z.object({ student_id: z.string() }))
  .handler(async ({ data }) => {
    const db = getSupabaseAdmin();

    // Get wifi account
    const { data: account } = await db
      .from("wifi_accounts")
      .select("id, username, is_active, max_devices")
      .eq("student_id", data.student_id)
      .maybeSingle();

    if (!account) return { account: null, subscription: null };

    // Get active subscription
    const { data: sub } = await db
      .from("subscriptions")
      .select("id, status, starts_at, expires_at, price_paid, wifi_packages(name, duration_hours)")
      .eq("wifi_account_id", account.id)
      .eq("status", "active")
      .order("starts_at", { ascending: false })
      .maybeSingle();

    return { account, subscription: sub };
  });
