'use client'

import { useState, FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { getSupabaseBrowser } from '@/lib/supabase-browser'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const router = useRouter()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setStatus('loading')

    const supabase = getSupabaseBrowser()
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    })

    if (error) {
      setStatus('error')
      setMessage('E-Mail oder Passwort falsch.')
    } else {
      router.back()
    }
  }

  return (
    <div className="min-h-screen grid-bg flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <Link href="/" className="flex items-center gap-2 mb-10 justify-center">
          <div className="w-8 h-8 rounded flex items-center justify-center font-bold text-sm"
            style={{ background: 'var(--accent)', color: '#0a0a0a' }}>₿</div>
          <span className="font-bold text-sm tracking-widest uppercase" style={{ letterSpacing: '0.15em' }}>
            Bitcoin Navigator
          </span>
        </Link>

        <div className="rounded-2xl border p-8" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <h1 className="text-2xl font-bold mb-2">Anmelden</h1>
          <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
            Melde dich an, um Reviews zu schreiben.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-mono mb-2 block" style={{ color: 'var(--text-secondary)' }}>
                E-Mail-Adresse
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full rounded-lg border px-4 py-3 text-sm outline-none transition-colors"
                style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />
            </div>
            <div>
              <label className="text-xs font-mono mb-2 block" style={{ color: 'var(--text-secondary)' }}>
                Passwort
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full rounded-lg border px-4 py-3 text-sm outline-none transition-colors"
                style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />
            </div>

            {status === 'error' && (
              <p className="text-sm" style={{ color: '#ef4444' }}>{message}</p>
            )}

            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full py-3 rounded-xl font-bold text-sm transition-all hover:opacity-90 disabled:opacity-50"
              style={{ background: 'var(--accent)', color: '#0a0a0a' }}
            >
              {status === 'loading' ? 'Wird angemeldet…' : 'Anmelden'}
            </button>
          </form>

          <p className="text-sm text-center mt-6" style={{ color: 'var(--text-secondary)' }}>
            Noch kein Konto?{' '}
            <Link href="/account/register" className="hover:text-white transition-colors"
              style={{ color: 'var(--accent)' }}>
              Jetzt registrieren
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
