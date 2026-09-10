import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Phone, Mail, MapPin, Clock, AlertTriangle, MessageCircle, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import logo from "@/assets/logo.jpg";
import { useSettings } from "@/lib/queries";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact & Emergency — SME Hostels" },
      { name: "description", content: "Reach SME Hostels reception, security, and emergency contacts 24/7." },
    ],
  }),
  component: Contact,
});

function Contact() {
  const { data: settings } = useSettings();
  const [submitted, setSubmitted] = useState(false);

  const emergency = [
    settings?.emergency_security && { label: "Hostel Security (24/7)", value: settings.emergency_security, href: `tel:${settings.emergency_security.replace(/\s/g, "")}` },
    settings?.emergency_medical && { label: "Medical / First Aid", value: settings.emergency_medical, href: `tel:${settings.emergency_medical.replace(/\s/g, "")}` },
    { label: "Fire Service", value: "192", href: "tel:192" },
    { label: "Police", value: "191", href: "tel:191" },
  ].filter(Boolean) as { label: string; value: string; href: string }[];

  const general = [
    settings?.contact_phone && { icon: Phone, label: "Reception", value: settings.contact_phone, href: `tel:${settings.contact_phone.replace(/\s/g, "")}` },
    settings?.email && { icon: Mail, label: "Email", value: settings.email, href: `mailto:${settings.email}` },
    settings?.contact_whatsapp && { icon: MessageCircle, label: "WhatsApp", value: settings.contact_whatsapp, href: `https://wa.me/${settings.contact_whatsapp.replace(/[^0-9]/g, "")}` },
    settings?.address && { icon: MapPin, label: "Address", value: settings.address, href: undefined },
    { icon: Clock, label: "Office Hours", value: settings?.office_hours || "Mon–Sat · 8:00 AM – 8:00 PM", href: undefined },
  ].filter(Boolean) as { icon: typeof Phone; label: string; value: string; href?: string }[];

  return (
    <div className="min-h-screen bg-gradient-soft">
      <header className="border-b border-border bg-white/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link to="/" className="flex items-center gap-3">
            <img src={logo} alt="SME Hostels" className="h-10 w-auto" />
          </Link>
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary">
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-10">
        <div className="animate-slide-up">
          <h1 className="text-4xl font-bold tracking-tight">Get in touch</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Our team is available around the clock. For life-threatening emergencies, call the urgent lines below immediately.
          </p>
        </div>

        {/* Emergency contacts */}
        {emergency.length > 0 && (
          <section className="mt-8 animate-scale-in">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-destructive/10 px-3 py-1 text-xs font-semibold text-destructive">
              <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive/60" /><span className="relative inline-flex h-2 w-2 rounded-full bg-destructive" /></span>
              Emergency contacts · 24/7
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {emergency.map((c) => (
                <a key={c.label} href={c.href}
                  className="squircle group flex flex-col gap-2 border border-destructive/20 bg-white p-5 shadow-soft transition hover:-translate-y-0.5 hover:shadow-glass">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  <div className="text-xs font-medium text-muted-foreground">{c.label}</div>
                  <div className="text-lg font-semibold text-foreground group-hover:text-destructive">{c.value}</div>
                </a>
              ))}
            </div>
          </section>
        )}

        <section className="mt-10 grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 squircle bg-white p-6 shadow-soft">
            <h2 className="text-lg font-semibold">Send us a message</h2>
            <p className="mt-1 text-sm text-muted-foreground">We typically reply within 2 hours during office hours.</p>
            {submitted ? (
              <div className="mt-5 rounded-2xl border border-primary/20 bg-primary/5 px-6 py-8 text-center">
                <div className="text-2xl">✅</div>
                <p className="mt-2 font-semibold text-foreground">Message received!</p>
                <p className="mt-1 text-sm text-muted-foreground">We'll get back to you within 2 hours during office hours.</p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="mt-4 text-sm text-primary underline underline-offset-2"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const fd = new FormData(e.currentTarget);
                  const name = fd.get("name") as string;
                  const email = fd.get("email") as string;
                  const phone = fd.get("phone") as string;
                  const message = fd.get("message") as string;

                  // Build a WhatsApp or mailto link to forward the message
                  const whatsapp = settings?.contact_whatsapp;
                  const body = `*New message from ${name}*\nEmail: ${email}${phone ? `\nPhone: ${phone}` : ""}\n\n${message}`;

                  if (whatsapp) {
                    const num = whatsapp.replace(/[^0-9]/g, "");
                    window.open(`https://wa.me/${num}?text=${encodeURIComponent(body)}`, "_blank");
                  } else if (settings?.email) {
                    window.location.href = `mailto:${settings.email}?subject=${encodeURIComponent(`Message from ${name}`)}&body=${encodeURIComponent(body)}`;
                  }

                  setSubmitted(true);
                  toast.success("Message sent! We'll be in touch shortly.");
                }}
                className="mt-5 grid gap-4 sm:grid-cols-2"
              >
                <input name="name" required placeholder="Full name" className="rounded-2xl border border-border bg-secondary/40 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30" />
                <input name="email" required type="email" placeholder="Email" className="rounded-2xl border border-border bg-secondary/40 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30" />
                <input name="phone" placeholder="Phone (optional)" className="rounded-2xl border border-border bg-secondary/40 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30 sm:col-span-2" />
                <textarea name="message" required rows={5} placeholder="How can we help?" className="rounded-2xl border border-border bg-secondary/40 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30 sm:col-span-2" />
                <button type="submit" className="sm:col-span-2 rounded-2xl bg-gradient-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-soft hover:opacity-95">Send message</button>
              </form>
            )}
          </div>

          {general.length > 0 && (
            <div className="squircle bg-white p-6 shadow-soft">
              <h2 className="text-lg font-semibold">Reach us directly</h2>
              <ul className="mt-4 space-y-4">
                {general.map((c) => (
                  <li key={c.label} className="flex items-start gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-2xl bg-primary/10 text-primary"><c.icon className="h-5 w-5" /></div>
                    <div>
                      <div className="text-xs uppercase tracking-wide text-muted-foreground">{c.label}</div>
                      {c.href ? <a href={c.href} className="text-sm font-medium hover:text-primary">{c.value}</a> : <div className="text-sm font-medium">{c.value}</div>}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
