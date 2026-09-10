import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSupabaseAdmin } from "../supabase.server";

export const getPolicies = createServerFn({ method: "GET" }).handler(async () => {
  const db = getSupabaseAdmin();
  const { data, error } = await db
    .from("policies")
    .select("*")
    .eq("active", true)
    .order("sort_order");
  if (error) throw new Error(error.message);
  return data;
});

export const getAllPoliciesAdmin = createServerFn({ method: "GET" }).handler(async () => {
  const db = getSupabaseAdmin();
  const { data, error } = await db
    .from("policies")
    .select("*")
    .order("sort_order");
  if (error) throw new Error(error.message);
  return data;
});

export const createPolicy = createServerFn({ method: "POST" })
  .inputValidator(z.object({ title: z.string().min(1), body: z.string().min(1), sort_order: z.number().optional() }))
  .handler(async ({ data }) => {
    const db = getSupabaseAdmin();
    const { data: max } = await db.from("policies").select("sort_order").order("sort_order", { ascending: false }).limit(1).maybeSingle();
    const { data: policy, error } = await db.from("policies")
      .insert({ title: data.title, body: data.body, sort_order: data.sort_order ?? ((max?.sort_order ?? 0) + 1) })
      .select().single();
    if (error) throw new Error(error.message);
    return policy;
  });

export const updatePolicy = createServerFn({ method: "POST" })
  .inputValidator(z.object({ id: z.number(), title: z.string().min(1).optional(), body: z.string().min(1).optional(), active: z.boolean().optional(), sort_order: z.number().optional() }))
  .handler(async ({ data }) => {
    const db = getSupabaseAdmin();
    const { id, ...patch } = data;
    const { data: policy, error } = await db.from("policies")
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq("id", id).select().single();
    if (error) throw new Error(error.message);
    return policy;
  });

export const deletePolicy = createServerFn({ method: "POST" })
  .inputValidator(z.object({ id: z.number() }))
  .handler(async ({ data }) => {
    const db = getSupabaseAdmin();
    const { error } = await db.from("policies").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { success: true };
  });
