'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import type { ComparisonData, Criteria, Provider, CriteriaValue } from '@/lib/types'
import FilterBar from './FilterBar'

interface ActiveFilters {
  booleans: Record<string, boolean>
  selects: Record<string, string[]>
}

interface SortState {
  slug: string
  dir: 'asc' | 'desc'
}

const COUNTRY_FLAGS: Record<string, string> = {
  DE: '🇩🇪', AT: '🇦🇹', CH: '🇨🇭', US: '🇺🇸',
  NL: '🇳🇱', CA: '🇨🇦', FR: '🇫🇷', CZ: '🇨🇿', GB: '🇬🇧',
}

function getSortValue(provider: Provider, slug: string): number | string {
  const cv = provider.values[slug]
  if (!cv) return Infinity
  if (cv.value_number !== null) return cv.value_number
  if (cv.value_boolean !== null) return cv.value_boolean ? 0 : 1
  return cv.value_text ?? ''
}

function formatMetricValue(cv: CriteriaValue, criteria: Criteria): string {
  if (criteria.data_type === 'percentage') {
    if (cv.value_number === null) return 'Spread'
    return `${cv.value_number.toFixed(2).replace('.', ',')} %`
  }
  if (criteria.data_type === 'number') {
    if (cv.value_number === null) return '–'
    return criteria.unit
      ? `${cv.value_number.toLocaleString('de-DE')} ${criteria.unit}`
      : cv.value_number.toLocaleString('de-DE')
  }
  return cv.value_text ?? '–'
}

function ProviderCard({ provider, metricCriteria, boolCriteria, promoCodeCriteria, isFirst }: {
  provider: Provider
  metricCriteria: Criteria[]
  boolCriteria: Criteria[]
  promoCodeCriteria: Criteria | undefined
  isFirst: boolean
}) {
  const flag = provider.hq_country ? (COUNTRY_FLAGS[provider.hq_country] ?? '') : ''
  const promoCode = promoCodeCriteria ? provider.values[promoCodeCriteria.slug]?.value_text : null

  return (
    <div
      className="rounded-xl border bg-white"
      style={{
        borderColor: isFirst ? 'var(--text-primary)' : 'var(--border)',
        borderWidth: isFirst ? '1.5px' : '1px',
      }}
    >
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] lg:grid-cols-[180px_1fr_auto] gap-0">

        {/* ── Identity ── */}
        <div className="px-5 py-4 border-b sm:border-b lg:border-b-0 lg:border-r" style={{ borderColor: 'var(--border)' }}>
          <Link
            href={`/anbieter/${provider.slug}`}
            className="font-bold text-base leading-tight hover:underline block mb-1"
            style={{ color: 'var(--text-primary)', letterSpacing: '-0.01em' }}
          >
            {provider.name}
            {provider.is_verified && (
              <span title="Verifiziert" style={{ color: 'var(--accent)', marginLeft: '4px', fontSize: '12px' }}>✓</span>
            )}
          </Link>
          <p className="text-xs mb-3" style={{ color: 'var(--text-secondary)' }}>
            {flag && <span className="mr-1">{flag}</span>}
            {provider.hq_country}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {boolCriteria.map(c => {
              const cv = provider.values[c.slug]
              const isTrue = cv?.value_boolean === true
              if (!isTrue) return null
              return (
                <span
                  key={c.slug}
                  className="text-xs px-2 py-0.5 rounded"
                  style={{
                    background: 'var(--green-bg)',
                    color: 'var(--green)',
                    border: '0.5px solid var(--green-border)',
                  }}
                >
                  {c.name}
                </span>
              )
            })}
          </div>
        </div>

        {/* ── Metrics ── */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 px-5 py-4">
          {(() => {
            const pricingModel = provider.values['pricing_model']?.value_text
            const makerFee = provider.values['maker_fee']?.value_number
            const takerFee = provider.values['taker_fee']?.value_number

            // Nur relevante Metriken je Preismodell anzeigen
            const filtered = metricCriteria.filter(c => {
              if (pricingModel === 'Flat-Fee') {
                // Gleiche Maker/Taker: nur einen Wert zeigen (z.B. Relai, Coinfinity)
                if (makerFee === takerFee) return c.slug === 'maker_fee'
                // Unterschiedlich (21bitcoin: Sparplan vs Sofortkauf): Maker + Taker
                return ['maker_fee', 'taker_fee'].includes(c.slug)
              }
              if (pricingModel === 'Spread') return c.slug === 'spread_pct'
              if (pricingModel === 'Maker/Taker') return ['maker_fee', 'taker_fee'].includes(c.slug)
              return true
            })

            return filtered.map(c => {
              const cv = provider.values[c.slug]
              if (!cv) return null
              // Label anpassen: Flat-Fee Einzel → "Flat-Fee", 21bitcoin Maker → "Sparplan", Taker → "Sofortkauf"
              let label = c.name
              if (pricingModel === 'Flat-Fee' && makerFee === takerFee) label = 'Flat-Fee'
              if (pricingModel === 'Flat-Fee' && makerFee !== takerFee) {
                if (c.slug === 'maker_fee') label = 'Sparplan'
                if (c.slug === 'taker_fee') label = 'Sofortkauf'
              }
              return (
                <div key={c.slug}>
                  <p className="text-xs mb-0.5" style={{ color: 'var(--text-secondary)' }}>{label}</p>
                  <p className="font-bold text-base" style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                    {formatMetricValue(cv, c)}
                  </p>
                </div>
              )
            })
          })()}
          {promoCode && (
            <div>
              <p className="text-xs mb-0.5" style={{ color: 'var(--text-secondary)' }}>Promo-Code</p>
              <button
                onClick={() => navigator.clipboard.writeText(promoCode)}
                title="Code kopieren"
                className="font-mono text-sm font-bold px-2.5 py-0.5 rounded border transition-all hover:opacity-70"
                style={{
                  background: 'var(--accent-dim)',
                  borderColor: 'var(--accent)',
                  color: 'var(--accent)',
                  letterSpacing: '0.08em',
                }}
              >
                {promoCode} ⎘
              </button>
            </div>
          )}
        </div>

        {/* ── CTA ── */}
        <div className="flex items-center px-5 py-4 border-t sm:border-t-0 sm:border-l lg:border-l" style={{ borderColor: 'var(--border)' }}>
          <a
            href={provider.website_url}
            target="_blank"
            rel="noopener noreferrer sponsored"
            className="whitespace-nowrap px-5 py-2.5 rounded-lg text-sm font-bold transition-all hover:opacity-80"
            style={{ background: 'var(--cta-bg)', color: 'var(--cta-text)' }}
          >
            Zur Website →
          </a>
        </div>
      </div>
    </div>
  )
}

export default function ComparisonView({ data }: { data: ComparisonData }) {
  const { category, providers } = data
  const [filters, setFilters] = useState<ActiveFilters>({ booleans: {}, selects: {} })
  const [sort, setSort] = useState<SortState | null>(null)

  const metricCriteria = category.criteria.filter(
    c => c.is_highlighted && (c.data_type === 'percentage' || c.data_type === 'number') && c.slug !== 'promo_code'
  )
  const boolCriteria = category.criteria.filter(
    c => c.is_highlighted && c.data_type === 'boolean'
  )
  const promoCodeCriteria = category.criteria.find(c => c.slug === 'promo_code')

  const defaultSortSlug = metricCriteria[0]?.slug ?? null

  const filtered = useMemo(() => {
    return providers.filter(p => {
      for (const [slug] of Object.entries(filters.booleans)) {
        if (p.values[slug]?.value_boolean !== true) return false
      }
      for (const [slug, allowed] of Object.entries(filters.selects)) {
        if (!allowed.length) continue
        const val = p.values[slug]?.value_text
        if (!val || !allowed.includes(val)) return false
      }
      return true
    })
  }, [providers, filters])

  const sorted = useMemo(() => {
    const sortSlug = sort?.slug ?? defaultSortSlug
    if (!sortSlug) return filtered
    const dir = sort?.dir ?? 'asc'
    return [...filtered].sort((a, b) => {
      const av = getSortValue(a, sortSlug)
      const bv = getSortValue(b, sortSlug)
      if (av === bv) return 0
      const cmp = av < bv ? -1 : 1
      return dir === 'asc' ? cmp : -cmp
    })
  }, [filtered, sort, defaultSortSlug])

  const activeSortLabel = (() => {
    const slug = sort?.slug ?? defaultSortSlug
    if (!slug) return null
    const c = category.criteria.find(cr => cr.slug === slug)
    return c ? `${c.name} ${sort?.dir === 'desc' ? '↓' : '↑'}` : null
  })()

  function cycleSort(slug: string) {
    setSort(prev => {
      if (prev?.slug !== slug) return { slug, dir: 'asc' }
      if (prev.dir === 'asc') return { slug, dir: 'desc' }
      return null
    })
  }

  return (
    <div className="flex flex-col gap-6">

      {/* ── Header ── */}
      <div>
        <p className="text-xs tracking-widest uppercase mb-1 font-medium" style={{ color: 'var(--text-tertiary)' }}>
          Vergleich
        </p>
        <h1 className="text-3xl md:text-4xl font-bold mb-1" style={{ letterSpacing: '-0.03em' }}>
          {category.name}
        </h1>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          {sorted.length} von {providers.length} Anbietern · täglich geprüft
        </p>
      </div>

      {/* ── Filters + Sort ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <FilterBar
          criteria={category.criteria}
          filters={filters}
          onChange={setFilters}
        />
        {metricCriteria.length > 0 && (
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Sortieren:</span>
            {metricCriteria.slice(0, 3).map(c => (
              <button
                key={c.slug}
                onClick={() => cycleSort(c.slug)}
                className="text-xs px-2.5 py-1 rounded-full border transition-all"
                style={{
                  background: (sort?.slug ?? defaultSortSlug) === c.slug ? 'var(--surface-alt)' : 'transparent',
                  borderColor: 'var(--border)',
                  color: (sort?.slug ?? defaultSortSlug) === c.slug ? 'var(--text-primary)' : 'var(--text-secondary)',
                  fontWeight: (sort?.slug ?? defaultSortSlug) === c.slug ? 500 : 400,
                }}
              >
                {c.name} {(sort?.slug ?? defaultSortSlug) === c.slug ? (sort?.dir === 'desc' ? '↓' : '↑') : ''}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Provider list ── */}
      {sorted.length === 0 ? (
        <div
          className="rounded-xl border px-6 py-16 text-center text-sm"
          style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
        >
          Keine Anbieter entsprechen den gewählten Filtern.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {sorted.map((provider, i) => (
            <ProviderCard
              key={provider.id}
              provider={provider}
              metricCriteria={metricCriteria}
              boolCriteria={boolCriteria}
              promoCodeCriteria={promoCodeCriteria}
              isFirst={i === 0}
            />
          ))}
        </div>
      )}

      {activeSortLabel && (
        <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
          Sortiert nach: {activeSortLabel}
        </p>
      )}
    </div>
  )
}
