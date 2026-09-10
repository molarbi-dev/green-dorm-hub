-- SME Hostels — Initial Schema
-- Run this entire script in the Supabase SQL editor (Project → SQL Editor → New query → paste → Run).

-- ── Extensions ────────────────────────────────────────────────────────────────
create extension if not exists "pgcrypto";

-- ── Meters ────────────────────────────────────────────────────────────────────
create table if not exists meters (
  no          text primary key,
  notice      text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ── Rooms ─────────────────────────────────────────────────────────────────────
create table if not exists rooms (
  no          text primary key,
  capacity    int  not null default 4,
  status      text not null default 'available'
                check (status in ('available', 'full', 'maintenance')),
  meter_no    text references meters(no) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ── Students ──────────────────────────────────────────────────────────────────
create table if not exists students (
  id              text primary key,
  full_name       text not null,
  course          text not null default '',
  level           text not null default '100',
  room_no         text references rooms(no) on delete set null,
  meter_no        text references meters(no) on delete set null,
  phone           text not null default '',
  whatsapp        text not null default '',
  guardian_name   text not null default '',
  guardian_phone  text not null default '',
  username        text not null unique,
  password_hash   text not null default '',
  gender          text check (gender in ('male', 'female', 'other')),
  avatar_url      text,
  reg_status      text not null default 'unpaid'
                    check (reg_status in ('paid', 'partial', 'unpaid')),
  reg_paid        numeric not null default 0,
  hostel_paid     numeric not null default 0,
  check_status    text not null default 'out'
                    check (check_status in ('in', 'out')),
  last_check_in   timestamptz,
  last_check_out  timestamptz,
  policy_accepted boolean not null default false,
  accepted_at     timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ── Admins ────────────────────────────────────────────────────────────────────
create table if not exists admins (
  id            text primary key default gen_random_uuid()::text,
  username      text not null unique,
  password_hash text not null,
  full_name     text not null default '',
  created_at    timestamptz not null default now()
);

-- ── Payments ──────────────────────────────────────────────────────────────────
create table if not exists payments (
  id            text primary key,
  student_id    text not null references students(id) on delete cascade,
  type          text not null check (type in ('registration', 'hostel')),
  amount        numeric not null,
  method        text not null check (method in ('bank', 'momo', 'cash')),
  payment_date  timestamptz not null default now(),
  created_at    timestamptz not null default now()
);

-- ── Payment Receipts (student-uploaded proof) ─────────────────────────────────
create table if not exists payment_receipts (
  id           text primary key default gen_random_uuid()::text,
  student_id   text not null references students(id) on delete cascade,
  image_url    text not null,
  amount       numeric,
  description  text,
  status       text not null default 'pending'
                 check (status in ('pending', 'verified', 'rejected')),
  admin_note   text,
  reviewed_at  timestamptz,
  uploaded_at  timestamptz not null default now(),
  created_at   timestamptz not null default now()
);

-- ── SMS Messages ──────────────────────────────────────────────────────────────
create table if not exists sms_messages (
  id               text primary key default gen_random_uuid()::text,
  recipients       text not null,
  recipient_count  int  not null default 1,
  template         text,
  body             text not null,
  status           text not null default 'sent'
                     check (status in ('sent', 'delivered', 'failed')),
  sent_at          timestamptz not null default now(),
  created_at       timestamptz not null default now()
);

-- ── Electricity Top-up Logs ───────────────────────────────────────────────────
create table if not exists electricity_logs (
  id           text primary key default gen_random_uuid()::text,
  student_id   text not null references students(id) on delete cascade,
  meter_no     text not null references meters(no) on delete cascade,
  amount       numeric not null,
  confirmation text not null default '',
  sms_status   text not null default 'pending',
  logged_at    timestamptz not null default now()
);

-- ── Room Pricing (per capacity tier) ─────────────────────────────────────────
create table if not exists room_pricing (
  capacity    int     primary key,
  hostel_fee  numeric not null default 0,
  updated_at  timestamptz not null default now()
);

-- Seed default pricing tiers
insert into room_pricing (capacity, hostel_fee) values
  (2, 8000),
  (3, 8000),
  (4, 6000)
on conflict (capacity) do nothing;

-- ── Hostel Policies ───────────────────────────────────────────────────────────
create table if not exists policies (
  id         serial primary key,
  title      text    not null,
  body       text    not null,
  active     boolean not null default true,
  sort_order int     not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ── Internships ───────────────────────────────────────────────────────────────
create table if not exists internships (
  id               serial primary key,
  company_name     text    not null,
  industry         text,
  description      text,
  contact_person   text,
  contact_phone    text,
  contact_email    text,
  contact_whatsapp text,
  address          text,
  active           boolean not null default true,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- ── Settings (single row) ─────────────────────────────────────────────────────
create table if not exists settings (
  id                    int  primary key default 1 check (id = 1),
  hostel_name           text not null default 'SME Hostels',
  address               text not null default '',
  contact_phone         text not null default '',
  contact_whatsapp      text not null default '',
  email                 text not null default '',
  bank_name             text not null default '',
  account_name          text not null default '',
  account_number        text not null default '',
  branch                text not null default '',
  momo_number           text not null default '',
  momo_name             text not null default '',
  registration_fee      numeric not null default 200,
  hostel_fee            numeric not null default 4500,
  sms_sender_id         text not null default 'SMEHOSTEL',
  brand_primary         text not null default '#4CAF50',
  brand_soft            text not null default '#66BB6A',
  brand_mint            text not null default '#A5D6A7',
  emergency_security    text,
  emergency_medical     text,
  office_hours          text,
  whatsapp_channel_url  text,
  announcement          text,
  updated_at            timestamptz not null default now()
);

-- Seed the single settings row
insert into settings (id) values (1) on conflict (id) do nothing;

-- ── Indexes ───────────────────────────────────────────────────────────────────
create index if not exists idx_students_room_no       on students(room_no);
create index if not exists idx_students_meter_no      on students(meter_no);
create index if not exists idx_students_reg_status    on students(reg_status);
create index if not exists idx_students_check_status  on students(check_status);
create index if not exists idx_payments_student_id    on payments(student_id);
create index if not exists idx_payments_type          on payments(type);
create index if not exists idx_receipts_student_id    on payment_receipts(student_id);
create index if not exists idx_receipts_status        on payment_receipts(status);
create index if not exists idx_elec_logs_meter_no     on electricity_logs(meter_no);
create index if not exists idx_elec_logs_student_id   on electricity_logs(student_id);
create index if not exists idx_rooms_meter_no         on rooms(meter_no);
create index if not exists idx_internships_active     on internships(active);

-- ── Row Level Security ────────────────────────────────────────────────────────
-- All access goes through the service_role key (server-side only).
-- RLS is enabled — the service role bypasses it automatically.
alter table students          enable row level security;
alter table admins            enable row level security;
alter table rooms             enable row level security;
alter table meters            enable row level security;
alter table payments          enable row level security;
alter table payment_receipts  enable row level security;
alter table sms_messages      enable row level security;
alter table electricity_logs  enable row level security;
alter table room_pricing      enable row level security;
alter table policies          enable row level security;
alter table internships       enable row level security;
alter table settings          enable row level security;

-- ── updated_at trigger ────────────────────────────────────────────────────────
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace trigger trg_students_updated_at
  before update on students for each row execute function set_updated_at();
create or replace trigger trg_rooms_updated_at
  before update on rooms for each row execute function set_updated_at();
create or replace trigger trg_meters_updated_at
  before update on meters for each row execute function set_updated_at();
create or replace trigger trg_settings_updated_at
  before update on settings for each row execute function set_updated_at();
create or replace trigger trg_policies_updated_at
  before update on policies for each row execute function set_updated_at();
create or replace trigger trg_internships_updated_at
  before update on internships for each row execute function set_updated_at();
create or replace trigger trg_room_pricing_updated_at
  before update on room_pricing for each row execute function set_updated_at();
