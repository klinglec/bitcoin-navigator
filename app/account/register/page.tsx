'use client'

import { useState, FormEvent } from 'react'
import Link from 'next/link'
import { getSupabaseBrowser } from '@/lib/supabase-browser'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setStatus('loading')

    if (password.length < 8) {
      setStatus('error')
      setMessage('Passwort muss mindestens 8 Zeichen lang sein.')
      return
    }

    const supabase = getSupabaseBrowser()
    const { error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
    })

    if (error) {
      setStatus('error')
      setMessage(error.message === 'User already registered'
        ? 'Diese E-Mail ist bereits registriert.'
        : 'Registrierung fehlgeschlagen. Bitte versuche es erneut.')
      return
    }

    // Bestätigungsmail via Resend API senden (umgeht Supabase SMTP)
    const mailRes = await fetch('/api/auth/send-confirmation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim().toLowerCase() }),
    })

    if (!mailRes.ok) {
      setStatus('error')
      setMessage('Konto erstellt, aber Bestätigungsmail konnte nicht gesendet werden. Bitte wende dich an den Support.')
      return
    }

    setStatus('success')
    setMessage('Fast geschafft! Prüfe deine E-Mails und klicke auf den Bestätigungslink.')
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
          <h1 className="text-2xl font-bold mb-2">Konto erstellen</h1>
          <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
            Um Reviews zu schreiben, benötigst du ein Konto.
          </p>

          {status === 'success' ? (
            <div className="rounded-xl p-5 border text-center" style={{ borderColor: 'var(--accent)', background: 'var(--accent-dim)' }}>
              <p className="font-bold mb-2" style={{ color: 'var(--accent)' }}>✓ Fast geschafft!</p>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{message}</p>
            </div>
          ) : (
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
                  Passwort (min. 8 Zeichen)
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
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
                {status === 'loading' ? 'Wird registriert…' : 'Konto erstellen'}
              </button>

              <p className="text-xs text-center" style={{ color: 'var(--text-secondary)' }}>
                Mit der Registrierung stimmst du unserer{' '}
                <Link href="/datenschutz" className="hover:text-white transition-colors underline">
                  Datenschutzerklärung
                </Link>{' '}
                zu.
              </p>
            </form>
          )}

          <p className="text-sm text-center mt-6" style={{ color: 'var(--text-secondary)' }}>
            Bereits registriert?{' '}
            <Link href="/account/login" className="hover:text-white transition-colors"
              style={{ color: 'var(--accent)' }}>
              Anmelden
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
