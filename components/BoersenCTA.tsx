import Link from 'next/link'

interface Props {
  context?: 'sparplan' | 'entnahme' | 'freedom'
}

const labels: Record<NonNullable<Props['context']>, string> = {
  sparplan: 'Sparplan starten — passende Börse finden',
  entnahme: 'Entnahmeplan umsetzen — passende Börse finden',
  freedom:  'Freedom-Plan starten — passende Börse finden',
}

const subs: Record<NonNullable<Props['context']>, string> = {
  sparplan: 'Günstigste Gebühren für regelmäßige Käufe im Vergleich',
  entnahme: 'Börsen mit niedrigen Verkaufsgebühren im Vergleich',
  freedom:  'Börsen für Sparplan und spätere Entnahme im Vergleich',
}

export default function BoersenCTA({ context = 'sparplan' }: Props) {
  return (
    <div
      className="flex items-center justify-between gap-4 rounded-xl p-5 mt-8"
      style={{
        border: '1.5px solid #1a1a1a',
        background: '#ffffff',
      }}
    >
      <div className="flex items-center gap-4">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 text-lg"
          style={{ background: '#f5f5f5' }}
        >
          🏦
        </div>
        <div>
          <p className="text-sm font-medium" style={{ color: '#1a1a1a', margin: 0 }}>
            {labels[context]}
          </p>
          <p className="text-xs" style={{ color: '#666666', margin: '2px 0 0' }}>
            {subs[context]}
          </p>
        </div>
      </div>
      <Link
        href="/vergleich/boersen"
        className="text-sm font-medium whitespace-nowrap rounded-lg px-4 py-2 transition-colors"
        style={{
          border: '1px solid #1a1a1a',
          color: '#1a1a1a',
          background: '#ffffff',
          textDecoration: 'none',
        }}
      >
        Börsen vergleichen →
      </Link>
    </div>
  )
}
