import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useMemo, useRef } from "react";
import {
  User, Phone, MessageCircle, BookOpen, Layers, DoorOpen, ShieldCheck,
  AtSign, Lock, ArrowRight, ArrowLeft, CheckCircle2, FileText, Sparkles,
  Zap, Loader2, Camera, Upload, X, Eye, EyeOff, Download,
} from "lucide-react";
import logo from "@/assets/logo.jpg";
import building from "@/assets/building.jpg";
import { useRegisterStudent, useRooms, useMeters, useSettings, usePolicies } from "@/lib/queries";
import { uploadToImgur } from "@/lib/imgur";
import { ALL_COURSES, LEVELS } from "@/lib/constants";
import { getPaystackPublicKey, initializeActivationPayment, verifyActivationPayment } from "@/lib/api/activation.functions";

export const Route = createFileRoute("/onboarding")({
  head: () => ({
    meta: [
      { title: "Student Onboarding — SME Hostels" },
      { name: "description", content: "Create your SME Hostels student account." },
    ],
  }),
  component: Onboarding,
});

type Step = 1 | 2 | 3; // 1=details, 2=policy, 3=payment

type Form = {
  fullName: string; phone: string; whatsapp: string; course: string;
  level: string; roomNo: string; guardianName: string; guardianPhone: string;
  username: string; password: string; gender: string;
};

const empty: Form = {
  fullName: "", phone: "", whatsapp: "", course: "", level: "",
  roomNo: "", guardianName: "", guardianPhone: "", username: "", password: "", gender: "",
};

function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>(1);
  const [form, setForm] = useState<Form>(empty);
  const [accepted, setAccepted] = useState(false);
  const [createdStudentId, setCreatedStudentId] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: rooms = [], isLoading: roomsLoading, error: roomsError } = useRooms();
  const { data: meters = [] } = useMeters();
  const { data: settings } = useSettings();
  const { data: policies = [] } = usePolicies();
  const createStudent = useRegisterStudent();

  const upd = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { setAvatarError("Please select an image file."); return; }
    if (file.size > 5 * 1024 * 1024) { setAvatarError("Image must be under 5MB."); return; }

    setAvatarError(null);
    setAvatarPreview(URL.createObjectURL(file));
    setAvatarUploading(true);
    try {
      const url = await uploadToImgur(file);
      setAvatarUrl(url);
    } catch (err) {
      setAvatarError(err instanceof Error ? err.message : "Upload failed. Try again.");
      setAvatarPreview(null);
    } finally {
      setAvatarUploading(false);
    }
  }

  // Auto-resolve meter from selected room
  const resolvedMeter = useMemo(() => {
    if (!form.roomNo) return null;
    const room = rooms.find((r: any) => r.no === form.roomNo);
    return room?.meter_no ?? null;
  }, [form.roomNo, rooms]);

  function submitDetails(e: React.FormEvent) {
    e.preventDefault();
    setStep(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function acceptPolicy() {
    if (!accepted) return;
    // Create the student account now (policy_accepted = true)
    const studentId = "SME-" + new Date().getFullYear() + "-" + String(Math.floor(100 + Math.random() * 900));
    createStudent.mutate(
      {
        id: studentId,
        full_name: form.fullName,
        phone: form.phone,
        whatsapp: form.whatsapp,
        course: form.course,
        level: form.level,
        room_no: form.roomNo || null,
        meter_no: resolvedMeter,
        guardian_name: form.guardianName,
        guardian_phone: form.guardianPhone,
        username: form.username,
        password: form.password,
        accepted_at: new Date().toISOString(),
        avatar_url: avatarUrl ?? undefined,
        gender: form.gender as "male" | "female" | "other" | undefined,
      },
      {
        onSuccess: (student) => {
          try {
            localStorage.setItem("sme_student_profile", JSON.stringify({ id: student.id, fullName: student.full_name }));
          } catch {}
          sessionStorage.setItem("sme_student_id", student.id);
          setCreatedStudentId(student.id);
          setStep(3);
          window.scrollTo({ top: 0, behavior: "smooth" });
        },
      },
    );
  }

  const stepLabels: { n: Step; label: string }[] = [
    { n: 1, label: "Your details" },
    { n: 2, label: "Policy" },
    { n: 3, label: "Activate" },
  ];

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      <img src={building} alt="" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-br from-primary/70 via-primary/40 to-background/90" />

      <div className="relative z-10 mx-auto max-w-3xl px-4 py-8">
        <Link to="/" className="mb-6 inline-flex items-center gap-2 text-sm text-white/90 hover:text-white">
          <ArrowLeft className="h-4 w-4" /> Back to sign in
        </Link>

        <div className="mb-6 flex items-center gap-3">
          <img src={logo} alt="SME Hostels" className="h-14 w-auto squircle bg-white p-2 shadow-glass" />
          <div className="text-white">
            <div className="text-xs uppercase tracking-wider opacity-80">SME Hostels</div>
            <div className="text-xl font-semibold">Student onboarding</div>
          </div>
        </div>

        {/* Stepper */}
        <div className="mb-5 flex items-center gap-2">
          {stepLabels.map((s, i) => (
            <div key={s.n} className="flex flex-1 items-center gap-2">
              <div className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-bold transition ${step >= s.n ? "bg-white text-primary shadow-soft" : "bg-white/30 text-white"}`}>
                {step > s.n ? <CheckCircle2 className="h-4 w-4" /> : s.n}
              </div>
              <span className="hidden text-sm font-medium text-white sm:inline">{s.label}</span>
              {i < stepLabels.length - 1 && <div className={`h-1 flex-1 rounded-full ${step > s.n ? "bg-white" : "bg-white/30"}`} />}
            </div>
          ))}
        </div>

        <div className="glass squircle p-6 shadow-glass animate-slide-up sm:p-8">
          {/* ── STEP 1: Details ── */}
          {step === 1 && (
            <form onSubmit={submitDetails} className="space-y-4">
              <div>
                <h2 className="text-xl font-semibold">Tell us about you</h2>
                <p className="text-sm text-muted-foreground">We use this to set up your room access and billing.</p>
              </div>

              <Field icon={User} label="Full name" placeholder="Ama Mensah" value={form.fullName} onChange={upd("fullName")} required />

              <div className="grid gap-4 sm:grid-cols-2">
                <Field icon={Phone} type="tel" label="Phone number" placeholder="0241234567" value={form.phone} onChange={upd("phone")} required />
                <Field icon={MessageCircle} type="tel" label="WhatsApp number" placeholder="0241234567" value={form.whatsapp} onChange={upd("whatsapp")} required />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <SelectField icon={BookOpen} label="Programme / Course" value={form.course} onChange={upd("course")} required placeholder="Select your programme"
                  options={ALL_COURSES.map((c) => ({ value: c, label: c }))} />
                <SelectField icon={Layers} label="Level" value={form.level} onChange={upd("level")} required placeholder="Select level"
                  options={LEVELS.map((l) => ({ value: l, label: `Level ${l}` }))} />
              </div>

              <SelectField icon={User} label="Gender" value={form.gender} onChange={upd("gender")} required placeholder="Select gender"
                options={[
                  { value: "male", label: "Male" },
                  { value: "female", label: "Female" },
                  { value: "other", label: "Other" },
                ]} />

              {/* Room dropdown — populated from DB */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-foreground">Room number</label>
                  <div className="relative">
                    <DoorOpen className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <select value={form.roomNo} onChange={upd("roomNo")} required
                      className="w-full appearance-none rounded-2xl border border-border bg-white/80 py-3 pl-10 pr-4 text-sm outline-none ring-primary/30 focus:ring-2">
                      <option value="">
                        {roomsLoading ? "Loading rooms…" : roomsError ? "Error loading rooms — check connection" : rooms.length === 0 ? "No rooms available — contact admin" : "Select your room"}
                      </option>
                      {rooms
                        .filter((r: any) => r.status === "available")
                        .map((r: any) => (
                          <option key={r.no} value={r.no}>{r.no}</option>
                        ))}
                    </select>
                  </div>
                </div>

                {/* Meter — auto-resolved, read-only */}
                <div>
                  <label className="mb-1 block text-xs font-medium text-foreground">Electricity meter</label>
                  <div className="relative">
                    <Zap className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <div className={`w-full rounded-2xl border border-border py-3 pl-10 pr-4 text-sm ${resolvedMeter ? "bg-primary/5 text-primary font-medium" : "bg-white/50 text-muted-foreground"}`}>
                      {resolvedMeter ?? (form.roomNo ? "No meter assigned" : "Auto-filled from room")}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field icon={ShieldCheck} label="Guardian's name" placeholder="Mr. Mensah" value={form.guardianName} onChange={upd("guardianName")} required />
                <Field icon={Phone} type="tel" label="Guardian's phone" placeholder="0241234567" value={form.guardianPhone} onChange={upd("guardianPhone")} required />
              </div>

              <div className="rounded-2xl border border-border bg-white/60 p-4">
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Sparkles className="h-4 w-4 text-primary" /> Create your sign-in
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field icon={AtSign} label="Username" placeholder="ama.mensah" value={form.username} onChange={upd("username")} required />
                  <Field icon={Lock} type="password" label="Password" placeholder="At least 8 characters" value={form.password} onChange={upd("password")} required minLength={8} />
                </div>
              </div>

              {/* ── Profile photo upload ── */}
              <div className="rounded-2xl border border-border bg-white/60 p-4">
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Camera className="h-4 w-4 text-primary" /> Profile photo
                  <span className="ml-auto text-xs font-normal text-muted-foreground">Required</span>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoSelect}
                  className="hidden"
                />

                {!avatarPreview ? (
                  <button type="button" onClick={() => fileInputRef.current?.click()}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border bg-white/50 py-6 text-sm text-muted-foreground hover:border-primary/40 hover:bg-primary/5 transition">
                    <Upload className="h-5 w-5" />
                    <span>Tap to upload a clear photo of yourself</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-4">
                    <img src={avatarPreview} alt="Preview"
                      className="h-20 w-20 rounded-2xl object-cover border-2 border-border shadow-soft" />
                    <div className="flex-1">
                      {avatarUploading && (
                        <div className="flex items-center gap-2 text-sm text-primary">
                          <Loader2 className="h-4 w-4 animate-spin" /> Uploading…
                        </div>
                      )}
                      {avatarUrl && !avatarUploading && (
                        <div className="flex items-center gap-2 text-sm text-primary font-medium">
                          <CheckCircle2 className="h-4 w-4" /> Photo uploaded
                        </div>
                      )}
                      {avatarError && (
                        <div className="text-sm text-destructive">{avatarError}</div>
                      )}
                      <button type="button" onClick={() => { setAvatarPreview(null); setAvatarUrl(null); setAvatarError(null); }}
                        className="mt-2 inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground hover:bg-muted/70">
                        <X className="h-3 w-3" /> Remove
                      </button>
                    </div>
                  </div>
                )}
                {avatarError && !avatarPreview && (
                  <div className="mt-2 text-xs text-destructive">{avatarError}</div>
                )}
              </div>

              <button type="submit" disabled={!avatarUrl || avatarUploading}
                className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-soft transition hover:opacity-95 active:scale-[.98] disabled:opacity-50 disabled:cursor-not-allowed">
                Continue <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          )}

          {/* ── STEP 2: Policy ── */}
          {step === 2 && (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">Hostel guidelines & code of conduct</h2>
                    <p className="text-sm text-muted-foreground">Read carefully — acceptance is mandatory to proceed.</p>
                  </div>
                </div>
                <a
                  href="/sme-hostels-guidelines.pdf"
                  download="SME-Hostels-Guidelines.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-xs font-semibold text-primary hover:bg-primary/20 transition shadow-soft"
                >
                  <Download className="h-4 w-4" /> Download PDF
                </a>
              </div>

              <div className="max-h-80 space-y-4 overflow-y-auto rounded-2xl border border-border bg-white/70 p-5 text-sm leading-relaxed text-foreground">
                <div className="border-b border-border/60 pb-3 text-center">
                  <div className="font-bold text-base tracking-wide text-foreground">SME HOSTELS</div>
                  <div className="text-xs text-muted-foreground font-medium">Important Guidelines for Residents</div>
                </div>
                {(policies.length > 0 ? policies : GUIDELINES).map((g: any, i: number) => (
                  <div key={i} className="flex gap-3">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-foreground text-sm">{g.title}</div>
                      {g.points ? (
                        <ul className="mt-1 list-disc pl-4 space-y-0.5 text-xs text-muted-foreground leading-relaxed">
                          {g.points.map((pt: string, pIdx: number) => (
                            <li key={pIdx}>{pt}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="mt-0.5 text-xs text-muted-foreground whitespace-pre-line leading-relaxed">{g.body}</p>
                      )}
                    </div>
                  </div>
                ))}
                <p className="pt-2 text-center text-xs text-muted-foreground italic border-t border-border/60">
                  Please keep these guidelines in mind when preparing for your stay at SME Hostels.
                </p>
              </div>

              <label className="flex cursor-pointer items-start gap-3 rounded-2xl bg-secondary/60 p-4">
                <input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)}
                  className="mt-1 h-4 w-4 accent-[oklch(0.68_0.17_145)]" />
                <span className="text-sm">
                  I, <strong>{form.fullName || "the student"}</strong>, have read and agree to abide by the
                  SME Hostels guidelines and code of conduct. I understand violations may result in disciplinary action.
                </span>
              </label>

              <div className="flex gap-3">
                <button onClick={() => setStep(1)}
                  className="inline-flex items-center gap-2 rounded-2xl bg-secondary px-4 py-3 text-sm font-medium">
                  <ArrowLeft className="h-4 w-4" /> Back
                </button>
                <button onClick={acceptPolicy} disabled={!accepted || createStudent.isPending}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-soft transition disabled:cursor-not-allowed disabled:opacity-50">
                  {createStudent.isPending
                    ? <><Loader2 className="h-4 w-4 animate-spin" /> Creating account…</>
                    : <>Accept & continue <ArrowRight className="h-4 w-4" /></>}
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 3: Payment ── */}
          {step === 3 && (
            <PaymentStep
              form={form}
              studentId={createdStudentId!}
              settings={settings}
              onActivated={() => navigate({ to: "/student-home" })}
            />
          )}
        </div>

        <p className="mt-4 text-center text-xs text-white/80">
          Already onboarded? <Link to="/" className="font-medium underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}

/* ── Shared field components ── */

function Field({ icon: Icon, label, ...props }: { icon: typeof User; label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  const [show, setShow] = useState(false);
  const isPassword = props.type === "password";
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-foreground">{label}</span>
      <div className="relative">
        <Icon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input {...props} type={isPassword ? (show ? "text" : "password") : props.type}
          className={`w-full rounded-2xl border border-border bg-white/80 py-3 pl-10 text-sm outline-none ring-primary/30 focus:ring-2 ${isPassword ? "pr-10" : "pr-4"}`} />
        {isPassword && (
          <button type="button" onClick={() => setShow((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition">
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </div>
    </label>
  );
}

function SelectField({ icon: Icon, label, options, placeholder, ...props }: {
  icon: typeof User; label: string; options: { value: string; label: string }[]; placeholder?: string;
} & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-foreground">{label}</span>
      <div className="relative">
        <Icon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <select {...props} className="w-full appearance-none rounded-2xl border border-border bg-white/80 py-3 pl-10 pr-4 text-sm outline-none ring-primary/30 focus:ring-2">
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>
    </label>
  );
}

// ── Payment Step ──────────────────────────────────────────────────────────────

declare global {
  interface Window {
    PaystackPop?: {
      setup(opts: {
        key: string;
        email: string;
        amount: number;
        currency: string;
        ref: string;
        metadata?: Record<string, unknown>;
        onClose: () => void;
        callback: (response: { reference: string }) => void;
      }): { openIframe(): void };
    };
  }
}

function PaymentStep({
  form,
  studentId,
  onActivated,
  settings,
}: {
  form: Form;
  studentId: string;
  onActivated: () => void;
  settings: any;
}) {
  const [joined, setJoined] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "paying" | "verifying" | "done" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const channelUrl = settings?.whatsapp_channel_url ?? "https://whatsapp.com/channel/";

  async function handlePay() {
    setStatus("loading");
    setErrorMsg(null);

    try {
      // Load Paystack inline script if not already loaded
      if (!window.PaystackPop) {
        await new Promise<void>((resolve, reject) => {
          const s = document.createElement("script");
          s.src = "https://js.paystack.co/v1/inline.js";
          s.onload = () => resolve();
          s.onerror = () => reject(new Error("Failed to load payment provider."));
          document.head.appendChild(s);
        });
      }

      // Get public key and initialize payment record
      const [{ publicKey }, { reference, email, amount }] = await Promise.all([
        getPaystackPublicKey(),
        initializeActivationPayment({ data: { student_id: studentId } }),
      ]);

      setStatus("paying");

      const handler = window.PaystackPop!.setup({
        key: publicKey,
        email,
        amount,
        currency: "GHS",
        ref: reference,
        metadata: { student_id: studentId, purpose: "activation" },
        onClose: () => {
          setStatus("idle");
          setErrorMsg("Payment was cancelled. Click 'Pay GHS 80' to try again.");
        },
        callback: async (response) => {
          setStatus("verifying");
          try {
            const result = await verifyActivationPayment({
              data: { reference: response.reference, student_id: studentId },
            });
            if (result.status === "active") {
              setStatus("done");
              setTimeout(onActivated, 1500);
            } else if (result.status === "failed") {
              setStatus("error");
              setErrorMsg(result.message);
            } else {
              setStatus("idle");
              setErrorMsg("Payment is being processed. Please wait a moment then sign in.");
            }
          } catch (_) {
            setStatus("idle");
            setErrorMsg("Could not verify payment. If you paid, your account will activate shortly.");
          }
        },
      });

      handler.openIframe();
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    }
  }

  if (status === "done") {
    return (
      <div className="space-y-5 text-center">
        <div className="grid h-16 w-16 place-items-center rounded-full bg-primary/10 text-primary mx-auto">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-semibold">Account Activated!</h2>
        <p className="text-sm text-muted-foreground">
          Welcome to SME Hostels, {form.fullName.split(" ")[0]}. Redirecting you now…
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#25D366]/15 text-[#25D366]">
          <MessageCircle className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-xl font-semibold">Almost there!</h2>
          <p className="text-sm text-muted-foreground">Join our channel, then activate your account.</p>
        </div>
      </div>

      {/* WhatsApp join */}
      <div className="rounded-2xl border-2 border-[#25D366]/40 bg-[#25D366]/5 p-4 space-y-3">
        <p className="text-sm text-muted-foreground">
          Join our WhatsApp channel to receive hostel announcements and updates.
        </p>
        <a href={channelUrl} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition">
          <MessageCircle className="h-4 w-4" />
          Join {settings?.hostel_name ?? "SME Hostels"} channel
        </a>
        <label className="flex cursor-pointer items-start gap-3 rounded-xl bg-white/60 p-3">
          <input type="checkbox" checked={joined} onChange={(e) => setJoined(e.target.checked)}
            className="mt-0.5 h-4 w-4 accent-[oklch(0.68_0.17_145)]" />
          <span className="text-xs text-muted-foreground">
            I have joined the SME Hostels WhatsApp channel.
          </span>
        </label>
      </div>

      {/* Payment card */}
      <div className={`rounded-2xl border border-border bg-white/70 p-5 space-y-3 transition ${!joined ? "opacity-50 pointer-events-none" : ""}`}>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Activation fee</span>
          <span className="font-bold text-lg text-primary">GHS 80</span>
        </div>
        <div className="border-t border-border/60 pt-3 space-y-2">
          <p className="text-xs font-semibold text-foreground uppercase tracking-wide">What you get</p>
          {[
            "First week of Wi-Fi access free",
            "First prepaid electricity top-up free",
            "Electricity meter info & top-up history",
            "Internship opportunities portal",
            "Transport agencies & schedules",
            "Hostel announcements & emergency contacts",
          ].map((benefit) => (
            <div key={benefit} className="flex items-center gap-2 text-xs text-muted-foreground">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-primary" />
              <span>{benefit}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground border-t border-border/60 pt-3">
          Secure payment via Paystack. Supports Mobile Money and cards.
        </p>
      </div>

      {errorMsg && (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-xs text-destructive">
          {errorMsg}
        </div>
      )}

      <button
        onClick={handlePay}
        disabled={!joined || status === "loading" || status === "paying" || status === "verifying"}
        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-primary px-5 py-4 text-base font-bold text-primary-foreground shadow-soft transition hover:opacity-95 active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === "loading" && <><Loader2 className="h-4 w-4 animate-spin" /> Loading…</>}
        {status === "paying" && <><Loader2 className="h-4 w-4 animate-spin" /> Opening payment…</>}
        {status === "verifying" && <><Loader2 className="h-4 w-4 animate-spin" /> Verifying…</>}
        {(status === "idle" || status === "error") && <>Pay GHS 80 to activate</>}
      </button>
    </div>
  );
}

const GUIDELINES = [
  {
    title: "1. Electricity",
    body: "• Electric hotplates are not allowed.\n• Use gas cylinders/stoves for cooking.\n• Approved appliances such as irons, fridges, electric kettles and other reasonable appliances maybe used.\n• Do not tamper with electricity meter boards unless approved by management.\n• 50cedis Should be contributed individually for prepaid each week",
    points: [
      "Electric hotplates are not allowed.",
      "Use gas cylinders/stoves for cooking.",
      "Approved appliances such as irons, fridges, electric kettles and other reasonable appliances maybe used.",
      "Do not tamper with electricity meter boards unless approved by management.",
      "50cedis Should be contributed individually for prepaid each week",
    ],
  },
  {
    title: "2. Noise & Conduct",
    body: "• Keep noise low between 10:00 PM and 6:00 AM.\n• No loud music, parties or disruptive behavior.\n• Respect other students and hostel staff.",
    points: [
      "Keep noise low between 10:00 PM and 6:00 AM.",
      "No loud music, parties or disruptive behavior.",
      "Respect other students and hostel staff.",
    ],
  },
  {
    title: "3. Room Maintenance",
    body: "• Keep your room and shared spaces clean.\n• Regularly clean fans and louver blades.\n• Report damage, leaks, faulty bulbs or other issues to management.\n• Do not alter or modify rooms without permission.",
    points: [
      "Keep your room and shared spaces clean.",
      "Regularly clean fans and louver blades.",
      "Report damage, leaks, faulty bulbs or other issues to management.",
      "Do not alter or modify rooms without permission.",
    ],
  },
  {
    title: "4. Visitors",
    body: "• Visiting hours: 10:00 AM – 8:00 PM.\n• All visitors must sign in.\n• Overnight visitors require management approval.\n• Students are responsible for their visitors.",
    points: [
      "Visiting hours: 10:00 AM – 8:00 PM.",
      "All visitors must sign in.",
      "Overnight visitors require management approval.",
      "Students are responsible for their visitors.",
    ],
  },
  {
    title: "5. Communication",
    body: "• Important announcements will be shared through SMS and the hostel WhatsApp group.\n• Keep your phone and WhatsApp number updated.",
    points: [
      "Important announcements will be shared through SMS and the hostel WhatsApp group.",
      "Keep your phone and WhatsApp number updated.",
    ],
  },
  {
    title: "6. What to Bring",
    body: "• Bring your own curtains, sleeping items, mops, brushes, brooms and other basic cleaning items.\n• Cleaning items will not be provided by management.",
    points: [
      "Bring your own curtains, sleeping items, mops, brushes, brooms and other basic cleaning items.",
      "Cleaning items will not be provided by management.",
    ],
  },
  {
    title: "7. Compliance",
    body: "• All students are expected to follow hostel rules and regulations(Policies).\n• Failure to follow the rules may result in warnings, fines, suspension or eviction.",
    points: [
      "All students are expected to follow hostel rules and regulations(Policies).",
      "Failure to follow the rules may result in warnings, fines, suspension or eviction.",
    ],
  },
];
