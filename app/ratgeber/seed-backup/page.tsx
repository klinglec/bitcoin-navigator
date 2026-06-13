import Link from "next/link";

export const metadata = {
  title: "Seed Backup: Bitcoin sicher aufbewahren – Metallplatten, Passphrase & Vererbung | Bitcoin Navigator",
  description: "Wie du deine Seed Phrase dauerhaft sicherst: Metallbackup, mehrere Kopien, BIP-39 Passphrase und Vererbungsplanung. Der vollständige Guide für DACH.",
  alternates: { canonical: "https://bitcoinnavigator.de/ratgeber/seed-backup" },
};

export default function ArtikelSeedBackup() {
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
        <Link href="/ratgeber" className="font-mono text-xs hover:text-white transition-colors"
          style={{ color: "var(--text-secondary)" }}>← Ratgeber</Link>
      </header>

      <main className="relative z-10 px-6 md:px-12 py-16 max-w-2xl">
        <div className="flex items-center gap-3 mb-6">
          <span className="font-mono text-xs px-2 py-1 rounded-full border"
            style={{ borderColor: "var(--accent)", color: "var(--accent)", background: "var(--accent-dim)" }}>
            Self-Custody
          </span>
          <span className="font-mono text-xs" style={{ color: "var(--text-secondary)" }}>6 min Lesezeit</span>
        </div>

        <h1 className="text-3xl md:text-4xl font-extrabold leading-tight mb-6">
          Seed Backup: So sicherst du deinen Bitcoin langfristig
        </h1>

        <p className="text-lg leading-relaxed mb-12" style={{ color: "var(--text-secondary)" }}>
          Eine Seed Phrase aufzuschreiben ist der erste Schritt. Aber Papier brennt, verblasst und geht verloren.
          Wer Bitcoin wirklich sicher verwahren will, braucht eine Backup-Strategie, die Jahrzehnte hält.
        </p>

        <div className="space-y-10" style={{ color: "var(--text-secondary)" }}>

          <section>
            <h2 className="text-xl font-bold mb-4" style={{ color: "var(--text-primary)" }}>
              Warum Papier nicht reicht
            </h2>
            <p className="leading-relaxed mb-4">
              Das mitgelieferte Papierblatt eines Hardware Wallets ist für den Moment gedacht – nicht für
              zehn Jahre. Papier brennt bei ca. 230 °C, ein Wohnungsbrand erreicht leicht 600–900 °C.
              Feuchtigkeit lässt Tinte verblassen. Ein Wasserschaden reicht, um alles zu vernichten.
            </p>
            <p className="leading-relaxed">
              Wer seinen Bitcoin-Stack ernst nimmt, braucht ein Backup, das Feuer, Wasser und Zeit übersteht.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-4" style={{ color: "var(--text-primary)" }}>
              Metallbackup: die robuste Lösung
            </h2>
            <p className="leading-relaxed mb-6">
              Edelstahl- und Titanplatten halten Temperaturen von über 1.400 °C stand, sind korrosionsbeständig
              und praktisch unzerstörbar. Die Seed-Wörter werden eingestanzt, graviert oder als Buchstaben-Tiles
              eingeschoben.
            </p>
            <div className="space-y-3">
              {[
                { name: "Cryptosteel Capsule", desc: "Edelstahlkapsel mit Buchstabenkacheln. Sehr robust, etwas aufwändig beim Bestücken.", badge: "Beliebt" },
                { name: "Seedor", desc: "Kompakte Edelstahlplatte, in Österreich entwickelt. Gutes Preis-Leistungs-Verhältnis für DACH.", badge: "DACH" },
                { name: "Blockplate", desc: "Aluminiumplatte zum Einprägen mit einem Körner. Günstig und unkompliziert.", badge: "Budget" },
                { name: "Titanplatten", desc: "Höchste Hitzebeständigkeit, leicht und korrosionsfest. Teurer, aber maximaler Schutz.", badge: "Premium" },
              ].map((p) => (
                <div key={p.name} className="flex items-start justify-between gap-4 p-4 rounded-xl border"
                  style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
                  <div>
                    <p className="font-bold text-sm mb-0.5" style={{ color: "var(--text-primary)" }}>{p.name}</p>
                    <p className="text-sm">{p.desc}</p>
                  </div>
                  <span className="font-mono text-xs px-2 py-1 rounded flex-shrink-0"
                    style={{ background: "var(--accent-dim)", color: "var(--accent)" }}>{p.badge}</span>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-4" style={{ color: "var(--text-primary)" }}>
              Mindestens zwei Kopien, zwei Orte
            </h2>
            <p className="leading-relaxed mb-4">
              Eine einzige Kopie ist ein Single Point of Failure. Empfohlen: mindestens zwei Backups an
              zwei verschiedenen, sicheren Orten – z.B. zuhause im Tresor und bei Eltern oder in einem Bankschließfach.
            </p>
            <div className="rounded-xl p-5 border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
              <p className="font-mono text-xs mb-3" style={{ color: "var(--accent)" }}>Grundregel</p>
              <ul className="text-sm space-y-2">
                <li>• Kopie 1: Zuhause, feuerfester Tresor oder versteckter, trockener Ort</li>
                <li>• Kopie 2: Zweiter Standort – Eltern, Bankschließfach, Büro</li>
                <li>• Niemals beide Kopien am selben Ort lagern</li>
                <li>• Niemanden wissen lassen, wo beide Kopien sind</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-4" style={{ color: "var(--text-primary)" }}>
              Passphrase: die unsichtbare Sicherheitsebene
            </h2>
            <p className="leading-relaxed mb-4">
              Die BIP-39 Passphrase – oft als &ldquo;25. Wort&rdquo; bezeichnet – ist ein selbstgewähltes Passwort,
              das zusätzlich zur Seed Phrase eingegeben wird. Wer nur die Seed Phrase findet, sieht zwar
              ein Wallet – aber ohne Passphrase ist es leer.
            </p>
            <p className="leading-relaxed mb-4">
              Das Prinzip: Seed Phrase und Passphrase werden <strong style={{ color: "var(--text-primary)" }}>getrennt</strong> aufbewahrt.
              Nur wer beides hat, kommt an die Bitcoin.
            </p>
            <div className="rounded-xl p-5 border border-orange-500/30" style={{ background: "var(--surface)" }}>
              <p className="font-mono text-xs mb-2" style={{ color: "var(--accent)" }}>Wichtig</p>
              <p className="text-sm">
                Die Passphrase muss genauso sorgfältig gesichert werden wie die Seed Phrase – nur eben
                an einem anderen Ort. Wer eine der beiden verliert, verliert den Zugang.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-4" style={{ color: "var(--text-primary)" }}>
              Backup testen – bevor Bitcoin draufgehen
            </h2>
            <p className="leading-relaxed mb-4">
              Viele vertrauen ihrem Backup, ohne es je getestet zu haben. Ein Fehler bei einem einzigen
              Wort macht die gesamte Phrase unbrauchbar. Der Test kostet 10 Minuten und kann alles retten.
            </p>
            <ol className="text-sm space-y-2 list-decimal list-inside">
              <li>Wallet einrichten, Seed Phrase notieren</li>
              <li>Wallet auf Werkseinstellungen zurücksetzen (Factory Reset)</li>
              <li>Mit der notierten Seed Phrase wiederherstellen</li>
              <li>Prüfen, ob dieselben Bitcoin-Adressen erscheinen</li>
            </ol>
            <p className="text-sm mt-4">
              Erst wenn das funktioniert, Geld auf das Wallet laden.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-4" style={{ color: "var(--text-primary)" }}>
              Vererbung: Was passiert nach dir?
            </h2>
            <p className="leading-relaxed mb-4">
              Ohne Plan verliert auch die Familie den Zugriff auf deine Bitcoin. Ein einfacher Ansatz:
              Eine verschlossene Anleitung beim Notar hinterlegen, die erklärt wo das Backup liegt und
              wie das Wallet funktioniert – ohne die Seed Phrase direkt preiszugeben.
            </p>
            <p className="leading-relaxed">
              Für größere Bestände lohnt sich eine Multisignatur-Lösung (z.B. 2-von-3), bei der
              mehrere Personen oder Geräte für eine Transaktion nötig sind.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-4" style={{ color: "var(--text-primary)" }}>
              Fazit
            </h2>
            <p className="leading-relaxed">
              Ein gutes Seed Backup kostet einmalig 30–80 € und ein paar Stunden Zeit.
              Es ist die günstigste Versicherung, die du für deine Bitcoin abschließen kannst.
              Papier für den Moment, Metall für die Ewigkeit – und mindestens zwei Kopien an zwei Orten.
            </p>
          </section>

          <div className="rounded-2xl p-7 border mt-8" style={{ background: "var(--surface)", borderColor: "var(--accent)" }}>
            <p className="font-mono text-xs mb-3" style={{ color: "var(--accent)" }}>Nächster Schritt</p>
            <p className="font-bold text-lg mb-4">Hardware Wallet vergleichen</p>
            <p className="text-sm mb-5" style={{ color: "var(--text-secondary)" }}>
              Das richtige Hardware Wallet ist die Grundlage für sicheres Seed-Management.
              12 Modelle im Vergleich – Bitcoin-only, Open Source, Secure Element.
            </p>
            <Link href="/vergleich/hardware-wallets"
              className="inline-block px-6 py-3 rounded-xl font-bold text-sm transition-all hover:opacity-90"
              style={{ background: "var(--accent)", color: "#0a0a0a" }}>
              Hardware Wallet Vergleich →
            </Link>
          </div>
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
