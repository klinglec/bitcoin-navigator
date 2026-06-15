import Link from "next/link";
import SiteHeader from '@/components/SiteHeader';

export const metadata = {
  title: "Warum die Wahl der Bitcoin-Börse mehr kostet als du denkst | Bitcoin Navigator",
  description: "Wer monatlich 200€ in Bitcoin spart, zahlt je nach Börse bis zu 30× mehr Gebühren. Rechenbeispiele und Erklärung von Spread vs. Maker/Taker-Gebühren.",
  alternates: { canonical: "https://bitcoinnavigator.de/ratgeber/bitcoin-boerse-gebuehren" },
};

export default function ArtikelBoerseGebuehren() {
  return (
    <div className="relative min-h-screen" style={{ background: '#f7f6f3' }}>
      <SiteHeader activePath="/ratgeber" />

      <main className="relative z-10 px-6 md:px-12 py-16 max-w-2xl">
        <div className="mb-8">
          <Link href="/ratgeber" className="font-mono text-xs transition-colors hover:opacity-70" style={{ color: '#666666' }}>← Ratgeber</Link>
        </div>
        <div className="flex items-center gap-3 mb-6">
          <span className="font-mono text-xs px-2 py-1 rounded-full border"
            style={{ borderColor: "var(--accent)", color: "var(--accent)", background: "var(--accent-dim)" }}>
            Börsen
          </span>
          <span className="font-mono text-xs" style={{ color: "var(--text-secondary)" }}>5 min Lesezeit</span>
        </div>

        <h1 className="text-3xl md:text-4xl font-extrabold leading-tight mb-6">
          Warum die Wahl der Bitcoin-Börse mehr kostet als du denkst
        </h1>

        <p className="text-lg leading-relaxed mb-12" style={{ color: "var(--text-secondary)" }}>
          Viele Einsteiger wählen ihre Bitcoin-Börse nach Bekanntheit oder Empfehlung. Dabei ist die Gebührenstruktur
          einer der wichtigsten Faktoren – und der Unterschied zwischen Anbietern ist erheblich.
        </p>

        <div className="space-y-10" style={{ color: "var(--text-secondary)" }}>

          <section>
            <h2 className="text-xl font-bold mb-4" style={{ color: "var(--text-primary)" }}>
              Was kostet dich eine Börse wirklich?
            </h2>
            <p className="leading-relaxed mb-4">
              Jede Bitcoin-Börse verdient Geld, wenn du kaufst oder verkaufst. Die Art, wie Gebühren erhoben werden,
              unterscheidet sich aber grundlegend – und das macht einen enormen Unterschied über Zeit.
            </p>
            <p className="leading-relaxed">
              Es gibt zwei gängige Modelle: das <strong style={{ color: "var(--text-primary)" }}>Spread-Modell</strong> und
              das <strong style={{ color: "var(--text-primary)" }}>Maker/Taker-Modell</strong>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-4" style={{ color: "var(--text-primary)" }}>
              Spread vs. Maker/Taker – der Unterschied
            </h2>
            <p className="leading-relaxed mb-4">
              Beim <strong style={{ color: "var(--text-primary)" }}>Spread-Modell</strong> kaufst du Bitcoin zu einem Preis,
              der leicht über dem Marktpreis liegt – und verkaufst zu einem Preis leicht darunter. Die Differenz
              (der Spread) ist die Gebühr. Typische Werte liegen zwischen 1,0% und 1,99%. Anbieter wie Bitpanda (Standard) oder Bison arbeiten so – sie sind deshalb nicht im Vergleich auf Bitcoin Navigator gelistet.
            </p>
            <p className="leading-relaxed mb-4">
              Beim <strong style={{ color: "var(--text-primary)" }}>Maker/Taker-Modell</strong> handelst du direkt über
              ein Orderbuch. Wer eine Order einstellt (Maker), zahlt weniger – wer eine bestehende Order kauft (Taker),
              etwas mehr. Typische Basisgebühren liegen zwischen 0,15% und 0,60%. Bitcoin.de arbeitet so.
            </p>
            <div className="rounded-xl p-5 border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
              <p className="font-mono text-xs mb-3" style={{ color: "var(--accent)" }}>Beispiel: 200€ Bitcoin kaufen</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>21bitcoin (Sparplan 0,99%)</span>
                  <span style={{ color: "var(--text-primary)" }}>≈ 1,98€ Gebühr</span>
                </div>
                <div className="flex justify-between">
                  <span>Relai (Flat-Fee 1,0%)</span>
                  <span style={{ color: "var(--text-primary)" }}>≈ 2,00€ Gebühr</span>
                </div>
                <div className="flex justify-between">
                  <span>Bitcoin.de (Taker 0,5%)</span>
                  <span style={{ color: "var(--text-primary)" }}>≈ 1,00€ Gebühr</span>
                </div>
                <div className="flex justify-between">
                  <span>Coinfinity (Flat-Fee 1,5%, kein Spread)</span>
                  <span style={{ color: "var(--text-primary)" }}>≈ 3,00€ Gebühr</span>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-4" style={{ color: "var(--text-primary)" }}>
              Rechenbeispiel: 200€/Monat über 5 Jahre
            </h2>
            <p className="leading-relaxed mb-4">
              Nehmen wir einen Bitcoin-Sparplan mit 200€ pro Monat über 5 Jahre – also 12.000€ Gesamtinvestition.
            </p>
            <div className="rounded-xl p-5 border space-y-3" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
              <p className="font-mono text-xs mb-3" style={{ color: "var(--accent)" }}>Gesamtgebühren über 5 Jahre</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span>21bitcoin (0,99% Sparplan)</span>
                  <span className="font-bold" style={{ color: "#2a6a2a" }}>118,80€</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Bitcoin.de (0,5% Taker)</span>
                  <span style={{ color: "var(--text-primary)" }}>60€</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Relai (1,0% Flat-Fee)</span>
                  <span style={{ color: "var(--text-primary)" }}>120€</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Coinfinity (1,5% Flat-Fee, kein Spread)</span>
                  <span style={{ color: "var(--text-primary)" }}>180€</span>
                </div>
              </div>
              <p className="text-xs pt-2 border-t" style={{ borderColor: '#e0ddd8', color: '#666666' }}>
                * Vereinfachte Rechnung: 200€/Monat × 60 Monate × Gebührensatz. Tatsächliche Gebühren können variieren.
              </p>
            </div>
            <p className="leading-relaxed mt-4">
              Der Unterschied zwischen günstigster und teuerster Option beträgt hier bis zu 150€ – allein durch die
              Wahl der Börse. Bei höheren Sparraten wächst dieser Unterschied proportional.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-4" style={{ color: "var(--text-primary)" }}>
              Nicht nur die Gebühren zählen
            </h2>
            <p className="leading-relaxed mb-4">
              Günstig ist nicht alles. Weitere wichtige Kriterien bei der Börsenauswahl:
            </p>
            <ul className="space-y-3 text-sm">
              <li className="flex gap-3">
                <span style={{ color: "var(--accent)" }}>◈</span>
                <span><strong style={{ color: "var(--text-primary)" }}>Regulierung:</strong> Ist die Börse BaFin-, FMA- oder MiCA-reguliert?
                  Das schützt dich im Fall einer Insolvenz oder eines Hacks.</span>
              </li>
              <li className="flex gap-3">
                <span style={{ color: "var(--accent)" }}>◈</span>
                <span><strong style={{ color: "var(--text-primary)" }}>Auszahlung in deine Wallet:</strong> Kannst du Bitcoin
                  in eine eigene Hardware Wallet auszahlen? Nicht alle Anbieter erlauben das problemlos.</span>
              </li>
              <li className="flex gap-3">
                <span style={{ color: "var(--accent)" }}>◈</span>
                <span><strong style={{ color: "var(--text-primary)" }}>KYC-Anforderungen:</strong> Welche Identifikation
                  ist nötig, und welche Limits gelten ohne bzw. mit Verifizierung?</span>
              </li>
              <li className="flex gap-3">
                <span style={{ color: "var(--accent)" }}>◈</span>
                <span><strong style={{ color: "var(--text-primary)" }}>Lightning-Support:</strong> Für schnelle, günstige
                  Transaktionen kann Lightning-Unterstützung relevant sein.</span>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-4" style={{ color: "var(--text-primary)" }}>
              Fazit
            </h2>
            <p className="leading-relaxed">
              Die Wahl der Bitcoin-Börse ist keine Nebensächlichkeit. Schon bei moderaten Sparraten summieren sich
              Gebührenunterschiede über Jahre auf drei- bis vierstellige Beträge. Nutze den Vergleich, um die
              für dich passende Option zu finden – anhand aller relevanten Kriterien, nicht nur der Bekanntheit.
            </p>
          </section>

          <div className="rounded-2xl p-7 border mt-8" style={{ background: "var(--surface)", borderColor: "var(--accent)" }}>
            <p className="font-mono text-xs mb-3" style={{ color: "var(--accent)" }}>Jetzt vergleichen</p>
            <p className="font-bold text-lg mb-4">4 Bitcoin-first Börsen im direkten Vergleich</p>
            <p className="text-sm mb-5" style={{ color: "var(--text-secondary)" }}>
              Gebühren, Sparplan, Lightning, KYC-Level, Regulierung und mehr – alle Daten aktuell und transparent.
            </p>
            <Link href="/vergleich/boersen"
              className="inline-block px-6 py-3 rounded-xl font-bold text-sm transition-all hover:opacity-90"
              style={{ background: "var(--accent)", color: "#0a0a0a" }}>
              Börsenvergleich öffnen →
            </Link>
          </div>
        </div>
      </main>

      <footer className="relative z-10 px-6 md:px-12 py-8 border-t mt-16 text-xs font-mono"
        style={{ borderColor: '#e0ddd8', color: '#666666' }}>
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
