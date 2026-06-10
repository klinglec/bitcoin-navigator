import { getComparisonData } from '@/lib/comparison'
import ComparisonView from '@/components/comparison/ComparisonView'
import Link from 'next/link'
import { notFound } from 'next/navigation'

// ISR: Seite alle 3600 Sekunden (1h) neu generieren
// → Datenbankänderungen gehen automatisch live, kein manueller Redeploy nötig
export const revalidate = 3600

const VALID_CATEGORIES = ['boersen', 'hardware-wallets']

export async function generateStaticParams() {
  return VALID_CATEGORIES.map(category => ({ category }))
}

export async function generateMetadata({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params
  const meta: Record<string, { title: string; description: string }> = {
    'boersen': {
      title: 'Bitcoin Börsen Vergleich 2026 – Gebühren, Sparplan & Sicherheit | Bitcoin Navigator',
      description: 'Vergleiche 9 Bitcoin-Börsen für den DACH-Raum: Maker-/Taker-Gebühren, KYC-Level, Sparplan, Lightning-Support & Regulierung. Unabhängig & aktuell.',
    },
    'hardware-wallets': {
      title: 'Hardware Wallet Vergleich 2026 – Ledger, Trezor, BitBox & mehr | Bitcoin Navigator',
      description: '12 Hardware Wallets im Vergleich: Preis, Open-Source-Firmware, Secure Element, UX-Score & Lieferzeit. Finde das beste Wallet für deine Bitcoin.',
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
    <div className="relative min-h-screen grid-bg">
      {/* Nav */}
      <header
        className="relative z-10 flex items-center justify-between px-6 md:px-12 py-6 border-b"
        style={{ borderColor: 'var(--border)' }}
      >
        <Link href="/" className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded flex items-center justify-center font-bold text-sm"
            style={{ background: 'var(--accent)', color: '#0a0a0a' }}
          >
            ₿
          </div>
          <span className="font-bold text-sm tracking-widest uppercase" style={{ letterSpacing: '0.15em' }}>
            Bitcoin Navigator
          </span>
        </Link>

        <nav className="flex items-center gap-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
          <Link
            href="/vergleich/boersen"
            className="hover:text-white transition-colors"
            style={{ color: category === 'boersen' ? 'var(--accent)' : undefined }}
          >
            Börsen
          </Link>
          <Link
            href="/vergleich/hardware-wallets"
            className="hover:text-white transition-colors"
            style={{ color: category === 'hardware-wallets' ? 'var(--accent)' : undefined }}
          >
            Hardware Wallets
          </Link>
        </nav>
      </header>

      <main className="relative z-10 px-6 md:px-12 py-12">
        <ComparisonView data={data} />
      </main>

      <footer
        className="relative z-10 px-6 md:px-12 py-8 border-t mt-16 text-xs font-mono"
        style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
      >
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <span>© 2026 Bitcoin Navigator</span>
          <div className="flex gap-4">
            <Link href="/impressum" className="hover:text-white transition-colors">Impressum</Link>
            <Link href="/datenschutz" className="hover:text-white transition-colors">Datenschutz</Link>
          </div>
        </div>
        <p className="mt-2" style={{ color: 'var(--border)' }}>
          Affiliate-Links werden transparent gekennzeichnet. Alle Angaben ohne Gewähr – Stand: {new Date().toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })}.
        </p>
      </footer>
    </div>
  )
}
