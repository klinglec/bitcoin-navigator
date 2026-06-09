import EmailCapture from "@/components/EmailCapture";
import CategoryCard, { CategoryData } from "@/components/CategoryCard";
import Link from "next/link";

const categories: CategoryData[] = [
  {
    iconKey: "exchanges",
    title: "Börsen & Exchanges",
    desc: "Gebühren, Sicherheit, SEPA-Anbindung & Nutzer-Ratings im Vergleich.",
    href: "/vergleich/boersen",
  },
  {
    iconKey: "wallets",
    title: "Hardware Wallets",
    desc: "Cold Storage für langfristige Sicherheit – Modelle & Erfahrungsberichte.",
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
    desc: "Kein Krypto-Rauschen. Fokus auf das Wesentliche.",
  },
  {
    icon: "◈",
    title: "Community-kuratiert",
    desc: "Echte Nutzerbewertungen, keine bezahlten Rankings.",
  },
  {
    icon: "◎",
    title: "DACH-spezifisch",
    desc: "Deutsche Regulierung, Steuerrecht, Sprache.",
  },
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
        <span
          className="font-mono text-xs px-3 py-1.5 rounded-full border"
          style={{
            borderColor: "var(--accent)",
            color: "var(--accent)",
            background: "var(--accent-dim)",
          }}
        >
          Beta coming soon
        </span>
      </header>

      <main className="relative z-10">
        {/* ── HERO ── */}
        <section className="px-6 md:px-12 pt-24 pb-32 max-w-5xl">
          <div
            className="inline-flex items-center gap-2 font-mono text-xs px-3 py-1.5 rounded-full border mb-8"
            style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full inline-block animate-pulse"
              style={{ background: "var(--accent)" }}
            />
            Jetzt in Entwicklung
          </div>

          <h1
            className="text-5xl md:text-7xl lg:text-8xl font-extrabold leading-[0.95] tracking-tight mb-8"
          >
            Der Bitcoin-Kompass
            <br />
            <span style={{ color: "var(--accent)" }}>für den DACH-Raum.</span>
          </h1>

          <p
            className="text-lg md:text-xl max-w-2xl mb-12 leading-relaxed"
            style={{ color: "var(--text-secondary)" }}
          >
            Börsen, Wallets, Steuerberater & mehr – unabhängig verglichen, von
            der Community bewertet.
          </p>

          <EmailCapture source="hero" size="large" />

          <p className="mt-4 font-mono text-xs" style={{ color: "var(--text-secondary)" }}>
            Kein Spam. Nur eine Nachricht wenn wir live gehen.
          </p>
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
          <p
            className="text-xl md:text-2xl leading-relaxed"
            style={{ color: "var(--text-secondary)" }}
          >
            Börsen, Wallets, Steuerberater – du willst wissen, welchem Anbieter du
            vertrauen kannst. Aber die meisten Empfehlungen kommen von{" "}
            <span style={{ color: "var(--text-primary)" }}>
              Influencern, die nur ihren Affiliate-Link promoten.
            </span>{" "}
            Bitcoin Navigator ist anders: Ein{" "}
            <span style={{ color: "var(--text-primary)" }}>
              unabhängiges Vergleichsportal
            </span>
            , das echte Nutzerbewertungen bündelt – kein Redakteur, kein
            Sponsor, keine versteckten Interessen. Du siehst, was die Community
            wirklich erlebt hat.
          </p>
        </section>

        {/* ── KATEGORIEN ── */}
        <section
          className="px-6 md:px-12 py-16 border-t"
          style={{ borderColor: "var(--border)" }}
        >
          <p
            className="font-mono text-xs tracking-widest uppercase mb-2"
            style={{ color: "var(--accent)" }}
          >
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
          <p
            className="font-mono text-xs tracking-widest uppercase mb-2"
            style={{ color: "var(--accent)" }}
          >
            Warum Bitcoin Navigator?
          </p>
          <h2 className="text-3xl md:text-4xl font-bold mb-12">Drei Grundsätze.</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((f) => (
              <div key={f.title} className="flex flex-col gap-4">
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl font-bold"
                  style={{
                    background: "var(--accent-dim)",
                    color: "var(--accent)",
                    border: "1px solid var(--accent)",
                  }}
                >
                  {f.icon}
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-1">"{f.title}"</h3>
                  <p
                    style={{ color: "var(--text-secondary)" }}
                    className="leading-relaxed"
                  >
                    {f.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── SECOND EMAIL CAPTURE ── */}
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
            Bereit, wenn es losgeht?
          </h2>
          <p className="mb-8 text-lg" style={{ color: "var(--text-secondary)" }}>
            Trag dich ein und wir informieren dich sofort beim Launch.
          </p>
          <EmailCapture source="bottom" size="large" />
        </section>
      </main>

      {/* ── FOOTER ── */}
      <footer
        className="relative z-10 px-6 md:px-12 py-12 border-t"
        style={{ borderColor: "var(--border)" }}
      >
        <div className="max-w-5xl">
          <div className="flex items-center gap-2 mb-6">
            <div
              className="w-6 h-6 rounded flex items-center justify-center font-bold text-xs"
              style={{ background: "var(--accent)", color: "#0a0a0a" }}
            >
              ₿
            </div>
            <span className="font-bold text-sm">Bitcoin Navigator</span>
          </div>

          <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>
            DACH's community-kuratiertes Bitcoin-Vergleichsportal.
          </p>

          <div className="flex flex-wrap items-center gap-4 mb-6">
            <Link
              href="/impressum"
              className="font-mono text-xs transition-colors hover:text-white"
              style={{ color: "var(--text-secondary)" }}
            >
              Impressum
            </Link>
            <span style={{ color: "var(--border)" }}>|</span>
            <Link
              href="/datenschutz"
              className="font-mono text-xs transition-colors hover:text-white"
              style={{ color: "var(--text-secondary)" }}
            >
              Datenschutz
            </Link>
          </div>

          <p className="font-mono text-xs mb-2" style={{ color: "var(--text-secondary)" }}>
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
