import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSupabaseAdmin } from "../supabase.server";

const transportSchema = z.object({
  agency_name: z.string().min(1),
  route: z.string().optional(),
  description: z.string().optional(),
  contact_person: z.string().optional(),
  contact_phone: z.string().optional(),
  contact_whatsapp: z.string().optional(),
  pickup_location: z.string().optional(),
  destination: z.string().optional(),
  departure_time: z.string().optional(),
  price: z.string().optional(),
  logo_url: z.string().url().optional().or(z.literal("")).transform(v => v === "" ? null : v),
  active: z.boolean().optional(),
});

export const getTransportAgencies = createServerFn({ method: "GET" })
  .handler(async () => {
    const db = getSupabaseAdmin();
    const { data, error } = await db
      .from("transportation_agencies")
      .select("*")
      .order("agency_name", { ascending: true });
    if (error) throw new Error(error.message);
    return data;
  });

export const getActiveTransportAgencies = createServerFn({ method: "GET" })
  .handler(async () => {
    const db = getSupabaseAdmin();
    const { data, error } = await db
      .from("transportation_agencies")
      .select("*")
      .eq("active", true)
      .order("agency_name", { ascending: true });
    if (error) throw new Error(error.message);
    return data;
  });

export const createTransportAgency = createServerFn({ method: "POST" })
  .inputValidator(transportSchema)
  .handler(async ({ data }) => {
    const db = getSupabaseAdmin();
    const { data: row, error } = await db
      .from("transportation_agencies")
      .insert({
        agency_name: data.agency_name,
        route: data.route ?? null,
        description: data.description ?? null,
        contact_person: data.contact_person ?? null,
        contact_phone: data.contact_phone ?? null,
        contact_whatsapp: data.contact_whatsapp ?? null,
        pickup_location: data.pickup_location ?? null,
        destination: data.destination ?? null,
        departure_time: data.departure_time ?? null,
        price: data.price ?? null,
        logo_url: data.logo_url ?? null,
        active: data.active ?? true,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const updateTransportAgency = createServerFn({ method: "POST" })
  .inputValidator(z.object({ id: z.number(), patch: transportSchema.partial() }))
  .handler(async ({ data }) => {
    const db = getSupabaseAdmin();
    const { data: row, error } = await db
      .from("transportation_agencies")
      .update(data.patch)
      .eq("id", data.id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const deleteTransportAgency = createServerFn({ method: "POST" })
  .inputValidator(z.object({ id: z.number() }))
  .handler(async ({ data }) => {
    const db = getSupabaseAdmin();
    const { error } = await db
      .from("transportation_agencies")
      .delete()
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { success: true };
  });
