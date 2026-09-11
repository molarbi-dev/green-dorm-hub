import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Edit3, X, Save, ShieldCheck } from "lucide-react";
import logo from "@/assets/logo.jpg";
import { initials } from "@/lib/hostel-store";
import { useStudent, useSettings, useUpdateStudent } from "@/lib/queries";

export const Route = createFileRoute("/student/profile")({
  head: () => ({ meta: [{ title: "My Profile — SME Hostels" }] }),
  component: ProfilePage,
});

function getCurrentStudentId(): string {
  if (typeof window === "undefined") return "";
  return sessionStorage.getItem("sme_student_id") ?? "";
}

function ProfilePage() {
  const nav = useNavigate();
  const currentId = getCurrentStudentId();
  const { data: student, isLoading } = useStudent(currentId);
  const { data: settings } = useSettings();
  const updateStudent = useUpdateStudent();
  const [edit, setEdit] = useState(false);
  const [form, setForm] = useState({ phone: "", whatsapp: "", guardian_name: "", guardian_phone: "" });

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

  function startEdit() {
    setForm({ phone: student!.phone, whatsapp: student!.whatsapp, guardian_name: student!.guardian_name, guardian_phone: student!.guardian_phone });
    setEdit(true);
  }

  function save() {
    updateStudent.mutate({ id: student!.id, patch: form }, { onSuccess: () => setEdit(false) });
  }

  const rows: { label: string; value: string; editable?: keyof typeof form }[] = [
    { label: "Full Name", value: student.full_name },
    { label: "Student ID", value: student.id },
    { label: "Course", value: student.course },
    { label: "Level", value: student.level },
    { label: "Room Number", value: student.room_no ?? "—" },
    { label: "Phone Number", value: form.phone || student.phone, editable: "phone" },
    { label: "WhatsApp", value: form.whatsapp || student.whatsapp, editable: "whatsapp" },
    { label: "Guardian Name", value: form.guardian_name || student.guardian_name, editable: "guardian_name" },
    { label: "Guardian Phone", value: form.guardian_phone || student.guardian_phone, editable: "guardian_phone" },
  ];

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
              <div className="text-base font-bold leading-tight">My Profile</div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-4 py-5 space-y-4">
        {/* Avatar card */}
        <div className="squircle bg-white p-6 text-center shadow-soft animate-slide-up">
          {(student as any).avatar_url ? (
            <img src={(student as any).avatar_url} alt={student.full_name}
              className="mx-auto h-20 w-20 rounded-full object-cover border-4 border-primary/20 shadow-soft" />
          ) : (
            <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-gradient-primary text-2xl font-bold text-white shadow-soft">
              {initials(student.full_name)}
            </div>
          )}
          <div className="mt-3 text-lg font-bold">{student.full_name}</div>
          <div className="text-xs text-muted-foreground">{student.id}</div>
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${student.reg_status === "paid" ? "bg-primary/10 text-primary" : student.reg_status === "partial" ? "bg-amber-100 text-amber-700" : "bg-destructive/10 text-destructive"}`}>
              Reg: {student.reg_status}
            </span>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${student.check_status === "in" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
              {student.check_status === "in" ? "Checked in" : "Checked out"}
            </span>
            <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${student.policy_accepted ? "bg-primary/10 text-primary" : "bg-amber-100 text-amber-700"}`}>
              <ShieldCheck className="h-3 w-3" /> {student.policy_accepted ? "Policy accepted" : "Policy pending"}
            </span>
          </div>
        </div>

        {/* Info table */}
        <div className="squircle bg-white shadow-soft overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div className="text-base font-bold">Account Details</div>
            {!edit ? (
              <button onClick={startEdit} className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                <Edit3 className="h-3 w-3" /> Edit
              </button>
            ) : (
              <div className="flex gap-2">
                <button onClick={() => setEdit(false)} className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs">
                  <X className="h-3 w-3" /> Cancel
                </button>
                <button onClick={save} disabled={updateStudent.isPending} className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground disabled:opacity-50">
                  <Save className="h-3 w-3" /> {updateStudent.isPending ? "Saving…" : "Save"}
                </button>
              </div>
            )}
          </div>
          {rows.map(({ label, value, editable }, i) => (
            <div key={label} className={`flex items-center justify-between px-5 py-3 text-sm ${i % 2 === 0 ? "bg-muted/20" : ""} border-b border-border last:border-none`}>
              <span className="text-xs text-muted-foreground w-32 shrink-0">{label}</span>
              {edit && editable ? (
                <input value={form[editable]} onChange={(e) => setForm({ ...form, [editable]: e.target.value })}
                  className="flex-1 rounded-lg border border-border bg-white px-2 py-1 text-right text-sm outline-none focus:ring-2 focus:ring-primary/30" />
              ) : (
                <span className="font-medium text-right break-all">{value}</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
