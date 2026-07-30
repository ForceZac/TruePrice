import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-border mt-auto py-8 px-4">
      <div className="max-w-2xl mx-auto flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
        <Link href="/about" className="hover:text-foreground transition">
          About
        </Link>
        <Link href="/privacy" className="hover:text-foreground transition">
          Privacy Policy
        </Link>
        <Link href="/terms" className="hover:text-foreground transition">
          Terms
        </Link>
        <Link href="/contact" className="hover:text-foreground transition">
          Contact
        </Link>
        <span className="text-muted-foreground/50">
          © {new Date().getFullYear()} TruePrice
        </span>
      </div>
    </footer>
  );
}
