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

// ─── Value renderer ───────────────────────────────────────────────────────────
function CellValue({ cv, criteria }: { cv: CriteriaValue | undefined; criteria: Criteria }) {
  if (!cv) return <span style={{ color: 'var(--border)' }}>–</span>

  if (criteria.data_type === 'boolean') {
    if (cv.value_boolean === null) return <span style={{ color: 'var(--border)' }}>–</span>
    return cv.value_boolean
      ? <span className="font-bold" style={{ color: '#22c55e' }}>✓</span>
      : <span style={{ color: 'var(--text-secondary)' }}>✗</span>
  }

  if (criteria.data_type === 'percentage' || criteria.data_type === 'number') {
    if (cv.value_number === null) {
      // Für Maker/Taker: Hinweis wenn Spread-Modell verwendet wird
      if (criteria.slug === 'maker_fee' || criteria.slug === 'taker_fee') {
        return <span className="text-xs italic" style={{ color: 'var(--text-secondary)' }}>Spread</span>
      }
      return <span style={{ color: 'var(--border)' }}>–</span>
    }
    const formatted = criteria.data_type === 'percentage'
      ? `${cv.value_number.toFixed(2).replace('.', ',')} %`
      : criteria.unit
        ? `${cv.value_number.toLocaleString('de-DE')} ${criteria.unit}`
        : cv.value_number.toLocaleString('de-DE')
    return <span>{formatted}</span>
  }

  if (criteria.data_type === 'select') {
    return <span>{cv.value_text ?? '–'}</span>
  }

  // Promo-Code: kopierbar darstellen
  if (criteria.slug === 'promo_code' && cv.value_text) {
    return (
      <button
        onClick={() => navigator.clipboard.writeText(cv.value_text!)}
        title="Code kopieren"
        className="font-mono text-xs px-2 py-1 rounded border transition-all hover:opacity-80 active:scale-95"
        style={{
          background: 'var(--accent-dim)',
          borderColor: 'var(--accent)',
          color: 'var(--accent)',
          letterSpacing: '0.1em',
        }}
      >
        {cv.value_text} ⎘
      </button>
    )
  }

  if (criteria.data_type === 'multi_select') {
    const vals: string[] = Array.isArray(cv.value_json) ? cv.value_json as string[] : []
    if (!vals.length) return <span style={{ color: 'var(--border)' }}>–</span>
    return (
      <div className="flex flex-wrap gap-1">
        {vals.map(v => (
          <span
            key={v}
            className="px-1.5 py-0.5 rounded text-xs"
            style={{ background: 'var(--accent-dim)', color: 'var(--accent)', border: '1px solid var(--accent)' }}
          >
            {v}
          </span>
        ))}
      </div>
    )
  }

  return <span>{cv.value_text ?? '–'}</span>
}

// ─── Sort helpers ─────────────────────────────────────────────────────────────
function getSortValue(provider: Provider, slug: string): number | string {
  const cv = provider.values[slug]
  if (!cv) return -Infinity
  if (cv.value_number !== null) return cv.value_number
  if (cv.value_boolean !== null) return cv.value_boolean ? 1 : 0
  return cv.value_text ?? ''
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function ComparisonView({ data }: { data: ComparisonData }) {
  const { category, providers } = data
  const [filters, setFilters] = useState<ActiveFilters>({ booleans: {}, selects: {} })
  const [sort, setSort] = useState<SortState | null>(null)
  const [filtersOpen, setFiltersOpen] = useState(false)

  // Split criteria: highlighted shown by default, rest in "mehr anzeigen"
  const highlighted = category.criteria.filter(c => c.is_highlighted)
  const rest = category.criteria.filter(c => !c.is_highlighted)
  const [showAll, setShowAll] = useState(false)
  const visibleCriteria = showAll ? category.criteria : highlighted

  // Filter providers
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

  // Sort
  const sorted = useMemo(() => {
    if (!sort) return filtered
    return [...filtered].sort((a, b) => {
      const av = getSortValue(a, sort.slug)
      const bv = getSortValue(b, sort.slug)
      if (av === bv) return 0
      const cmp = av < bv ? -1 : 1
      return sort.dir === 'asc' ? cmp : -cmp
    })
  }, [filtered, sort])

  function toggleSort(slug: string) {
    setSort(prev =>
      prev?.slug === slug
        ? { slug, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
        : { slug, dir: 'asc' }
    )
  }

  const activeFilterCount =
    Object.keys(filters.booleans).length +
    Object.values(filters.selects).filter(v => v.length > 0).length

  return (
    <div className="flex flex-col gap-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <p className="font-mono text-xs tracking-widest uppercase mb-1" style={{ color: 'var(--accent)' }}>
            Vergleich
          </p>
          <h1 className="text-3xl md:text-4xl font-extrabold">{category.name}</h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
            {sorted.length} von {providers.length} Anbietern
          </p>
        </div>
        <button
          onClick={() => setFiltersOpen(o => !o)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border text-sm transition-all md:hidden"
          style={{
            background: filtersOpen ? 'var(--accent-dim)' : 'var(--surface)',
            borderColor: filtersOpen ? 'var(--accent)' : 'var(--border)',
            color: filtersOpen ? 'var(--accent)' : 'var(--text-primary)',
          }}
        >
          ⚙ Filter{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
        </button>
      </div>

      <div className="flex gap-6 items-start">
        {/* ── Sidebar (desktop always visible, mobile toggle) ── */}
        <div className={`w-56 flex-shrink-0 ${filtersOpen ? 'block' : 'hidden'} md:block`}>
          <FilterBar
            criteria={category.criteria}
            filters={filters}
            onChange={setFilters}
          />
        </div>

        {/* ── Table ── */}
        <div className="flex-1 min-w-0">
          <div className="overflow-x-auto rounded-xl border" style={{ borderColor: 'var(--border)' }}>
            <table className="w-full text-sm border-collapse">
              {/* Head */}
              <thead>
                <tr style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
                  {/* Provider column */}
                  <th
                    className="sticky left-0 z-10 text-left px-4 py-3 font-medium text-xs tracking-widest uppercase min-w-[160px]"
                    style={{ background: 'var(--surface)', color: 'var(--text-secondary)', borderRight: '1px solid var(--border)' }}
                  >
                    Anbieter
                  </th>
                  {visibleCriteria.map(c => (
                    <th
                      key={c.slug}
                      className="text-left px-4 py-3 font-medium text-xs whitespace-nowrap"
                      style={{ color: c.is_highlighted ? 'var(--accent)' : 'var(--text-secondary)', minWidth: '120px' }}
                    >
                      {c.is_sortable ? (
                        <button
                          onClick={() => toggleSort(c.slug)}
                          className="flex items-center gap-1 hover:text-white transition-colors"
                        >
                          {c.name}
                          {c.unit && <span className="opacity-50">({c.unit})</span>}
                          <span className="opacity-50 ml-1">
                            {sort?.slug === c.slug ? (sort.dir === 'asc' ? '↑' : '↓') : '↕'}
                          </span>
                        </button>
                      ) : (
                        <span>{c.name}</span>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>

              {/* Body */}
              <tbody>
                {sorted.length === 0 && (
                  <tr>
                    <td
                      colSpan={visibleCriteria.length + 1}
                      className="px-4 py-12 text-center text-sm"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      Keine Anbieter entsprechen den gewählten Filtern.
                    </td>
                  </tr>
                )}
                {sorted.map((provider, i) => (
                  <tr
                    key={provider.id}
                    className="group transition-colors"
                    style={{
                      borderBottom: '1px solid var(--border)',
                      background: i % 2 === 0 ? 'var(--bg)' : 'var(--surface)',
                    }}
                  >
                    {/* Provider name */}
                    <td
                      className="sticky left-0 z-10 px-4 py-3"
                      style={{
                        background: i % 2 === 0 ? 'var(--bg)' : 'var(--surface)',
                        borderRight: '1px solid var(--border)',
                      }}
                    >
                      <div className="flex flex-col gap-0.5">
                        <Link
                          href={`/anbieter/${provider.slug}`}
                          className="font-semibold text-sm hover:underline flex items-center gap-1.5"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          {provider.name}
                          {provider.is_verified && (
                            <span title="Verifizierter Anbieter" style={{ color: 'var(--accent)' }}>✓</span>
                          )}
                        </Link>
                        {provider.hq_country && (
                          <span className="font-mono text-xs" style={{ color: 'var(--text-secondary)' }}>
                            {provider.hq_country}
                          </span>
                        )}
                        <a
                          href={provider.website_url}
                          target="_blank"
                          rel="noopener noreferrer sponsored"
                          className="font-mono text-xs hover:underline"
                          style={{ color: 'var(--accent)' }}
                        >
                          Website →
                        </a>
                      </div>
                    </td>

                    {/* Criteria values */}
                    {visibleCriteria.map(c => (
                      <td key={c.slug} className="px-4 py-3">
                        <CellValue cv={provider.values[c.slug]} criteria={c} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Show more/less toggle */}
          {rest.length > 0 && (
            <button
              onClick={() => setShowAll(v => !v)}
              className="mt-4 w-full py-2.5 rounded-lg border text-sm font-medium transition-all"
              style={{
                background: 'var(--surface)',
                borderColor: 'var(--border)',
                color: 'var(--text-secondary)',
              }}
            >
              {showAll
                ? '↑ Weniger Kriterien anzeigen'
                : `↓ Alle Kriterien anzeigen (+${rest.length})`}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
