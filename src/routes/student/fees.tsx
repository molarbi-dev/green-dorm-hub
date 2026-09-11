import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft, Phone, Building2, ChevronDown, ChevronUp, Copy, Check,
  AlertTriangle, Receipt, Upload, Camera, CheckCircle2, Loader2,
} from "lucide-react";
import { toast } from "sonner";
import logo from "@/assets/logo.jpg";
import { fmtGHS, fmtDate } from "@/lib/hostel-store";
import {
  useStudent, useSettings, usePayments,
  useStudentReceipts, useSubmitReceipt,
} from "@/lib/queries";

export const Route = createFileRoute("/student/fees")({
  head: () => ({ meta: [{ title: "Fees & Payments — SME Hostels" }] }),
  component: FeesPage,
});

function getCurrentStudentId(): string {
  if (typeof window === "undefined") return "";
  return sessionStorage.getItem("sme_student_id") ?? "";
}

function FeesPage() {
  const nav = useNavigate();
  const currentId = getCurrentStudentId();
  const { data: student, isLoading } = useStudent(currentId);
  const { data: settings } = useSettings();
  const { data: payments = [] } = usePayments(currentId);

  useEffect(() => { if (!currentId) nav({ to: "/" }); }, [currentId]);
  useEffect(() => {
    if (!isLoading && currentId && !student) {
      sessionStorage.removeItem("sme_student_id");
      nav({ to: "/" });
    }
  }, [isLoading, student, currentId]);

  if (!currentId || isLoading) {
    return <div className="grid min-h-screen place-items-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;
  }
  if (!student || !settings) return null;

  const sorted = [...payments].sort((a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime());
  const regBalance = Math.max(0, settings.registration_fee - student.reg_paid);
  const regPct = Math.min(100, (student.reg_paid / settings.registration_fee) * 100);

  return (
    <div className="min-h-screen bg-background pb-10">
      {/* Header */}
      <div className="bg-gradient-primary px-4 pt-6 pb-8 text-white shadow-glass">
        <div className="mx-auto max-w-2xl">
          <div className="flex items-center gap-3">
            <Link to="/student-home" className="grid h-9 w-9 place-items-center rounded-full bg-white/20 hover:bg-white/30">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <img src={logo} alt="" className="h-8 w-8 squircle bg-white p-1 object-contain" />
            <div>
              <div className="text-xs opacity-80">{settings.hostel_name}</div>
              <div className="text-base font-bold leading-tight">Fees & Payments</div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-4 py-5 space-y-4">
        {/* Fee breakdown */}
        <div className="squircle bg-white p-5 shadow-soft animate-slide-up">
          <div className="flex items-center justify-between mb-3">
            <div className="text-base font-bold">Registration Fee</div>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${regBalance === 0 ? "bg-primary/10 text-primary" : "bg-amber-100 text-amber-700"}`}>
              {regBalance === 0 ? "Paid" : "Outstanding"}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center mb-3">
            <div><div className="text-xs text-muted-foreground">Total</div><div className="text-sm font-semibold">{fmtGHS(settings.registration_fee)}</div></div>
            <div><div className="text-xs text-muted-foreground">Paid</div><div className="text-sm font-semibold text-primary">{fmtGHS(student.reg_paid)}</div></div>
            <div><div className="text-xs text-muted-foreground">Balance</div><div className="text-sm font-semibold text-amber-700">{fmtGHS(regBalance)}</div></div>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full bg-sky-500 transition-all" style={{ width: `${regPct}%` }} />
          </div>
        </div>

        {/* How to pay */}
        <div className="squircle bg-white p-5 shadow-soft">
          <div className="mb-3 text-base font-bold">How to Pay</div>
          <PayAccordion title="Bank Transfer" icon={Building2}
            fields={[
              { label: "Bank Name", value: settings.bank_name },
              { label: "Account Name", value: settings.account_name },
              { label: "Account Number", value: settings.account_number },
              { label: "Branch", value: settings.branch },
            ]}
            reference={student.id}
          />
          <PayAccordion title="Mobile Money" icon={Phone}
            fields={[
              { label: "MoMo Number", value: settings.momo_number },
              { label: "Account Name", value: settings.momo_name },
            ]}
            reference={student.id}
          />
        </div>

        {/* Payment history */}
        <div className="squircle bg-white p-5 shadow-soft">
          <div className="mb-3 text-base font-bold">Payment History</div>
          {sorted.length === 0 && <div className="text-sm text-muted-foreground">No payments yet.</div>}
          <div className="divide-y divide-border">
            {sorted.map((p) => (
              <div key={p.id} className="flex items-center justify-between py-3">
                <div>
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Receipt className="h-4 w-4 text-primary" /> {p.id}
                  </div>
                  <div className="text-xs text-muted-foreground capitalize">{p.type} · {fmtDate(new Date(p.payment_date).getTime())}</div>
                </div>
                <div className="text-sm font-semibold">{fmtGHS(p.amount)}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Help */}
        <div className="squircle bg-white p-5 shadow-soft">
          <div className="mb-3 text-base font-bold">Need Help?</div>
          <a href={`tel:${settings.contact_phone}`} className="flex items-center justify-between rounded-2xl bg-primary/5 px-4 py-3 text-sm font-medium text-primary">
            <span className="inline-flex items-center gap-2"><Phone className="h-4 w-4" /> Call Management</span>
            <span>{settings.contact_phone}</span>
          </a>
        </div>

        {/* Receipt upload */}
        <ReceiptUploadSection studentId={currentId} />
      </div>
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
    if (!file.type.startsWith("image/")) { setImgError("Please select an image file."); return; }
    if (file.size > 10 * 1024 * 1024) { setImgError("File must be under 10MB."); return; }
    setImgError(null);
    setPreview(URL.createObjectURL(file));
    setUploading(true);
    try {
      const { uploadToImgur } = await import("@/lib/imgur");
      setImgUrl(await uploadToImgur(file));
    } catch (err) {
      setImgError(err instanceof Error ? err.message : "Upload failed.");
      setPreview(null);
    } finally { setUploading(false); }
  }

  function submit() {
    if (!imgUrl) return;
    submitReceiptMut.mutate(
      { student_id: studentId, image_url: imgUrl, amount: Number(amount) || undefined, description: description || undefined },
      { onSuccess: () => { setPreview(null); setImgUrl(null); setAmount(""); setShowForm(false); setImgError(null); if (fileRef.current) fileRef.current.value = ""; } },
    );
  }

  const statusStyle = (s: string) => s === "verified" ? "bg-primary/10 text-primary" : s === "rejected" ? "bg-destructive/10 text-destructive" : "bg-amber-100 text-amber-700";

  return (
    <div className="squircle bg-white p-5 shadow-soft">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-base font-bold">Payment Receipts</div>
          <div className="text-xs text-muted-foreground">Upload proof for management to verify</div>
        </div>
        <button onClick={() => setShowForm((v) => !v)}
          className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20">
          <Upload className="h-3.5 w-3.5" /> {showForm ? "Cancel" : "Upload"}
        </button>
      </div>
      {showForm && (
        <div className="border-t border-border pt-4 space-y-3 mb-4">
          <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
          {!preview ? (
            <button type="button" onClick={() => fileRef.current?.click()}
              className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-muted/30 py-5 text-sm text-muted-foreground hover:border-primary/40 hover:bg-primary/5 transition">
              <Camera className="h-5 w-5" /> Tap to select receipt image
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
                <option>Registration fee</option><option>Hostel fee</option><option>Other</option>
              </select>
            </div>
          </div>
          <button onClick={submit} disabled={!imgUrl || uploading || submitReceiptMut.isPending}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-primary py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50">
            {submitReceiptMut.isPending ? <><Loader2 className="h-4 w-4 animate-spin" /> Submitting…</> : "Submit receipt for review"}
          </button>
        </div>
      )}
      {receipts.length === 0 && !showForm && <div className="text-sm text-muted-foreground">No receipts submitted yet.</div>}
      {receipts.length > 0 && (
        <div className="space-y-3">
          {receipts.map((r: any) => (
            <div key={r.id} className="flex items-start gap-3 rounded-xl border border-border p-3">
              <img src={r.image_url} alt="Receipt" className="h-14 w-14 rounded-lg object-cover border border-border cursor-pointer" onClick={() => window.open(r.image_url, "_blank")} />
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
