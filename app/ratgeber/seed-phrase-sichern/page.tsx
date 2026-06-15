import Link from "next/link";
import SiteHeader from '@/components/SiteHeader';

export const metadata = {
  title: "Seed Phrase: Der häufigste Fehler beim Bitcoin-Sichern | Bitcoin Navigator",
  description: "Warum Screenshots, Cloud-Backups und Passwortmanager gefährlich sind – und warum physische Stahlplatten die einzig sinnvolle Lösung für deine Bitcoin-Seed-Phrase sind.",
  alternates: { canonical: "https://bitcoinnavigator.de/ratgeber/seed-phrase-sichern" },
};

export default function ArtikelSeedPhrase() {
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
            Self-Custody
          </span>
          <span className="font-mono text-xs" style={{ color: "var(--text-secondary)" }}>4 min Lesezeit</span>
        </div>

        <h1 className="text-3xl md:text-4xl font-extrabold leading-tight mb-6">
          Seed Phrase: Der häufigste Fehler beim Bitcoin-Sichern
        </h1>

        <p className="text-lg leading-relaxed mb-12" style={{ color: "var(--text-secondary)" }}>
          Du hast dir ein Hardware Wallet gekauft. Gut. Aber wie sicherst du deine Seed Phrase?
          Hier machen die meisten Nutzer einen entscheidenden Fehler.
        </p>

        <div className="space-y-10" style={{ color: "var(--text-secondary)" }}>

          <section>
            <h2 className="text-xl font-bold mb-4" style={{ color: "var(--text-primary)" }}>
              Was ist eine Seed Phrase?
            </h2>
            <p className="leading-relaxed mb-4">
              Wenn du ein Hardware Wallet einrichtest, generiert es 12 oder 24 zufällige Wörter –
              die sogenannte Seed Phrase (auch Recovery Phrase oder Mnemonic genannt).
              Diese Wörter sind der Generalschlüssel zu deinem Bitcoin.
            </p>
            <p className="leading-relaxed">
              Wer diese Wörter in der richtigen Reihenfolge kennt, kann auf jedes Wallet der Welt
              zugreifen, das mit dieser Phrase erstellt wurde. Wenn du sie verlierst und dein Gerät
              kaputtgeht, sind deine Bitcoin unwiederbringlich verloren.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-4" style={{ color: "var(--text-primary)" }}>
              Die häufigsten Fehler
            </h2>
            <div className="space-y-4">
              {[
                {
                  title: "Screenshot auf dem Smartphone",
                  desc: "Smartphones werden synchronisiert – iCloud, Google Photos, OneDrive. Deine Seed Phrase landet automatisch in der Cloud. Ein Hack des Cloud-Accounts reicht aus."
                },
                {
                  title: "Foto in der Cloud speichern",
                  desc: "Gleicher Fehler, andere Ausführung. Cloud-Dienste sind bequem, aber kein sicherer Ort für Seed Phrases."
                },
                {
                  title: "In einem Passwortmanager speichern",
                  desc: "Passwortmanager sind für Passwörter, nicht für Bitcoin-Seeds. Ein kompromittiertes Master-Passwort gibt Zugriff auf alles."
                },
                {
                  title: "Auf Papier – und das war's",
                  desc: "Papier brennt, wird nass, verblasst. Das mitgelieferte Blatt des Hardware Wallets ist für den Moment gedacht – nicht für Jahre."
                },
                {
                  title: "Einmal irgendwo abfotografiert",
                  desc: "Kamerarollen werden gesichert. Einmal gemacht, immer ein Risiko."
                },
              ].map((item) => (
                <div key={item.title} className="flex gap-4 p-4 rounded-xl border"
                  style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
                  <span className="text-lg flex-shrink-0">✗</span>
                  <div>
                    <p className="font-bold text-sm mb-1" style={{ color: "var(--text-primary)" }}>{item.title}</p>
                    <p className="text-sm">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-4" style={{ color: "var(--text-primary)" }}>
              Die richtige Lösung: Physisches Backup
            </h2>
            <p className="leading-relaxed mb-4">
              Die einzig sinnvolle Lösung für langfristige Sicherung ist ein physisches Backup auf einem
              Material, das Feuer, Wasser und Zeit übersteht: <strong style={{ color: "var(--text-primary)" }}>Edelstahl oder Titan</strong>.
            </p>
            <p className="leading-relaxed mb-4">
              Es gibt dafür spezialisierte Produkte – Stahlplatten, auf die du die Wörter einpresst,
              gravierst oder körnerst. Diese sogenannten Seed-Backup-Produkte sind feuerfest bis
              über 1.000°C und wasserdicht.
            </p>
            <div className="rounded-xl p-5 border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
              <p className="font-mono text-xs mb-3" style={{ color: "var(--accent)" }}>Wichtig beim Einstempeln</p>
              <ul className="text-sm space-y-2">
                <li>• Immer offline, niemals in der Nähe eines Computers oder Smartphones</li>
                <li>• Wörter in der richtigen Reihenfolge eintragen – Fehler nicht korrigierbar</li>
                <li>• Mindestens zwei Kopien an verschiedenen sicheren Orten aufbewahren</li>
                <li>• Niemandem zeigen – nicht mal der Familie (außer du hast eine Vererbungsplanung)</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-4" style={{ color: "var(--text-primary)" }}>
              Welche Backup-Methode ist die beste?
            </h2>
            <div className="space-y-3 text-sm">
              {[
                { method: "Stempel-Kit", desc: "Günstig, weit verbreitet. Buchstaben einzeln einschlagen – zeitaufwendig aber robust.", rec: "Einsteiger" },
                { method: "Körner-Methode", desc: "Noch günstiger, mit Körner und Hammer. Weniger präzise.", rec: "Budget" },
                { method: "Gravur (CNC/Laser)", desc: "Professionell, sehr lesbar. Benötigt externes Gerät oder Service.", rec: "Fortgeschrittene" },
                { method: "Vorgefertigte Platten (z. B. Cryptosteel, Blockplate)", desc: "Teurer, aber komfortabel. Buchstaben-Tiles einschieben statt einschlagen.", rec: "Komfort" },
              ].map((m) => (
                <div key={m.method} className="flex items-start justify-between gap-4 p-4 rounded-xl border"
                  style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
                  <div>
                    <p className="font-bold mb-0.5" style={{ color: "var(--text-primary)" }}>{m.method}</p>
                    <p>{m.desc}</p>
                  </div>
                  <span className="font-mono text-xs px-2 py-1 rounded flex-shrink-0"
                    style={{ background: "var(--accent-dim)", color: "var(--accent)" }}>
                    {m.rec}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-4" style={{ color: "var(--text-primary)" }}>
              Fazit
            </h2>
            <p className="leading-relaxed">
              Ein Hardware Wallet ohne ein sicheres physisches Backup ist wie ein Tresor ohne Schlüssel-Backup.
              Der Aufwand für eine Stahlplatte ist gering – der Schutz, den sie bietet, ist immens.
              Kaufe dein Hardware Wallet, kaufe eine Stahlplatte, schreibe deine Seed Phrase dort ein –
              fertig ist deine sichere Bitcoin-Verwahrung.
            </p>
          </section>

          <div className="rounded-2xl p-7 border mt-8" style={{ background: "var(--surface)", borderColor: "var(--accent)" }}>
            <p className="font-mono text-xs mb-3" style={{ color: "var(--accent)" }}>Nächster Schritt</p>
            <p className="font-bold text-lg mb-4">Hardware Wallet aussuchen</p>
            <p className="text-sm mb-5" style={{ color: "var(--text-secondary)" }}>
              12 Modelle im Vergleich – von günstig bis professionell. Filter nach Bitcoin-only,
              Open Source, Secure Element und Bedienbarkeit.
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
