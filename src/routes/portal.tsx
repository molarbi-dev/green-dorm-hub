import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useMemo, useState, useEffect, useRef } from "react";
import {
  Home, User, Wallet, MoreHorizontal, LogOut,
  CheckCircle2, XCircle, ArrowRight, Copy, Check,
  Zap, History, ChevronRight, Phone, MessageCircle, DoorOpen,
  Edit3, Save, X, ChevronDown, ChevronUp, AlertTriangle,
  Building2, Receipt, ShieldCheck, Upload, Loader2, Camera, ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import logo from "@/assets/logo.jpg";
import { fmtGHS, fmtTime, fmtDate, initials } from "@/lib/hostel-store";
import { PolicyGate } from "@/components/PolicyGate";
import {
  useStudent, useCheckIn, useCheckOut, useAcceptPolicy,
  useUpdateStudent, usePayments, useSettings,
  useMeters, useStudents,
  useElectricityLogs, useLogElectricityTopup,
  useStudentReceipts, useSubmitReceipt,
} from "@/lib/queries";

// ── ECG PowerApp launcher ─────────────────────────────────────────────────────
// Opens the ECG PowerApp with the meter number pre-filled where possible.
// Android: uses an intent:// URL so the OS routes directly into the installed app.
//   The meter number is passed as a query param; if the app isn't installed the
//   browser falls back to the Play Store via the intent fallback URL.
// iOS: opens the App Store listing directly (no published custom URL scheme).
// Desktop: opens the Play Store web page as a generic fallback.
function openEcgApp(meterNo: string) {
  const ua = navigator.userAgent;
  const isIos = /iphone|ipad|ipod/i.test(ua);
  const isAndroid = /android/i.test(ua);

  if (isAndroid) {
    // Android intent URL: tries to open the app; falls back to Play Store
    const intentUrl =
      `intent://topup?meter=${encodeURIComponent(meterNo)}` +
      `#Intent;` +
      `package=com.ecgmobile;` +
      `scheme=ecgpowerapp;` +
      `S.browser_fallback_url=${encodeURIComponent(
        "https://play.google.com/store/apps/details?id=com.ecgmobile",
      )};` +
      `end`;
    window.location.href = intentUrl;
  } else if (isIos) {
    window.open("https://apps.apple.com/app/ecg-powerapp/id1398352884", "_blank");
  } else {
    window.open("https://play.google.com/store/apps/details?id=com.ecgmobile", "_blank");
  }
}

export const Route = createFileRoute("/portal")({
  head: () => ({ meta: [{ title: "Student Portal — SME Hostels" }] }),
  component: Portal,
});

type Tab = "home" | "profile" | "fees" | "more";
type SubPage = null | "meter" | "history";

// Current student ID is stored in sessionStorage after login
function getCurrentStudentId(): string {
  if (typeof window === "undefined") return "";
  return sessionStorage.getItem("sme_student_id") ?? "";
}

function Portal() {
  const nav = useNavigate();
  const [tab, setTab] = useState<Tab>("home");
  const [sub, setSub] = useState<SubPage>(null);
  const currentId = getCurrentStudentId();

  const { data: student, isLoading } = useStudent(currentId);
  const { data: settings } = useSettings();
  const acceptPolicyMut = useAcceptPolicy();

  // Redirect to login if no session — must be in useEffect, not render body
  useEffect(() => {
    if (!currentId) nav({ to: "/" });
  }, [currentId]);

  // If student was deleted from DB, clear session and redirect
  useEffect(() => {
    if (!isLoading && currentId && !student) {
      sessionStorage.removeItem("sme_student_id");
      localStorage.removeItem("sme_student_profile");
      nav({ to: "/" });
    }
  }, [isLoading, currentId, student]);

  // Students must be verified by admin before accessing the portal
  useEffect(() => {
    if (!isLoading && student && student.reg_status !== "paid") {
      nav({ to: "/student-home" });
    }
  }, [isLoading, student]);

  if (!currentId) return null;

  if (isLoading) {
    return <div className="grid min-h-screen place-items-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;
  }

  if (!student && !isLoading && currentId) {
    return (
      <div className="grid min-h-screen place-items-center bg-background px-4">
        <div className="w-full max-w-sm text-center">
          <div className="text-4xl font-bold text-destructive">!</div>
          <div className="mt-2 text-lg font-semibold">Portal unavailable</div>
          <div className="mt-1 text-sm text-muted-foreground">Could not connect to the server. Please check your internet connection and try again.</div>
          <button onClick={() => window.location.reload()} className="mt-4 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground">
            Retry
          </button>
          <button onClick={() => { sessionStorage.removeItem("sme_student_id"); window.location.href = "/"; }}
            className="mt-2 block w-full rounded-full border border-border py-2.5 text-sm text-muted-foreground">
            Back to sign in
          </button>
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="grid min-h-screen place-items-center p-6 text-center">
        <div>
          <p className="text-muted-foreground">No student session.</p>
          <button onClick={() => nav({ to: "/" })} className="mt-3 rounded-full bg-primary px-4 py-2 text-sm text-primary-foreground">Sign in</button>
        </div>
      </div>
    );
  }

  if (!student.policy_accepted) {
    return (
      <PolicyGate
        studentName={student.full_name}
        onAccept={() => acceptPolicyMut.mutate(student.id)}
      />
    );
  }

  function switchUser() {
    sessionStorage.removeItem("sme_student_id");
    nav({ to: "/" });
  }

  const switchBtn = (
    <button onClick={switchUser} className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-md hover:bg-white/30">
      <LogOut className="h-3.5 w-3.5" /> Switch
    </button>
  );

  return (
    <div className="min-h-screen bg-background pb-32">
      <div className="bg-gradient-primary px-4 pt-6 pb-8 text-white shadow-glass">
        <div className="mx-auto max-w-3xl">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <img src={logo} alt="" className="h-11 w-11 squircle bg-white p-1.5 object-contain" />
              <div>
                <div className="text-xs uppercase tracking-wider opacity-90">{settings?.hostel_name ?? "SME Hostels"}</div>
                <div className="text-lg font-bold leading-tight">Hello, {student.full_name.split(" ")[0]}</div>
                <div className="text-xs opacity-90">{student.course} · {student.id}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setTab("profile")} className="h-10 w-10 overflow-hidden rounded-full bg-white/20 backdrop-blur-md hover:bg-white/30 flex items-center justify-center text-sm font-bold">
                {(student as any).avatar_url
                  ? <img src={(student as any).avatar_url} alt="" className="h-full w-full object-cover" />
                  : initials(student.full_name)}
              </button>
              {switchBtn}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto -mt-4 max-w-3xl px-4">
        <div key={tab + (sub ?? "")} className="animate-fade-in">
          {tab === "home" && <HomeTab studentId={currentId} onNavTab={setTab} onSub={setSub} />}
          {tab === "profile" && <ProfileTab studentId={currentId} />}
          {tab === "fees" && <FeesTab studentId={currentId} />}
          {tab === "more" && !sub && <MoreTab onSub={setSub} />}
          {tab === "more" && sub === "meter" && <MeterTab studentId={currentId} onBack={() => setSub(null)} />}
          {tab === "more" && sub === "history" && <HistoryTab studentId={currentId} onBack={() => setSub(null)} />}
        </div>
      </div>

      <BottomNav tab={tab} onChange={(t) => { setTab(t); setSub(null); }} />
    </div>
  );
}

/* =========================  HOME  ========================= */

function HomeTab({ studentId, onNavTab, onSub }: { studentId: string; onNavTab: (t: Tab) => void; onSub: (s: SubPage) => void }) {
  const { data: s } = useStudent(studentId);
  const { data: settings } = useSettings();
  const { data: allStudents = [] } = useStudents();
  const checkIn = useCheckIn();
  const checkOut = useCheckOut();
  const [confirm, setConfirm] = useState<"in" | "out" | null>(null);

  if (!s || !settings) return <div className="py-10 text-center text-sm text-muted-foreground">Loading…</div>;

  const regFee = settings.registration_fee;
  const regPct = Math.min(100, (s.reg_paid / regFee) * 100);
  const meterRoomies = allStudents.filter((x: any) => x.meter_no === s.meter_no).length;

  return (
    <div className="space-y-4">
      <div className="squircle bg-white p-5 shadow-soft animate-slide-up">
        <div className="flex flex-wrap items-center gap-2">
          <Badge color={s.check_status === "in" ? "primary" : "muted"} icon={s.check_status === "in" ? CheckCircle2 : XCircle}>
            {s.check_status === "in" ? "Checked in" : "Checked out"}
          </Badge>
          <Badge color={s.reg_status === "paid" ? "primary" : s.reg_status === "partial" ? "amber" : "destructive"}>
            Reg: {s.reg_status}
          </Badge>
          <div className="ml-auto text-xs text-muted-foreground">Last: {fmtTime(s.last_check_in ? new Date(s.last_check_in).getTime() : undefined)}</div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button onClick={() => setConfirm("in")} disabled={s.check_status === "in" || checkIn.isPending}
            className="rounded-2xl bg-primary py-3 text-sm font-semibold text-primary-foreground shadow-soft disabled:opacity-50 hover:opacity-95">Check In</button>
          <button onClick={() => setConfirm("out")} disabled={s.check_status === "out" || checkOut.isPending}
            className="rounded-2xl border border-border bg-white py-3 text-sm font-semibold disabled:opacity-50 hover:bg-muted/40">Check Out</button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard icon={DoorOpen} label="Room" value={s.room_no ?? "—"} />
        <StatCard icon={Wallet} label="Reg. Fee" value={s.reg_status === "paid" ? "Paid" : "Pending"} />
        <StatCard icon={Zap} label="Meter" value={s.meter_no ?? "—"} />
        <StatCard icon={CheckCircle2} label="Status" value={s.check_status === "in" ? "In" : "Out"} />
      </div>

      <FeeProgressCard title="Registration Fee" amount={s.reg_paid} total={regFee} pct={regPct} accent="blue" ctaLabel="View Details" onCta={() => onNavTab("fees")} />

      <div className="grid grid-cols-2 gap-3">
        <ActionCard icon={Wallet} label="Fees & Payments" onClick={() => onNavTab("fees")} />
        <ActionCard icon={Zap} label={`Meter Info (${meterRoomies} sharing)`} onClick={() => { onNavTab("more"); onSub("meter"); }} />
        <ActionCard icon={History} label="Check-In History" onClick={() => { onNavTab("more"); onSub("history"); }} />
      </div>

      <div className="squircle bg-white p-5 shadow-soft">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">Guardian Contact</div>
        <div className="mt-1.5 text-base font-semibold">{s.guardian_name}</div>
        <a href={`tel:${s.guardian_phone}`} className="mt-1 inline-flex items-center gap-1.5 text-sm text-primary">
          <Phone className="h-3.5 w-3.5" /> {s.guardian_phone}
        </a>
      </div>

      {confirm && (
        <ConfirmModal
          title={confirm === "in" ? "Confirm Check In" : "Confirm Check Out"}
          body={confirm === "in" ? "Mark yourself as currently in the hostel?" : "Mark yourself as currently out of the hostel?"}
          onCancel={() => setConfirm(null)}
          onConfirm={() => {
            if (confirm === "in") checkIn.mutate(s.id);
            else checkOut.mutate(s.id);
            setConfirm(null);
          }}
        />
      )}
    </div>
  );
}

/* =========================  PROFILE  ========================= */

function ProfileTab({ studentId }: { studentId: string }) {
  const { data: s } = useStudent(studentId);
  const updateStudent = useUpdateStudent();
  const [edit, setEdit] = useState(false);
  const [form, setForm] = useState({ phone: "", whatsapp: "", guardian_name: "", guardian_phone: "" });

  if (!s) return null;

  function startEdit() {
    setForm({ phone: s!.phone, whatsapp: s!.whatsapp, guardian_name: s!.guardian_name, guardian_phone: s!.guardian_phone });
    setEdit(true);
  }

  function save() {
    updateStudent.mutate({ id: s!.id, patch: form }, { onSuccess: () => setEdit(false) });
  }

  return (
    <div className="space-y-4">
      <div className="squircle bg-white p-6 text-center shadow-soft animate-slide-up">
        {(s as any).avatar_url ? (
          <img src={(s as any).avatar_url} alt={s.full_name}
            className="mx-auto h-20 w-20 rounded-full object-cover border-4 border-primary/20 shadow-soft" />
        ) : (
          <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-gradient-primary text-2xl font-bold text-white shadow-soft">
            {initials(s.full_name)}
          </div>
        )}
        <div className="mt-3 text-lg font-bold">{s.full_name}</div>
        <div className="text-xs text-muted-foreground">{s.id}</div>
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          <Badge color={s.reg_status === "paid" ? "primary" : s.reg_status === "partial" ? "amber" : "destructive"}>Reg: {s.reg_status}</Badge>
          <Badge color={s.check_status === "in" ? "primary" : "muted"}>{s.check_status === "in" ? "Checked in" : "Checked out"}</Badge>
          <Badge color={s.policy_accepted ? "primary" : "amber"} icon={ShieldCheck}>{s.policy_accepted ? "Policy accepted" : "Policy pending"}</Badge>
        </div>
      </div>

      <SectionCard title="Account Info">
        <InfoRow label="Full Name" value={s.full_name} />
        <InfoRow label="Student ID" value={s.id} />
        <InfoRow label="Course" value={s.course} />
        <InfoRow label="Level" value={s.level} />
        <InfoRow label="Room Number" value={s.room_no ?? "—"} />
      </SectionCard>

      <SectionCard title="Contact Details"
        right={!edit ? (
          <button onClick={startEdit} className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <Edit3 className="h-3 w-3" /> Edit
          </button>
        ) : (
          <div className="flex gap-2">
            <button onClick={() => setEdit(false)} className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs"><X className="h-3 w-3" /> Cancel</button>
            <button onClick={save} disabled={updateStudent.isPending} className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
              <Save className="h-3 w-3" /> Save
            </button>
          </div>
        )}
      >
        <EditableRow label="Phone Number" value={form.phone || s.phone} onChange={(v) => setForm({ ...form, phone: v })} edit={edit} />
        <EditableRow label="WhatsApp Number" value={form.whatsapp || s.whatsapp} onChange={(v) => setForm({ ...form, whatsapp: v })} edit={edit} />
        <EditableRow label="Guardian Name" value={form.guardian_name || s.guardian_name} onChange={(v) => setForm({ ...form, guardian_name: v })} edit={edit} />
        <EditableRow label="Guardian Phone" value={form.guardian_phone || s.guardian_phone} onChange={(v) => setForm({ ...form, guardian_phone: v })} edit={edit} />
      </SectionCard>
    </div>
  );
}

/* =========================  FEES  ========================= */

function FeesTab({ studentId }: { studentId: string }) {
  const { data: s } = useStudent(studentId);
  const { data: settings } = useSettings();
  const { data: payments = [] } = usePayments(studentId);

  if (!s || !settings) return null;

  const sorted = [...payments].sort((a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime());

  return (
    <div className="space-y-4">
      <FeeBreakdown title="Registration Fee" paid={s.reg_paid} total={settings.registration_fee} accent="blue" />

      <div className="squircle bg-white p-5 shadow-soft">
        <div className="mb-3 text-base font-bold">How to Pay</div>
        <PayAccordion title="Bank Transfer" icon={Building2}
          fields={[
            { label: "Bank Name", value: settings.bank_name },
            { label: "Account Name", value: settings.account_name },
            { label: "Account Number", value: settings.account_number },
            { label: "Branch", value: settings.branch },
          ]}
          reference={s.id}
        />
        <PayAccordion title="Mobile Money" icon={Phone}
          fields={[
            { label: "MoMo Number", value: settings.momo_number },
            { label: "Account Name", value: settings.momo_name },
          ]}
          reference={s.id}
        />
      </div>

      <SectionCard title="Payment History">
        {sorted.length === 0 && <div className="text-sm text-muted-foreground">No payments yet.</div>}
        <div className="divide-y divide-border">
          {sorted.map((p) => (
            <div key={p.id} className="flex items-center justify-between py-3">
              <div>
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Receipt className="h-4 w-4 text-primary" /> {p.id}
                </div>
                <div className="text-xs text-muted-foreground">{p.type === "registration" ? "Registration" : "Hostel"} · {fmtDate(new Date(p.payment_date).getTime())}</div>
              </div>
              <div className="text-sm font-semibold">{fmtGHS(p.amount)}</div>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Need Help?">
        <a href={`tel:${settings.contact_phone}`} className="flex items-center justify-between rounded-2xl bg-primary/5 px-4 py-3 text-sm font-medium text-primary">
          <span className="inline-flex items-center gap-2"><Phone className="h-4 w-4" /> Call Management</span>
          <span>{settings.contact_phone}</span>
        </a>
      </SectionCard>

      <ReceiptUploadSection studentId={studentId} />
    </div>
  );
}

function ReceiptUploadSection({ studentId }: { studentId: string }) {
  const { data: receipts = [] } = useStudentReceipts(studentId);
  const submitReceiptMut = useSubmitReceipt();
  const fileRef = useRef<HTMLInputElement>(null);

  const [uploading, setUploading] = useState(false);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("Registration fee");
  const [preview, setPreview] = useState<string | null>(null);
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [imgError, setImgError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/") && file.type !== "application/pdf") {
      setImgError("Please select an image file."); return;
    }
    if (file.size > 10 * 1024 * 1024) { setImgError("File must be under 10MB."); return; }
    setImgError(null);
    setPreview(URL.createObjectURL(file));
    setUploading(true);
    try {
      const { uploadToImgur } = await import("@/lib/imgur");
      const url = await uploadToImgur(file);
      setImgUrl(url);
    } catch (err) {
      setImgError(err instanceof Error ? err.message : "Upload failed.");
      setPreview(null);
    } finally {
      setUploading(false);
    }
  }

  function submit() {
    if (!imgUrl) return;
    submitReceiptMut.mutate(
      { student_id: studentId, image_url: imgUrl, amount: Number(amount) || undefined, description: description || undefined },
      {
        onSuccess: () => {
          setPreview(null); setImgUrl(null); setAmount(""); setShowForm(false); setImgError(null);
          if (fileRef.current) fileRef.current.value = "";
        },
      },
    );
  }

  const statusStyle = (s: string) => s === "verified" ? "bg-primary/10 text-primary" : s === "rejected" ? "bg-destructive/10 text-destructive" : "bg-amber-100 text-amber-700";

  return (
    <div className="squircle bg-white p-5 shadow-soft">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-base font-bold">Payment Receipts</div>
          <div className="text-xs text-muted-foreground">Upload proof of payment for management to verify</div>
        </div>
        <button onClick={() => setShowForm((v) => !v)}
          className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20">
          <Upload className="h-3.5 w-3.5" /> {showForm ? "Cancel" : "Upload receipt"}
        </button>
      </div>

      {showForm && (
        <div className="border-t border-border pt-4 space-y-3 mb-4">
          <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />

          {!preview ? (
            <button type="button" onClick={() => fileRef.current?.click()}
              className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-muted/30 py-5 text-sm text-muted-foreground hover:border-primary/40 hover:bg-primary/5 transition">
              <Camera className="h-5 w-5" /> Tap to take photo or select receipt image
            </button>
          ) : (
            <div className="flex items-center gap-3 rounded-xl bg-muted/30 p-3">
              <img src={preview} alt="" className="h-16 w-16 rounded-lg object-cover border border-border" />
              <div className="flex-1">
                {uploading && <div className="flex items-center gap-1.5 text-xs text-primary"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Uploading…</div>}
                {imgUrl && !uploading && <div className="text-xs text-primary font-medium flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5" /> Image ready</div>}
                {imgError && <div className="text-xs text-destructive">{imgError}</div>}
                <button onClick={() => { setPreview(null); setImgUrl(null); if (fileRef.current) fileRef.current.value = ""; }}
                  className="mt-1 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">Remove</button>
              </div>
            </div>
          )}
          {imgError && !preview && <div className="text-xs text-destructive">{imgError}</div>}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium">Amount paid (GHS)</label>
              <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="e.g. 100"
                className="w-full rounded-xl border border-border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium">Payment type</label>
              <select value={description} onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-xl border border-border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30">
                <option>Registration fee</option>
                <option>Hostel fee</option>
                <option>Other</option>
              </select>
            </div>
          </div>

          <button onClick={submit} disabled={!imgUrl || uploading || submitReceiptMut.isPending}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-primary py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50">
            {submitReceiptMut.isPending ? <><Loader2 className="h-4 w-4 animate-spin" /> Submitting…</> : "Submit receipt for review"}
          </button>
        </div>
      )}

      {receipts.length === 0 && !showForm && (
        <div className="text-sm text-muted-foreground">No receipts submitted yet.</div>
      )}

      {receipts.length > 0 && (
        <div className="space-y-3">
          {receipts.map((r: any) => (
            <div key={r.id} className="flex items-start gap-3 rounded-xl border border-border p-3">
              <img src={r.image_url} alt="Receipt" className="h-14 w-14 rounded-lg object-cover border border-border cursor-pointer"
                onClick={() => window.open(r.image_url, "_blank")} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium">{r.description ?? "Payment"}</span>
                  {r.amount && <span className="text-xs text-muted-foreground">GHS {Number(r.amount).toLocaleString()}</span>}
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${statusStyle(r.status)}`}>{r.status}</span>
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">{fmtDate(new Date(r.uploaded_at).getTime())}</div>
                {r.admin_note && <div className="mt-1 text-xs text-muted-foreground italic">Note: {r.admin_note}</div>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PayAccordion({ title, icon: Icon, fields, reference }: {
  title: string; icon: typeof Phone;
  fields: { label: string; value: string }[]; reference: string;
}) {
  const [open, setOpen] = useState(true);
  return (
    <div className="mb-3 squircle border border-border bg-white">
      <button onClick={() => setOpen(!open)} className="flex w-full items-center justify-between p-4">
        <div className="flex items-center gap-2 text-sm font-semibold"><Icon className="h-4 w-4 text-primary" /> {title}</div>
        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>
      {open && (
        <div className="space-y-2 px-4 pb-4">
          {fields.map((f) => <CopyRow key={f.label} label={f.label} value={f.value} />)}
          <div className="mt-3 flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-xs text-amber-800">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <div>Use <strong>{reference}</strong> as the payment reference so we can match your payment.</div>
          </div>
        </div>
      )}
    </div>
  );
}

function CopyRow({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-muted/40 px-3 py-2">
      <div>
        <div className="text-[11px] uppercase text-muted-foreground">{label}</div>
        <div className="text-sm font-semibold">{value}</div>
      </div>
      <button onClick={async () => { await navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 1500); toast.success("Copied"); }}
        className="grid h-9 w-9 place-items-center rounded-xl bg-white text-primary hover:bg-primary/10">
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      </button>
    </div>
  );
}

/* =========================  MORE / METER / HISTORY  ========================= */

function MoreTab({ onSub }: { onSub: (s: SubPage) => void }) {
  const { data: settings } = useSettings();
  return (
    <div className="space-y-3">
      <button onClick={() => onSub("history")} className="flex w-full items-center justify-between squircle bg-white p-5 shadow-soft hover:bg-muted/30">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary"><History className="h-5 w-5" /></div>
          <div className="text-left"><div className="text-sm font-semibold">Check-In History</div><div className="text-xs text-muted-foreground">All your check-ins & outs</div></div>
        </div>
        <ChevronRight className="h-5 w-5 text-muted-foreground" />
      </button>
      <button onClick={() => onSub("meter")} className="flex w-full items-center justify-between squircle bg-white p-5 shadow-soft hover:bg-muted/30">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-violet-100 text-violet-700"><Zap className="h-5 w-5" /></div>
          <div className="text-left"><div className="text-sm font-semibold">Meter Info</div><div className="text-xs text-muted-foreground">Rooms & students sharing</div></div>
        </div>
        <ChevronRight className="h-5 w-5 text-muted-foreground" />
      </button>
      <Link to="/contact" className="flex items-center justify-between squircle bg-white p-5 shadow-soft hover:bg-muted/30">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-sky-100 text-sky-700"><Phone className="h-5 w-5" /></div>
          <div className="text-left"><div className="text-sm font-semibold">Emergency & Contacts</div><div className="text-xs text-muted-foreground">Reach the hostel quickly</div></div>
        </div>
        <ChevronRight className="h-5 w-5 text-muted-foreground" />
      </Link>
      {settings && (
        <SectionCard title="Hostel Info">
          <InfoRow label="Hostel" value={settings.hostel_name} />
          <InfoRow label="Address" value={settings.address} />
          <InfoRow label="Phone" value={settings.contact_phone} />
          <InfoRow label="WhatsApp" value={settings.contact_whatsapp} />
        </SectionCard>
      )}
    </div>
  );
}

function MeterTab({ studentId, onBack }: { studentId: string; onBack: () => void }) {
  const { data: me } = useStudent(studentId);
  const { data: meters = [] } = useMeters();
  const { data: allStudents = [] } = useStudents();
  const { data: elecLogs = [] } = useElectricityLogs(me?.meter_no ?? undefined);
  const logTopup = useLogElectricityTopup();

  const [showTopupForm, setShowTopupForm] = useState(false);
  const [topupAmount, setTopupAmount] = useState("");
  const [topupConfirmation, setTopupConfirmation] = useState("");

  if (!me) return null;
  const meter = meters.find((m: any) => m.no === me.meter_no);
  const roommates = allStudents.filter((s: any) => s.meter_no === me.meter_no);

  if (!meter) return (
    <div className="space-y-4">
      <button onClick={onBack} className="text-sm text-primary">‹ Back</button>
      <div className="py-10 text-center text-sm text-muted-foreground">No meter assigned to your room yet. Contact management.</div>
    </div>
  );

  function submitTopup(e: React.FormEvent) {
    e.preventDefault();
    if (!me?.meter_no) return;
    logTopup.mutate(
      { studentId, meterNo: me.meter_no, amount: Number(topupAmount), confirmation: topupConfirmation },
      { onSuccess: () => { setShowTopupForm(false); setTopupAmount(""); setTopupConfirmation(""); } },
    );
  }

  return (
    <div className="space-y-4">
      <button onClick={onBack} className="text-sm text-primary">‹ Back</button>

      {/* Management notice — shown first if set, it's urgent */}
      {meter.notice && (
        <div className="flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600 mt-0.5" />
          <div>
            <div className="text-sm font-semibold text-amber-900">Management Notice</div>
            <div className="text-xs text-amber-800 mt-0.5">{meter.notice}</div>
          </div>
        </div>
      )}

      {/* ── Pay electricity bill via ECG PowerApp ── */}
      <div className="squircle overflow-hidden shadow-soft">
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/25">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="text-sm font-bold text-white">Pay Electricity Bill</div>
              <div className="text-xs text-white/80">Powered by ECG PowerApp</div>
            </div>
          </div>
        </div>

        <div className="bg-white px-5 py-4 space-y-3">
          {/* Meter number — copy before opening app */}
          <div className="flex items-center justify-between rounded-xl bg-amber-50 border border-amber-200 px-4 py-3">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-amber-700 font-semibold">Your Meter Number</div>
              <div className="text-xl font-bold text-amber-900 mt-0.5">{meter.no}</div>
            </div>
            <button
              onClick={async () => { await navigator.clipboard.writeText(meter.no); toast.success("Meter number copied"); }}
              className="grid h-9 w-9 place-items-center rounded-xl bg-white border border-amber-200 text-amber-700 hover:bg-amber-100 transition"
              title="Copy meter number"
            >
              <Copy className="h-4 w-4" />
            </button>
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed">
            Copy your meter number above, then open the <strong>ECG PowerApp</strong> to load prepaid units.
          </p>

          {/* Primary CTA */}
          <button
            onClick={() => openEcgApp(meter.no)}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 py-3.5 text-sm font-semibold text-white shadow-soft hover:opacity-90 active:scale-[.98] transition"
          >
            <ExternalLink className="h-4 w-4" />
            Open ECG PowerApp · {meter.no}
          </button>

          {/* Fallback links */}
          <div className="flex items-center justify-center gap-4 pt-0.5">
            <a href="https://play.google.com/store/apps/details?id=com.ecgmobile" target="_blank" rel="noopener noreferrer"
              className="text-xs text-muted-foreground underline-offset-2 hover:text-primary hover:underline">
              Android
            </a>
            <span className="text-muted-foreground text-xs">·</span>
            <a href="https://apps.apple.com/app/ecg-powerapp/id1398352884" target="_blank" rel="noopener noreferrer"
              className="text-xs text-muted-foreground underline-offset-2 hover:text-primary hover:underline">
              iOS
            </a>
            <span className="text-muted-foreground text-xs">·</span>
            <a href="tel:*226%23" className="text-xs text-muted-foreground underline-offset-2 hover:text-primary hover:underline">
              Dial *226#
            </a>
          </div>
        </div>
      </div>

      {/* ── Log top-up ── */}
      <div className="squircle bg-white p-5 shadow-soft">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-base font-bold">Log a Top-up</div>
            <div className="text-xs text-muted-foreground">Bought prepaid units? Log it — meter-mates get notified via SMS.</div>
          </div>
          <button onClick={() => setShowTopupForm((v) => !v)}
            className="rounded-full bg-violet-100 px-3 py-1.5 text-xs font-medium text-violet-700 hover:bg-violet-200">
            {showTopupForm ? "Cancel" : "+ Log top-up"}
          </button>
        </div>

        {showTopupForm && (
          <form onSubmit={submitTopup} className="mt-3 space-y-3 border-t border-border pt-3">
            <div>
              <label className="mb-1 block text-xs font-medium">Amount bought (GHS)</label>
              <input type="number" min="1" step="0.01" required value={topupAmount} onChange={(e) => setTopupAmount(e.target.value)}
                placeholder="e.g. 50.00"
                className="w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium">Confirmation SMS (paste it here)</label>
              <textarea required value={topupConfirmation} onChange={(e) => setTopupConfirmation(e.target.value)}
                placeholder="Paste the confirmation message you received after buying units…"
                rows={3}
                className="w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div className="rounded-xl bg-violet-50 p-3 text-xs text-violet-800">
              This will be broadcast to all {roommates.length} student{roommates.length !== 1 ? "s" : ""} on meter <strong>{meter.no}</strong> via SMS.
            </div>
            <button type="submit" disabled={logTopup.isPending}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-violet-600 py-3 text-sm font-semibold text-white disabled:opacity-50">
              {logTopup.isPending ? "Sending…" : `Notify ${roommates.length} meter-mates via SMS`}
            </button>
          </form>
        )}
      </div>

      {/* Top-up history for this meter */}
      <SectionCard title="Meter Top-up History">
        {elecLogs.length === 0 && <div className="text-sm text-muted-foreground">No top-ups logged yet.</div>}
        <div className="divide-y divide-border">
          {elecLogs.map((log: any) => (
            <div key={log.id} className="py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="grid h-8 w-8 place-items-center rounded-full bg-violet-100 text-violet-700 text-xs font-bold">
                    {initials(log.students?.full_name ?? "?")}
                  </div>
                  <div>
                    <div className="text-sm font-semibold">{log.students?.full_name ?? "Unknown"}</div>
                    <div className="text-xs text-muted-foreground">{log.students?.room_no} · {fmtTime(new Date(log.logged_at).getTime())}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-violet-700">GHS {Number(log.amount).toFixed(2)}</div>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${log.sms_status === "sent" ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"}`}>
                    SMS {log.sms_status}
                  </span>
                </div>
              </div>
              <div className="mt-1.5 rounded-xl bg-muted/40 px-3 py-2 text-xs text-muted-foreground line-clamp-2">{log.confirmation}</div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Rooms on this meter */}
      <SectionCard title="Rooms on this meter">
        <div className="flex flex-wrap gap-2">
          {(meter.rooms as string[]).map((r) => (
            <span key={r} className={`rounded-full px-3 py-1 text-xs font-medium ${r === me.room_no ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}>{r}</span>
          ))}
        </div>
      </SectionCard>

      {/* Meter-mates */}
      <SectionCard title={`Students sharing this meter (${roommates.length})`}>
        <div className="divide-y divide-border">
          {roommates.map((s: any) => (
            <div key={s.id} className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-primary text-xs font-bold text-white">{initials(s.full_name)}</div>
                <div>
                  <div className="text-sm font-medium">{s.full_name}</div>
                  <div className="text-xs text-muted-foreground">{s.id}</div>
                </div>
              </div>
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs">{s.room_no}</span>
            </div>
          ))}
          {roommates.length === 0 && <div className="text-sm text-muted-foreground">No other students on this meter yet.</div>}
        </div>
      </SectionCard>

    </div>
  );
}

function HistoryTab({ studentId, onBack }: { studentId: string; onBack: () => void }) {
  const { data: s } = useStudent(studentId);
  if (!s) return null;

  // Build log from last_check_in / last_check_out stored on the student row
  const log = useMemo(() => {
    const out: { in: number; out?: number }[] = [];
    if (s.last_check_in) out.push({ in: new Date(s.last_check_in).getTime(), out: s.last_check_out ? new Date(s.last_check_out).getTime() : undefined });
    return out;
  }, [s]);

  const month = new Date().getMonth();
  const thisMonth = log.filter((l) => new Date(l.in).getMonth() === month).length;

  return (
    <div className="space-y-4">
      <button onClick={onBack} className="text-sm text-primary">‹ Back</button>
      <div className="grid grid-cols-2 gap-3">
        <StatCard icon={History} label="Total Check-Ins" value={String(log.length)} />
        <StatCard icon={CheckCircle2} label="This Month" value={String(thisMonth)} />
      </div>
      <SectionCard title="Activity Log">
        {log.length === 0 && <div className="text-sm text-muted-foreground">No check-in history yet.</div>}
        <div className="divide-y divide-border">
          {log.map((l, i) => (
            <div key={i} className="flex items-center justify-between py-3">
              <div>
                <div className="text-sm font-medium">{fmtDate(l.in)}</div>
                <div className="text-xs text-muted-foreground">In {fmtTime(l.in)} · Out {l.out ? fmtTime(l.out) : "—"}</div>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-muted px-2 py-0.5 text-[10px]">{s.room_no}</span>
                <Badge color={l.out ? "muted" : "primary"}>{l.out ? "Completed" : "Active"}</Badge>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

/* =========================  SHARED UI  ========================= */

function BottomNav({ tab, onChange }: { tab: Tab; onChange: (t: Tab) => void }) {
  const tabs: { key: Tab; label: string; icon: typeof Home }[] = [
    { key: "home", label: "Home", icon: Home }, { key: "profile", label: "Profile", icon: User },
    { key: "fees", label: "Fees", icon: Wallet },
    { key: "more", label: "More", icon: MoreHorizontal },
  ];
  const idx = tabs.findIndex((t) => t.key === tab);
  return (
    <nav className="fixed bottom-3 left-1/2 z-30 -translate-x-1/2 safe-bottom">
      <div className="glass-strong relative flex items-center gap-1 rounded-full p-1.5">
        <div className="absolute top-1.5 bottom-1.5 rounded-full bg-gradient-primary shadow-soft transition-all duration-500"
          style={{ width: `calc((100% - 12px) / 4)`, transform: `translateX(calc(${idx} * 100%))`, transitionTimingFunction: "cubic-bezier(.34,1.56,.64,1)" }} />
        {tabs.map((t) => {
          const active = t.key === tab;
          return (
            <button key={t.key} onClick={() => onChange(t.key)}
              className={`relative z-10 flex w-16 flex-col items-center gap-0.5 rounded-full py-2 text-[10px] font-medium transition ${active ? "text-white" : "text-foreground/70"}`}>
              <t.icon className="h-5 w-5" />{t.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

function Badge({ children, color, icon: Icon }: { children: React.ReactNode; color: "primary" | "amber" | "destructive" | "muted" | "blue"; icon?: typeof CheckCircle2 }) {
  const map = { primary: "bg-primary/10 text-primary", amber: "bg-amber-100 text-amber-700", destructive: "bg-destructive/10 text-destructive", muted: "bg-muted text-muted-foreground", blue: "bg-sky-100 text-sky-700" };
  return <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium capitalize ${map[color]}`}>{Icon && <Icon className="h-3 w-3" />}{children}</span>;
}

function StatCard({ icon: Icon, label, value }: { icon: typeof Home; label: string; value: string }) {
  return <div className="squircle bg-white p-4 shadow-soft"><div className="flex items-center gap-2 text-xs text-muted-foreground"><Icon className="h-3.5 w-3.5" />{label}</div><div className="mt-1 text-base font-bold">{value}</div></div>;
}

function ActionCard({ icon: Icon, label, badge, onClick }: { icon: typeof Home; label: string; badge?: number; onClick: () => void }) {
  return (
    <button onClick={onClick} className="relative flex items-center gap-3 squircle bg-white p-4 text-left shadow-soft hover:bg-muted/30 transition">
      <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary"><Icon className="h-5 w-5" /></div>
      <div className="text-sm font-semibold leading-tight">{label}</div>
      {badge ? <span className="absolute right-3 top-3 grid h-5 min-w-5 place-items-center rounded-full bg-destructive px-1.5 text-[10px] font-bold text-destructive-foreground">{badge}</span> : null}
      <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground" />
    </button>
  );
}

function FeeProgressCard({ title, amount, total, pct, accent, ctaLabel, onCta }: { title: string; amount: number; total: number; pct: number; accent: "primary" | "blue"; ctaLabel: string; onCta: () => void }) {
  const bar = accent === "primary" ? "bg-primary" : "bg-sky-500";
  return (
    <div className="squircle bg-white p-5 shadow-soft">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{title}</div>
      <div className="mt-1 flex items-end justify-between">
        <div><div className="text-3xl font-bold">{fmtGHS(amount)}</div><div className="text-xs text-muted-foreground">of {fmtGHS(total)}</div></div>
        <button onClick={onCta} className={`rounded-full ${accent === "primary" ? "bg-primary text-primary-foreground" : "bg-sky-500 text-white"} px-4 py-2 text-xs font-semibold shadow-soft`}>{ctaLabel}</button>
      </div>
      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted"><div className={`h-full ${bar} transition-all`} style={{ width: `${pct}%` }} /></div>
    </div>
  );
}

function FeeBreakdown({ title, paid, total, accent }: { title: string; paid: number; total: number; accent: "primary" | "blue" }) {
  const balance = Math.max(0, total - paid);
  const pct = Math.min(100, (paid / total) * 100);
  const isPaid = balance === 0;
  return (
    <div className="squircle bg-white p-5 shadow-soft">
      <div className="flex items-center justify-between">
        <div className="text-base font-bold">{title}</div>
        <Badge color={isPaid ? "primary" : "amber"}>{isPaid ? "Paid" : "Outstanding"}</Badge>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        <div><div className="text-xs text-muted-foreground">Total</div><div className="text-sm font-semibold">{fmtGHS(total)}</div></div>
        <div><div className="text-xs text-muted-foreground">Paid</div><div className="text-sm font-semibold text-primary">{fmtGHS(paid)}</div></div>
        <div><div className="text-xs text-muted-foreground">Balance</div><div className="text-sm font-semibold text-amber-700">{fmtGHS(balance)}</div></div>
      </div>
      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted"><div className={`h-full ${accent === "primary" ? "bg-primary" : "bg-sky-500"} transition-all`} style={{ width: `${pct}%` }} /></div>
    </div>
  );
}

function SectionCard({ title, right, children }: { title: string; right?: React.ReactNode; children: React.ReactNode }) {
  return <div className="squircle bg-white p-5 shadow-soft"><div className="mb-3 flex items-center justify-between"><div className="text-base font-bold">{title}</div>{right}</div>{children}</div>;
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return <div className="flex items-center justify-between border-b border-border py-2 last:border-none"><div className="text-xs text-muted-foreground">{label}</div><div className="text-sm font-medium">{value}</div></div>;
}

function EditableRow({ label, value, onChange, edit }: { label: string; value: string; onChange: (v: string) => void; edit: boolean }) {
  return (
    <div className="flex items-center justify-between border-b border-border py-2 last:border-none">
      <div className="text-xs text-muted-foreground">{label}</div>
      {edit ? <input value={value} onChange={(e) => onChange(e.target.value)} className="w-1/2 rounded-lg border border-border bg-white px-2 py-1 text-right text-sm" /> : <div className="text-sm font-medium">{value}</div>}
    </div>
  );
}

function ConfirmModal({ title, body, onConfirm, onCancel }: { title: string; body: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4 animate-fade-in" onClick={onCancel}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-sm squircle bg-white p-6 shadow-glass animate-pop">
        <div className="text-lg font-bold">{title}</div>
        <div className="mt-1 text-sm text-muted-foreground">{body}</div>
        <div className="mt-5 grid grid-cols-2 gap-2">
          <button onClick={onCancel} className="rounded-2xl border border-border bg-white py-2.5 text-sm font-medium">Cancel</button>
          <button onClick={onConfirm} className="rounded-2xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground">Confirm</button>
        </div>
      </div>
    </div>
  );
}
