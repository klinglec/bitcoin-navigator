import Link from "next/link";
import SiteHeader from '@/components/SiteHeader';

export const metadata = {
  title: "Was ein solides Bitcoin-Setup kostet – und warum es sich lohnt | Bitcoin Navigator",
  description: "Hardware Wallet, Seed-Backup, richtige Börse: Was ein solides Bitcoin-Setup kostet und wie trivial diese Kosten sind, wenn Bitcoin dem Power Law folgt.",
  alternates: { canonical: "https://bitcoinnavigator.de/ratgeber/bitcoin-setup-kosten" },
};

const TABLE_DATA = [
  { year: "2026 (heute)", days: 6403,  median: "~55.000 €",  stack: "~5.500 €",   pct: "4,5 %"  },
  { year: "2028",         days: 6941,  median: "~110.000 €", stack: "~11.000 €",  pct: "2,3 %"  },
  { year: "2031",         days: 8036,  median: "~230.000 €", stack: "~23.000 €",  pct: "1,1 %"  },
  { year: "2035",         days: 9497,  median: "~500.000 €", stack: "~50.000 €",  pct: "0,5 %"  },
  { year: "2040",         days: 11323, median: "~950.000 €", stack: "~95.000 €",  pct: "0,26 %" },
];

export default function ArtikelSetupKosten() {
  return (
    <div className="relative min-h-screen" style={{ background: '#f7f6f3' }}>
      <SiteHeader activePath="/ratgeber" />

      <main className="relative z-10 px-6 md:px-12 py-16 max-w-2xl">
        <div className="mb-8">
          <Link href="/ratgeber" className="font-mono text-xs transition-colors hover:opacity-70" style={{ color: '#666666' }}>
            ← Ratgeber
          </Link>
        </div>

        <div className="flex items-center gap-3 mb-6">
          <span className="font-mono text-xs px-2 py-1 rounded-full border"
            style={{ borderColor: "var(--accent)", color: "var(--accent)", background: "var(--accent-dim)" }}>
            Setup & Sicherheit
          </span>
          <span className="font-mono text-xs" style={{ color: "var(--text-secondary)" }}>6 min Lesezeit</span>
          <span className="font-mono text-xs" style={{ color: "var(--text-secondary)" }}>20. Juni 2026</span>
        </div>

        <h1 className="text-3xl md:text-4xl font-extrabold leading-tight mb-6">
          Not your keys, not your coins: Was ein solides Bitcoin-Setup wirklich kostet
        </h1>

        <p className="text-lg leading-relaxed mb-12" style={{ color: "var(--text-secondary)" }}>
          Eine Hardware Wallet, ein Seed-Backup aus Stahl, eine Börse mit fairen Gebühren —
          das klingt nach Aufwand und Kosten. Aber wenn Bitcoin dem Power Law folgt,
          sind diese Kosten im Verhältnis zum Stack-Wert kleiner als ein Restaurantbesuch.
          Eine Rechnung, die sich lohnt.
        </p>

        <div className="space-y-12" style={{ color: "var(--text-secondary)" }}>

          {/* ── 1. Das Grundproblem ── */}
          <section>
            <h2 className="text-xl font-bold mb-4" style={{ color: "var(--text-primary)" }}>
              Das Grundproblem: Wer verwahrt deine Bitcoin wirklich?
            </h2>
            <p className="leading-relaxed mb-4">
              Bitcoin auf einer Börse zu halten ist bequem. Zu bequem. Was viele nicht verstehen:
              Wenn du Bitcoin auf einer Börse lässt, hast du keinen Bitcoin. Du hast eine Forderung
              gegenüber einem Unternehmen, das dein Geld hält — genau wie bei einer Bank.
            </p>
            <p className="leading-relaxed mb-4">
              Mt. Gox, 2014: 850.000 Bitcoin verschwunden. Insolvent. FTX, 2022: 8 Milliarden Dollar
              Kundengeld veruntreut. Pleite. Celsius, Voyager, BlockFi — alle innerhalb eines Jahres.
              In jedem dieser Fälle waren die Kunden die letzten in der Gläubigerschlange.
              Viele haben nie alles zurückbekommen.
            </p>
            <p className="leading-relaxed">
              Der Satz, der Bitcoin-Veteranen von Anfängern unterscheidet, ist simpel:
            </p>
            <div className="my-6 px-5 py-4 rounded-xl border-l-4" style={{ background: "var(--surface)", borderLeftColor: "#1a1a1a" }}>
              <p className="font-bold text-base" style={{ color: "var(--text-primary)" }}>
                „Not your keys, not your coins."
              </p>
              <p className="text-sm mt-1" style={{ color: "var(--text-tertiary)" }}>
                Nur wer den privaten Schlüssel kontrolliert, kontrolliert die Bitcoin.
              </p>
            </div>
            <p className="leading-relaxed">
              Selbstverwahrung bedeutet: Deine Bitcoin liegen auf einer Hardware Wallet,
              die du physisch besitzt. Keine Börse, kein Dritter kann darauf zugreifen.
              Wenn die Börse morgen pleitegeht — deine Bitcoin bleiben unberührt.
            </p>
          </section>

          {/* ── 2. Die drei Komponenten ── */}
          <section>
            <h2 className="text-xl font-bold mb-4" style={{ color: "var(--text-primary)" }}>
              Was ein solides Setup braucht
            </h2>
            <p className="leading-relaxed mb-6">
              Ein professionelles Bitcoin-Setup besteht aus drei Komponenten — jede mit einer
              klaren Aufgabe:
            </p>

            <div className="space-y-4">
              {/* Börse */}
              <div className="rounded-xl border p-5" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
                <div className="flex items-start gap-4">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0"
                    style={{ background: "#1a1a1a", color: "#fff" }}>1</div>
                  <div>
                    <p className="font-bold mb-1" style={{ color: "var(--text-primary)" }}>Die richtige Börse</p>
                    <p className="text-sm leading-relaxed">
                      Nicht jede Börse ist gleich. Entscheidend sind drei Dinge: niedrige Gebühren,
                      Sparplanfunktion und — wenn du größere Beträge kaufst — regulierter Betrieb mit
                      MiCA-Zulassung. Ein Unterschied von 1,5 % Gebühren auf 200 €/Monat Sparplan
                      kostet dich über 10 Jahre mehr als 3.600 € an unnötigen Gebühren.
                    </p>
                    <p className="text-sm mt-2 font-medium" style={{ color: "var(--text-tertiary)" }}>
                      Typische Kosten: 0,5–1,5 % je Kauf
                    </p>
                  </div>
                </div>
              </div>

              {/* Hardware Wallet */}
              <div className="rounded-xl border p-5" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
                <div className="flex items-start gap-4">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0"
                    style={{ background: "#1a1a1a", color: "#fff" }}>2</div>
                  <div>
                    <p className="font-bold mb-1" style={{ color: "var(--text-primary)" }}>Hardware Wallet</p>
                    <p className="text-sm leading-relaxed">
                      Ein kleines Gerät, das deinen privaten Schlüssel offline erzeugt und niemals
                      preisgibt. Transaktionen werden auf dem Gerät signiert — dein Rechner sieht
                      den Schlüssel nie. Selbst ein kompromittierter Computer kann deine Bitcoin
                      nicht stehlen. Bewährteste Modelle: BitBox02 (Schweiz, Open Source),
                      Ledger Nano X, Trezor Safe 5.
                    </p>
                    <p className="text-sm mt-2 font-medium" style={{ color: "var(--text-tertiary)" }}>
                      Typische Kosten: 80–250 € einmalig
                    </p>
                  </div>
                </div>
              </div>

              {/* Seed Backup */}
              <div className="rounded-xl border p-5" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
                <div className="flex items-start gap-4">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0"
                    style={{ background: "#1a1a1a", color: "#fff" }}>3</div>
                  <div>
                    <p className="font-bold mb-1" style={{ color: "var(--text-primary)" }}>Seed-Backup aus Metall</p>
                    <p className="text-sm leading-relaxed">
                      Deine 12 oder 24 Seed-Wörter auf Papier: Feuer, Wasser, Zeit — all das vernichtet
                      Papier. Stahlplatten überstehen bis zu 1.200 °C, jede Überflutung und Jahrzehnte
                      im Keller. Das Seed-Backup ist deine letzte Verteidigungslinie. Wer es verliert
                      und dessen Gerät defekt ist, verliert alles. Wer es auf Stahl hat, verliert nichts.
                    </p>
                    <p className="text-sm mt-2 font-medium" style={{ color: "var(--text-tertiary)" }}>
                      Typische Kosten: 50–120 € einmalig
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ── 3. Konkrete Kosten ── */}
          <section>
            <h2 className="text-xl font-bold mb-4" style={{ color: "var(--text-primary)" }}>
              Die konkrete Rechnung
            </h2>
            <p className="leading-relaxed mb-6">
              Ein vollständiges, solides Setup auf dem Markt heute — mit bewährten Produkten
              aus dem DACH-Raum:
            </p>

            <div className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--border)" }}>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: "var(--surface-alt)", borderBottom: "1px solid var(--border)" }}>
                    <th className="text-left px-4 py-3 font-semibold" style={{ color: "var(--text-primary)" }}>Komponente</th>
                    <th className="text-left px-4 py-3 font-semibold hidden sm:table-cell" style={{ color: "var(--text-primary)" }}>Beispiel</th>
                    <th className="text-right px-4 py-3 font-semibold" style={{ color: "var(--text-primary)" }}>Kosten</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { comp: "Börse (Sparplan)",   ex: "z.B. Relai, 21bitcoin",    cost: "~0,5–1,5 % / Kauf",  note: true  },
                    { comp: "Hardware Wallet",     ex: "z.B. BitBox02, Ledger",    cost: "~80–250 €",          note: false },
                    { comp: "Seed-Backup (Stahl)", ex: "z.B. Cryptosteel, SEEDOR", cost: "~50–120 €",          note: false },
                    { comp: "Gesamt einmalig",     ex: "",                          cost: "~130–370 €",         note: false },
                  ].map((row, i) => (
                    <tr key={i} style={{
                      borderBottom: i < 3 ? "1px solid var(--border)" : "none",
                      background: i === 3 ? "var(--surface-alt)" : "var(--surface)",
                    }}>
                      <td className="px-4 py-3" style={{ color: "var(--text-primary)", fontWeight: i === 3 ? 700 : 400 }}>
                        {row.comp}
                        {row.note && <span className="ml-2 text-xs" style={{ color: "var(--text-tertiary)" }}>(laufend)</span>}
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell" style={{ color: "var(--text-secondary)" }}>{row.ex}</td>
                      <td className="px-4 py-3 text-right font-mono" style={{ color: i === 3 ? "var(--text-primary)" : "var(--text-secondary)", fontWeight: i === 3 ? 700 : 400 }}>
                        {row.cost}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs mt-3" style={{ color: "var(--text-tertiary)" }}>
              Preise sind Richtwerte für gängige Produkte. Aktuelle Preise im{" "}
              <Link href="/vergleich/hardware-wallets" className="underline">Hardware-Wallet-</Link> und{" "}
              <Link href="/vergleich/seed-backup" className="underline">Seed-Backup-Vergleich</Link>.
            </p>
          </section>

          {/* ── 4. Power Law Vergleich ── */}
          <section>
            <h2 className="text-xl font-bold mb-4" style={{ color: "var(--text-primary)" }}>
              Der Power-Law-Vergleich: triviale Kosten, massiver Schutz
            </h2>
            <p className="leading-relaxed mb-4">
              Das Bitcoin Power Law beschreibt den langfristigen Preisverlauf seit dem Genesis Block
              als nahezu lineare Beziehung auf einer doppelt-logarithmischen Skala. Das Modell
              hat alle Crashs, Halvings und Bärenmärkte seit 2009 überstanden —
              und zeigt konsistent: Wer lange hält, wird belohnt.
            </p>
            <p className="leading-relaxed mb-6">
              Was passiert mit deinen einmaligen Setup-Kosten von rund <strong style={{ color: "var(--text-primary)" }}>250 €</strong>,
              wenn du 0,1 BTC hältst und der Preis dem Power-Law-Median folgt?
            </p>

            <div className="rounded-xl border overflow-hidden mb-4" style={{ borderColor: "var(--border)" }}>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: "#1a1a1a", color: "#fff" }}>
                    <th className="text-left px-4 py-3 font-semibold">Jahr</th>
                    <th className="text-right px-4 py-3 font-semibold hidden sm:table-cell">BTC-Preis (Median)</th>
                    <th className="text-right px-4 py-3 font-semibold">Stack (0,1 BTC)</th>
                    <th className="text-right px-4 py-3 font-semibold">Setup als % des Stacks</th>
                  </tr>
                </thead>
                <tbody>
                  {TABLE_DATA.map((row, i) => (
                    <tr key={i} style={{
                      borderBottom: i < TABLE_DATA.length - 1 ? "1px solid var(--border)" : "none",
                      background: i % 2 === 0 ? "var(--surface)" : "var(--surface-alt)",
                    }}>
                      <td className="px-4 py-3 font-medium" style={{ color: "var(--text-primary)" }}>{row.year}</td>
                      <td className="px-4 py-3 text-right font-mono hidden sm:table-cell" style={{ color: "var(--text-secondary)" }}>{row.median}</td>
                      <td className="px-4 py-3 text-right font-mono" style={{ color: "var(--text-secondary)" }}>{row.stack}</td>
                      <td className="px-4 py-3 text-right font-mono font-semibold" style={{ color: i >= 2 ? "#16a34a" : "var(--text-primary)" }}>{row.pct}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="text-xs mb-6" style={{ color: "var(--text-tertiary)" }}>
              Modellrechnung auf Basis des Bitcoin Power Laws (Santostasi). Setup-Kosten: 250 € einmalig.
              Stack: 0,1 BTC. Preise sind Median-Schätzwerte — keine Finanzberatung, keine Garantie.
              Tatsächliche Preise können deutlich davon abweichen.{" "}
              <Link href="/rechner/fair-price" className="underline">Power-Law-Rechner →</Link>
            </p>

            <p className="leading-relaxed mb-4">
              Das Ergebnis ist eindeutig: Schon heute macht ein solides Setup weniger als 5 % des
              Stack-Werts aus. In 2031 — wenn der Preis laut Modell bei ~230.000 € liegt —
              sind deine 250 € Setup-Investition gerade noch 1,1 % des Werts, den sie schützen.
            </p>
            <p className="leading-relaxed">
              Zum Vergleich: Eine Hausratversicherung kostet jährlich 1–2 % des Versicherungswerts,
              und du zahlst sie jeden Monat neu. Dein Bitcoin-Setup zahlst du einmal.
            </p>
          </section>

          {/* ── 5. Was kostet kein Setup ── */}
          <section>
            <h2 className="text-xl font-bold mb-4" style={{ color: "var(--text-primary)" }}>
              Die eigentliche Frage: Was kostet kein Setup?
            </h2>
            <p className="leading-relaxed mb-4">
              Wer auf ein Hardware Wallet verzichtet, lässt sein Bitcoin auf der Börse.
              Das Gegenrisiko ist nicht abstrakt — es ist dokumentiert.
              FTX-Kunden warten heute, Jahre nach der Pleite, immer noch auf ihre Gelder.
              Mt.-Gox-Gläubiger haben jahrelang Insolvenzverfahren durchgefochten.
            </p>
            <p className="leading-relaxed mb-4">
              Das schlimmste Szenario: Dein Stack wächst über die Jahre auf 0,5 BTC oder mehr —
              und du verlierst ihn vollständig durch eine Börsenpleite, einen Hack oder
              einen Betrug. 250 € hätten das verhindert.
            </p>
            <p className="leading-relaxed mb-4">
              Wer auf ein Metall-Seed-Backup verzichtet, riskiert Totalverlust durch Feuer,
              Wasserschaden oder einfach verblasste Tinte auf vergilbtem Papier —
              Jahre, nachdem die Seed Phrase aufgeschrieben wurde und vergessen in
              einer Schublade lag.
            </p>
            <div className="rounded-xl p-5 border" style={{ background: "var(--surface)", borderColor: "#1a1a1a" }}>
              <p className="font-bold mb-2" style={{ color: "var(--text-primary)" }}>
                Die Rechnung ist simpel:
              </p>
              <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                Ein Setup kostet einmalig ~250 €. Es schützt einen Stack, der nach dem Power Law
                in 10 Jahren fünf- bis sechsstellig sein kann. Wer das Setup nicht macht,
                spart 250 € und riskiert alles. Das ist keine gute Kalkulation.
              </p>
            </div>
          </section>

          {/* ── 6. Gebühren über Zeit ── */}
          <section>
            <h2 className="text-xl font-bold mb-4" style={{ color: "var(--text-primary)" }}>
              Auch laufende Kosten relativieren sich schnell
            </h2>
            <p className="leading-relaxed mb-4">
              Börsengebühren fallen bei jedem Kauf an — das macht sie zur einzigen laufenden
              Komponente deines Setups. Aber auch hier gilt: im Vergleich zur erwarteten
              Wertentwicklung sind selbst 1 % Gebühren langfristig kaum spürbar.
            </p>
            <p className="leading-relaxed mb-4">
              Was hingegen sehr wohl spürbar ist: der Unterschied zwischen einer guten und
              einer schlechten Börse. Ein Sparplan über 100 €/Monat bei 1,5 % Gebühren
              kostet 18 € pro Jahr mehr als bei 0,5 % Gebühren. Über 15 Jahre summiert
              sich das auf über 2.700 € reine Mehrkosten — bei gleichem Einkauf.
            </p>
            <p className="leading-relaxed">
              Die richtige Börse zu wählen ist deshalb kein Detailproblem. Es ist ein
              wesentlicher Teil des Setups — und im{" "}
              <Link href="/vergleich/boersen" className="underline font-medium" style={{ color: "var(--text-primary)" }}>
                Börsen-Vergleich
              </Link>{" "}
              sind alle relevanten Anbieter für DACH gegenübergestellt.
            </p>
          </section>

          {/* ── 7. CTA ── */}
          <section>
            <h2 className="text-xl font-bold mb-4" style={{ color: "var(--text-primary)" }}>
              Jetzt dein Setup zusammenstellen
            </h2>
            <p className="leading-relaxed mb-8">
              Ein solides Bitcoin-Setup ist kein Luxus — es ist die Grundlage dafür, dass
              dein Stack wirklich dir gehört. Und gemessen an dem, was Bitcoin laut Power Law
              langfristig wert sein kann, sind die Kosten trivial.
            </p>

            <div className="flex flex-col gap-4">

              {/* CTA 1: Setup-Wizard */}
              <Link
                href="/setup"
                className="flex items-center justify-between rounded-xl p-5 border transition-all hover:border-gray-800 group"
                style={{ background: "#1a1a1a", borderColor: "#1a1a1a" }}
              >
                <div>
                  <p className="font-bold text-base" style={{ color: "#fff" }}>
                    Mein Bitcoin-Setup zusammenstellen
                  </p>
                  <p className="text-sm mt-0.5" style={{ color: "#aaa" }}>
                    3 Minuten · persönliche Produktempfehlungen auf Basis deiner Angaben
                  </p>
                </div>
                <span style={{ color: "#fff", fontSize: "18px" }}>→</span>
              </Link>

              {/* CTA 2: Freedom-Rechner */}
              <Link
                href="/rechner/freedom-boost"
                className="flex items-center justify-between rounded-xl p-5 border transition-all hover:border-gray-400 group"
                style={{ background: "var(--surface)", borderColor: "var(--border)" }}
              >
                <div>
                  <p className="font-bold text-base" style={{ color: "var(--text-primary)" }}>
                    Setup-Kosten im Freedom-Rechner kalkulieren
                  </p>
                  <p className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>
                    Wie viel verschiebt sich dein Freedom-Datum durch Einmalkosten und Gebühren?
                  </p>
                </div>
                <span style={{ color: "var(--text-tertiary)", fontSize: "18px" }}>→</span>
              </Link>

              {/* CTA 3: Warenkorb */}
              <Link
                href="/setup/warenkorb"
                className="flex items-center justify-between rounded-xl p-5 border transition-all hover:border-gray-400 group"
                style={{ background: "var(--surface)", borderColor: "var(--border)" }}
              >
                <div>
                  <p className="font-bold text-base" style={{ color: "var(--text-primary)" }}>
                    Produkte im Warenkorb sammeln
                  </p>
                  <p className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>
                    Börse, Hardware Wallet und Seed-Backup vergleichen, auswählen und Kosten berechnen
                  </p>
                </div>
                <span style={{ color: "var(--text-tertiary)", fontSize: "18px" }}>→</span>
              </Link>
            </div>
          </section>

        </div>

        {/* Footer Links */}
        <div className="mt-16 pt-8 border-t flex flex-wrap gap-4 text-xs font-mono" style={{ borderColor: "var(--border)", color: "var(--text-tertiary)" }}>
          <Link href="/ratgeber/hardware-wallet-erklaerung" className="hover:underline">Hardware Wallets erklärt →</Link>
          <Link href="/ratgeber/seed-phrase-sichern" className="hover:underline">Seed Phrase sichern →</Link>
          <Link href="/ratgeber/bitcoin-boerse-gebuehren" className="hover:underline">Börsengebühren im Vergleich →</Link>
          <Link href="/ratgeber/bitcoin-power-law" className="hover:underline">Bitcoin Power Law →</Link>
        </div>
      </main>

      <footer className="relative z-10 px-6 md:px-12 py-8 border-t mt-8 text-xs font-mono"
        style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}>
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <span>© 2026 Bitcoin Navigator</span>
          <div className="flex gap-4">
            <Link href="/impressum" className="hover:opacity-70 transition-colors">Impressum</Link>
            <Link href="/datenschutz" className="hover:opacity-70 transition-colors">Datenschutz</Link>
          </div>
        </div>
        <p className="mt-2" style={{ color: "#999" }}>
          Kein Anlageberatung. Alle Angaben ohne Gewähr. Modellpreise basieren auf dem Bitcoin Power Law (Santostasi) — keine Garantie für zukünftige Kurse.
        </p>
      </footer>
    </div>
  );
}
