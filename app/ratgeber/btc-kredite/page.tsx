import Link from "next/link";

export const metadata = {
  title: "Bitcoin Kredit Vergleich 2026 – Bitcoin beleihen statt verkaufen | Bitcoin Navigator",
  description: "Bitcoin als Sicherheit hinterlegen und Liquidität erhalten, ohne zu verkaufen. Wie Bitcoin-Kredite funktionieren, was sie kosten und welche Risiken du kennen musst.",
  alternates: { canonical: "https://bitcoinnavigator.de/ratgeber/btc-kredite" },
};

export default function ArtikelBtcKredite() {
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
            Bitcoin Kredite
          </span>
          <span className="font-mono text-xs" style={{ color: "var(--text-secondary)" }}>7 min Lesezeit</span>
        </div>

        <h1 className="text-3xl md:text-4xl font-extrabold leading-tight mb-6">
          Bitcoin beleihen statt verkaufen – wie Bitcoin-Kredite funktionieren
        </h1>

        <p className="text-lg leading-relaxed mb-6" style={{ color: "var(--text-secondary)" }}>
          Du hältst Bitcoin langfristig, brauchst aber kurzfristig Liquidität? Ein Bitcoin-Kredit
          ermöglicht genau das – ohne zu verkaufen, ohne Steuern auszulösen, ohne deine Position aufzugeben.
        </p>

        {/* Risikohinweis prominent */}
        <div className="rounded-xl p-5 border mb-12"
          style={{ background: "rgba(239,68,68,0.08)", borderColor: "rgba(239,68,68,0.4)" }}>
          <p className="font-mono text-xs mb-2" style={{ color: "#f87171" }}>⚠ Risikohinweis</p>
          <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            Bitcoin-Kredite können zum <strong style={{ color: "var(--text-primary)" }}>vollständigen Verlust deiner hinterlegten Bitcoin</strong> führen.
            Bei einem starken Kursrückgang wirst du automatisch liquidiert – ohne Vorwarnung, ohne Möglichkeit zur Rückgängigmachung.
            Bitcoin-Crashs von 30–50 % innerhalb weniger Wochen sind historisch mehrfach vorgekommen.
            Dieser Artikel ist keine Steuer- oder Anlageberatung. Lass dich vor einer Entscheidung
            von einem auf Bitcoin spezialisierten Steuerberater beraten.
          </p>
        </div>

        <div className="space-y-10" style={{ color: "var(--text-secondary)" }}>

          <section>
            <h2 className="text-xl font-bold mb-4" style={{ color: "var(--text-primary)" }}>
              Was ist ein Bitcoin-Kredit?
            </h2>
            <p className="leading-relaxed mb-4">
              Ein Bitcoin-Kredit funktioniert wie ein Pfandkredit: Du hinterlegst Bitcoin als Sicherheit
              (Kollateral) beim Anbieter, erhältst dafür Euro oder Stablecoins – und bekommst deine Bitcoin
              zurück, sobald der Kredit zurückgezahlt ist.
            </p>
            <p className="leading-relaxed">
              Der entscheidende Unterschied zum Verkauf: <strong style={{ color: "var(--text-primary)" }}>Du behältst das Upside.</strong> Steigt
              Bitcoin während der Kreditlaufzeit im Wert, profitierst du davon. Du hast nichts verkauft.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-4" style={{ color: "var(--text-primary)" }}>
              Warum beleihen statt verkaufen?
            </h2>
            <div className="space-y-4">
              {[
                {
                  title: "Steuerliche Überlegungen",
                  desc: "In Deutschland, Österreich und der Schweiz ist ein Bitcoin-Kredit kein Verkauf und löst daher keine Steuerpflicht aus. Die Haltefrist läuft weiter. Das ist für viele der stärkste Grund. Wichtig: Steuerrecht ist komplex und individuell – das ist keine Steuerberatung, lass das von einem Fachmann prüfen."
                },
                {
                  title: "Überzeugung bewahren",
                  desc: "Wer langfristig von Bitcoin überzeugt ist, möchte den Stack nicht reduzieren. Ein Kredit ermöglicht kurzfristige Liquidität, ohne die Position aufzugeben."
                },
                {
                  title: "Schnelle Auszahlung",
                  desc: "Klassische Bankkredite dauern Wochen. Bitcoin-Kredite können je nach Anbieter innerhalb von Stunden ausgezahlt werden."
                },
              ].map((item) => (
                <div key={item.title} className="p-4 rounded-xl border"
                  style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
                  <p className="font-bold text-sm mb-2" style={{ color: "var(--text-primary)" }}>{item.title}</p>
                  <p className="text-sm leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-4" style={{ color: "var(--text-primary)" }}>
              Loan-to-Value (LTV) – das wichtigste Konzept
            </h2>
            <p className="leading-relaxed mb-4">
              Der LTV ist das Verhältnis von Kreditbetrag zum Wert der Sicherheit.
            </p>
            <div className="rounded-xl p-5 border mb-4" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
              <p className="font-mono text-xs mb-2" style={{ color: "var(--accent)" }}>Beispiel</p>
              <p className="text-sm">
                Du hinterlegst Bitcoin im Wert von <strong style={{ color: "var(--text-primary)" }}>10.000 €</strong> bei einem LTV von 50 % →
                Du erhältst <strong style={{ color: "var(--text-primary)" }}>5.000 €</strong> Kredit.
              </p>
            </div>
            <p className="leading-relaxed">
              Typische LTV-Werte: 25–60 %. Je niedriger der LTV, desto mehr Puffer hast du bei Kursrückgängen –
              und desto geringer das Liquidationsrisiko.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-4" style={{ color: "var(--text-primary)" }}>
              Das zentrale Risiko: Liquidation
            </h2>

            <div className="rounded-xl p-5 border mb-6"
              style={{ background: "rgba(239,68,68,0.08)", borderColor: "rgba(239,68,68,0.4)" }}>
              <p className="font-mono text-xs mb-2" style={{ color: "#f87171" }}>⚠ Liquidationsrisiko</p>
              <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                Fällt der Bitcoin-Kurs stark, kann deine gesamte hinterlegte Sicherheit automatisch
                verkauft werden – zu schlechten Marktpreisen, ohne Möglichkeit der Rückgängigmachung.
                Du trägst den Verlust vollständig.
              </p>
            </div>

            <p className="leading-relaxed mb-4">
              Was passiert bei einem Kursrückgang:
            </p>
            <div className="space-y-3 text-sm">
              {[
                { step: "1. Margin Call", desc: "Der Anbieter fordert dich auf, mehr Bitcoin nachzuschießen oder den Kredit teilweise zurückzuzahlen. Du hast oft nur wenige Stunden Zeit." },
                { step: "2. Automatische Liquidation", desc: "Reagierst du nicht rechtzeitig, werden deine Bitcoin automatisch verkauft. Bei extremer Volatilität kann das passieren, bevor du überhaupt reagieren kannst." },
              ].map((s) => (
                <div key={s.step} className="flex gap-4 p-4 rounded-xl border"
                  style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
                  <span className="font-mono text-xs flex-shrink-0 pt-0.5" style={{ color: "var(--accent)" }}>{s.step}</span>
                  <p>{s.desc}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-xl p-4 border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
              <p className="font-mono text-xs mb-2" style={{ color: "var(--accent)" }}>Rechenbeispiel</p>
              <p className="text-sm">
                Bei LTV 50 %: Ein Kursrückgang von ~35–40 % kann zur Liquidation führen.<br />
                Bei LTV 25 %: Bitcoin müsste über 60 % fallen – deutlich mehr Sicherheitspuffer.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-4" style={{ color: "var(--text-primary)" }}>
              Für wen ist ein Bitcoin-Kredit sinnvoll?
            </h2>
            <div className="grid grid-cols-1 gap-3 text-sm">
              <div>
                <p className="font-bold mb-2" style={{ color: "#4ade80" }}>Geeignet, wenn…</p>
                <ul className="space-y-1">
                  <li>✓ Du Bitcoin länger als 12 Monate hältst</li>
                  <li>✓ Du den Kredit sicher zurückzahlen kannst</li>
                  <li>✓ Du einen konservativen LTV wählst (max. 25–30 %)</li>
                  <li>✓ Du die Volatilität von Bitcoin kennst und damit umgehen kannst</li>
                  <li>✓ Du dich steuerlich beraten lassen hast</li>
                </ul>
              </div>
              <div className="mt-2">
                <p className="font-bold mb-2" style={{ color: "#f87171" }}>Nicht geeignet, wenn…</p>
                <ul className="space-y-1">
                  <li>✗ Du regelmäßige Zinszahlungen nicht sicher stemmen kannst</li>
                  <li>✗ Du auf Preisrückgänge finanziell nicht vorbereitet bist</li>
                  <li>✗ Du Bitcoin erst kurz hältst</li>
                  <li>✗ Du das Liquidationsrisiko nicht vollständig verstehst</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-4" style={{ color: "var(--text-primary)" }}>
              Worauf du bei der Anbieterwahl achten solltest
            </h2>
            <ul className="text-sm space-y-3">
              {[
                { label: "Regulierung", desc: "Ist der Anbieter in Deutschland, Österreich oder der Schweiz lizenziert oder einer anerkannten Aufsichtsbehörde unterstellt?" },
                { label: "Verwahrung", desc: "Werden deine Bitcoin in Cold Storage verwahrt? Gibt es Proof-of-Reserves? Was passiert bei Insolvenz des Anbieters?" },
                { label: "Liquidationsmechanismus", desc: "Wie viel Zeit hast du bei einem Margin Call? Wird automatisch liquidiert oder gibt es eine Warnung?" },
                { label: "Zinsen & Gebühren", desc: "Typisch: 5–18 % p.a. Gibt es Bearbeitungs-, Auszahlungs- oder Vorfälligkeitsgebühren?" },
                { label: "Auszahlungswährung", desc: "EUR, CHF, USDT, USDC? Was passt zu deinem konkreten Bedarf?" },
              ].map((item) => (
                <li key={item.label} className="flex gap-3 p-4 rounded-xl border"
                  style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
                  <span className="font-bold text-sm flex-shrink-0" style={{ color: "var(--text-primary)" }}>{item.label}:</span>
                  <span>{item.desc}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-4" style={{ color: "var(--text-primary)" }}>
              Fazit
            </h2>
            <div className="rounded-xl p-5 border mb-6"
              style={{ background: "rgba(239,68,68,0.08)", borderColor: "rgba(239,68,68,0.4)" }}>
              <p className="font-mono text-xs mb-2" style={{ color: "#f87171" }}>⚠ Risikohinweis</p>
              <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                Ein Bitcoin-Kredit kann zum vollständigen Verlust deiner hinterlegten Bitcoin führen.
                Dieses Produkt ist nur für Personen geeignet, die das Risiko vollständig verstehen und
                den Kredit auch bei einem starken Kursrückgang zurückzahlen können.
                Dies ist keine Anlage- oder Steuerberatung – lass dich von einem Fachmann beraten.
              </p>
            </div>
            <p className="leading-relaxed">
              Für erfahrene Bitcoin-Halter mit stabilem Einkommen und klarer Rückzahlungsstrategie
              kann ein Bitcoin-Kredit sinnvoll sein. Die wichtigsten Regeln: konservativen LTV wählen (max. 25–30 %),
              nur so viel leihen wie sicher rückzahlbar, Anbieter sorgfältig prüfen und steuerlichen Rat einholen.
            </p>
          </section>

          <div className="rounded-2xl p-7 border mt-8" style={{ background: "var(--surface)", borderColor: "var(--accent)" }}>
            <p className="font-mono text-xs mb-3" style={{ color: "var(--accent)" }}>Anbieter vergleichen</p>
            <p className="font-bold text-lg mb-4">Bitcoin Kredit Vergleich</p>
            <p className="text-sm mb-5" style={{ color: "var(--text-secondary)" }}>
              Aktuelle Anbieter für den DACH-Raum mit LTV-Grenzen, Zinssätzen und Community-Bewertungen.
            </p>
            <Link href="/vergleich/btc-kredite"
              className="inline-block px-6 py-3 rounded-xl font-bold text-sm transition-all hover:opacity-90"
              style={{ background: "var(--accent)", color: "#0a0a0a" }}>
              BTC Kredit Vergleich →
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
