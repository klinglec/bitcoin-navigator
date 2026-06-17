import Link from 'next/link'
import SiteHeader from '@/components/SiteHeader'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Bitcoin Rechner – DCA, Entnahmeplan & mehr | Bitcoin Navigator',
  description: 'Kostenlose Bitcoin-Rechner für DACH: DCA-Sparplan, Entnahmeplan, Altersvorsorge-Vergleich und Fair Price. Power Law Modell, mehrere Währungen.',
  alternates: { canonical: 'https://bitcoinnavigator.de/rechner' },
}

const TOOLS = [
  {
    href: '/rechner/dca',
    title: 'Sparplan-Rechner',
    subtitle: 'Sparplan · Power Law · Historische Szenarien',
    description: 'Regelmäßig Bitcoin kaufen – was ist dein Stack in 10 Jahren wert? Mit Power Law Projektion, Kauffrequenz und historischen Backtests.',
  },
  {
    href: '/rechner/entnahme',
    title: 'Entnahmeplan',
    subtitle: 'Schrittweise verkaufen · Steueroptimiert',
    description: 'Wie lange reicht dein Bitcoin-Stack bei regelmäßiger Entnahme? Mit §23 EStG Steuerberechnung für Deutschland.',
  },
  {
    href: '/rechner/altersvorsorge-vergleich',
    title: 'Altersvorsorge-Vergleich',
    subtitle: 'Bitcoin vs. ETF vs. Riester vs. bAV',
    description: 'Bitcoin DCA gegen ETF, Riester-Rente, betriebliche Altersvorsorge, Immobilie und Gold – gleiche Sparrate, gleicher Zeitraum.',
  },
  {
    href: '/rechner/fair-price',
    title: 'Fair Price',
    subtitle: 'Power Law · Datumsrechner · Zielpreis',
    description: 'Ist Bitcoin gerade günstig oder teuer? Der Power Law Fair Value für jedes Datum – und wann ein Zielpreis laut Modell erreicht wird.',
  },
  {
    href: '/rechner/freedom',
    title: 'Freedom-Rechner',
    subtitle: 'Finanzielle Freiheit · Aufbau & Entnahme',
    description: 'Wie viel musst du monatlich kaufen um mit Bitcoin finanziell frei zu werden? Aufbauphase und Entnahmephase in einem Tool.',
  },
  {
    href: '/rechner/buy-borrow-die',
    title: 'Buy. Borrow. Die.',
    subtitle: 'Kein Verkauf · Kredit · Steuerfrei',
    description: 'Bitcoin als Sicherheit hinterlegen, Kredit aufnehmen und steuerfrei davon leben – ohne einen Satoshi zu verkaufen.',
  },
]

export default function RechnerPage() {
  return (
    <div className="relative min-h-screen" style={{ background: 'var(--bg)' }}>
      <SiteHeader />
      <main className="px-6 md:px-12 py-12 max-w-4xl mx-auto">

        <div className="mb-10">
          <p className="text-xs tracking-widest uppercase mb-1 font-medium" style={{ color: 'var(--text-tertiary)' }}>
            Bitcoin Navigator
          </p>
          <h1 className="text-3xl md:text-4xl font-bold mb-3" style={{ letterSpacing: '-0.03em' }}>
            Bitcoin Rechner
          </h1>
          <p className="text-base max-w-xl" style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Kostenlose Tools für Bitcoin-Investoren im DACH-Raum. Power Law Projektionen,
            DACH-spezifische Steuermodelle, mehrere Währungen.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {TOOLS.map(tool => (
            <Link
              key={tool.href}
              href={tool.href}
              className="group rounded-xl border p-6 transition-all hover:border-gray-400"
              style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
            >
                  <h2 className="font-bold text-lg mb-0.5" style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                {tool.title}
              </h2>
              <p className="text-xs mb-3 font-mono" style={{ color: 'var(--text-tertiary)' }}>
                {tool.subtitle}
              </p>
              <p className="text-sm" style={{ color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {tool.description}
              </p>
              <p className="text-sm mt-4 font-medium group-hover:underline" style={{ color: 'var(--text-primary)' }}>
                Zum Rechner →
              </p>
            </Link>
          ))}
        </div>

        <p className="mt-10 text-xs" style={{ color: 'var(--text-tertiary)' }}>
          Alle Berechnungen sind Schätzwerte auf Basis von Modellen (Power Law, historische Renditen).
          Keine Anlageberatung. Preismodelle garantieren keine zukünftige Entwicklung.
        </p>
      </main>
    </div>
  )
}
