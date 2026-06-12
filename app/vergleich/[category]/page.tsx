import { getComparisonData } from '@/lib/comparison'
import ComparisonView from '@/components/comparison/ComparisonView'
import SiteHeader from '@/components/SiteHeader'
import Link from 'next/link'
import { notFound } from 'next/navigation'

// ISR: Seite alle 3600 Sekunden (1h) neu generieren
// → Datenbankänderungen gehen automatisch live, kein manueller Redeploy nötig
export const revalidate = 3600

const VALID_CATEGORIES = ['boersen', 'hardware-wallets', 'seed-backup', 'btc-kredite']

export async function generateStaticParams() {
  return VALID_CATEGORIES.map(category => ({ category }))
}

export async function generateMetadata({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params
  const meta: Record<string, { title: string; description: string }> = {
    'boersen': {
      title: 'Bitcoin Börsen Vergleich 2026 – Gebühren, Sparplan & Sicherheit | Bitcoin Navigator',
      description: 'Vergleiche 4 Bitcoin-first Börsen für den DACH-Raum: Gebühren, Sparplan, Lightning-Support & Regulierung. Unabhängig, täglich geprüft.',
    },
    'hardware-wallets': {
      title: 'Hardware Wallet Vergleich 2026 – Ledger, Trezor, BitBox & mehr | Bitcoin Navigator',
      description: '12 Hardware Wallets im Vergleich: Preis, Open-Source-Firmware, Secure Element, UX-Score & Lieferzeit. Finde das beste Wallet für deine Bitcoin.',
    },
    'seed-backup': {
      title: 'Seed-Backup Vergleich 2026 – Cryptosteel, CRYPTOTAG, SEEDOR & mehr | Bitcoin Navigator',
      description: '4 Seed-Backup Lösungen im Vergleich: Preis, Material, Methode & Temperaturbeständigkeit. Schütze deine Bitcoin-Seed Phrase mit einer Stahlplatte.',
    },
    'btc-kredite': {
      title: 'Bitcoin-Kredit Vergleich 2026 – Firefish, Debifi & mehr | Bitcoin Navigator',
      description: 'Bitcoin als Sicherheit für Fiat-Kredite – ohne zu verkaufen. Non-Custodiale Anbieter mit MiCA-Regulierung für den DACH-Raum verglichen.',
    },
  }
  const m = meta[category]
  if (!m) return { title: 'Vergleich – Bitcoin Navigator' }
  return {
    title: m.title,
    description: m.description,
    openGraph: {
      title: m.title,
      description: m.description,
      url: `https://bitcoinnavigator.de/vergleich/${category}`,
      siteName: 'Bitcoin Navigator',
      locale: 'de_DE',
      type: 'website',
    },
    alternates: {
      canonical: `https://bitcoinnavigator.de/vergleich/${category}`,
    },
  }
}

export default async function ComparisonPage({
  params,
}: {
  params: Promise<{ category: string }>
}) {
  const { category } = await params

  if (!VALID_CATEGORIES.includes(category)) notFound()

  let data
  try {
    data = await getComparisonData(category)
  } catch {
    notFound()
  }

  return (
    <div className="relative min-h-screen" style={{ background: '#f7f6f3' }}>
      <SiteHeader activePath={`/vergleich/${category}`} />

      <main className="relative z-10 px-6 md:px-12 py-12">
        <ComparisonView data={data} />
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
        <p className="mt-2" style={{ color: '#999999' }}>
          Affiliate-Links werden transparent gekennzeichnet. Alle Angaben ohne Gewähr – Stand: {new Date().toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })}.
        </p>
      </footer>
    </div>
  )
}
