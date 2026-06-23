import Link from 'next/link'

interface Recommendation {
  label: string
  provider: string
  slug: string
  reason: string
}

const RECOMMENDATIONS: Record<string, Recommendation[]> = {
  boersen: [
    {
      label: 'Einsteiger mit Sparplan',
      provider: '21bitcoin',
      slug: '21bitcoin',
      reason: 'Einfachste App, 4,8/5 auf Trustpilot, FMA-reguliert, 24/7 Support. Ab 1 € monatlich.',
    },
    {
      label: 'Sofortige Selbstverwahrung',
      provider: 'Pocket Bitcoin',
      slug: 'pocket-bitcoin',
      reason: 'Kein Account nötig. Bitcoin geht direkt in deine Wallet. Ideal wenn du bereits eine Hardware Wallet hast.',
    },
    {
      label: 'Günstige Gebühren',
      provider: 'Bitvavo',
      slug: 'bitvavo',
      reason: '0,15 % Maker-Fee — günstigste Option im Vergleich bei größeren Einmalkäufen.',
    },
  ],
}

export default function BeginnerRecommendations({ category }: { category: string }) {
  const recs = RECOMMENDATIONS[category]
  if (!recs) return null

  return (
    <div className="mb-10">
      <p
        className="font-mono text-xs uppercase tracking-widest mb-4"
        style={{ color: '#999999' }}
      >
        Schnell zur richtigen Wahl
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {recs.map(rec => (
          <Link
            key={rec.slug}
            href={`/anbieter/${rec.slug}`}
            className="block rounded-xl border p-4 transition-all hover:shadow-sm hover:border-gray-400"
            style={{
              background: '#ffffff',
              borderColor: '#e0ddd8',
              textDecoration: 'none',
            }}
          >
            <p
              className="font-mono text-xs uppercase tracking-widest mb-2"
              style={{ color: '#f7931a', fontSize: '9px' }}
            >
              {rec.label}
            </p>
            <p
              className="font-bold text-sm mb-1.5"
              style={{ color: '#1a1a1a', letterSpacing: '-0.01em' }}
            >
              {rec.provider} →
            </p>
            <p className="text-xs leading-relaxed" style={{ color: '#666666' }}>
              {rec.reason}
            </p>
          </Link>
        ))}
      </div>
    </div>
  )
}
