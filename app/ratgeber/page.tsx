import Link from "next/link";
import SiteHeader from '@/components/SiteHeader';

export const metadata = {
  title: "Bitcoin Ratgeber – Wissen für DACH | Bitcoin Navigator",
  description: "Bitcoin kaufen, sichern und verstehen: Ratgeber zu Börsengebühren, Hardware Wallets, Sparplan und Seed-Backup – speziell für Deutschland, Österreich und die Schweiz.",
  alternates: { canonical: "https://bitcoinnavigator.de/ratgeber" },
};

const articles = [
  {
    slug: "bitcoin-zahlungsdienste",
    title: "Mit Bitcoin im Alltag bezahlen – so geht's heute schon",
    desc: "Gutscheine, eSIMs und Handy-Aufladungen mit Bitcoin und Lightning kaufen. Bitrefill vs. Cryptorefills für den DACH-Raum.",
    tag: "Zahlungsdienste",
    readTime: "5 min",
    date: "14. Juni 2026",
  },
  {
    slug: "btc-kredite",
    title: "Bitcoin beleihen statt verkaufen – wie Bitcoin-Kredite funktionieren",
    desc: "Bitcoin als Sicherheit hinterlegen und Liquidität erhalten, ohne zu verkaufen. Funktionsweise, Risiken und worauf du bei der Anbieterwahl achten musst.",
    tag: "Bitcoin Kredite",
    readTime: "7 min",
    date: "13. Juni 2026",
  },
  {
    slug: "seed-backup",
    title: "Seed Backup: So sicherst du deinen Bitcoin langfristig",
    desc: "Metallplatten, mehrere Kopien, BIP-39 Passphrase und Vererbungsplanung – der vollständige Guide für dauerhaft sicheres Seed-Backup.",
    tag: "Self-Custody",
    readTime: "6 min",
    date: "13. Juni 2026",
  },
  {
    slug: "seed-phrase-sichern",
    title: "Seed Phrase: Der häufigste Fehler beim Bitcoin-Sichern",
    desc: "Warum Screenshots und Cloud-Backups gefährlich sind – und warum physische Stahlplatten die einzig sinnvolle Lösung sind.",
    tag: "Self-Custody",
    readTime: "4 min",
    date: "10. Juni 2026",
  },
  {
    slug: "bitcoin-sparplan-dca",
    title: "Bitcoin-Sparplan einrichten: So funktioniert DCA in der Praxis",
    desc: "Was ist Dollar-Cost-Averaging, warum empfehlen es so viele Bitcoiner, und welche Anbieter bieten in DACH den günstigsten Sparplan?",
    tag: "Sparplan",
    readTime: "5 min",
    date: "10. Juni 2026",
  },
  {
    slug: "hardware-wallet-erklaerung",
    title: "Was ist ein Hardware Wallet – und wann brauchst du wirklich eines?",
    desc: "Ab welchem Betrag lohnt sich ein Hardware Wallet? Was Self-Custody bedeutet und welche Risiken du damit eliminierst.",
    tag: "Hardware Wallets",
    readTime: "6 min",
    date: "10. Juni 2026",
  },
  {
    slug: "bitcoin-boerse-gebuehren",
    title: "Warum die Wahl der Bitcoin-Börse mehr kostet als du denkst",
    desc: "Wer monatlich 200€ in Bitcoin spart, zahlt je nach Börse bis zu 30× mehr Gebühren. Mit Rechenbeispielen und Erklärung von Spread vs. Maker/Taker.",
    tag: "Börsen",
    readTime: "5 min",
    date: "10. Juni 2026",
  },
];

export default function Ratgeber() {
  return (
    <div className="relative min-h-screen grid-bg">
      <header className="relative z-10 flex items-center justify-between px-6 md:px-12 py-6 border-b"
        style={{ borderColor: "var(--border)" }}>
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded flex items-center justify-center font-bold text-sm"
            style={{ background: "var(--accent)", color: "#0a0a0a" }}>₿</div>
          <span className="font-bold text-sm tracking-widest uppercase" style={{ letterSpacing: "0.15em" }}>
            Bitcoin Navigator
          </span>
        </Link>
        <nav className="flex items-center gap-6 text-sm" style={{ color: "var(--text-secondary)" }}>
          <Link href="/vergleich/boersen" className="hover:text-white transition-colors hidden sm:block">Börsen</Link>
          <Link href="/vergleich/hardware-wallets" className="hover:text-white transition-colors hidden sm:block">Hardware Wallets</Link>
          <Link href="/ratgeber" className="transition-colors" style={{ color: "var(--accent)" }}>Ratgeber</Link>
        </nav>
      </header>

      <main className="relative z-10 px-6 md:px-12 py-16 max-w-4xl">
        <p className="font-mono text-xs tracking-widest uppercase mb-4" style={{ color: "var(--accent)" }}>
          Ratgeber
        </p>
        <h1 className="text-4xl md:text-5xl font-extrabold mb-4">Bitcoin verstehen.</h1>
        <p className="text-lg mb-16" style={{ color: "var(--text-secondary)" }}>
          Fundierte Artikel zu Börsen, Wallets, Sparplan und Sicherheit – speziell für den deutschsprachigen Raum.
        </p>

        <div className="flex flex-col gap-6">
          {articles.map((a) => (
            <Link key={a.slug} href={`/ratgeber/${a.slug}`}
              className="group rounded-2xl border p-7 transition-all hover:border-orange-500"
              style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
              <div className="flex items-center gap-3 mb-3">
                <span className="font-mono text-xs px-2 py-1 rounded-full border"
                  style={{ borderColor: "var(--accent)", color: "var(--accent)", background: "var(--accent-dim)" }}>
                  {a.tag}
                </span>
                <span className="font-mono text-xs" style={{ color: "var(--text-secondary)" }}>{a.readTime} Lesezeit</span>
                <span className="font-mono text-xs" style={{ color: "var(--text-secondary)" }}>{a.date}</span>
              </div>
              <h2 className="text-xl font-bold mb-2 group-hover:text-orange-400 transition-colors">{a.title}</h2>
              <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{a.desc}</p>
              <p className="mt-4 text-sm font-mono" style={{ color: "var(--accent)" }}>Lesen →</p>
            </Link>
          ))}
        </div>
      </main>

      <footer className="relative z-10 px-6 md:px-12 py-8 border-t mt-16 text-xs font-mono"
        style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}>
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <span>© 2026 Bitcoin Navigator</span>
          <div className="flex gap-4">
            <Link href="/impressum" className="hover:text-white transition-colors">Impressum</Link>
            <Link href="/datenschutz" className="hover:text-white transition-colors">Datenschutz</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
