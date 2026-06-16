'use client'

import { useState, useMemo, useRef, useCallback } from 'react'
import Link from 'next/link'
import type { ComparisonData, Criteria, Provider, CriteriaValue } from '@/lib/types'
import FilterBar from './FilterBar'
import PromoCodeButton from '@/components/PromoCodeButton'

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

const EXAMPLE_AMOUNTS = [10, 100, 500, 1000]

function DualRangeSlider({ min, max, step, value, onChange }: {
  min: number; max: number; step: number
  value: [number, number]
  onChange: (v: [number, number]) => void
}) {
  const trackRef = useRef<HTMLDivElement>(null)
  const dragging  = useRef<'min' | 'max' | null>(null)
  const valueRef  = useRef(value)
  valueRef.current = value

  const pct = (v: number) => ((v - min) / (max - min)) * 100

  const valueFromX = useCallback((clientX: number) => {
    if (!trackRef.current) return min
    const rect = trackRef.current.getBoundingClientRect()
    const raw  = min + Math.max(0, Math.min(1, (clientX - rect.left) / rect.width)) * (max - min)
    return Math.round(raw / step) * step
  }, [min, max, step])

  const onMove = useCallback((e: PointerEvent) => {
    const v   = valueFromX(e.clientX)
    const cur = valueRef.current
    if (dragging.current === 'min') onChange([Math.min(v, cur[1] - step), cur[1]])
    if (dragging.current === 'max') onChange([cur[0], Math.max(v, cur[0] + step)])
  }, [valueFromX, onChange, step])

  const onUp = useCallback(() => {
    dragging.current = null
    window.removeEventListener('pointermove', onMove)
  }, [onMove])

  const onDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!trackRef.current) return
    const rect    = trackRef.current.getBoundingClientRect()
    const clickPct = (e.clientX - rect.left) / rect.width
    const minPct   = (value[0] - min) / (max - min)
    const maxPct   = (value[1] - min) / (max - min)
    dragging.current = Math.abs(clickPct - minPct) <= Math.abs(clickPct - maxPct) ? 'min' : 'max'
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp, { once: true })
  }

  const minP = pct(value[0])
  const maxP = pct(value[1])

  return (
    <div ref={trackRef} onPointerDown={onDown} style={{ position: 'relative', height: '20px', cursor: 'pointer', touchAction: 'none' }}>
      <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '3px', background: 'var(--border)', transform: 'translateY(-50%)', borderRadius: '2px' }} />
      <div style={{ position: 'absolute', top: '50%', left: `${minP}%`, right: `${100 - maxP}%`, height: '3px', background: 'var(--text-primary)', transform: 'translateY(-50%)', borderRadius: '2px' }} />
      {[minP, maxP].map((p, i) => (
        <div key={i} style={{ position: 'absolute', left: `calc(${p}% - 8px)`, top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', background: 'var(--surface)', border: '2px solid var(--text-primary)', borderRadius: '50%', boxShadow: '0 1px 3px rgba(0,0,0,0.15)' }} />
      ))}
    </div>
  )
}

/** Effektive Gebühr in % für einen Einsteiger (immer Taker / Sofortkauf) */
function getFeePct(provider: Provider): { sparplan: number | null; sofortkauf: number | null } {
  const model = provider.values['pricing_model']?.value_text
  const maker = provider.values['maker_fee']?.value_number ?? null
  const taker = provider.values['taker_fee']?.value_number ?? null
  const spread = provider.values['spread_pct']?.value_number ?? null

  if (model === 'Maker/Taker') return { sparplan: null, sofortkauf: taker }
  if (model === 'Spread') return { sparplan: null, sofortkauf: spread ?? taker }
  if (model === 'Flat-Fee') {
    if (maker !== null && taker !== null && maker !== taker) {
      // z.B. 21bitcoin: Sparplan vs. Sofortkauf
      return { sparplan: maker, sofortkauf: taker }
    }
    return { sparplan: null, sofortkauf: spread ?? maker }
  }
  return { sparplan: null, sofortkauf: null }
}

function formatEur(eur: number): string {
  if (eur < 0.01) return '< 0,01 €'
  return eur.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'
}

function ProviderCard({ provider, metricCriteria, boolCriteria, textCriteria, promoCodeCriteria, isFirst, selectedAmount }: {
  provider: Provider
  metricCriteria: Criteria[]
  boolCriteria: Criteria[]
  textCriteria: Criteria[]
  promoCodeCriteria: Criteria | undefined
  isFirst: boolean
  selectedAmount: number | null
}) {
  const flag = provider.hq_country ? (COUNTRY_FLAGS[provider.hq_country] ?? '') : ''
  const promoCode = promoCodeCriteria ? provider.values[promoCodeCriteria.slug]?.value_text : null
  const promoBenefit = promoCodeCriteria ? provider.values[promoCodeCriteria.slug]?.notes : null

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
          {textCriteria.map(c => {
            const cv = provider.values[c.slug]
            if (!cv?.value_text) return null
            return (
              <div key={c.slug}>
                <p className="text-xs mb-0.5" style={{ color: 'var(--text-secondary)' }}>{c.name}</p>
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  {cv.value_text}
                </p>
              </div>
            )
          })}
          {/* ── Gebührenrechner ── */}
          {selectedAmount !== null && (() => {
            const { sparplan, sofortkauf } = getFeePct(provider)
            if (sofortkauf === null) return null
            const costSofort = (selectedAmount * sofortkauf) / 100
            const costSparplan = sparplan !== null ? (selectedAmount * sparplan) / 100 : null
            return (
              <div
                className="px-3 py-2 rounded-lg"
                style={{ background: 'var(--surface-alt)', border: '0.5px solid var(--border)' }}
              >
                <p className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>
                  Kosten für {selectedAmount.toLocaleString('de-DE')} €
                </p>
                {costSparplan !== null ? (
                  <div className="flex flex-col gap-0.5">
                    <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                      {formatEur(costSparplan)}
                      <span className="font-normal text-xs ml-1" style={{ color: 'var(--text-secondary)' }}>Sparplan</span>
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                      {formatEur(costSofort)} Sofortkauf
                    </p>
                  </div>
                ) : (
                  <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                    {formatEur(costSofort)}
                  </p>
                )}
              </div>
            )
          })()}

          {promoCode && (
            <div>
              <p className="text-xs mb-0.5" style={{ color: 'var(--text-secondary)' }}>Promo-Code</p>
              <PromoCodeButton code={promoCode} benefit={promoBenefit} />
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
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null)
  const isBoersen = category.slug === 'boersen'
  const isHardwareWallets = category.slug === 'hardware-wallets'

  // Preisbereich für Hardware Wallets
  const allPrices = providers
    .map(p => p.values['price_eur']?.value_number)
    .filter((v): v is number => v !== null && v !== undefined)
  const priceMin = allPrices.length ? Math.floor(Math.min(...allPrices)) : 0
  const priceMax = allPrices.length ? Math.ceil(Math.max(...allPrices)) : 500
  const [priceRange, setPriceRange] = useState<[number, number]>([priceMin, priceMax])

  const metricCriteria = category.criteria.filter(
    c => c.is_highlighted && (c.data_type === 'percentage' || c.data_type === 'number') && c.slug !== 'promo_code'
  )
  const boolCriteria = category.criteria.filter(
    c => c.is_highlighted && c.data_type === 'boolean'
  )
  const textCriteria = category.criteria.filter(
    c => c.is_highlighted && c.data_type === 'text' && c.slug !== 'promo_code'
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
      if (isHardwareWallets) {
        const price = p.values['price_eur']?.value_number
        if (price !== null && price !== undefined) {
          if (price < priceRange[0] || price > priceRange[1]) return false
        }
      }
      return true
    })
  }, [providers, filters, isHardwareWallets, priceRange])

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
          providers={providers}
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

      {/* ── Preisbereich-Slider (nur Hardware Wallets) ── */}
      {isHardwareWallets && (
        <div className="px-4 py-3 rounded-xl border" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Preisbereich</span>
            <span className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
              {priceRange[0]} € – {priceRange[1]} €
              {(priceRange[0] > priceMin || priceRange[1] < priceMax) && (
                <button onClick={() => setPriceRange([priceMin, priceMax])} className="ml-2 font-normal" style={{ color: 'var(--text-tertiary)' }}>×</button>
              )}
            </span>
          </div>
          <DualRangeSlider
            min={priceMin} max={priceMax} step={5}
            value={priceRange}
            onChange={setPriceRange}
          />
          <div className="flex justify-between mt-3">
            <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{priceMin} €</span>
            <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{priceMax} €</span>
          </div>
        </div>
      )}

      {/* ── Gebührenrechner Selektor (nur Börsen) ── */}
      {isBoersen && (
        <div className="flex flex-wrap items-center gap-2 py-3 px-4 rounded-xl border" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
          <span className="text-xs font-medium mr-1" style={{ color: 'var(--text-secondary)' }}>
            Gebühren berechnen für:
          </span>
          {EXAMPLE_AMOUNTS.map(amount => (
            <button
              key={amount}
              onClick={() => setSelectedAmount(prev => prev === amount ? null : amount)}
              className="text-xs px-3 py-1.5 rounded-full border transition-all font-medium"
              style={{
                background: selectedAmount === amount ? 'var(--text-primary)' : 'transparent',
                borderColor: selectedAmount === amount ? 'var(--text-primary)' : 'var(--border)',
                color: selectedAmount === amount ? 'var(--bg)' : 'var(--text-secondary)',
              }}
            >
              {amount.toLocaleString('de-DE')} €
            </button>
          ))}
          {selectedAmount !== null && (
            <span className="text-xs ml-auto" style={{ color: 'var(--text-tertiary)' }}>
              Schätzwerte · Spreads und Gebühren können variieren · Aktuelle Konditionen beim Anbieter prüfen
            </span>
          )}
        </div>
      )}

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
              textCriteria={textCriteria}
              promoCodeCriteria={promoCodeCriteria}
              isFirst={i === 0}
              selectedAmount={isBoersen ? selectedAmount : null}
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
