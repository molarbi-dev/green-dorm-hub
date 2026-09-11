import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo } from "react";
import { ArrowLeft, History, CheckCircle2 } from "lucide-react";
import logo from "@/assets/logo.jpg";
import { fmtTime, fmtDate } from "@/lib/hostel-store";
import { useStudent, useSettings } from "@/lib/queries";

export const Route = createFileRoute("/student/history")({
  head: () => ({ meta: [{ title: "Check-In History — SME Hostels" }] }),
  component: HistoryPage,
});

function getCurrentStudentId(): string {
  if (typeof window === "undefined") return "";
  return sessionStorage.getItem("sme_student_id") ?? "";
}

function HistoryPage() {
  const nav = useNavigate();
  const currentId = getCurrentStudentId();
  const { data: student, isLoading } = useStudent(currentId);
  const { data: settings } = useSettings();

  useEffect(() => { if (!currentId) nav({ to: "/" }); }, [currentId]);
  useEffect(() => {
    if (!isLoading && currentId && !student) {
      sessionStorage.removeItem("sme_student_id");
      nav({ to: "/" });
    }
  }, [isLoading, student, currentId]);

  const log = useMemo(() => {
    if (!student) return [];
    const out: { in: number; out?: number }[] = [];
    if (student.last_check_in) {
      out.push({
        in: new Date(student.last_check_in).getTime(),
        out: student.last_check_out ? new Date(student.last_check_out).getTime() : undefined,
      });
    }
    return out;
  }, [student]);

  if (!currentId || isLoading) {
    return <div className="grid min-h-screen place-items-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;
  }
  if (!student) return null;

  const month = new Date().getMonth();
  const thisMonth = log.filter((l) => new Date(l.in).getMonth() === month).length;

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
              <div className="text-base font-bold leading-tight">Check-In History</div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-4 py-5 space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="squircle bg-white p-4 shadow-soft text-center">
            <History className="mx-auto h-5 w-5 text-primary" />
            <div className="mt-1 text-xs text-muted-foreground">Total Check-Ins</div>
            <div className="mt-0.5 text-xl font-bold">{log.length}</div>
          </div>
          <div className="squircle bg-white p-4 shadow-soft text-center">
            <CheckCircle2 className="mx-auto h-5 w-5 text-primary" />
            <div className="mt-1 text-xs text-muted-foreground">This Month</div>
            <div className="mt-0.5 text-xl font-bold">{thisMonth}</div>
          </div>
        </div>

        {/* Current status */}
        <div className={`squircle p-4 shadow-soft ${student.check_status === "in" ? "bg-primary/10 border border-primary/20" : "bg-white border border-border"}`}>
          <div className="flex items-center gap-3">
            <div className={`grid h-10 w-10 place-items-center rounded-xl ${student.check_status === "in" ? "bg-primary text-white" : "bg-muted text-muted-foreground"}`}>
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-bold">{student.check_status === "in" ? "Currently Checked In" : "Currently Checked Out"}</div>
              <div className="text-xs text-muted-foreground">Room {student.room_no ?? "—"}</div>
            </div>
          </div>
        </div>

        {/* Log */}
        <div className="squircle bg-white p-5 shadow-soft">
          <div className="mb-3 text-base font-bold">Activity Log</div>
          {log.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">No check-in history yet.</div>
          ) : (
            <div className="divide-y divide-border">
              {log.map((l, i) => (
                <div key={i} className="flex items-center justify-between py-3">
                  <div>
                    <div className="text-sm font-medium">{fmtDate(l.in)}</div>
                    <div className="text-xs text-muted-foreground">
                      In {fmtTime(l.in)} · Out {l.out ? fmtTime(l.out) : "—"}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px]">{student.room_no}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${l.out ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"}`}>
                      {l.out ? "Completed" : "Active"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
