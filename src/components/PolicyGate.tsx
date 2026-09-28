import { useEffect, useRef, useState } from "react";
import { ShieldCheck, ChevronDown, CheckCircle2 } from "lucide-react";
import { POLICY_SECTIONS } from "@/lib/policy-sections";

export function PolicyGate({ studentName, onAccept }: { studentName: string; onAccept: () => void }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [reachedBottom, setReachedBottom] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => {
      if (el.scrollTop + el.clientHeight >= el.scrollHeight - 24) setReachedBottom(true);
    };
    el.addEventListener("scroll", onScroll);
    onScroll();
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  const canAccept = reachedBottom && checked;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-background/95 backdrop-blur-sm animate-fade-in">
      {/* Header */}
      <div className="bg-gradient-primary px-5 py-5 text-white shadow-glass">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white/20">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider opacity-90">SME Hostels</div>
              <div className="text-lg font-bold leading-tight">Policies & Conduct</div>
              <div className="text-xs opacity-90">Hi {studentName.split(" ")[0]} — please review before continuing</div>
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="relative flex-1 overflow-hidden">
        <div ref={scrollRef} className="absolute inset-0 overflow-y-auto px-4 py-6 sm:px-6">
          <div className="mx-auto max-w-3xl space-y-4">
            <p className="rounded-2xl bg-primary/5 border border-primary/15 p-4 text-sm text-foreground/80">
              Welcome to SME Hostels. The following 10 sections outline the policies you must follow as a resident.
              Scroll through every section, then tick the box at the bottom and tap <strong>Accept & Continue</strong>.
            </p>
            {POLICY_SECTIONS.map((s, i) => (
              <section key={s.title} className="squircle bg-white p-5 shadow-soft animate-slide-up" style={{ animationDelay: `${i * 30}ms` }}>
                <h3 className="text-base font-bold text-primary">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-foreground/85">{s.body}</p>
              </section>
            ))}
            <div className="rounded-2xl border border-primary/30 bg-gradient-soft p-5 text-center">
              <CheckCircle2 className="mx-auto h-8 w-8 text-primary" />
              <div className="mt-2 text-sm font-semibold">You've reached the end of the policies.</div>
              <div className="text-xs text-muted-foreground">Tick the box below to enable the Accept button.</div>
            </div>
            <div className="h-2" />
          </div>
        </div>

        {/* Bouncing hint */}
        {!reachedBottom && (
          <div className="pointer-events-none absolute bottom-32 left-1/2 -translate-x-1/2 rounded-full bg-foreground/90 px-4 py-2 text-xs font-medium text-white shadow-glass animate-bounce">
            Scroll to read all <ChevronDown className="inline h-3 w-3" />
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-border bg-white/90 backdrop-blur-xl px-4 py-4 safe-bottom">
        <div className="mx-auto flex max-w-3xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <label className={`flex items-center gap-3 text-sm transition ${reachedBottom ? "" : "opacity-50"}`}>
            <input
              type="checkbox"
              disabled={!reachedBottom}
              checked={checked}
              onChange={(e) => setChecked(e.target.checked)}
              className="h-5 w-5 accent-[--color-primary]"
            />
            <span>I have read and agree to the SME Hostels policies.</span>
          </label>
          <button
            onClick={onAccept}
            disabled={!canAccept}
            className={`rounded-full px-6 py-3 text-sm font-semibold shadow-soft transition ${
              canAccept ? "bg-gradient-primary text-white hover:opacity-95" : "bg-muted text-muted-foreground cursor-not-allowed"
            }`}
          >
            Accept & Continue
          </button>
        </div>
      </div>
    </div>
  );
}
