'use client'

import type { Criteria } from '@/lib/types'

interface ActiveFilters {
  booleans: Record<string, boolean>
  selects: Record<string, string[]>
}

interface Props {
  criteria: Criteria[]
  filters: ActiveFilters
  onChange: (filters: ActiveFilters) => void
}

export default function FilterBar({ criteria, filters, onChange }: Props) {
  // Nur highlighted+filterable Kriterien als Chips anzeigen – kein Overload
  const boolCriteria = criteria.filter(c => c.is_filterable && c.is_highlighted && c.data_type === 'boolean')
  const selectCriteria = criteria.filter(
    c => c.is_filterable && c.is_highlighted && (c.data_type === 'select' || c.data_type === 'multi_select')
  )

  const activeCount =
    Object.keys(filters.booleans).length +
    Object.values(filters.selects).filter(v => v.length > 0).length

  function toggleBool(slug: string) {
    const next = { ...filters.booleans }
    if (next[slug]) delete next[slug]
    else next[slug] = true
    onChange({ ...filters, booleans: next })
  }

  function toggleSelect(slug: string, value: string) {
    const current = filters.selects[slug] ?? []
    const next = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value]
    onChange({ ...filters, selects: { ...filters.selects, [slug]: next } })
  }

  function reset() {
    onChange({ booleans: {}, selects: {} })
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {boolCriteria.map(c => {
        const active = !!filters.booleans[c.slug]
        return (
          <button
            key={c.slug}
            onClick={() => toggleBool(c.slug)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-all"
            style={{
              background: active ? '#1a1a1a' : '#ffffff',
              borderColor: active ? '#1a1a1a' : '#e0ddd8',
              color: active ? '#ffffff' : '#666666',
            }}
          >
            {active && <span style={{ fontSize: '10px' }}>✓</span>}
            {c.name}
          </button>
        )
      })}

      {selectCriteria.map(c => {
        const options = c.options ?? []
        const selected = filters.selects[c.slug] ?? []
        return options.map(opt => {
          const active = selected.includes(opt)
          return (
            <button
              key={`${c.slug}-${opt}`}
              onClick={() => toggleSelect(c.slug, opt)}
              className="px-3 py-1.5 rounded-full border text-xs font-medium transition-all"
              style={{
                background: active ? 'var(--text-primary)' : 'var(--surface)',
                borderColor: active ? 'var(--text-primary)' : 'var(--border)',
                color: active ? 'var(--cta-text)' : 'var(--text-secondary)',
              }}
            >
              {c.name}: {opt}
            </button>
          )
        })
      })}

      {activeCount > 0 && (
        <button
          onClick={reset}
          className="px-3 py-1.5 rounded-full border text-xs transition-all"
          style={{
            borderColor: '#e0ddd8',
            color: '#999999',
            background: 'transparent',
          }}
        >
          Filter zurücksetzen ×
        </button>
      )}
    </div>
  )
}
