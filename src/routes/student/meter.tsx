import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowLeft, Zap, AlertTriangle, Copy, ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import logo from "@/assets/logo.jpg";
import { fmtTime, initials } from "@/lib/hostel-store";
import {
  useStudent, useSettings, useStudents, useMeters,
  useElectricityLogs, useLogElectricityTopup,
} from "@/lib/queries";

export const Route = createFileRoute("/student/meter")({
  head: () => ({ meta: [{ title: "Electricity & Meter — SME Hostels" }] }),
  component: MeterPage,
});

function getCurrentStudentId(): string {
  if (typeof window === "undefined") return "";
  return sessionStorage.getItem("sme_student_id") ?? "";
}

function openEcgApp(meterNo: string) {
  const ua = navigator.userAgent;
  if (/android/i.test(ua)) {
    window.location.href =
      `intent://topup?meter=${encodeURIComponent(meterNo)}#Intent;package=com.ecgmobile;scheme=ecgpowerapp;` +
      `S.browser_fallback_url=${encodeURIComponent("https://play.google.com/store/apps/details?id=com.ecgmobile")};end`;
  } else if (/iphone|ipad|ipod/i.test(ua)) {
    window.open("https://apps.apple.com/app/ecg-powerapp/id1398352884", "_blank");
  } else {
    window.open("https://play.google.com/store/apps/details?id=com.ecgmobile", "_blank");
  }
}

function MeterPage() {
  const nav = useNavigate();
  const currentId = getCurrentStudentId();
  const { data: student, isLoading } = useStudent(currentId);
  const { data: settings } = useSettings();
  const { data: meters = [] } = useMeters();
  const { data: allStudents = [] } = useStudents();
  const { data: elecLogs = [] } = useElectricityLogs(student?.meter_no ?? undefined);
  const logTopup = useLogElectricityTopup();

  const [showTopupForm, setShowTopupForm] = useState(false);
  const [topupAmount, setTopupAmount] = useState("");
  const [topupConfirmation, setTopupConfirmation] = useState("");

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

  const meter = meters.find((m: any) => m.no === student.meter_no);
  const roommates = allStudents.filter((s: any) => s.meter_no === student.meter_no);

  function submitTopup(e: React.FormEvent) {
    e.preventDefault();
    if (!student?.meter_no) return;
    logTopup.mutate(
      { studentId: currentId, meterNo: student.meter_no, amount: Number(topupAmount), confirmation: topupConfirmation },
      { onSuccess: () => { setShowTopupForm(false); setTopupAmount(""); setTopupConfirmation(""); } },
    );
  }

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
              <div className="text-base font-bold leading-tight">Electricity & Meter</div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-4 py-5 space-y-4">
        {!meter ? (
          <div className="squircle bg-white p-8 text-center shadow-soft">
            <Zap className="mx-auto h-10 w-10 text-muted-foreground/40" />
            <div className="mt-3 text-sm font-semibold">No meter assigned</div>
            <div className="mt-1 text-xs text-muted-foreground">Contact management to get a meter assigned to your room.</div>
          </div>
        ) : (
          <>
            {/* Management notice */}
            {meter.notice && (
              <div className="flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 animate-slide-up">
                <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600 mt-0.5" />
                <div>
                  <div className="text-sm font-semibold text-amber-900">Management Notice</div>
                  <div className="text-xs text-amber-800 mt-0.5">{(meter as any).notice}</div>
                </div>
              </div>
            )}

            {/* Pay electricity */}
            <div className="squircle overflow-hidden shadow-soft animate-slide-up">
              <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/25">
                    <Zap className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">Pay Electricity Bill</div>
                    <div className="text-xs text-white/80">Powered by ECG PowerApp</div>
                  </div>
                </div>
              </div>
              <div className="bg-white px-5 py-4 space-y-3">
                <div className="flex items-center justify-between rounded-xl bg-amber-50 border border-amber-200 px-4 py-3">
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-amber-700 font-semibold">Your Meter Number</div>
                    <div className="text-xl font-bold text-amber-900 mt-0.5">{meter.no}</div>
                  </div>
                  <button onClick={async () => { await navigator.clipboard.writeText(meter.no); toast.success("Meter number copied"); }}
                    className="grid h-9 w-9 place-items-center rounded-xl bg-white border border-amber-200 text-amber-700 hover:bg-amber-100 transition">
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Copy your meter number above, then open the <strong>ECG PowerApp</strong> to load prepaid units.
                </p>
                <button onClick={() => openEcgApp(meter.no)}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 py-3.5 text-sm font-semibold text-white shadow-soft hover:opacity-90 active:scale-[.98] transition">
                  <ExternalLink className="h-4 w-4" /> Open ECG PowerApp · {meter.no}
                </button>
                <div className="flex items-center justify-center gap-4 pt-0.5">
                  <a href="https://play.google.com/store/apps/details?id=com.ecgmobile" target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground underline-offset-2 hover:text-primary hover:underline">Android</a>
                  <span className="text-muted-foreground text-xs">·</span>
                  <a href="https://apps.apple.com/app/ecg-powerapp/id1398352884" target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground underline-offset-2 hover:text-primary hover:underline">iOS</a>
                  <span className="text-muted-foreground text-xs">·</span>
                  <a href="tel:*226%23" className="text-xs text-muted-foreground underline-offset-2 hover:text-primary hover:underline">Dial *226#</a>
                </div>
              </div>
            </div>

            {/* Log top-up */}
            <div className="squircle bg-white p-5 shadow-soft">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-base font-bold">Log a Top-up</div>
                  <div className="text-xs text-muted-foreground">Bought units? Log it — meter-mates get notified via SMS.</div>
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
                    <label className="mb-1 block text-xs font-medium">Confirmation SMS (paste here)</label>
                    <textarea required value={topupConfirmation} onChange={(e) => setTopupConfirmation(e.target.value)}
                      placeholder="Paste the confirmation message you received after buying units…" rows={3}
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

            {/* Top-up history */}
            <div className="squircle bg-white p-5 shadow-soft">
              <div className="mb-3 text-base font-bold">Meter Top-up History</div>
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
            </div>

            {/* Rooms on meter */}
            <div className="squircle bg-white p-5 shadow-soft">
              <div className="mb-3 text-base font-bold">Rooms on this meter</div>
              <div className="flex flex-wrap gap-2">
                {((meter as any).rooms as string[]).map((r) => (
                  <span key={r} className={`rounded-full px-3 py-1 text-xs font-medium ${r === student.room_no ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}>{r}</span>
                ))}
              </div>
            </div>

            {/* Meter-mates */}
            <div className="squircle bg-white p-5 shadow-soft">
              <div className="mb-3 text-base font-bold">Students sharing this meter ({roommates.length})</div>
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
            </div>
          </>
        )}
      </div>
    </div>
  );
}
