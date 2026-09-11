// Auto-generated Supabase types — regenerate with:
//   npx supabase gen types typescript --project-id <your-project-id> > src/lib/database.types.ts
//
// For now this is a hand-written version matching the hostel schema.

export type RegStatus = "paid" | "partial" | "unpaid";
export type CheckStatus = "in" | "out";
export type PaymentMethod = "bank" | "momo" | "cash";
export type PaymentType = "registration" | "hostel";
export type SmsStatus = "sent" | "delivered" | "failed";
export type RoomStatus = "available" | "full" | "maintenance";

export interface Database {
  public: {
    Tables: {
      students: {
        Row: StudentRow;
        Insert: Omit<StudentRow, "created_at" | "updated_at">;
        Update: Partial<Omit<StudentRow, "id" | "created_at">>;
      };
      rooms: {
        Row: RoomRow;
        Insert: Omit<RoomRow, "created_at" | "updated_at">;
        Update: Partial<Omit<RoomRow, "no" | "created_at">>;
      };
      meters: {
        Row: MeterRow;
        Insert: Omit<MeterRow, "created_at" | "updated_at">;
        Update: Partial<Omit<MeterRow, "no" | "created_at">>;
      };
      payments: {
        Row: PaymentRow;
        Insert: Omit<PaymentRow, "created_at">;
        Update: Partial<Omit<PaymentRow, "id" | "created_at">>;
      };
      sms_messages: {
        Row: SmsMessageRow;
        Insert: Omit<SmsMessageRow, "id" | "created_at">;
        Update: Partial<Omit<SmsMessageRow, "id" | "created_at">>;
      };
      settings: {
        Row: SettingsRow;
        Insert: Omit<SettingsRow, "updated_at">;
        Update: Partial<Omit<SettingsRow, "id">>;
      };
      internships: {
        Row: InternshipRow;
        Insert: Omit<InternshipRow, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<InternshipRow, "id" | "created_at">>;
      };
      admins: {
        Row: AdminRow;
        Insert: Omit<AdminRow, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<AdminRow, "id" | "created_at">>;
      };
    };
  };
}
export interface StudentRow {
  id: string;               // e.g. SME-2024-001
  full_name: string;
  course: string;
  level: string;
  room_no: string | null;
  meter_no: string | null;
  phone: string;
  whatsapp: string;
  guardian_name: string;
  guardian_phone: string;
  username: string;
  password_hash: string;
  gender: "male" | "female" | "other" | null;
  avatar_url: string | null;
  reg_status: RegStatus;
  reg_paid: number;
  hostel_paid: number;
  check_status: CheckStatus;
  last_check_in: string | null;   // ISO timestamp
  last_check_out: string | null;
  policy_accepted: boolean;
  accepted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface RoomRow {
  no: string;               // primary key, e.g. A-101
  capacity: number;
  status: RoomStatus;
  meter_no: string | null;
  created_at: string;
  updated_at: string;
}

export interface MeterRow {
  no: string;               // primary key, e.g. M-001
  notice: string | null;
  created_at: string;
  updated_at: string;
}

// Rooms are linked to meters via the rooms.meter_no FK — no separate junction table needed.

export interface PaymentRow {
  id: string;               // receipt number, e.g. R-1001
  student_id: string;
  type: PaymentType;
  amount: number;
  method: PaymentMethod;
  payment_date: string;     // ISO timestamp
  created_at: string;
}

export interface SmsMessageRow {
  id: string;
  recipients: string;
  recipient_count: number;
  template: string | null;
  body: string;
  status: SmsStatus;
  sent_at: string;
  created_at: string;
}

export interface SettingsRow {
  id: number;               // always 1 — single-row settings table
  hostel_name: string;
  address: string;
  contact_phone: string;
  contact_whatsapp: string;
  email: string;
  bank_name: string;
  account_name: string;
  account_number: string;
  branch: string;
  momo_number: string;
  momo_name: string;
  registration_fee: number;
  hostel_fee: number;
  sms_sender_id: string;
  brand_primary: string;
  brand_soft: string;
  brand_mint: string;
  emergency_security: string | null;
  emergency_medical: string | null;
  office_hours: string | null;
  whatsapp_channel_url: string | null;  // e.g. https://whatsapp.com/channel/...
  announcement: string | null;          // global notice shown to all students
  updated_at: string;
}

export interface InternshipRow {
  id: number;
  company_name: string;
  industry: string | null;
  description: string | null;
  contact_person: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  contact_whatsapp: string | null;
  address: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AdminRow {
  id: string;               // uuid
  username: string;
  password_hash: string;
  full_name: string;
  created_at: string;
  updated_at: string;
}
