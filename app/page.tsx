import CategoryCard, { CategoryData } from "@/components/CategoryCard";
import EmailCapture from "@/components/EmailCapture";
import Link from "next/link";

const categories: CategoryData[] = [
  {
    iconKey: "exchanges",
    title: "Börsen & Exchanges",
    desc: "Gebühren, Sparplan, Lightning & KYC-Level – 9 Anbieter im direkten Vergleich.",
    href: "/vergleich/boersen",
  },
  {
    iconKey: "wallets",
    title: "Hardware Wallets",
    desc: "Open Source, Secure Element, UX-Score & Preis – 12 Modelle verglichen.",
    href: "/vergleich/hardware-wallets",
  },
  {
    iconKey: "insurance",
    title: "Versicherungen",
    desc: "Schutz für Bitcoin-Bestände – Anbieter, Deckung & Konditionen.",
  },
  {
    iconKey: "tax",
    title: "Steuerberater",
    desc: "Bitcoin-erfahrene Steuerberater für DACH – verifiziert & bewertet.",
  },
  {
    iconKey: "legal",
    title: "Rechtsanwälte",
    desc: "Rechtssicherheit im Bitcoin-Recht – Kanzleien mit Krypto-Expertise.",
  },
  {
    iconKey: "coaches",
    title: "Berater & Coaches",
    desc: "Bitcoiner mit Erfahrung begleiten dich auf deinem Weg.",
  },
];

const features = [
  {
    icon: "₿",
    title: "Bitcoin-first",
    desc: "Kein Krypto-Rauschen. Alle Vergleiche sind auf Bitcoin ausgerichtet – mit klarem Fokus auf Self-Custody, Sicherheit und Souveränität.",
  },
  {
    icon: "◈",
    title: "Transparent",
    desc: "Affiliate-Links werden offen ausgewiesen. Rankings basieren auf sachlichen Kriterien, nicht auf Provisionshöhe.",
  },
  {
    icon: "◎",
    title: "DACH-spezifisch",
    desc: "Deutsche Regulierung, österreichisches Steuerrecht, Schweizer Anbieter. Nur was im DACH-Raum wirklich nutzbar ist.",
  },
];

const stats = [
  { value: "9", label: "Börsen verglichen" },
  { value: "12", label: "Hardware Wallets" },
  { value: "21", label: "Kriterien je Kategorie" },
  { value: "täglich", label: "Daten geprüft" },
];

export default function Home() {
  return (
    <div className="relative min-h-screen grid-bg">
      {/* Nav */}
      <header
        className="relative z-10 flex items-center justify-between px-6 md:px-12 py-6 border-b"
        style={{ borderColor: "var(--border)" }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded flex items-center justify-center font-bold text-sm"
            style={{ background: "var(--accent)", color: "#0a0a0a" }}
          >
            ₿
          </div>
          <span
            className="font-bold text-sm tracking-widest uppercase"
            style={{ letterSpacing: "0.15em" }}
          >
            Bitcoin Navigator
          </span>
        </div>
        <nav className="flex items-center gap-6 text-sm" style={{ color: "var(--text-secondary)" }}>
          <Link href="/vergleich/boersen" className="hover:text-white transition-colors hidden sm:block">
            Börsen
          </Link>
          <Link href="/vergleich/hardware-wallets" className="hover:text-white transition-colors hidden sm:block">
            Hardware Wallets
          </Link>
        </nav>
      </header>

      <main className="relative z-10">
        {/* ── HERO ── */}
        <section className="px-6 md:px-12 pt-24 pb-20 max-w-5xl">
          <div
            className="inline-flex items-center gap-2 font-mono text-xs px-3 py-1.5 rounded-full border mb-8"
            style={{ borderColor: "var(--accent)", color: "var(--accent)", background: "var(--accent-dim)" }}
          >
            <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: "var(--accent)" }} />
            Jetzt live
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold leading-[0.95] tracking-tight mb-8">
            Der Bitcoin-Kompass
            <br />
            <span style={{ color: "var(--accent)" }}>für den DACH-Raum.</span>
          </h1>

          <p
            className="text-lg md:text-xl max-w-2xl mb-10 leading-relaxed"
            style={{ color: "var(--text-secondary)" }}
          >
            Bitcoin Navigator vergleicht Börsen, Hardware Wallets & mehr –
            unabhängig, aktuell und speziell für Deutschland, Österreich & die Schweiz.
          </p>

          <div className="flex flex-wrap gap-4">
            <Link
              href="/vergleich/boersen"
              className="px-7 py-4 rounded-xl font-bold text-sm transition-all hover:opacity-90"
              style={{ background: "var(--accent)", color: "#0a0a0a" }}
            >
              Börsen vergleichen →
            </Link>
            <Link
              href="/vergleich/hardware-wallets"
              className="px-7 py-4 rounded-xl font-bold text-sm border transition-all hover:border-orange-500"
              style={{ borderColor: "var(--border)", color: "var(--text-primary)", background: "var(--surface)" }}
            >
              Hardware Wallets →
            </Link>
          </div>
        </section>

        {/* ── STATS ── */}
        <section className="px-6 md:px-12 pb-16 max-w-5xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((s) => (
              <div
                key={s.label}
                className="rounded-xl p-5 border"
                style={{ background: "var(--surface)", borderColor: "var(--border)" }}
              >
                <p className="text-3xl font-extrabold mb-1" style={{ color: "var(--accent)" }}>{s.value}</p>
                <p className="text-xs font-mono" style={{ color: "var(--text-secondary)" }}>{s.label}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="mx-6 md:mx-12 border-t" style={{ borderColor: "var(--border)" }} />

        {/* ── WAS IST BITCOIN NAVIGATOR ── */}
        <section className="px-6 md:px-12 py-24 max-w-3xl">
          <p
            className="font-mono text-xs tracking-widest uppercase mb-6"
            style={{ color: "var(--accent)" }}
          >
            Was ist Bitcoin Navigator?
          </p>
          <p className="text-xl md:text-2xl leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            <span style={{ color: "var(--text-primary)" }}>Bitcoin Navigator</span> ist das unabhängige
            Vergleichsportal für den DACH-Raum. Ob du Bitcoin kaufen, sicher verwahren
            oder versteuern möchtest – hier findest du aktuelle, sachlich geprüfte
            Vergleiche für{" "}
            <span style={{ color: "var(--text-primary)" }}>
              Börsen, Hardware Wallets, Steuerberater
            </span>{" "}
            und mehr.
          </p>
          <p className="text-xl md:text-2xl leading-relaxed mt-6" style={{ color: "var(--text-secondary)" }}>
            Die meisten Empfehlungen im Netz kommen von Influencern,
            die nur ihren Affiliate-Link promoten. Bitcoin Navigator ist anders:
            Vergleiche basieren auf{" "}
            <span style={{ color: "var(--text-primary)" }}>
              echten Kriterien
            </span>{" "}
            – Gebühren, Regulierung, Sicherheit, Bedienbarkeit.
            Affiliate-Links werden offen ausgewiesen. Die Community bewertet.
          </p>
        </section>

        {/* ── KATEGORIEN ── */}
        <section
          className="px-6 md:px-12 py-16 border-t"
          style={{ borderColor: "var(--border)" }}
        >
          <p className="font-mono text-xs tracking-widest uppercase mb-2" style={{ color: "var(--accent)" }}>
            Kategorien
          </p>
          <h2 className="text-3xl md:text-4xl font-bold mb-12">
            Alles rund um Bitcoin – an einem Ort.
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((cat) => (
              <CategoryCard key={cat.title} cat={cat} />
            ))}
          </div>
        </section>

        {/* ── WARUM ── */}
        <section
          className="px-6 md:px-12 py-16 border-t"
          style={{ borderColor: "var(--border)" }}
        >
          <p className="font-mono text-xs tracking-widest uppercase mb-2" style={{ color: "var(--accent)" }}>
            Warum Bitcoin Navigator?
          </p>
          <h2 className="text-3xl md:text-4xl font-bold mb-12">Drei Grundsätze.</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((f) => (
              <div key={f.title} className="flex flex-col gap-4">
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl font-bold"
                  style={{ background: "var(--accent-dim)", color: "var(--accent)", border: "1px solid var(--accent)" }}
                >
                  {f.icon}
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-1">{f.title}</h3>
                  <p style={{ color: "var(--text-secondary)" }} className="leading-relaxed text-sm">
                    {f.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── NEWSLETTER ── */}
        <section
          className="mx-6 md:mx-12 my-16 rounded-2xl p-10 md:p-16 border"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        >
          <div
            className="w-12 h-12 rounded-lg flex items-center justify-center text-xl font-bold mb-6"
            style={{ background: "var(--accent)", color: "#0a0a0a" }}
          >
            ₿
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Immer auf dem aktuellen Stand.
          </h2>
          <p className="mb-8 text-lg leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            Gebühren ändern sich, neue Anbieter kommen, Aktionen laufen ab.
            Trag dich ein und wir benachrichtigen dich bei relevanten Änderungen –
            kein Spam, nur was wirklich wichtig ist.
          </p>
          <EmailCapture source="newsletter" size="large" />
          <p className="mt-4 font-mono text-xs" style={{ color: "var(--text-secondary)" }}>
            Keine Werbung. Kein Tracking. Abmeldung jederzeit möglich.
          </p>
        </section>
      </main>

      {/* ── FOOTER ── */}
      <footer
        className="relative z-10 px-6 md:px-12 py-12 border-t"
        style={{ borderColor: "var(--border)" }}
      >
        <div className="max-w-5xl">
          <div className="flex items-center gap-2 mb-4">
            <div
              className="w-6 h-6 rounded flex items-center justify-center font-bold text-xs"
              style={{ background: "var(--accent)", color: "#0a0a0a" }}
            >
              ₿
            </div>
            <span className="font-bold text-sm">Bitcoin Navigator</span>
          </div>
          <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>
            Das unabhängige Bitcoin-Vergleichsportal für Deutschland, Österreich & die Schweiz.
          </p>
          <div className="flex flex-wrap items-center gap-4 mb-4">
            <Link href="/vergleich/boersen" className="font-mono text-xs transition-colors hover:text-white" style={{ color: "var(--text-secondary)" }}>
              Börsen
            </Link>
            <span style={{ color: "var(--border)" }}>|</span>
            <Link href="/vergleich/hardware-wallets" className="font-mono text-xs transition-colors hover:text-white" style={{ color: "var(--text-secondary)" }}>
              Hardware Wallets
            </Link>
            <span style={{ color: "var(--border)" }}>|</span>
            <Link href="/impressum" className="font-mono text-xs transition-colors hover:text-white" style={{ color: "var(--text-secondary)" }}>
              Impressum
            </Link>
            <span style={{ color: "var(--border)" }}>|</span>
            <Link href="/datenschutz" className="font-mono text-xs transition-colors hover:text-white" style={{ color: "var(--text-secondary)" }}>
              Datenschutz
            </Link>
          </div>
          <p className="font-mono text-xs mb-1" style={{ color: "var(--text-secondary)" }}>
            Affiliate-Links werden transparent gekennzeichnet.
          </p>
          <p className="font-mono text-xs" style={{ color: "var(--border)" }}>
            © 2026 Bitcoin Navigator
          </p>
        </div>
      </footer>
    </div>
  );
}
