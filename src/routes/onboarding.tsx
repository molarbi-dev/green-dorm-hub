import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useMemo, useRef } from "react";
import {
  User, Phone, MessageCircle, BookOpen, Layers, DoorOpen, ShieldCheck,
  AtSign, Lock, ArrowRight, ArrowLeft, CheckCircle2, FileText, Sparkles,
  Zap, Loader2, Camera, Upload, X, Eye, EyeOff,
} from "lucide-react";
import logo from "@/assets/logo.jpg";
import building from "@/assets/building.jpg";
import { useRegisterStudent, useRooms, useMeters, useSettings, useHostelFeeForRoom, usePolicies } from "@/lib/queries";
import { uploadToImgur } from "@/lib/imgur";
import { ALL_COURSES, LEVELS } from "@/lib/constants";

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
  const { data: roomFeeData } = useHostelFeeForRoom(form.roomNo);
  const createStudent = useRegisterStudent();
  // hostelFee shown on step 3 notice

  // Registration fee is flat; hostel fee depends on room capacity
  const hostelFee = roomFeeData?.hostelFee ?? settings?.hostel_fee ?? 0;

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
    { n: 3, label: "Done" },
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
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/10 text-primary">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">Hostel guidelines & code of conduct</h2>
                  <p className="text-sm text-muted-foreground">Read carefully — acceptance is mandatory to proceed.</p>
                </div>
              </div>

              <div className="max-h-80 space-y-3 overflow-y-auto rounded-2xl border border-border bg-white/70 p-5 text-sm leading-relaxed text-foreground">
                {(policies.length > 0 ? policies : GUIDELINES).map((g: any, i: number) => (
                  <div key={i} className="flex gap-3">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <div>
                      <div className="font-medium">{g.title}</div>
                      <p className="text-muted-foreground">{g.body}</p>
                    </div>
                  </div>
                ))}
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

          {/* ── STEP 3: WhatsApp + registration fee notice ── */}
          {step === 3 && (
            <WhatsAppStep
              form={form}
              settings={settings}
              onEnter={() => navigate({ to: "/student-home" })}
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

function WhatsAppStep({ form, settings, onEnter }: {
  form: Form; settings: any; onEnter: () => void;
}) {
  const [joined, setJoined] = useState(false);

  const channelUrl = settings?.whatsapp_channel_url ?? "https://whatsapp.com/channel/";

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#25D366]/15 text-[#25D366]">
          <MessageCircle className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-xl font-semibold">Join our WhatsApp channel</h2>
          <p className="text-sm text-muted-foreground">Required before accessing the portal.</p>
        </div>
      </div>

      {/* WhatsApp channel card */}
      <div className="rounded-2xl border-2 border-[#25D366]/40 bg-[#25D366]/5 p-5">
        <p className="text-sm text-muted-foreground mb-4">
          All official hostel announcements, fee reminders, and urgent notices are sent through our WhatsApp channel.
          You <strong>must</strong> join to stay informed.
        </p>
        <a
          href={channelUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-full bg-[#25D366] px-5 py-3 text-sm font-semibold text-white shadow-soft hover:opacity-90 transition">
          <MessageCircle className="h-4 w-4" />
          Tap here to join {settings?.hostel_name ?? "SME Hostels"} channel
        </a>
      </div>

      {/* Confirmation checkbox — button stays disabled until ticked */}
      <label className="flex cursor-pointer items-start gap-3 rounded-2xl bg-secondary/60 p-4">
        <input type="checkbox" checked={joined} onChange={(e) => setJoined(e.target.checked)}
          className="mt-1 h-4 w-4 accent-[oklch(0.68_0.17_145)]" />
        <span className="text-sm">
          I, <strong>{form.fullName}</strong>, confirm that I have joined the SME Hostels WhatsApp channel.
        </span>
      </label>

      {/* Activate account */}
      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 text-center">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary mx-auto mb-3">
          <CheckCircle2 className="h-6 w-6" />
        </div>
        <div className="text-sm font-semibold text-foreground">Your account is ready</div>
        <p className="mt-1 text-xs text-muted-foreground">
          Click below to activate your account. Management will verify your details and get you fully set up.
        </p>
      </div>

      <button
        onClick={() => {
          if (!joined) return;
          onEnter();
        }}
        disabled={!joined}
        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[oklch(0.68_0.17_145)] px-5 py-4 text-base font-bold text-white shadow-soft transition hover:opacity-95 active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-50">
        <CheckCircle2 className="h-5 w-5" /> Activate System
      </button>
      {!joined && (
        <p className="text-center text-xs text-muted-foreground">Join the WhatsApp channel above to activate.</p>
      )}
    </div>
  );
}

const GUIDELINES = [
  {
    title: "SME Hostel Pricing & Capacity",
    body: "GHC 6,000 for four in a room · GHC 8,000 for three in a room · GHC 8,000 for two in a room.",
  },
  {
    title: "What Your Hostel Fees Cover",
    body: "Accommodation (bed space in shared/dorm or private room), utilities (electricity with usage limits, water, WiFi + generator backup), furniture & setup (bed frame, mattress, pillow — bring your own sheets unless you buy our bedding package), shared spaces (lounge/TV area, kitchen, dining, shared bathrooms), 24/7 security (guards, CCTV, access control), common area cleaning daily, dorm rooms weekly, professional washroom cleaning every 2 weeks, and sanitation & maintenance (regular garbage collection from central bins — littering around the hostel shall come with a fine or disciplinary action).",
  },
  {
    title: "Usually Not Included in Hostel Fees",
    body: "Beddings (duvet, sheets, pillowcases — unless you got the bedding pack), laundry (separate cost or coin/token machines), personal mobile data (WiFi is free but airtime is on you), food (kitchen is self-cook; meal plans only if offered), storage lockers (may carry a small monthly fee), and damages (you pay for anything you break).",
  },
  {
    title: "Registration Fee — GHC 100 (One-Time, Non-Refundable)",
    body: "Covers: admin/onboarding, access items (room key/card + spare, locker key — replacements cost extra), move-in prep, caution deposit (non-refundable), and welcome pack. Does NOT cover rent, beddings, extra utilities, laundry, meals, or parking.",
  },
  {
    title: "Furniture & Room Care",
    body: "Don't bring extra furniture. Use only what's provided and take care of all items. Damage or missing items = pay double replacement cost. Wilful damage = 2x repair cost. No moving or interchanging furniture between rooms. Damage/theft in corridors or common areas = cost shared by all students in that wing.",
  },
  {
    title: "Electricity & Appliances",
    body: "No high-power appliances in rooms: microwave, heater, washing machine, electric stove, rice cooker, etc. — confiscated if found. Switch off lights/fans when leaving your room. Bathroom lights only when in use. Fines apply for wasting electricity.",
  },
  {
    title: "Room Checks",
    body: "The Hostel Manager, porters, or security can inspect rooms and belongings at any time, with the student present.",
  },
  {
    title: "Discipline & Expulsion",
    body: "Breaking rules, disobeying staff, damaging property, or anti-social/violent acts = immediate termination. Deposit forfeited + no hostel fee refund if expelled.",
  },
  {
    title: "Going Out / Outstation",
    body: "Going outstation for competitions requires written parent consent + Hostel Council approval. Inform the porter and sign the Outstation Register before leaving.",
  },
  {
    title: "Celebrations",
    body: "Festivals/birthdays allowed only with prior permission. Birthdays: 8–10 PM, max 2 hours, common area only, no outside guests, must not disturb others.",
  },
  {
    title: "Respect for Staff",
    body: "Treat all hostel and housekeeping staff with respect. Do not use housekeeping for personal errands. No tips or gifts.",
  },
  {
    title: "Strictly Prohibited",
    body: "Ragging/fighting/violence (report immediately; expulsion + legal action) · Alcohol/drugs/smoking (zero tolerance; expulsion + legal action) · Gambling (banned; expulsion) · Internet/social media misuse (no defamatory posts about hostel, staff, or students) · Politics/communal activity (no propaganda against law/order) · Media (no interviews about the hostel to press/TV/radio without the Registrar's written permission).",
  },
  {
    title: "Vacation Policy & Overstay Fee",
    body: "Residents' personal belongings must not be left in the hostel during vacation. Management will not be held responsible for any loss or damages. Residents who stay over during vacation will be charged GHC 30 per day.",
  },
  {
    title: "Quiet Hours (10pm – 6am)",
    body: "Keep noise to a minimum to respect fellow residents preparing for classes and rest.",
  },
  {
    title: "Communication & WhatsApp Channel",
    body: "Official announcements are sent via the SME Hostels WhatsApp channel. You must join and keep notifications on. Ignoring official communications is not an excuse for non-compliance.",
  },
  {
    title: "Default & Disciplinary Action",
    body: "Default in any of the hostel contractual policies shall result in an appreciable fine, disciplinary action, or being totally expelled from the hostel without a refund or compensation; depending on the nature of the wrongful act or harm caused. This shall solely be effected by management decision as and when possible.",
  },
];
