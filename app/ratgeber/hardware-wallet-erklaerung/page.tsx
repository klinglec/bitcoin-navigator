import Link from "next/link";
import SiteHeader from '@/components/SiteHeader';

export const metadata = {
  title: "Was ist ein Hardware Wallet – und wann brauchst du wirklich eines? | Bitcoin Navigator",
  description: "Ab welchem Betrag lohnt sich ein Hardware Wallet? Was Self-Custody bedeutet, welche Risiken du eliminierst und worauf du beim Kauf achten solltest.",
  alternates: { canonical: "https://bitcoinnavigator.de/ratgeber/hardware-wallet-erklaerung" },
};

export default function ArtikelHardwareWallet() {
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
            Hardware Wallets
          </span>
          <span className="font-mono text-xs" style={{ color: "var(--text-secondary)" }}>6 min Lesezeit</span>
        </div>

        <h1 className="text-3xl md:text-4xl font-extrabold leading-tight mb-6">
          Was ist ein Hardware Wallet – und wann brauchst du wirklich eines?
        </h1>

        <p className="text-lg leading-relaxed mb-12" style={{ color: "var(--text-secondary)" }}>
          „Not your keys, not your coins." Dieser Satz ist einer der bekanntesten in der Bitcoin-Community –
          und er beschreibt genau, warum Hardware Wallets existieren.
        </p>

        <div className="space-y-10" style={{ color: "var(--text-secondary)" }}>

          <section>
            <h2 className="text-xl font-bold mb-4" style={{ color: "var(--text-primary)" }}>
              Das Risiko auf einer Börse
            </h2>
            <p className="leading-relaxed mb-4">
              Wenn du Bitcoin auf einer Börse kaufst und dort lässt, besitzt du technisch gesehen keinen Bitcoin.
              Du besitzt eine Forderung gegenüber der Börse. Das klingt nach einer Kleinigkeit – ist es aber nicht.
            </p>
            <p className="leading-relaxed">
              Börsen können gehackt werden, insolvent gehen oder regulatorisch gesperrt werden. Mt. Gox (2014),
              FTX (2022) – beide Male verloren Nutzer ihre Bestände. Solange dein Bitcoin auf einer Börse liegt,
              trägst du das Gegenparteirisiko dieses Unternehmens.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-4" style={{ color: "var(--text-primary)" }}>
              Was ist Self-Custody?
            </h2>
            <p className="leading-relaxed mb-4">
              Self-Custody bedeutet, dass du die privaten Schlüssel deines Bitcoin selbst kontrollierst –
              ohne Mittelmann. Ein Hardware Wallet ist ein physisches Gerät, das diese Schlüssel sicher speichert
              und niemals mit dem Internet verbunden ist.
            </p>
            <p className="leading-relaxed">
              Transaktionen werden auf dem Gerät signiert und dann erst ans Netzwerk gesendet. Der private Schlüssel
              verlässt das Gerät nie. Selbst wenn dein Computer gehackt wird, bleiben deine Bitcoin sicher.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-4" style={{ color: "var(--text-primary)" }}>
              Ab welchem Betrag lohnt sich ein Hardware Wallet?
            </h2>
            <p className="leading-relaxed mb-4">
              Eine pauschale Antwort gibt es nicht – aber als Orientierung:
            </p>
            <div className="rounded-xl p-5 border space-y-4" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
              <div>
                <p className="font-bold text-sm mb-1" style={{ color: "var(--text-primary)" }}>Unter 500€</p>
                <p className="text-sm">Ein Hardware Wallet ist optional. Das Risiko ist überschaubar, und ein günstiges
                  Modell wie der Trezor Safe 3 (59€) amortisiert sich noch nicht unbedingt.</p>
              </div>
              <div className="border-t pt-4" style={{ borderColor: "var(--border)" }}>
                <p className="font-bold text-sm mb-1" style={{ color: "var(--text-primary)" }}>500€ – 2.000€</p>
                <p className="text-sm">Empfehlenswert. Ein Einsteigermodell (Trezor Safe 3 oder Ledger Nano S Plus)
                  gibt Sicherheit ohne großen Aufwand.</p>
              </div>
              <div className="border-t pt-4" style={{ borderColor: "var(--border)" }}>
                <p className="font-bold text-sm mb-1" style={{ color: "var(--accent)" }}>Über 2.000€</p>
                <p className="text-sm">Klar empfohlen. Das Risiko auf einer Börse ist nicht gerechtfertigt.
                  Self-Custody ist hier Standard.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-4" style={{ color: "var(--text-primary)" }}>
              Die wichtigsten Kriterien beim Kauf
            </h2>
            <ul className="space-y-4 text-sm">
              <li className="flex gap-3">
                <span style={{ color: "var(--accent)" }}>◈</span>
                <span><strong style={{ color: "var(--text-primary)" }}>Open-Source Firmware:</strong> Kann der Code
                  von unabhängigen Experten geprüft werden? Trezor und BitBox02 sind vollständig open source.
                  Ledger ist closed source – was nicht automatisch unsicher bedeutet, aber weniger transparent ist.</span>
              </li>
              <li className="flex gap-3">
                <span style={{ color: "var(--accent)" }}>◈</span>
                <span><strong style={{ color: "var(--text-primary)" }}>Secure Element:</strong> Ein dedizierter
                  Sicherheitschip schützt vor physischen Angriffen. Fast alle modernen Modelle haben einen.</span>
              </li>
              <li className="flex gap-3">
                <span style={{ color: "var(--accent)" }}>◈</span>
                <span><strong style={{ color: "var(--text-primary)" }}>Bitcoin-only vs. Multi-Coin:</strong> Wer
                  ausschließlich Bitcoin hält, profitiert von einem Bitcoin-only Gerät – weniger Code bedeutet
                  weniger Angriffsfläche. BitBox02 Bitcoin-only, Coldcard und Jade sind gute Beispiele.</span>
              </li>
              <li className="flex gap-3">
                <span style={{ color: "var(--accent)" }}>◈</span>
                <span><strong style={{ color: "var(--text-primary)" }}>Bedienbarkeit:</strong> Ein Wallet nützt
                  nichts, wenn du es nicht benutzt. Gerade für Einsteiger ist ein guter UX-Score wichtiger als
                  maximale technische Features.</span>
              </li>
              <li className="flex gap-3">
                <span style={{ color: "var(--accent)" }}>◈</span>
                <span><strong style={{ color: "var(--text-primary)" }}>Nur beim Hersteller kaufen:</strong> Hardware
                  Wallets immer direkt beim Hersteller oder einem zertifizierten Händler kaufen – nie auf
                  Secondhand-Plattformen. Ein manipuliertes Gerät kann deine Bitcoin stehlen.</span>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-4" style={{ color: "var(--text-primary)" }}>
              Fazit
            </h2>
            <p className="leading-relaxed">
              Ein Hardware Wallet ist kein Luxus – es ist die logische Konsequenz von Bitcoin-Ownership.
              Wer Bitcoin langfristig hält, sollte seine Bestände selbst kontrollieren. Der Einstieg ist einfacher
              als oft gedacht: Ein Trezor Safe 3 für 59€ reicht für die meisten Nutzer vollkommen aus.
            </p>
          </section>

          <div className="rounded-2xl p-7 border mt-8" style={{ background: "var(--surface)", borderColor: "var(--accent)" }}>
            <p className="font-mono text-xs mb-3" style={{ color: "var(--accent)" }}>Jetzt vergleichen</p>
            <p className="font-bold text-lg mb-4">12 Hardware Wallets im direkten Vergleich</p>
            <p className="text-sm mb-5" style={{ color: "var(--text-secondary)" }}>
              Preis, Open Source, Secure Element, UX-Score, Verbindungsart und mehr – alle Modelle von Ledger,
              Trezor, BitBox02, Coldcard und Blockstream Jade.
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
