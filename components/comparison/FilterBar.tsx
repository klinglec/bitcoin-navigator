'use client'

import type { Criteria } from '@/lib/types'

interface ActiveFilters {
  booleans: Record<string, boolean>   // slug → must be true
  selects: Record<string, string[]>   // slug → allowed values
}

interface Props {
  criteria: Criteria[]
  filters: ActiveFilters
  onChange: (filters: ActiveFilters) => void
}

export default function FilterBar({ criteria, filters, onChange }: Props) {
  const boolCriteria = criteria.filter(c => c.is_filterable && c.data_type === 'boolean')
  const selectCriteria = criteria.filter(
    c => c.is_filterable && (c.data_type === 'select' || c.data_type === 'multi_select')
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
    <aside
      className="flex flex-col gap-6 p-5 rounded-xl border text-sm"
      style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
    >
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs tracking-widest uppercase" style={{ color: 'var(--accent)' }}>
          Filter
        </span>
        {activeCount > 0 && (
          <button
            onClick={reset}
            className="font-mono text-xs px-2 py-1 rounded border transition-colors hover:border-orange-500"
            style={{ color: 'var(--text-secondary)', borderColor: 'var(--border)' }}
          >
            Reset ({activeCount})
          </button>
        )}
      </div>

      {/* Boolean filters */}
      {boolCriteria.length > 0 && (
        <div className="flex flex-col gap-2">
          {boolCriteria.map(c => {
            const active = !!filters.booleans[c.slug]
            return (
              <button
                key={c.slug}
                onClick={() => toggleBool(c.slug)}
                className="flex items-center gap-3 px-3 py-2 rounded-lg border text-left transition-all"
                style={{
                  background: active ? 'var(--accent-dim)' : 'transparent',
                  borderColor: active ? 'var(--accent)' : 'var(--border)',
                  color: active ? 'var(--accent)' : 'var(--text-secondary)',
                }}
              >
                <span
                  className="w-4 h-4 rounded flex items-center justify-center text-xs flex-shrink-0 border"
                  style={{
                    background: active ? 'var(--accent)' : 'transparent',
                    borderColor: active ? 'var(--accent)' : 'var(--border)',
                    color: active ? '#0a0a0a' : 'transparent',
                  }}
                >
                  ✓
                </span>
                <span className="text-xs">{c.name}</span>
              </button>
            )
          })}
        </div>
      )}

      {/* Select filters */}
      {selectCriteria.map(c => {
        const options = c.options ?? []
        const selected = filters.selects[c.slug] ?? []
        return (
          <div key={c.slug}>
            <p className="text-xs mb-2 font-medium" style={{ color: 'var(--text-secondary)' }}>
              {c.name}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {options.map(opt => {
                const active = selected.includes(opt)
                return (
                  <button
                    key={opt}
                    onClick={() => toggleSelect(c.slug, opt)}
                    className="px-2 py-1 rounded text-xs border transition-all"
                    style={{
                      background: active ? 'var(--accent-dim)' : 'transparent',
                      borderColor: active ? 'var(--accent)' : 'var(--border)',
                      color: active ? 'var(--accent)' : 'var(--text-secondary)',
                    }}
                  >
                    {opt}
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}

      {boolCriteria.length === 0 && selectCriteria.length === 0 && (
        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
          Keine Filter verfügbar.
        </p>
      )}
    </aside>
  )
}
