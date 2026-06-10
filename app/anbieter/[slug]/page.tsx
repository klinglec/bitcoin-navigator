import { getProviderDetail, getAllProviderSlugs } from '@/lib/provider'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Criteria, CriteriaValue } from '@/lib/types'
import PromoCodeButton from '@/components/PromoCodeButton'
import ReviewSection from '@/components/reviews/ReviewSection'
import SiteHeader from '@/components/SiteHeader'

// ISR: Detailseiten alle 3600 Sekunden (1h) neu generieren
export const revalidate = 3600

export async function generateStaticParams() {
  const slugs = await getAllProviderSlugs()
  return slugs.map(slug => ({ slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const provider = await getProviderDetail(slug)
  if (!provider) return { title: 'Anbieter nicht gefunden' }

  const catNames = provider.categories.map(c => c.name).join(', ')
  return {
    title: `${provider.name} – Test & Erfahrungen 2026`,
    description: provider.description
      ? `${provider.description.slice(0, 150)}…`
      : `${provider.name} im Test: Alle Kriterien, Gebühren und Erfahrungen für ${catNames} im DACH-Raum.`,
    alternates: { canonical: `https://bitcoinnavigator.de/anbieter/${slug}` },
    openGraph: {
      title: `${provider.name} – Test & Erfahrungen 2026 | Bitcoin Navigator`,
      description: `${provider.name} – alle Kriterien, Bewertungen und aktuelle Daten.`,
      url: `https://bitcoinnavigator.de/anbieter/${slug}`,
    },
  }
}

// ─── Value cell ───────────────────────────────────────────────────────────────
function ValueDisplay({ criteria, value }: { criteria: Criteria; value: CriteriaValue }) {
  if (criteria.data_type === 'boolean') {
    if (value.value_boolean === null) return <span style={{ color: 'var(--text-secondary)' }}>–</span>
    return value.value_boolean
      ? <span className="font-bold" style={{ color: '#22c55e' }}>✓ Ja</span>
      : <span style={{ color: 'var(--text-secondary)' }}>✗ Nein</span>
  }
  if (criteria.data_type === 'percentage') {
    if (value.value_number === null) return <span style={{ color: 'var(--text-secondary)' }}>–</span>
    return <span>{value.value_number.toFixed(2).replace('.', ',')} %</span>
  }
  if (criteria.data_type === 'number') {
    if (value.value_number === null) return <span style={{ color: 'var(--text-secondary)' }}>–</span>
    return <span>{value.value_number.toLocaleString('de-DE')}{criteria.unit ? ` ${criteria.unit}` : ''}</span>
  }
  if (criteria.data_type === 'multi_select') {
    const vals: string[] = Array.isArray(value.value_json) ? value.value_json as string[] : []
    if (!vals.length) return <span style={{ color: 'var(--text-secondary)' }}>–</span>
    return (
      <div className="flex flex-wrap gap-1.5">
        {vals.map(v => (
          <span key={v} className="px-2 py-0.5 rounded text-xs border"
            style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
            {v}
          </span>
        ))}
      </div>
    )
  }
  if (criteria.slug === 'promo_code' && value.value_text) {
    return <PromoCodeButton code={value.value_text} />
  }
  return <span>{value.value_text ?? '–'}</span>
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default async function ProviderPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const provider = await getProviderDetail(slug)
  if (!provider) notFound()

  const categoryBackLinks: Record<string, string> = {
    'boersen': '/vergleich/boersen',
    'hardware-wallets': '/vergleich/hardware-wallets',
  }

  return (
    <div className="relative min-h-screen grid-bg">
      <SiteHeader />

      <main className="relative z-10 px-6 md:px-12 py-12 max-w-4xl">

        {/* ── Header ── */}
        <div className="mb-10">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <p className="font-mono text-xs tracking-widest uppercase" style={{ color: 'var(--accent)' }}>
                  Anbieter-Profil
                </p>
                {provider.is_verified && (
                  <span className="font-mono text-xs px-2 py-0.5 rounded-full border"
                    style={{ borderColor: 'var(--accent)', color: 'var(--accent)', background: 'var(--accent-dim)' }}>
                    ✓ Verifiziert
                  </span>
                )}
              </div>
              <h1 className="text-4xl md:text-5xl font-extrabold mb-3">{provider.name}</h1>
              <div className="flex flex-wrap gap-2 mb-4">
                {provider.categories.map(cat => (
                  <Link key={cat.slug} href={categoryBackLinks[cat.slug] ?? '#'}
                    className="text-xs px-3 py-1 rounded-full border transition-colors hover:border-orange-500"
                    style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
                    {cat.name}
                  </Link>
                ))}
                {provider.hq_country && (
                  <span className="text-xs px-3 py-1 rounded-full border"
                    style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
                    {provider.hq_country}
                    {provider.founded_year ? ` · seit ${provider.founded_year}` : ''}
                  </span>
                )}
              </div>
              {provider.description && (
                <p className="text-base leading-relaxed max-w-2xl" style={{ color: 'var(--text-secondary)' }}>
                  {provider.description}
                </p>
              )}
            </div>
            <a href={provider.website_url} target="_blank" rel="noopener noreferrer sponsored"
              className="flex-shrink-0 px-6 py-3 rounded-lg font-bold text-sm transition-all hover:opacity-90"
              style={{ background: 'var(--accent)', color: '#0a0a0a' }}>
              Zur Website →
            </a>
          </div>
        </div>

        {/* ── Kriterien ── */}
        {provider.criteriaGroups.map(group => (
          <section key={group.category.slug} className="mb-10">
            <h2 className="text-lg font-bold mb-4 pb-3 border-b flex items-center gap-2"
              style={{ borderColor: 'var(--border)' }}>
              <span style={{ color: 'var(--accent)' }}>◈</span>
              {group.category.name}
            </h2>

            {/* Highlighted criteria as cards */}
            {group.items.filter(i => i.criteria.is_highlighted).length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
                {group.items.filter(i => i.criteria.is_highlighted).map(({ criteria, value }) => (
                  <div key={criteria.slug} className="rounded-xl p-4 border"
                    style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                    <p className="text-xs mb-2 font-mono" style={{ color: 'var(--text-secondary)' }}>
                      {criteria.name}
                    </p>
                    <div className="text-base font-bold">
                      <ValueDisplay criteria={criteria} value={value} />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Remaining criteria as list */}
            {group.items.filter(i => !i.criteria.is_highlighted).length > 0 && (
              <div className="rounded-xl border divide-y overflow-hidden"
                style={{ borderColor: 'var(--border)' }}>
                {group.items.filter(i => !i.criteria.is_highlighted).map(({ criteria, value }) => (
                  <div key={criteria.slug}
                    className="flex items-start justify-between gap-4 px-4 py-3 text-sm"
                    style={{ background: 'var(--surface)' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>{criteria.name}</span>
                    <span className="text-right font-medium">
                      <ValueDisplay criteria={criteria} value={value} />
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        ))}

        {/* ── Reviews ── */}
        <ReviewSection
          providerId={provider.id}
          categoryId={provider.categories[0]?.id ?? ''}
          providerName={provider.name}
        />

        {/* ── Zurück zum Vergleich ── */}
        <div className="mt-12 pt-8 border-t flex flex-wrap gap-4" style={{ borderColor: 'var(--border)' }}>
          {provider.categories.map(cat => (
            categoryBackLinks[cat.slug] && (
              <Link key={cat.slug} href={categoryBackLinks[cat.slug]}
                className="px-5 py-2.5 rounded-lg border text-sm font-medium transition-all hover:border-orange-500"
                style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}>
                ← Zurück zum {cat.name} Vergleich
              </Link>
            )
          ))}
        </div>

        {/* ── Disclaimer ── */}
        <p className="mt-8 text-xs font-mono" style={{ color: 'var(--border)' }}>
          Alle Angaben ohne Gewähr. Letzte Aktualisierung der Daten durch das Bitcoin Navigator Team.
          Links zur Anbieter-Website können Affiliate-Links sein und sind entsprechend gekennzeichnet.
        </p>
      </main>

      <footer className="relative z-10 px-6 md:px-12 py-8 border-t mt-8 text-xs font-mono"
        style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <span>© 2026 Bitcoin Navigator</span>
          <div className="flex gap-4">
            <Link href="/impressum" className="hover:text-white transition-colors">Impressum</Link>
            <Link href="/datenschutz" className="hover:text-white transition-colors">Datenschutz</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
