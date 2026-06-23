import Link from 'next/link'
import SiteHeader from '@/components/SiteHeader'
import SocialCards from '@/components/SocialCards'

export const metadata = {
  title: 'Über uns – Bitcoin Navigator',
  description: 'Wer steckt hinter Bitcoin Navigator? Entstehungsgeschichte, Bewertungsmethodik und wie wir mit Affiliate-Links umgehen.',
  alternates: { canonical: 'https://bitcoinnavigator.de/ueber-uns' },
}

export default function UeberUns() {
  return (
    <div className="relative min-h-screen" style={{ background: '#f7f6f3' }}>
      <SiteHeader />

      <main className="relative z-10 px-6 md:px-12 py-16 max-w-2xl mx-auto">

        <Link
          href="/"
          className="font-mono text-xs mb-12 block hover:opacity-70 transition-opacity"
          style={{ color: '#999999' }}
        >
          ← Zurück
        </Link>

        <h1
          className="text-4xl font-bold mb-4 tracking-tight"
          style={{ color: '#1a1a1a', letterSpacing: '-0.02em' }}
        >
          Über Bitcoin Navigator
        </h1>
        <p className="text-lg mb-16 leading-relaxed" style={{ color: '#666666' }}>
          Ein ehrlicher Bitcoin-Kompass für den DACH-Raum — von jemandem, der selbst gesucht hat.
        </p>

        {/* Wer ich bin */}
        <section className="mb-14">
          <h2
            className="font-mono text-xs uppercase tracking-widest mb-5"
            style={{ color: '#f7931a' }}
          >
            Wer dahinter steckt
          </h2>
          <div className="space-y-4 leading-relaxed" style={{ color: '#444444' }}>
            <p>
              Ich bin Christian, 40, Familienvater aus Fellbach bei Stuttgart. 2021 bin ich wie viele andere
              über Krypto zu Bitcoin gekommen — Altcoins, NFTs, das volle Programm. Irgendwann
              hab ich verstanden, dass Bitcoin und Krypto nicht dasselbe sind. Nicht mal annähernd.
            </p>
            <p>
              Seitdem bin ich tief im Rabbit Hole. Ich lese Whitepapers, teste Hardware Wallets,
              verfolge MiCA-Regulierung und bin fasziniert davon, was Bitcoin auf einer fundamentalen
              Ebene bedeutet — als Geld, als Protokoll, als gesellschaftliches Phänomen. Das ist kein
              Hobby mehr, das ist eine Überzeugung.
            </p>
            <p>
              Bitcoin Navigator ist das Portal, das ich mir 2021 gewünscht hätte: Eine sachliche,
              deutschsprachige Übersicht über die Produkte und Anbieter, die man braucht, um Bitcoin
              richtig zu halten. Ohne Altcoin-Rauschen, ohne versteckte Interessenkonflikte.
            </p>
          </div>
        </section>

        {/* Methodik */}
        <section className="mb-14">
          <h2
            className="font-mono text-xs uppercase tracking-widest mb-5"
            style={{ color: '#f7931a' }}
          >
            Wie wir bewerten
          </h2>
          <div className="space-y-4 leading-relaxed" style={{ color: '#444444' }}>
            <p>
              Jede Kategorie hat einen festen Kriterienkatalog, der <strong>vor</strong> der
              Aufnahme eines Anbieters definiert wird. Gebühren, Regulierung, Sicherheitsstandards,
              Eigenverwahrung — die Gewichtungen stehen fest, bevor ein Anbieter überhaupt
              kontaktiert wird.
            </p>
            <p>
              Technische Daten werden direkt aus offiziellen Quellen entnommen und mit einem
              Zeitstempel versehen. Wo ich Produkte selbst getestet habe — etwa Hardware Wallets —
              fließen eigene Erfahrungen in die redaktionelle Einschätzung ein. Was ich nicht selbst
              testen konnte, kennzeichne ich entsprechend.
            </p>
            <p>
              Nutzerbewertungen werden manuell geprüft, bevor sie sichtbar werden. Externe Quellen
              wie Trustpilot oder unabhängige Testberichte werden als solche ausgewiesen und
              verlinkt — immer mit Quellenangabe und Datum.
            </p>
          </div>
        </section>

        {/* Affiliate */}
        <section className="mb-14">
          <h2
            className="font-mono text-xs uppercase tracking-widest mb-5"
            style={{ color: '#f7931a' }}
          >
            Affiliate-Links & Unabhängigkeit
          </h2>
          <div className="space-y-4 leading-relaxed" style={{ color: '#444444' }}>
            <p>
              Einige Links auf dieser Seite sind Affiliate-Links. Das bedeutet: Wenn du über einen
              solchen Link kaufst oder dich registrierst, bekomme ich eine Provision — für dich
              entstehen dabei keine Mehrkosten.
            </p>
            <p>
              Ich weiß, dass dieser Satz wenig wert ist ohne Nachweis. Deshalb: Kein Anbieter
              kann sich eine bessere Bewertung kaufen. Die Platzierung im Vergleich basiert
              ausschließlich auf den Kriterien. Anbieter, die kein Affiliate-Programm haben,
              sind genauso gelistet wie solche, die mir Provision zahlen.
            </p>
            <p>
              Alle Affiliate-Links sind im Interface gekennzeichnet. Der Verdienst ermöglicht es
              mir, die Plattform kostenlos und werbefrei zu betreiben.
            </p>
          </div>
        </section>

        {/* Kontakt / Socials */}
        <section className="mb-14">
          <h2
            className="font-mono text-xs uppercase tracking-widest mb-5"
            style={{ color: '#f7931a' }}
          >
            Kontakt & Socials
          </h2>
          <p className="text-sm leading-relaxed mb-6" style={{ color: '#444444' }}>
            Feedback, Korrekturen, Kooperationsanfragen — am schnellsten erreichbar über Instagram oder Nostr.
          </p>
          <SocialCards />
        </section>

        {/* Impressum-Hinweis */}
        <div
          className="rounded-xl border p-5 mt-4"
          style={{ background: '#ffffff', borderColor: '#e0ddd8' }}
        >
          <p className="text-sm leading-relaxed" style={{ color: '#666666' }}>
            Vollständige Anbieterkennzeichnung gemäß § 5 TMG findest du im{' '}
            <Link href="/impressum" className="underline hover:opacity-70 transition-opacity" style={{ color: '#1a1a1a' }}>
              Impressum
            </Link>
            .
          </p>
        </div>

      </main>

      <footer
        className="relative z-10 px-6 md:px-12 py-8 border-t mt-16 text-xs font-mono"
        style={{ borderColor: '#e0ddd8', color: '#666666' }}
      >
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <span>© 2026 Bitcoin Navigator</span>
          <div className="flex gap-4">
            <Link href="/impressum" className="hover:opacity-70 transition-colors">Impressum</Link>
            <Link href="/datenschutz" className="hover:opacity-70 transition-colors">Datenschutz</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
