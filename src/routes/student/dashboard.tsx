import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowLeft, CheckCircle2, XCircle, DoorOpen, Wallet, Zap, History, Phone,
} from "lucide-react";
import logo from "@/assets/logo.jpg";
import { fmtTime, initials } from "@/lib/hostel-store";
import {
  useStudent, useSettings, useStudents,
  useCheckIn, useCheckOut, useAcceptPolicy,
} from "@/lib/queries";
import { PolicyGate } from "@/components/PolicyGate";

export const Route = createFileRoute("/student/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — SME Hostels" }] }),
  component: DashboardPage,
});

function getCurrentStudentId(): string {
  if (typeof window === "undefined") return "";
  return sessionStorage.getItem("sme_student_id") ?? "";
}

function DashboardPage() {
  const nav = useNavigate();
  const currentId = getCurrentStudentId();
  const { data: student, isLoading } = useStudent(currentId);
  const { data: settings } = useSettings();
  const { data: allStudents = [] } = useStudents();
  const checkIn = useCheckIn();
  const checkOut = useCheckOut();
  const acceptPolicyMut = useAcceptPolicy();
  const [confirm, setConfirm] = useState<"in" | "out" | null>(null);

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

  if (!student) return null;

  if (!student.policy_accepted) {
    return <PolicyGate studentName={student.full_name} onAccept={() => acceptPolicyMut.mutate(student.id)} />;
  }

  const regFee = settings?.registration_fee ?? 0;
  const regPct = Math.min(100, (student.reg_paid / regFee) * 100);
  const meterRoomies = allStudents.filter((x: any) => x.meter_no === student.meter_no).length;

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
              <div className="text-xs opacity-80">{settings?.hostel_name ?? "SME Hostels"}</div>
              <div className="text-base font-bold leading-tight">Dashboard</div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-4 py-5 space-y-4">
        {/* Check-in card */}
        <div className="squircle bg-white p-5 shadow-soft animate-slide-up">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${student.check_status === "in" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
              {student.check_status === "in" ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
              {student.check_status === "in" ? "Checked in" : "Checked out"}
            </span>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${student.reg_status === "paid" ? "bg-primary/10 text-primary" : student.reg_status === "partial" ? "bg-amber-100 text-amber-700" : "bg-destructive/10 text-destructive"}`}>
              Reg: {student.reg_status}
            </span>
            <span className="ml-auto text-xs text-muted-foreground">Last in: {fmtTime(student.last_check_in ? new Date(student.last_check_in).getTime() : undefined)}</span>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button onClick={() => setConfirm("in")} disabled={student.check_status === "in" || checkIn.isPending}
              className="rounded-2xl bg-primary py-3 text-sm font-semibold text-primary-foreground shadow-soft disabled:opacity-50 hover:opacity-95">
              Check In
            </button>
            <button onClick={() => setConfirm("out")} disabled={student.check_status === "out" || checkOut.isPending}
              className="rounded-2xl border border-border bg-white py-3 text-sm font-semibold disabled:opacity-50 hover:bg-muted/40">
              Check Out
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { icon: DoorOpen, label: "Room", value: student.room_no ?? "—" },
            { icon: Wallet, label: "Reg. Fee", value: student.reg_status === "paid" ? "Paid" : "Pending" },
            { icon: Zap, label: "Meter", value: student.meter_no ?? "—" },
            { icon: CheckCircle2, label: "Status", value: student.check_status === "in" ? "In" : "Out" },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="squircle bg-white p-4 shadow-soft text-center">
              <Icon className="mx-auto h-5 w-5 text-primary" />
              <div className="mt-1 text-xs text-muted-foreground">{label}</div>
              <div className="mt-0.5 text-sm font-bold">{value}</div>
            </div>
          ))}
        </div>

        {/* Registration fee progress */}
        {settings && (
          <div className="squircle bg-white p-5 shadow-soft">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-bold">Registration Fee</div>
              <Link to="/student/fees" className="rounded-full bg-sky-500 px-3 py-1 text-xs font-semibold text-white">View Details</Link>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>Paid: GHS {student.reg_paid.toLocaleString()}</span>
              <span>Total: GHS {regFee.toLocaleString()}</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div className="h-full bg-sky-500 transition-all" style={{ width: `${regPct}%` }} />
            </div>
          </div>
        )}

        {/* Quick nav */}
        <div className="grid grid-cols-2 gap-3">
          <Link to="/student/fees" className="squircle bg-white p-4 shadow-soft flex items-center gap-3 hover:bg-muted/30">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary shrink-0"><Wallet className="h-5 w-5" /></div>
            <div className="text-sm font-semibold">Fees & Payments</div>
          </Link>
          <Link to="/student/meter" className="squircle bg-white p-4 shadow-soft flex items-center gap-3 hover:bg-muted/30">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-violet-100 text-violet-700 shrink-0"><Zap className="h-5 w-5" /></div>
            <div className="text-sm font-semibold">Meter Info ({meterRoomies} sharing)</div>
          </Link>
          <Link to="/student/history" className="squircle bg-white p-4 shadow-soft flex items-center gap-3 hover:bg-muted/30">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary shrink-0"><History className="h-5 w-5" /></div>
            <div className="text-sm font-semibold">Check-In History</div>
          </Link>
          <Link to="/student/profile" className="squircle bg-white p-4 shadow-soft flex items-center gap-3 hover:bg-muted/30">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-muted shrink-0">
              <div className="grid h-7 w-7 place-items-center rounded-full bg-gradient-primary text-[10px] font-bold text-white">{initials(student.full_name)}</div>
            </div>
            <div className="text-sm font-semibold">My Profile</div>
          </Link>
        </div>

        {/* Guardian */}
        <div className="squircle bg-white p-5 shadow-soft">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Guardian Contact</div>
          <div className="mt-1.5 text-base font-semibold">{student.guardian_name || "—"}</div>
          {student.guardian_phone && (
            <a href={`tel:${student.guardian_phone}`} className="mt-1 inline-flex items-center gap-1.5 text-sm text-primary">
              <Phone className="h-3.5 w-3.5" /> {student.guardian_phone}
            </a>
          )}
        </div>
      </div>

      {/* Confirm modal */}
      {confirm && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onClick={() => setConfirm(null)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-sm squircle bg-white p-6 shadow-glass">
            <div className="text-lg font-bold">{confirm === "in" ? "Confirm Check In" : "Confirm Check Out"}</div>
            <div className="mt-1 text-sm text-muted-foreground">
              {confirm === "in" ? "Mark yourself as currently in the hostel?" : "Mark yourself as currently out of the hostel?"}
            </div>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <button onClick={() => setConfirm(null)} className="rounded-2xl border border-border bg-white py-2.5 text-sm font-medium">Cancel</button>
              <button onClick={() => { if (confirm === "in") checkIn.mutate(student.id); else checkOut.mutate(student.id); setConfirm(null); }}
                className="rounded-2xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground">Confirm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
