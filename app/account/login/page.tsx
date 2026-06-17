'use client'

import { useState, FormEvent, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { getSupabaseBrowser } from '@/lib/supabase-browser'

// Google-Logo SVG (inline, kein externes Package nötig)
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  )
}
import {
  hasNostrExtension,
  signWithExtension,
  parseBunkerUrl,
  signWithBunker,
  generateAmberConnectUrl,
  authenticateWithServer,
} from '@/lib/nostr'

type Tab = 'extension' | 'bunker' | 'email'

// ── Wiederverwendete Styles ──────────────────────────────────
const inputStyle = {
  background: '#f7f6f3',
  borderColor: '#e0ddd8',
  color: '#1a1a1a',
}
const cardStyle = {
  background: '#ffffff',
  borderColor: '#e0ddd8',
}

// ── Nostr nach Supabase-Session konvertieren ─────────────────
async function applyNostrSession(
  accessToken: string,
  refreshToken: string,
  npub: string
) {
  const supabase = getSupabaseBrowser()
  await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
  localStorage.setItem('bn_nostr_npub', npub)
}

export default function LoginPage() {
  const [tab, setTab] = useState<Tab>('extension')
  const [googleLoading, setGoogleLoading] = useState(false)
  const router = useRouter()

  // Nach OAuth-Redirect: Session automatisch übernehmen und weiterleiten
  useEffect(() => {
    const supabase = getSupabaseBrowser()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') router.back()
    })
    return () => subscription.unsubscribe()
  }, [router])

  async function handleGoogle() {
    setGoogleLoading(true)
    const supabase = getSupabaseBrowser()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/account/login`,
      },
    })
    // Browser leitet weiter — kein setLoading(false) nötig
  }

  // ── Tab: Extension (NIP-07) ──────────────────────────────
  function ExtensionTab() {
    const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
    const [message, setMessage] = useState('')
    const [hasExt, setHasExt] = useState(false)

    useEffect(() => { setHasExt(hasNostrExtension()) }, [])

    async function handleExtension() {
      setStatus('loading')
      const result = await signWithExtension()
      if (!result) {
        setStatus('error')
        setMessage('Extension hat die Anfrage abgebrochen.')
        return
      }
      const session = await authenticateWithServer(result)
      if (!session) {
        setStatus('error')
        setMessage('Serverauthentifizierung fehlgeschlagen.')
        return
      }
      await applyNostrSession(session.accessToken, session.refreshToken, `npub1${result.pubkeyHex.slice(0, 20)}…`)
      router.back()
    }

    return (
      <div className="space-y-5">
        <p className="text-sm" style={{ color: '#666666' }}>
          Melde dich mit deiner Nostr-Browser-Extension an.
          Kompatibel mit <strong style={{ color: '#1a1a1a' }}>Alby</strong>, <strong style={{ color: '#1a1a1a' }}>nos2x</strong> und anderen NIP-07-Extensions.
        </p>
        <div className="rounded-lg border p-3 text-xs" style={{ borderColor: '#e0ddd8', background: '#f7f6f3', color: '#666666' }}>
          <strong style={{ color: '#1a1a1a' }}>Primal-Nutzer:</strong> Öffne bitcoinnavigator.de direkt im Primal In-App-Browser (Link teilen → In Primal öffnen). Dann funktioniert dieser Tab automatisch.
        </div>

        {hasExt ? (
          <button
            onClick={handleExtension}
            disabled={status === 'loading'}
            className="w-full py-3 rounded-lg font-bold text-sm transition-all hover:opacity-80 disabled:opacity-50"
            style={{ background: '#1a1a1a', color: '#ffffff' }}
          >
            {status === 'loading' ? 'Warte auf Extension…' : '⚡ Mit Browser-Extension anmelden'}
          </button>
        ) : (
          <div className="rounded-lg border p-4 text-sm space-y-3" style={{ borderColor: '#e0ddd8', background: '#f7f6f3' }}>
            <p style={{ color: '#666666' }}>Keine Nostr-Extension gefunden. Installiere eine:</p>
            <div className="space-y-2">
              {[
                { name: 'Alby', url: 'https://getalby.com', desc: 'Bitcoin + Nostr, Desktop' },
                { name: 'nos2x', url: 'https://github.com/fiatjaf/nos2x', desc: 'Nur Nostr, Chromium' },
              ].map(ext => (
                <a key={ext.name} href={ext.url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-between hover:opacity-70 transition-opacity">
                  <span className="font-medium" style={{ color: '#1a1a1a' }}>{ext.name}</span>
                  <span className="text-xs" style={{ color: '#999999' }}>{ext.desc} →</span>
                </a>
              ))}
            </div>
          </div>
        )}

        {status === 'error' && (
          <p className="text-sm" style={{ color: '#cc3333' }}>{message}</p>
        )}
      </div>
    )
  }

  // ── Tab: Bunker (NIP-46) ─────────────────────────────────
  function BunkerTab() {
    const [mode, setMode] = useState<'amber' | 'url'>('amber')
    const [bunkerUrl, setBunkerUrl] = useState('')
    const [statusMsg, setStatusMsg] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [amberUrl, setAmberUrl] = useState<string | null>(null)

    async function handleAmber() {
      setLoading(true)
      setError('')
      try {
        const { connectUrl, waitForConnection } = await generateAmberConnectUrl()
        setAmberUrl(connectUrl)
        // Deep-Link nur auf Mobile öffnen – auf Desktop keinen leeren Tab
        const isMobile = /Android|iPhone|iPad/i.test(navigator.userAgent)
        if (isMobile) {
          window.location.href = `nostrsigner:${connectUrl}`
        }
        setStatusMsg('QR-Code scannen oder Amber auf dem Handy öffnen…')
        const result = await waitForConnection(setStatusMsg)
        if (!result) { setError('Verbindung fehlgeschlagen.'); return }
        const session = await authenticateWithServer(result)
        if (!session) { setError('Serverauthentifizierung fehlgeschlagen.'); return }
        await applyNostrSession(session.accessToken, session.refreshToken, `npub1${result.pubkeyHex.slice(0, 20)}…`)
        router.back()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Fehler')
      } finally {
        setLoading(false)
      }
    }

    async function handleBunkerUrl() {
      const pointer = parseBunkerUrl(bunkerUrl)
      if (!pointer) { setError('Ungültige bunker://-URL.'); return }
      setLoading(true)
      setError('')
      try {
        const result = await signWithBunker(pointer, setStatusMsg)
        if (!result) { setError('Signatur fehlgeschlagen.'); return }
        const session = await authenticateWithServer(result)
        if (!session) { setError('Serverauthentifizierung fehlgeschlagen.'); return }
        await applyNostrSession(session.accessToken, session.refreshToken, `npub1${result.pubkeyHex.slice(0, 20)}…`)
        router.back()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Fehler')
      } finally {
        setLoading(false)
      }
    }

    return (
      <div className="space-y-5">
        {/* Amber / URL Toggle */}
        <div className="flex rounded-lg overflow-hidden border" style={{ borderColor: '#e0ddd8' }}>
          {(['amber', 'url'] as const).map(m => (
            <button key={m} onClick={() => setMode(m)}
              className="flex-1 py-2 text-xs font-medium transition-colors"
              style={{
                background: mode === m ? '#1a1a1a' : '#ffffff',
                color: mode === m ? '#ffffff' : '#666666',
              }}>
              {m === 'amber' ? 'Amber / Signer-App' : 'Bunker-URL'}
            </button>
          ))}
        </div>

        {mode === 'amber' && (
          <div className="space-y-4">
            <p className="text-sm" style={{ color: '#666666' }}>
              Benötigt eine <strong style={{ color: '#1a1a1a' }}>Nostr-Signer-App</strong> – kein Nostr-Client (z.B. nicht Primal, Damus etc.).
              Kompatibel: <strong style={{ color: '#1a1a1a' }}>Amber</strong> (Android),{' '}
              <strong style={{ color: '#1a1a1a' }}>nsec.app</strong> (iOS/Web), <strong style={{ color: '#1a1a1a' }}>Alby Hub</strong> (Desktop).
            </p>
            <button
              onClick={handleAmber}
              disabled={loading}
              className="w-full py-3 rounded-lg font-bold text-sm transition-all hover:opacity-80 disabled:opacity-50"
              style={{ background: '#1a1a1a', color: '#ffffff' }}
            >
              {loading ? statusMsg || 'Verbinde…' : '⚡ Mit Amber / Signer-App anmelden'}
            </button>
            {amberUrl && (
              <div className="rounded-lg border p-4 text-center" style={{ borderColor: '#e0ddd8', background: '#f7f6f3' }}>
                <p className="text-xs mb-3" style={{ color: '#666666' }}>
                  Auf Desktop: QR-Code mit Amber auf dem Handy scannen
                </p>
                {/* QR-Code via api.qrserver.com – kein extra Package nötig */}
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(amberUrl)}&size=180x180&margin=10&color=1a1a1a&bgcolor=f7f6f3`}
                  alt="Nostr Connect QR-Code"
                  width={180}
                  height={180}
                  className="mx-auto rounded-lg"
                  style={{ imageRendering: 'pixelated' }}
                />
                <p className="text-xs mt-3" style={{ color: '#999999' }}>
                  Amber → Scan → Bitcoin Navigator bestätigen
                </p>
              </div>
            )}
          </div>
        )}

        {mode === 'url' && (
          <div className="space-y-4">
            <p className="text-sm" style={{ color: '#666666' }}>
              Füge deine <strong style={{ color: '#1a1a1a' }}>bunker://-URL</strong> ein.
              Zu finden in Amber → Verbindungen, nsec.app oder Alby Hub.
            </p>
            <input
              type="text"
              value={bunkerUrl}
              onChange={e => setBunkerUrl(e.target.value)}
              placeholder="bunker://abc123...?relay=wss://..."
              className="w-full rounded-lg border px-4 py-3 text-sm font-mono outline-none"
              style={inputStyle}
            />
            <button
              onClick={handleBunkerUrl}
              disabled={loading || !bunkerUrl}
              className="w-full py-3 rounded-lg font-bold text-sm transition-all hover:opacity-80 disabled:opacity-50"
              style={{ background: '#1a1a1a', color: '#ffffff' }}
            >
              {loading ? statusMsg || 'Verbinde…' : 'Verbinden'}
            </button>
          </div>
        )}

        {error && <p className="text-sm" style={{ color: '#cc3333' }}>{error}</p>}
        {statusMsg && !error && loading && (
          <p className="text-sm" style={{ color: '#999999' }}>{statusMsg}</p>
        )}
      </div>
    )
  }

  // ── Tab: E-Mail ──────────────────────────────────────────
  function EmailTab() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
    const [message, setMessage] = useState('')

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
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-xs font-medium mb-2 block" style={{ color: '#666666' }}>
            E-Mail-Adresse
          </label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)}
            required autoComplete="email"
            className="w-full rounded-lg border px-4 py-3 text-sm outline-none transition-colors"
            style={inputStyle} />
        </div>
        <div>
          <label className="text-xs font-medium mb-2 block" style={{ color: '#666666' }}>
            Passwort
          </label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)}
            required autoComplete="current-password"
            className="w-full rounded-lg border px-4 py-3 text-sm outline-none transition-colors"
            style={inputStyle} />
        </div>
        {status === 'error' && (
          <p className="text-sm" style={{ color: '#cc3333' }}>{message}</p>
        )}
        <button type="submit" disabled={status === 'loading'}
          className="w-full py-3 rounded-lg font-bold text-sm transition-all hover:opacity-80 disabled:opacity-50"
          style={{ background: '#1a1a1a', color: '#ffffff' }}>
          {status === 'loading' ? 'Wird angemeldet…' : 'Anmelden'}
        </button>
        <p className="text-sm text-center" style={{ color: '#666666' }}>
          Noch kein Konto?{' '}
          <Link href="/account/register" style={{ color: '#1a1a1a', fontWeight: 500 }}>
            Jetzt registrieren
          </Link>
        </p>
      </form>
    )
  }

  // ── Layout ───────────────────────────────────────────────
  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ background: '#f7f6f3' }}>
      <div className="w-full max-w-sm">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 mb-10 justify-center">
          <div className="w-7 h-7 rounded flex items-center justify-center font-bold text-sm"
            style={{ background: '#F7931A', color: '#1a1a1a' }}>₿</div>
          <span className="font-bold text-sm" style={{ color: '#1a1a1a', letterSpacing: '-0.01em' }}>
            Bitcoin Navigator
          </span>
        </Link>

        <div className="rounded-xl border p-8" style={cardStyle}>
          <h1 className="text-xl font-bold mb-1" style={{ color: '#1a1a1a', letterSpacing: '-0.02em' }}>
            Anmelden
          </h1>
          <p className="text-sm mb-6" style={{ color: '#666666' }}>
            Zum Schreiben von Bewertungen
          </p>

          {/* Google Login */}
          <button
            onClick={handleGoogle}
            disabled={googleLoading}
            className="w-full flex items-center justify-center gap-3 py-3 rounded-lg border text-sm font-medium transition-all hover:bg-gray-50 disabled:opacity-50 mb-5"
            style={{ borderColor: '#e0ddd8', background: '#ffffff', color: '#1a1a1a' }}
          >
            <GoogleIcon />
            {googleLoading ? 'Weiterleitung…' : 'Mit Google anmelden'}
          </button>

          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 border-t" style={{ borderColor: '#e0ddd8' }} />
            <span className="text-xs" style={{ color: '#999999' }}>oder</span>
            <div className="flex-1 border-t" style={{ borderColor: '#e0ddd8' }} />
          </div>

          {/* Tab-Navigation */}
          <div className="flex border-b mb-6" style={{ borderColor: '#e0ddd8' }}>
            {([
              { id: 'extension', label: 'Erweiterung' },
              { id: 'bunker',    label: 'Bunker' },
              { id: 'email',     label: 'E-Mail' },
            ] as { id: Tab; label: string }[]).map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className="flex-1 pb-3 text-sm font-medium transition-colors"
                style={{
                  color: tab === t.id ? '#1a1a1a' : '#999999',
                  borderBottom: tab === t.id ? '2px solid #1a1a1a' : '2px solid transparent',
                  marginBottom: '-1px',
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Tab-Inhalt */}
          {tab === 'extension' && <ExtensionTab />}
          {tab === 'bunker'    && <BunkerTab />}
          {tab === 'email'     && <EmailTab />}
        </div>

      </div>
    </div>
  )
}
