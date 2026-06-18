import Link from "next/link";
import SiteHeader from '@/components/SiteHeader';

export const metadata = {
  title: "Das Bitcoin Power Law: Langfristiger Kursverlauf erklärt | Bitcoin Navigator",
  description: "Was ist das Power Law Modell, wie funktioniert die Formel, und was bedeuten Median, unteres Band und Überbewertung für deine Bitcoin-Strategie?",
  alternates: { canonical: "https://bitcoinnavigator.de/ratgeber/bitcoin-power-law" },
};

export default function ArtikelPowerLaw() {
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
            Analyse
          </span>
          <span className="font-mono text-xs" style={{ color: "var(--text-secondary)" }}>7 min Lesezeit</span>
          <span className="font-mono text-xs" style={{ color: "var(--text-secondary)" }}>18. Juni 2026</span>
        </div>

        <h1 className="text-3xl md:text-4xl font-extrabold leading-tight mb-6">
          Das Bitcoin Power Law: Warum der Kurs langfristig einem Muster folgt
        </h1>

        <p className="text-lg leading-relaxed mb-12" style={{ color: "var(--text-secondary)" }}>
          Bitcoin wirkt kurzfristig chaotisch. Langfristig zeigt sich ein erstaunlich stabiles Muster:
          Der Kurs folgt einem sogenannten Potenzgesetz — auf doppelt logarithmischer Skala fast eine Gerade.
          Was steckt dahinter, und was bedeutet das für deine Strategie?
        </p>

        <div className="space-y-10" style={{ color: "var(--text-secondary)" }}>

          <section>
            <h2 className="text-xl font-bold mb-4" style={{ color: "var(--text-primary)" }}>
              Was ist ein Power Law?
            </h2>
            <p className="leading-relaxed mb-4">
              Ein Potenzgesetz (englisch: Power Law) beschreibt eine Beziehung der Form <em>y = a · x<sup>b</sup></em>.
              Viele natürliche Phänomene folgen diesem Muster: die Größe von Städten, die Häufigkeit von Erdbeben,
              das Wachstum von Netzwerken. Das Charakteristische daran: auf einer doppelt logarithmischen Skala
              (log–log) erscheinen Power-Law-Beziehungen als gerade Linie.
            </p>
            <p className="leading-relaxed">
              Der Physiker Giovanni Santostasi beobachtete, dass auch der Bitcoin-Kurs auf einer solchen
              log–log-Skala seit dem Genesis Block im Januar 2009 erstaunlich konstant einer Geraden folgt —
              trotz aller Crashs, Blasen und Bärenmärkte dazwischen.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-4" style={{ color: "var(--text-primary)" }}>
              Die Formel hinter dem Modell
            </h2>
            <p className="leading-relaxed mb-4">
              Das Modell von Santostasi lautet:
            </p>
            <div className="rounded-xl p-5 border font-mono text-sm" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
              <p style={{ color: "var(--text-primary)" }}>log₁₀(Preis) = −17,016 + 5,845 · log₁₀(d)</p>
              <p className="mt-2 text-xs" style={{ color: "var(--text-tertiary)" }}>
                d = Tage seit dem Genesis Block (3. Januar 2009)
              </p>
            </div>
            <p className="leading-relaxed mt-4">
              Das ergibt den sogenannten <strong style={{ color: "var(--text-primary)" }}>Power Law Median</strong> —
              den fairen Gleichgewichtspreis laut Modell für jeden beliebigen Tag.
              Daraus lässt sich direkt ablesen: Heute wäre der Median-Preis laut Modell deutlich niedriger
              als die aktuellen Handelskurse — was auf eine Überbewertung hindeutet. In Bärenmärkten
              liegt der Kurs oft weit darunter.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-4" style={{ color: "var(--text-primary)" }}>
              Median, unteres Band — was ist was?
            </h2>
            <p className="leading-relaxed mb-6">
              Das Modell definiert zwei Kernlinien:
            </p>
            <div className="space-y-3">
              {[
                {
                  label: "Power Law Median",
                  color: "#2a6a2a",
                  bg: "#eef7ee",
                  border: "#b3d9b3",
                  desc: "Der langfristige Gleichgewichtspreis. Historisch pendelt Bitcoin mal darüber, mal darunter. In Bullenmärkten liegt der Kurs deutlich über dem Median, in Bärenmärkten darunter.",
                },
                {
                  label: "Unteres Band (Floor)",
                  color: "#2a6a2a",
                  bg: "#eef7ee",
                  border: "#b3d9b3",
                  desc: "Etwa 35% des Medians. Historisch hat Bitcoin den Preis unterhalb dieses Bandes kaum je für längere Zeit gehalten. Das untere Band gilt als langfristiger Boden.",
                },
              ].map(({ label, color, bg, border, desc }) => (
                <div key={label} className="rounded-xl p-5 border text-sm"
                  style={{ background: bg, borderColor: border }}>
                  <p className="font-bold mb-2" style={{ color }}>{label}</p>
                  <p style={{ color: "#444" }}>{desc}</p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-4" style={{ color: "var(--text-primary)" }}>
              Die vier Zonen: Wo steht Bitcoin gerade?
            </h2>
            <p className="leading-relaxed mb-6">
              Das Vielfache des aktuellen Kurses gegenüber dem Median (das sogenannte <em>Multiple</em>)
              gibt Aufschluss darüber, wie weit der Kurs vom langfristigen Gleichgewicht entfernt ist.
              Im Freedom-Boost-Rechner wird dieses Multiple live berechnet und in vier Zonen eingeteilt:
            </p>
            <div className="space-y-3 text-sm">
              {[
                {
                  zone: "Unterbewertet",
                  range: "Multiple < 0,5×",
                  bg: "#eef7ee", border: "#b3d9b3", color: "#2a6a2a",
                  desc: "Preis liegt nahe dem unteren Band. Historisch selten und kurzlebig — oft ein attraktiver Einstiegspunkt.",
                },
                {
                  zone: "Fair Value",
                  range: "0,5× – 1,5×",
                  bg: "var(--surface)", border: "var(--border)", color: "var(--text-primary)",
                  desc: "Preis im normalen Bereich rund um den Median. Weder überhitzt noch extrem günstig.",
                },
                {
                  zone: "Erhöht",
                  range: "1,5× – 2,5×",
                  bg: "rgba(245,158,11,0.05)", border: "#f59e0b", color: "#854F0B",
                  desc: "Preis deutlich über Median. Typisch für späte Bullmarkt-Phasen. Korrekturen von 40–60% sind in dieser Zone historisch wahrscheinlich.",
                },
                {
                  zone: "Extrem überbewertet",
                  range: "Multiple > 2,5×",
                  bg: "#f0ede8", border: "#c0bdb8", color: "#444",
                  desc: "Preis weit über Median. Zyklische Peaks lagen historisch in diesem Bereich — gefolgt von starken Korrekturen.",
                },
              ].map(({ zone, range, bg, border, color, desc }) => (
                <div key={zone} className="rounded-xl p-4 border"
                  style={{ background: bg, borderColor: border }}>
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-bold text-sm" style={{ color }}>{zone}</p>
                    <span className="font-mono text-xs px-2 py-0.5 rounded-full"
                      style={{ background: "var(--surface-alt)", color: "var(--text-tertiary)" }}>
                      {range}
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>{desc}</p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-4" style={{ color: "var(--text-primary)" }}>
              Was das Power Law für Kredit-Strategien bedeutet
            </h2>
            <p className="leading-relaxed mb-4">
              Wer mit Bitcoin besicherter Kredit arbeitet — etwa im Rahmen einer <em>Buy. Borrow. Die.</em>-Strategie —
              muss das aktuelle Preisniveau im Blick behalten. Der Grund: Kreditgeber liquidieren deine
              Bitcoin automatisch, wenn der Kurs unter einen bestimmten Schwellenwert fällt.
            </p>
            <p className="leading-relaxed mb-4">
              Liegt der aktuelle Kurs weit über dem Power Law Median, ist eine Korrektur historisch
              wahrscheinlicher. Liegt dein Liquidationspreis nahe dem Median oder gar darunter, kann
              eine normale Zykluskorrektur bereits zur Liquidation führen — ohne dass ein extremer
              Crash nötig wäre.
            </p>
            <p className="leading-relaxed">
              Der <Link href="/rechner/freedom-boost" className="font-medium underline" style={{ color: "var(--accent)" }}>Freedom-Boost-Rechner</Link> zeigt
              dir deshalb in Echtzeit, wo der Bitcoin-Kurs gerade im Power Law steht — und warnt,
              wenn dein Liquidationspreis in einen kritischen Bereich gerät.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-4" style={{ color: "var(--text-primary)" }}>
              Stärken und Grenzen des Modells
            </h2>
            <p className="leading-relaxed mb-4">
              Das Power Law hat bemerkenswerte Stärken: Es hat bisher alle großen Bitcoin-Zyklen
              zumindest grob antizipiert, und die log–log-Linearität hält seit über 15 Jahren.
              Das Modell ist transparent, reproduzierbar und basiert auf einer simplen Formel.
            </p>
            <p className="leading-relaxed mb-4">
              Gleichzeitig gilt: Kein Modell kann die Zukunft vorhersagen. Das Power Law beschreibt
              historische Daten — eine Garantie für künftige Entwicklungen ist es nicht. Gründe,
              warum es brechen könnte: regulatorische Eingriffe, fundamentale technische Veränderungen
              oder eine strukturell andere Adoption als bisher.
            </p>
            <div className="rounded-xl p-5 border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
              <p className="font-mono text-xs mb-3" style={{ color: "var(--accent)" }}>Wichtiger Hinweis</p>
              <p className="text-sm leading-relaxed">
                Das Power Law Modell ist ein Analysewerkzeug, kein Handelssignal.
                Alle Werte im Freedom-Boost-Rechner sind Projektionen auf Basis historischer Daten —
                keine Anlageberatung. Entscheide eigenverantwortlich und ziehe bei Bedarf einen
                Finanzberater hinzu.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-4" style={{ color: "var(--text-primary)" }}>
              Fazit
            </h2>
            <p className="leading-relaxed">
              Das Power Law ist das robusteste langfristige Preismodell für Bitcoin, das bisher
              existiert. Es gibt keine Kaufsignale — aber es schafft Orientierung. Wer weiß, ob der
              aktuelle Kurs eher am Boden oder im überhitzten Bereich liegt, trifft bessere
              Entscheidungen: beim Sparplan, beim Einstiegszeitpunkt und besonders bei
              hebelten Strategien wie Bitcoin-Krediten.
            </p>
          </section>

          <div className="rounded-2xl p-7 border mt-8" style={{ background: "var(--surface)", borderColor: "var(--accent)" }}>
            <p className="font-mono text-xs mb-2" style={{ color: "var(--accent)" }}>Rechner ausprobieren</p>
            <p className="font-bold text-lg mb-3" style={{ color: "var(--text-primary)" }}>
              Wo steht Bitcoin heute im Power Law?
            </p>
            <p className="text-sm mb-5" style={{ color: "var(--text-secondary)" }}>
              Der Freedom-Boost-Rechner zeigt dir live das aktuelle Multiple und warnt bei
              erhöhtem Korrekturrisiko für Kredit-Strategien.
            </p>
            <Link href="/rechner/freedom-boost"
              className="inline-block px-5 py-2.5 rounded-xl text-sm font-bold transition-opacity hover:opacity-80"
              style={{ background: "var(--accent)", color: "#0a0a0a" }}>
              Zum Freedom-Boost-Rechner →
            </Link>
          </div>

        </div>
      </main>
    </div>
  );
}
