import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  LayoutDashboard, CreditCard, BookOpen,
  Zap, Phone, LogOut, ChevronRight, CheckCircle2,
  AlertTriangle, DoorOpen, User, Briefcase, MessageCircle, X, Wifi, Bus,
} from "lucide-react";
import logo from "@/assets/logo.jpg";
import building from "@/assets/building.jpg";
import { useStudent, useSettings, useActiveInternships, useStudentWifiInfo, useActiveTransportAgencies } from "@/lib/queries";
import { initials, fmtDate } from "@/lib/hostel-store";

export const Route = createFileRoute("/student-home")({
  head: () => ({ meta: [{ title: "My Account — SME Hostels" }] }),
  component: StudentHome,
});

function getCurrentStudentId(): string {
  if (typeof window === "undefined") return "";
  return sessionStorage.getItem("sme_student_id") ?? "";
}

function StudentHome() {
  const navigate = useNavigate();
  const currentId = getCurrentStudentId();
  const { data: student, isLoading } = useStudent(currentId);
  const { data: settings } = useSettings();
  const { data: internships = [] } = useActiveInternships();
  const { data: transportAgencies = [] } = useActiveTransportAgencies();
  const { data: wifiInfo } = useStudentWifiInfo(currentId);
  const [announcementDismissed, setAnnouncementDismissed] = useState(false);

  useEffect(() => {
    if (!currentId) navigate({ to: "/" });
  }, [currentId]);

  useEffect(() => {
    if (!isLoading && currentId && !student) {
      sessionStorage.removeItem("sme_student_id");
      navigate({ to: "/" });
    }
  }, [isLoading, student, currentId]);

  function signOut() {
    sessionStorage.removeItem("sme_student_id");
    localStorage.removeItem("sme_student_profile");
    navigate({ to: "/" });
  }

  const regStatus = student?.reg_status ?? "unpaid";
  const regFee = settings?.registration_fee ?? 100;
  const regPending = regStatus !== "paid";

  // All icons use primary colour — amber is reserved for warning badges only
  const sections = [
    {
      icon: LayoutDashboard,
      label: "Student Dashboard",
      description: "Check-in status, room details and activity history",
      to: "/student/dashboard" as const,
      search: {},
      badge: undefined as string | undefined,
      chip: undefined as string | undefined,
    },
    {
      icon: CreditCard,
      label: "Fees & Payments",
      description: regPending
        ? `GHS ${regFee.toLocaleString()} registration fee outstanding`
        : "Your registration fee has been settled",
      badge: regPending ? "Pending" : undefined,
      to: "/student/fees" as const,
      search: {},
      chip: undefined as string | undefined,
    },
    {
      icon: BookOpen,
      label: "Hostel Policy",
      description: "Full guidelines, rules and code of conduct",
      to: "/policy" as const,
      search: {},
      badge: undefined as string | undefined,
      chip: undefined as string | undefined,
    },
    {
      icon: Zap,
      label: "Electricity & Meter",
      description: student?.meter_no
        ? `Meter ${student.meter_no} · Pay via ECG PowerApp or log a top-up`
        : "View shared meter and pay electricity bills",
      to: "/student/meter" as const,
      search: {},
      badge: undefined as string | undefined,
      chip: student?.meter_no ? "Pay Now" : undefined,
    },
    {
      icon: Phone,
      label: "Contact & Emergency",
      description: "Management contacts and emergency lines",
      to: "/contact" as const,
      search: {},
      badge: undefined as string | undefined,
      chip: undefined as string | undefined,
    },
  ];

  if (isLoading) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  // Admin verification gate — student must be marked as paid by admin
  if (student && regPending) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-background">
        <div className="relative overflow-hidden bg-gradient-primary pb-16 pt-8">
          <img src={building} alt="" className="absolute inset-0 h-full w-full object-cover opacity-10 pointer-events-none" />
          <div className="relative mx-auto max-w-lg px-4 sm:px-6">
            <div className="flex items-center justify-between">
              <img src={logo} alt="SME Hostels" className="h-10 w-auto squircle bg-white p-1.5 object-contain shadow-soft" />
              <button onClick={signOut} className="flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-2 text-xs font-medium text-white backdrop-blur-md hover:bg-white/25 transition">
                <LogOut className="h-3.5 w-3.5" /> Sign out
              </button>
            </div>
            <div className="mt-8 text-white">
              <h1 className="text-2xl font-bold">Account pending verification</h1>
              <p className="mt-1 text-sm opacity-80">Management is reviewing your registration.</p>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-lg px-4 sm:px-6 -mt-8 relative z-10 pb-10">
          <div className="rounded-2xl bg-white shadow-glass p-6 space-y-5">
            {/* Student info */}
            <div className="flex items-center gap-4 rounded-xl bg-muted/40 p-4">
              <div className="h-14 w-14 overflow-hidden rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                {(student as any).avatar_url
                  ? <img src={(student as any).avatar_url} alt="" className="h-full w-full object-cover" />
                  : <span className="text-lg font-bold text-primary">{initials(student.full_name)}</span>}
              </div>
              <div>
                <div className="font-semibold">{student.full_name}</div>
                <div className="text-xs text-muted-foreground">{student.id} · Room {student.room_no ?? "—"}</div>
              </div>
            </div>

            {/* Status */}
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-2.5 w-2.5 rounded-full bg-amber-500 animate-pulse" />
                <span className="text-sm font-semibold text-amber-800">Awaiting payment verification</span>
              </div>
              <p className="text-xs text-amber-700 leading-relaxed">
                Your account has been created. Management needs to confirm your registration fee payment of{" "}
                <strong>GHS {regFee.toLocaleString()}</strong> before you can access the portal.
                Please pay to management directly and ask them to verify your account.
              </p>
            </div>

            {/* Steps */}
            <div className="space-y-2">
              <div className="text-sm font-semibold">What to do:</div>
              {[
                `Pay GHS ${regFee.toLocaleString()} registration fee to management (cash, bank or MoMo)`,
                `Use your Student ID as reference: ${student.id}`,
                "Management will verify your payment and activate your account",
                "Come back here and sign in once activated",
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-3 rounded-xl bg-muted/30 p-3">
                  <div className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary text-[10px] font-bold text-white mt-0.5">{i + 1}</div>
                  <span className="text-xs text-foreground leading-relaxed">{step}</span>
                </div>
              ))}
            </div>

            {/* Payment details */}
            {settings && (settings.bank_name || settings.momo_number) && (
              <div className="rounded-xl border border-border p-4 space-y-2 text-xs">
                <div className="font-semibold text-sm">Payment details</div>
                {settings.bank_name && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Bank</span>
                    <span className="font-medium text-right">{settings.bank_name} · {settings.account_number}</span>
                  </div>
                )}
                {settings.momo_number && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">MoMo</span>
                    <span className="font-medium">{settings.momo_number} ({settings.momo_name})</span>
                  </div>
                )}
              </div>
            )}

            <button onClick={() => window.location.reload()}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-white py-3 text-sm font-medium hover:bg-muted/40 transition">
              Check verification status
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* ── Hero ── fix: pb-20 so the overlapping card has room below */}
      <div className="relative overflow-hidden bg-gradient-primary pb-20 pt-8">
        <img src={building} alt="" className="absolute inset-0 h-full w-full object-cover opacity-10 pointer-events-none" />
        <div className="relative mx-auto max-w-5xl px-4 sm:px-6">
          {/* Top bar */}
          <div className="flex items-center justify-between">
            <img src={logo} alt="SME Hostels" className="h-10 w-auto squircle bg-white p-1.5 object-contain shadow-soft" />
            <div className="flex items-center gap-2">
              {student && (
                <>
                  {/* Avatar — always visible */}
                  <div className="h-9 w-9 overflow-hidden rounded-full bg-white/25 text-xs font-bold flex items-center justify-center shrink-0 border-2 border-white/30">
                    {(student as any).avatar_url
                      ? <img src={(student as any).avatar_url} alt="" className="h-full w-full object-cover" />
                      : <span className="text-white">{initials(student.full_name)}</span>}
                  </div>
                  {/* Name — desktop only */}
                  <div className="hidden sm:flex items-center rounded-full bg-white/15 px-3 py-1.5 text-sm text-white backdrop-blur-md">
                    <span className="font-medium">{student.full_name.split(" ")[0]}</span>
                  </div>
                </>
              )}
              <button onClick={signOut}
                className="flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-2 text-xs font-medium text-white backdrop-blur-md hover:bg-white/25 transition">
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Sign out</span>
              </button>
            </div>
          </div>

          {/* Greeting */}
          <div className="mt-8 text-white">
            <div className="text-xs font-semibold uppercase tracking-widest opacity-70">
              {settings?.hostel_name ?? "SME Hostels"}
            </div>
            <h1 className="mt-1 text-3xl font-bold sm:text-4xl">
              {student ? `Welcome back, ${student.full_name.split(" ")[0]}` : "Welcome"}
            </h1>
            {student && (
              <div className="mt-2 flex flex-wrap items-center gap-4 text-sm opacity-80">
                <span className="flex items-center gap-1.5"><User className="h-3.5 w-3.5" />{student.id}</span>
                <span className="flex items-center gap-1.5"><DoorOpen className="h-3.5 w-3.5" />Room {student.room_no ?? "—"}</span>
                <span className="flex items-center gap-1.5"><Zap className="h-3.5 w-3.5" />Meter {student.meter_no ?? "—"}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Status card — sits below hero with mt-negative to overlap slightly ── */}
      {student && (
        <div className="mx-auto max-w-5xl px-4 sm:px-6 -mt-10 relative z-10">
          <div className={`rounded-2xl p-4 flex items-start gap-3 shadow-soft ${
            regPending
              ? "bg-amber-50 border border-amber-200"
              : "bg-white border border-primary/20"
          }`}>
            {regPending
              ? <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600 mt-0.5" />
              : <CheckCircle2 className="h-5 w-5 shrink-0 text-primary mt-0.5" />}
            <div className="flex-1 min-w-0">
              <div className={`text-sm font-semibold ${regPending ? "text-amber-800" : "text-primary"}`}>
                {regPending ? "Registration fee outstanding" : "Account fully active"}
              </div>
              {regPending && (
                <p className="mt-0.5 text-xs text-amber-700 leading-relaxed">
                  Pay GHS {regFee.toLocaleString()} to management via bank transfer or MoMo.
                  Use your Student ID as the payment reference.
                </p>
              )}
            </div>
            {regPending && (
              <Link to="/student/fees" search={{} as any}
                className="shrink-0 rounded-full bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700 transition">
                View details
              </Link>
            )}
          </div>
        </div>
      )}

      {/* ── Announcement banner ── */}
      {settings?.announcement?.trim() && !announcementDismissed && (
        <div className="mx-auto max-w-5xl px-4 sm:px-6 -mt-2">
          <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 shadow-soft">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
            <p className="flex-1 text-xs leading-relaxed text-amber-800">{settings.announcement}</p>
            <button onClick={() => setAnnouncementDismissed(true)} className="shrink-0 text-amber-500 hover:text-amber-700">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── Section grid ── */}
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8">
        <p className="text-sm font-semibold text-muted-foreground mb-4">
          Select a section to continue
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {sections.map((s) => (
            <Link key={s.label} to={s.to} search={s.search as any}
              className="group relative flex items-start gap-4 rounded-2xl bg-white p-5 shadow-soft ring-1 ring-border/50 transition hover:shadow-glass hover:-translate-y-0.5 active:scale-[.98]">
              {/* Electricity card gets an amber icon background; others use primary */}
              <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${s.chip ? "bg-amber-100 text-amber-600" : "bg-primary/10 text-primary"}`}>
                <s.icon className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0 pt-0.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold text-foreground">{s.label}</span>
                  {s.badge && (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
                      {s.badge}
                    </span>
                  )}
                  {s.chip && (
                    <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                      {s.chip}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{s.description}</p>
              </div>
              <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground/40 transition group-hover:text-primary group-hover:translate-x-0.5" />
            </Link>
          ))}
        </div>
      </div>

      {/* ── WhatsApp channel + Internships ── */}
      <div className="mx-auto max-w-5xl px-4 sm:px-6 pb-2 space-y-6">

        {/* Wi-Fi Card */}
        <WifiCard wifiInfo={wifiInfo} />

        {/* WhatsApp Channel */}
        {settings?.whatsapp_channel_url && (
          <div className="flex items-center justify-between rounded-2xl border border-[#25D366]/30 bg-[#25D366]/5 px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#25D366]/15 text-[#25D366]">
                <MessageCircle className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm font-semibold">Join our WhatsApp Channel</div>
                <div className="text-xs text-muted-foreground">Stay updated with hostel news & announcements</div>
              </div>
            </div>
            <a href={settings.whatsapp_channel_url} target="_blank" rel="noopener noreferrer"
              className="shrink-0 rounded-full bg-[#25D366] px-4 py-2 text-xs font-semibold text-white hover:bg-[#1ebe5d] transition">
              Join
            </a>
          </div>
        )}

        {/* Internships */}
        {internships.length > 0 && (
          <div>
            <div className="mb-3 flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold">Internship Opportunities</span>
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">{internships.length}</span>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {internships.map((co: any) => (
                <div key={co.id} className="rounded-2xl bg-white p-4 shadow-soft ring-1 ring-border/50">
                  <div className="flex items-start gap-3">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary overflow-hidden">
                    {co.logo_url
                      ? <img src={co.logo_url} alt={co.company_name} className="h-full w-full object-contain p-1" />
                      : <Briefcase className="h-4 w-4" />}
                  </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-sm font-bold truncate">{co.company_name}</span>
                        {co.industry && <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">{co.industry}</span>}
                      </div>
                      {co.description && <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed line-clamp-2">{co.description}</p>}
                    </div>
                  </div>
                  {/* Contact details */}
                  <div className="mt-3 space-y-1.5 border-t border-border pt-3">
                    {co.contact_person && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <User className="h-3.5 w-3.5 shrink-0" />
                        <span>{co.contact_person}</span>
                      </div>
                    )}
                    {co.contact_phone && (
                      <a href={`tel:${co.contact_phone}`} className="flex items-center gap-2 text-xs text-primary hover:underline">
                        <Phone className="h-3.5 w-3.5 shrink-0" />
                        <span>{co.contact_phone}</span>
                      </a>
                    )}
                    {co.contact_whatsapp && (
                      <a href={`https://wa.me/${co.contact_whatsapp.replace(/[^0-9]/g, "")}`} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-2 text-xs text-[#25D366] hover:underline">
                        <MessageCircle className="h-3.5 w-3.5 shrink-0" />
                        <span>{co.contact_whatsapp}</span>
                      </a>
                    )}
                    {co.contact_email && (
                      <a href={`mailto:${co.contact_email}`} className="flex items-center gap-2 text-xs text-primary hover:underline">
                        <span className="text-[11px] font-medium">✉</span>
                        <span>{co.contact_email}</span>
                      </a>
                    )}
                    {co.address && (
                      <div className="flex items-start gap-2 text-xs text-muted-foreground">
                        <span className="shrink-0">📍</span>
                        <span>{co.address}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Transport Agencies */}
        {transportAgencies.length > 0 && (
          <div>
            <div className="mb-3 flex items-center gap-2">
              <Bus className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold">Transport Services</span>
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">{transportAgencies.length}</span>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {transportAgencies.map((agency: any) => (
                <div key={agency.id} className="rounded-2xl bg-white p-4 shadow-soft ring-1 ring-border/50">
                  <div className="flex items-start gap-3">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary overflow-hidden">
                      {agency.logo_url
                        ? <img src={agency.logo_url} alt={agency.agency_name} className="h-full w-full object-contain p-1" />
                        : <Bus className="h-4 w-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-sm font-bold truncate">{agency.agency_name}</span>
                        {agency.route && (
                          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] text-primary font-medium">{agency.route}</span>
                        )}
                      </div>
                      {agency.description && <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed line-clamp-2">{agency.description}</p>}
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-1.5 text-xs">
                    {agency.pickup_location && (
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <span>📍</span><span className="truncate">From: {agency.pickup_location}</span>
                      </div>
                    )}
                    {agency.destination && (
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <span>🏁</span><span className="truncate">To: {agency.destination}</span>
                      </div>
                    )}
                    {agency.departure_time && (
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <span>🕐</span><span>{agency.departure_time}</span>
                      </div>
                    )}
                    {agency.price && (
                      <div className="flex items-center gap-1.5 font-semibold text-primary">
                        <span>💰</span><span>{agency.price}</span>
                      </div>
                    )}
                  </div>
                  <div className="mt-3 space-y-1.5 border-t border-border pt-3">
                    {agency.contact_person && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <User className="h-3.5 w-3.5 shrink-0" /><span>{agency.contact_person}</span>
                      </div>
                    )}
                    {agency.contact_phone && (
                      <a href={`tel:${agency.contact_phone}`} className="flex items-center gap-2 text-xs text-primary hover:underline">
                        <Phone className="h-3.5 w-3.5 shrink-0" /><span>{agency.contact_phone}</span>
                      </a>
                    )}
                    {agency.contact_whatsapp && (
                      <a href={`https://wa.me/${agency.contact_whatsapp.replace(/[^0-9]/g, "")}`} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-2 text-xs text-[#25D366] hover:underline">
                        <MessageCircle className="h-3.5 w-3.5 shrink-0" /><span>{agency.contact_whatsapp}</span>
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Footer */}
      <div className="mx-auto max-w-5xl px-4 sm:px-6 pb-10">
        <div className="rounded-2xl border border-border bg-muted/30 px-5 py-4 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} {settings?.hostel_name ?? "SME Hostels"}
          {settings?.address ? ` · ${settings.address}` : ""}
        </div>
      </div>
    </div>
  );
}

// ── Wi-Fi Card ────────────────────────────────────────────────────────────────

function WifiCard({ wifiInfo }: { wifiInfo: any }) {
  const WIFI_URL = "https://wifi.sme-hostel.site";

  // No wifi account yet
  if (!wifiInfo?.account) {
    return (
      <div className="rounded-2xl border border-border bg-muted/30 px-5 py-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
              <Wifi className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-semibold">SME Hostels Wi-Fi</div>
              <div className="text-xs text-muted-foreground">No Wi-Fi account set up yet</div>
            </div>
          </div>
          <a
            href={WIFI_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90 transition"
          >
            Set up Wi-Fi
          </a>
        </div>
      </div>
    );
  }

  const sub = wifiInfo.subscription;
  const voucher = wifiInfo.voucher;
  const isActive = sub?.status === "active";

  // Time left calculation
  function timeLeft(iso: string): string {
    const diff = new Date(iso).getTime() - Date.now();
    if (diff <= 0) return "Expired";
    const hours = Math.floor(diff / 3_600_000);
    if (hours < 1) return `${Math.floor(diff / 60_000)} min left`;
    if (hours < 24) return `${hours}h left`;
    return `${Math.floor(hours / 24)}d ${hours % 24}h left`;
  }

  return (
    <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
            <Wifi className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm font-semibold">SME Hostels Wi-Fi</div>
            <div className="text-xs text-muted-foreground">@{wifiInfo.account.username}</div>
          </div>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${wifiInfo.account.is_active ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"}`}>
          {wifiInfo.account.is_active ? "Active" : "Suspended"}
        </span>
      </div>

      {/* Active subscription */}
      {isActive && sub ? (
        <div className="rounded-xl bg-white/60 p-3 space-y-1.5 mb-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Package</span>
            <span className="font-semibold">{(sub.wifi_packages as any)?.name ?? "—"}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Expires</span>
            <span className="font-semibold">{sub.expires_at ? fmtDate(new Date(sub.expires_at).getTime()) : "—"}</span>
          </div>
          {sub.expires_at && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Time left</span>
              <span className="font-semibold text-primary">{timeLeft(sub.expires_at)}</span>
            </div>
          )}
          {voucher && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Voucher</span>
              <span className="font-mono font-bold tracking-wider text-primary">{voucher.voucher_code}</span>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-xl bg-white/60 p-3 mb-3 text-sm text-muted-foreground text-center">
          No active subscription
        </div>
      )}

      {/* CTA */}
      <a
        href={WIFI_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition"
      >
        <Wifi className="h-4 w-4" />
        {isActive ? "Buy another package" : "Buy Wi-Fi package"}
      </a>
    </div>
  );
}
