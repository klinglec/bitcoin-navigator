import Link from "next/link";

export const metadata = {
  title: "Bitcoin-Sparplan einrichten: So funktioniert DCA in der Praxis | Bitcoin Navigator",
  description: "Was ist Dollar-Cost-Averaging, warum empfehlen es so viele Bitcoiner und welche Anbieter bieten in DACH den günstigsten Bitcoin-Sparplan?",
  alternates: { canonical: "https://bitcoinnavigator.de/ratgeber/bitcoin-sparplan-dca" },
};

export default function ArtikelSparplan() {
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
            Sparplan
          </span>
          <span className="font-mono text-xs" style={{ color: "var(--text-secondary)" }}>5 min Lesezeit</span>
        </div>

        <h1 className="text-3xl md:text-4xl font-extrabold leading-tight mb-6">
          Bitcoin-Sparplan einrichten: So funktioniert DCA in der Praxis
        </h1>

        <p className="text-lg leading-relaxed mb-12" style={{ color: "var(--text-secondary)" }}>
          Wann ist der beste Zeitpunkt, Bitcoin zu kaufen? Die ehrliche Antwort: Niemand weiß es.
          Dollar-Cost-Averaging ist die rationale Antwort auf diese Unsicherheit.
        </p>

        <div className="space-y-10" style={{ color: "var(--text-secondary)" }}>

          <section>
            <h2 className="text-xl font-bold mb-4" style={{ color: "var(--text-primary)" }}>
              Was ist Dollar-Cost-Averaging?
            </h2>
            <p className="leading-relaxed mb-4">
              Dollar-Cost-Averaging (DCA) bedeutet, regelmäßig einen festen Betrag zu investieren –
              unabhängig vom aktuellen Kurs. Du kaufst also manchmal teurer, manchmal günstiger.
              Über Zeit entsteht ein Durchschnittskaufkurs, der weder beim Hoch noch beim Tief liegt.
            </p>
            <p className="leading-relaxed">
              Die Idee dahinter: Niemand kann den Markt zuverlässig timen. Wer versucht, immer
              zum günstigsten Zeitpunkt zu kaufen, kauft oft zu spät – oder gar nicht. DCA nimmt
              diese Entscheidung aus der Gleichung.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-4" style={{ color: "var(--text-primary)" }}>
              Warum DCA für Bitcoin funktioniert
            </h2>
            <p className="leading-relaxed mb-4">
              Bitcoin ist volatil – in beide Richtungen. Korrekturen von 30–50% innerhalb weniger Monate
              sind keine Seltenheit. Für Einmalanleger können solche Phasen psychologisch belastend sein.
            </p>
            <p className="leading-relaxed mb-4">
              Mit einem Sparplan investierst du auch in Korrekturen weiter – und kaufst dann günstiger.
              Historisch hat Bitcoin nach jeder Korrektur neue Höchststände erreicht. DCA-Anleger
              profitieren von Korrekturen, statt von ihnen erschreckt zu werden.
            </p>
            <div className="rounded-xl p-5 border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
              <p className="font-mono text-xs mb-3" style={{ color: "var(--accent)" }}>Hinweis</p>
              <p className="text-sm">
                DCA ist eine Strategie zur Risikoreduzierung, keine Garantie auf Gewinn.
                Vergangene Kursverläufe sind kein Indikator für künftige Entwicklungen.
                Investiere nur, was du langfristig entbehren kannst.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-4" style={{ color: "var(--text-primary)" }}>
              Welche Anbieter bieten Bitcoin-Sparpläne in DACH?
            </h2>
            <p className="leading-relaxed mb-4">
              Nicht alle Börsen bieten echte automatische Sparpläne. Einige verkaufen dir Bitcoin nur
              manuell – für DCA brauchst du aber eine automatische, wiederkehrende Kauffunktion.
            </p>
            <div className="space-y-3">
              {[
                { name: "21bitcoin", fee: "0,99%", min: "21€", note: "Günstigster Sparplan, Bitcoin-only, FMA-reguliert" },
                { name: "Relai", fee: "1,0%", min: "10€", note: "Bitcoin-only, FINMA, einfache App" },
                { name: "Bitvavo", fee: "0,25%", min: "10€", note: "Günstigster Taker-Tarif, MiCA-reguliert" },
                { name: "Coinfinity", fee: "1,5%", min: "21€", note: "Österreich, FMA MiCAR, Lightning" },
                { name: "Kraken", fee: "1,0%*", min: "10€", note: "Recurring Buys, MiCA, Lightning" },
              ].map((p) => (
                <div key={p.name} className="flex items-start justify-between gap-4 p-4 rounded-xl border text-sm"
                  style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
                  <div>
                    <p className="font-bold mb-0.5" style={{ color: "var(--text-primary)" }}>{p.name}</p>
                    <p>{p.note}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold" style={{ color: "var(--accent)" }}>{p.fee}</p>
                    <p className="text-xs">ab {p.min}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs mt-3" style={{ color: "var(--text-secondary)" }}>
              * Kraken Recurring Buys: 1% Gebühr, unabhängig vom normalen Maker/Taker-Tarif.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-4" style={{ color: "var(--text-primary)" }}>
              Wie richtest du einen Sparplan ein?
            </h2>
            <ol className="space-y-3 text-sm">
              {[
                "Börse auswählen (Kriterien: Gebühren, Regulierung, Mindestbetrag)",
                "Konto erstellen und KYC-Verifizierung durchführen",
                "Sparplan-Funktion aktivieren: Betrag, Intervall (wöchentlich/monatlich) und Zahlungsart wählen",
                "Dauerauftrag oder SEPA-Lastschrift einrichten",
                "Bitcoin regelmäßig in deine Hardware Wallet auszahlen (Self-Custody)",
              ].map((step, i) => (
                <li key={i} className="flex gap-4">
                  <span className="font-mono font-bold flex-shrink-0" style={{ color: "var(--accent)" }}>
                    {i + 1}.
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-4" style={{ color: "var(--text-primary)" }}>
              Fazit
            </h2>
            <p className="leading-relaxed">
              Ein Bitcoin-Sparplan ist der einfachste Einstieg in Bitcoin für langfristig orientierte Anleger.
              Wähle einen regulierten Anbieter mit niedrigen Gebühren, stelle einen Dauerauftrag ein –
              und ziehe die Bitcoin regelmäßig in deine eigene Wallet. Fertig.
            </p>
          </section>

          <div className="rounded-2xl p-7 border mt-8" style={{ background: "var(--surface)", borderColor: "var(--accent)" }}>
            <p className="font-mono text-xs mb-3" style={{ color: "var(--accent)" }}>Jetzt vergleichen</p>
            <p className="font-bold text-lg mb-4">Alle Börsen mit Sparplan im Vergleich</p>
            <p className="text-sm mb-5" style={{ color: "var(--text-secondary)" }}>
              Filter nach „Sparplan möglich" und sortiere nach Taker-Fee – du siehst sofort, welcher
              Anbieter für deinen Sparplan am günstigsten ist.
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
