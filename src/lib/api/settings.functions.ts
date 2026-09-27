import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSupabaseAdmin } from "../supabase.server";

const SettingsPatchSchema = z.object({
  hostel_name: z.string().min(1).optional(),
  address: z.string().optional(),
  contact_phone: z.string().optional(),
  contact_whatsapp: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  bank_name: z.string().optional(),
  account_name: z.string().optional(),
  account_number: z.string().optional(),
  branch: z.string().optional(),
  momo_number: z.string().optional(),
  momo_name: z.string().optional(),
  registration_fee: z.number().positive().optional(),
  hostel_fee: z.number().positive().optional(),
  sms_sender_id: z.string().optional(),
  brand_primary: z.string().optional(),
  brand_soft: z.string().optional(),
  brand_mint: z.string().optional(),
  sms_package_name: z.string().optional(),
  sms_package_expires_at: z.string().optional(),
});

export const getSettings = createServerFn({ method: "GET" }).handler(async () => {
  const db = getSupabaseAdmin();
  const { data, error } = await db
    .from("settings")
    .select("*")
    .eq("id", 1)
    .single();

  if (error) throw new Error(error.message);
  return data;
});

export const updateSettings = createServerFn({ method: "POST" })
  .inputValidator(SettingsPatchSchema)
  .handler(async ({ data }) => {
    const db = getSupabaseAdmin();
    const { data: settings, error } = await db
      .from("settings")
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq("id", 1)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return settings;
  });
