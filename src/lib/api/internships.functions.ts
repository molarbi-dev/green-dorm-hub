import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSupabaseAdmin } from "../supabase.server";

const internshipSchema = z.object({
  company_name: z.string().min(1),
  industry: z.string().optional(),
  description: z.string().optional(),
  contact_person: z.string().optional(),
  contact_phone: z.string().optional(),
  contact_email: z.string().optional(),
  contact_whatsapp: z.string().optional(),
  address: z.string().optional(),
  active: z.boolean().optional(),
});

export const getInternships = createServerFn({ method: "GET" })
  .handler(async () => {
    const db = getSupabaseAdmin();
    const { data, error } = await db
      .from("internships")
      .select("*")
      .order("company_name", { ascending: true });
    if (error) throw new Error(error.message);
    return data;
  });

export const getActiveInternships = createServerFn({ method: "GET" })
  .handler(async () => {
    const db = getSupabaseAdmin();
    const { data, error } = await db
      .from("internships")
      .select("*")
      .eq("active", true)
      .order("company_name", { ascending: true });
    if (error) throw new Error(error.message);
    return data;
  });

export const createInternship = createServerFn({ method: "POST" })
  .inputValidator(internshipSchema)
  .handler(async ({ data }) => {
    const db = getSupabaseAdmin();
    const { data: row, error } = await db
      .from("internships")
      .insert({
        company_name: data.company_name,
        industry: data.industry ?? null,
        description: data.description ?? null,
        contact_person: data.contact_person ?? null,
        contact_phone: data.contact_phone ?? null,
        contact_email: data.contact_email ?? null,
        contact_whatsapp: data.contact_whatsapp ?? null,
        address: data.address ?? null,
        active: data.active ?? true,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const updateInternship = createServerFn({ method: "POST" })
  .inputValidator(z.object({ id: z.number(), patch: internshipSchema.partial() }))
  .handler(async ({ data }) => {
    const db = getSupabaseAdmin();
    const { data: row, error } = await db
      .from("internships")
      .update(data.patch)
      .eq("id", data.id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const deleteInternship = createServerFn({ method: "POST" })
  .inputValidator(z.object({ id: z.number() }))
  .handler(async ({ data }) => {
    const db = getSupabaseAdmin();
    const { error } = await db
      .from("internships")
      .delete()
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { success: true };
  });
