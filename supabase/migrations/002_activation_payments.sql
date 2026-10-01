-- SME Hostels — Activation Payment (GHS 80 via Paystack)
-- Run after 001_initial_schema.sql

-- ── 1. Clean existing test data ───────────────────────────────────────────────
-- Safe to run: cascades handle child rows via ON DELETE CASCADE
delete from electricity_logs;
delete from payment_receipts;
delete from payments;
delete from students;

-- ── 2. Add activation_status to students ─────────────────────────────────────
alter table students
  add column if not exists activation_status text not null default 'unpaid'
    check (activation_status in ('unpaid', 'pending', 'active'));

-- ── 3. Activation payments table ─────────────────────────────────────────────
-- One row per payment attempt. Reference is server-generated, never from client.
-- Amount stored in pesewas (GHS 80 = 8000) so no float arithmetic.
create table if not exists activation_payments (
  id               text primary key default gen_random_uuid()::text,
  student_id       text not null references students(id) on delete cascade,
  reference        text not null unique,      -- ACT-<student_id_short>-<timestamp>
  amount_pesewas   int  not null,             -- 8000 = GHS 80, from server config only
  currency         text not null default 'GHS',
  status           text not null default 'pending'
                     check (status in ('pending', 'success', 'failed', 'abandoned')),
  provider         text not null default 'paystack',
  paystack_txn_id  text,                      -- data.id from Paystack verify response
  channel          text,                      -- mobile_money, card, etc.
  paid_at          timestamptz,
  created_at       timestamptz not null default now()
);

-- ── 4. Webhook idempotency table ─────────────────────────────────────────────
-- Insert event_key before processing. If it already exists, skip — prevents
-- double-settle on Paystack webhook retries.
-- Key format: "charge.success:<paystack_txn_id>"
create table if not exists webhook_events (
  event_key    text primary key,
  received_at  timestamptz not null default now()
);

-- ── 5. Settle activation payment (atomic, idempotent) ────────────────────────
create or replace function public.settle_activation_payment(
  p_reference      text,
  p_paystack_txn_id text,
  p_amount_pesewas int,
  p_channel        text,
  p_paid_at        timestamptz
)
returns text   -- 'settled' | 'duplicate' | 'amount_mismatch' | 'not_found'
language plpgsql
security definer
set search_path = public
as $$
declare
  v_payment activation_payments%rowtype;
begin
  -- Lock the payment row
  select * into v_payment
  from activation_payments
  where reference = p_reference
  for update;

  if not found then
    return 'not_found';
  end if;

  -- Already settled — idempotent, safe to return success
  if v_payment.status = 'success' then
    return 'duplicate';
  end if;

  -- Amount must match what we recorded server-side
  if v_payment.amount_pesewas <> p_amount_pesewas then
    return 'amount_mismatch';
  end if;

  -- Settle payment
  update activation_payments
  set
    status          = 'success',
    paystack_txn_id = p_paystack_txn_id,
    channel         = p_channel,
    paid_at         = p_paid_at
  where id = v_payment.id;

  -- Activate student
  update students
  set
    activation_status = 'active',
    updated_at        = now()
  where id = v_payment.student_id;

  return 'settled';
end;
$$;

revoke all on function public.settle_activation_payment(text, text, int, text, timestamptz)
  from public, anon, authenticated;
grant execute on function public.settle_activation_payment(text, text, int, text, timestamptz)
  to service_role;

-- ── 6. Indexes ────────────────────────────────────────────────────────────────
create index if not exists idx_activation_payments_student_id
  on activation_payments(student_id);

create index if not exists idx_activation_payments_status
  on activation_payments(status);

create index if not exists idx_students_activation_status
  on students(activation_status);

-- ── 7. RLS ────────────────────────────────────────────────────────────────────
alter table activation_payments enable row level security;
alter table webhook_events       enable row level security;

revoke all on activation_payments from public, anon, authenticated;
revoke all on webhook_events       from public, anon, authenticated;

grant all on activation_payments to service_role;
grant all on webhook_events       to service_role;
