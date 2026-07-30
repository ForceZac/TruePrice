import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact — TruePrice",
  description: "Get in touch with the TruePrice team.",
};

export default function ContactPage() {
  return (
    <main className="flex flex-col min-h-screen px-4 py-12 max-w-2xl mx-auto w-full gap-8">
      <div className="flex flex-col gap-3">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Contact
        </h1>
        <p className="text-muted-foreground leading-relaxed">
          Have a question, a data correction, or just want to say hello?
        </p>
      </div>

      <div className="p-6 rounded-xl border border-border bg-card flex flex-col gap-3">
        <p className="text-sm text-muted-foreground uppercase tracking-wider font-medium">
          Email
        </p>
        <a
          href="mailto:hello@trueprice.app"
          className="text-lg font-medium text-foreground hover:underline"
        >
          hello@trueprice.app
        </a>
        <p className="text-sm text-muted-foreground">
          We read every message and typically reply within a few days.
        </p>
      </div>
    </main>
  );
}
