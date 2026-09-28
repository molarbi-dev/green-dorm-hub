import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, BookOpen, Download } from "lucide-react";
import { usePolicies } from "@/lib/queries";
import logo from "@/assets/logo.jpg";

export const Route = createFileRoute("/policy")({
  head: () => ({ meta: [{ title: "Hostel Policy — SME Hostels" }] }),
  component: PolicyPage,
});

function PolicyPage() {
  const { data: policies = [], isLoading } = usePolicies();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 border-b border-border bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3 sm:px-6">
          <Link to="/student-home"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-border bg-white text-muted-foreground hover:bg-muted/50 transition">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <img src={logo} alt="SME Hostels" className="h-8 w-auto squircle bg-white p-1 object-contain" />
          <div>
            <div className="text-sm font-semibold text-foreground">Hostel Policy</div>
            <div className="text-xs text-muted-foreground">Guidelines & Code of Conduct</div>
          </div>
        </div>
      </header>

      <div className="bg-gradient-primary px-4 py-10 text-white sm:px-6">
        <div className="mx-auto max-w-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white/15 shrink-0">
              <BookOpen className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">SME Hostel Guidelines</h1>
              <p className="mt-0.5 text-sm opacity-80">Please read all sections carefully before proceeding.</p>
            </div>
          </div>
          <a
            href="/sme-hostels-guidelines.pdf"
            download="SME-Hostels-Guidelines.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md px-4 py-2.5 text-xs font-semibold text-white transition shadow-sm"
          >
            <Download className="h-4 w-4" /> Download PDF
          </a>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 space-y-3">
        {isLoading && (
          <div className="py-10 text-center text-sm text-muted-foreground">Loading policies…</div>
        )}
        {policies.map((s: any, i: number) => (
          <div key={s.id ?? i} className="rounded-2xl bg-white shadow-soft ring-1 ring-border/40 overflow-hidden">
            <div className="flex items-start gap-4 px-5 py-4">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary mt-0.5">
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-foreground">{s.title.replace(/^\d+\.\s*/, "")}</div>
                <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{s.body}</p>
              </div>
            </div>
          </div>
        ))}

        <Link to="/student-home"
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-primary py-3.5 text-sm font-semibold text-primary-foreground shadow-soft hover:opacity-95 transition mt-4">
          <ArrowLeft className="h-4 w-4" />
          Back to my account
        </Link>
      </div>

      <div className="pb-8 text-center text-xs text-muted-foreground">
        SME Hostels — all policies subject to management review
      </div>
    </div>
  );
}
