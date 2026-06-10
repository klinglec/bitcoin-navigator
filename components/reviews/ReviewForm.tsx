'use client'

import { useState } from 'react'
import { getSupabaseBrowser } from '@/lib/supabase-browser'

interface Props {
  providerId: string
  categoryId: string
  providerName: string
}

const STARS = [1, 2, 3, 4, 5]

export default function ReviewForm({ providerId, categoryId, providerName }: Props) {
  const [rating, setRating] = useState(0)
  const [hovered, setHovered] = useState(0)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [pros, setPros] = useState('')
  const [cons, setCons] = useState('')
  const [honeypot, setHoneypot] = useState('') // Soll leer bleiben
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (status === 'loading' || status === 'success') return

    setStatus('loading')

    const supabase = getSupabaseBrowser()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      setStatus('error')
      setMessage('Bitte melde dich an, um ein Review zu schreiben.')
      return
    }

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          provider_id: providerId,
          category_id: categoryId,
          rating,
          title: title.trim(),
          body: body.trim(),
          pros: pros.split('\n').map(s => s.trim()).filter(Boolean),
          cons: cons.split('\n').map(s => s.trim()).filter(Boolean),
          website: honeypot, // Honeypot
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setStatus('error')
        setMessage(data.error ?? 'Etwas ist schiefgelaufen.')
      } else {
        setStatus('success')
        setMessage(data.message)
      }
    } catch {
      setStatus('error')
      setMessage('Netzwerkfehler. Bitte versuche es erneut.')
    }
  }

  if (status === 'success') {
    return (
      <div className="rounded-xl p-6 border" style={{ background: 'var(--surface)', borderColor: 'var(--accent)' }}>
        <p className="font-bold mb-1" style={{ color: 'var(--accent)' }}>✓ Review eingereicht</p>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{message}</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border p-6 space-y-5"
      style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
      <h3 className="font-bold text-lg">{providerName} bewerten</h3>

      {/* Sternbewertung */}
      <div>
        <label className="text-xs font-mono mb-2 block" style={{ color: 'var(--text-secondary)' }}>
          Bewertung *
        </label>
        <div className="flex gap-1">
          {STARS.map(s => (
            <button
              key={s}
              type="button"
              onClick={() => setRating(s)}
              onMouseEnter={() => setHovered(s)}
              onMouseLeave={() => setHovered(0)}
              className="text-2xl transition-colors"
              style={{ color: s <= (hovered || rating) ? 'var(--accent)' : 'var(--border)' }}
            >
              ★
            </button>
          ))}
        </div>
      </div>

      {/* Titel */}
      <div>
        <label className="text-xs font-mono mb-2 block" style={{ color: 'var(--text-secondary)' }}>
          Titel (optional)
        </label>
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          maxLength={100}
          placeholder="Kurze Zusammenfassung"
          className="w-full rounded-lg border px-4 py-3 text-sm outline-none transition-colors"
          style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
          onFocus={e => e.target.style.borderColor = 'var(--accent)'}
          onBlur={e => e.target.style.borderColor = 'var(--border)'}
        />
      </div>

      {/* Review-Text */}
      <div>
        <label className="text-xs font-mono mb-2 block" style={{ color: 'var(--text-secondary)' }}>
          Erfahrungsbericht * (min. 30 Zeichen)
        </label>
        <textarea
          value={body}
          onChange={e => setBody(e.target.value)}
          maxLength={2000}
          required
          rows={4}
          placeholder="Beschreibe deine Erfahrung mit dem Anbieter..."
          className="w-full rounded-lg border px-4 py-3 text-sm outline-none transition-colors resize-none"
          style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
          onFocus={e => e.target.style.borderColor = 'var(--accent)'}
          onBlur={e => e.target.style.borderColor = 'var(--border)'}
        />
        <p className="text-xs mt-1 text-right" style={{ color: 'var(--text-secondary)' }}>
          {body.length}/2000
        </p>
      </div>

      {/* Pros / Cons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-mono mb-2 block" style={{ color: 'var(--text-secondary)' }}>
            Vorteile (optional, eine pro Zeile)
          </label>
          <textarea
            value={pros}
            onChange={e => setPros(e.target.value)}
            rows={3}
            placeholder="Günstiger Sparplan&#10;Lightning-Support&#10;Guter Support"
            className="w-full rounded-lg border px-4 py-3 text-sm outline-none transition-colors resize-none"
            style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
            onFocus={e => e.target.style.borderColor = 'var(--accent)'}
            onBlur={e => e.target.style.borderColor = 'var(--border)'}
          />
        </div>
        <div>
          <label className="text-xs font-mono mb-2 block" style={{ color: 'var(--text-secondary)' }}>
            Nachteile (optional, eine pro Zeile)
          </label>
          <textarea
            value={cons}
            onChange={e => setCons(e.target.value)}
            rows={3}
            placeholder="Hohe Spreads&#10;Langsamer Support"
            className="w-full rounded-lg border px-4 py-3 text-sm outline-none transition-colors resize-none"
            style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
            onFocus={e => e.target.style.borderColor = 'var(--accent)'}
            onBlur={e => e.target.style.borderColor = 'var(--border)'}
          />
        </div>
      </div>

      {/* Honeypot – für echte Nutzer unsichtbar */}
      <div style={{ display: 'none' }} aria-hidden="true">
        <input
          type="text"
          name="website"
          value={honeypot}
          onChange={e => setHoneypot(e.target.value)}
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      {status === 'error' && (
        <p className="text-sm" style={{ color: '#ef4444' }}>{message}</p>
      )}

      <div className="flex items-center justify-between gap-4 pt-2">
        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
          Reviews werden vor Veröffentlichung geprüft.
        </p>
        <button
          type="submit"
          disabled={status === 'loading' || rating === 0}
          className="px-6 py-3 rounded-xl font-bold text-sm transition-all hover:opacity-90 disabled:opacity-40"
          style={{ background: 'var(--accent)', color: '#0a0a0a' }}
        >
          {status === 'loading' ? 'Wird gesendet…' : 'Review einreichen'}
        </button>
      </div>
    </form>
  )
}
