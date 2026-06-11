import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

// ── Env-Vars ──────────────────────────────────────────────────
// SUPABASE_SERVICE_ROLE_KEY  – Supabase Dashboard → Settings → API → service_role
// NOSTR_AUTH_SECRET          – Beliebiger langer zufälliger String (z.B. openssl rand -hex 32)

const NOSTR_AUTH_SECRET = process.env.NOSTR_AUTH_SECRET
if (!NOSTR_AUTH_SECRET) throw new Error('NOSTR_AUTH_SECRET env var nicht gesetzt')
const SECRET: string = NOSTR_AUTH_SECRET
const MAX_EVENT_AGE_SECONDS = 60

// ── Phantom-User-Passwort aus Pubkey ableiten ─────────────────
// Deterministisch: gleicher Pubkey → immer gleiches Passwort → Login funktioniert
function derivePassword(pubkeyHex: string): string {
  return crypto
    .createHmac('sha256', SECRET)
    .update(pubkeyHex)
    .digest('hex')
    .slice(0, 32)
}

function phantomEmail(pubkeyHex: string): string {
  return `nostr-${pubkeyHex.slice(0, 16)}@internal.bitcoinnavigator.de`
}

// ── npub aus hex ──────────────────────────────────────────────
function hexToNpub(hex: string): string {
  // Bech32 encoding für npub1...
  // Vereinfacht: wir speichern hex-basiertes npub-ähnliches Format
  // Für echtes npub encoding: nostr-tools wird client-side genutzt
  return `npub1${hex.slice(0, 32)}`
}

// ── POST /api/auth/nostr ──────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { event } = body

    if (!event || typeof event !== 'object') {
      return NextResponse.json({ error: 'Kein Event übergeben' }, { status: 400 })
    }

    // ── 1. Event-Struktur prüfen ──────────────────────────────
    const { kind, pubkey, created_at, tags, content, sig, id } = event

    if (kind !== 27235) {
      return NextResponse.json({ error: 'Falscher Event-Typ (erwartet kind 27235)' }, { status: 400 })
    }
    if (typeof pubkey !== 'string' || pubkey.length !== 64) {
      return NextResponse.json({ error: 'Ungültiger Pubkey' }, { status: 400 })
    }
    if (!sig || !id) {
      return NextResponse.json({ error: 'Fehlende Signatur oder ID' }, { status: 400 })
    }

    // ── 2. Zeitstempel prüfen (Replay-Schutz) ────────────────
    const now = Math.floor(Date.now() / 1000)
    if (Math.abs(now - created_at) > MAX_EVENT_AGE_SECONDS) {
      return NextResponse.json({ error: 'Event abgelaufen' }, { status: 400 })
    }

    // ── 3. Signatur verifizieren (server-side, nostr-tools) ───
    // nostr-tools läuft auch in Node.js
    // @ts-ignore – nostr-tools wird via npm install hinzugefügt
    const { verifyEvent } = await import('nostr-tools')
    const isValid = verifyEvent(event)
    if (!isValid) {
      return NextResponse.json({ error: 'Ungültige Signatur' }, { status: 401 })
    }

    // ── 4. URL-Tag prüfen (verhindert Cross-Origin-Replay) ────
    const urlTag = tags?.find((t: string[]) => t[0] === 'u')?.[1]
    if (!urlTag?.includes('/api/auth/nostr')) {
      return NextResponse.json({ error: 'Falscher URL-Tag' }, { status: 400 })
    }

    // ── 5. Supabase User anlegen oder finden ──────────────────
    const supabase = getSupabaseAdmin()
    const email = phantomEmail(pubkey)
    const password = derivePassword(pubkey)
    const npub = hexToNpub(pubkey)

    // Versuche bestehenden User zu finden
    let userId: string

    // Erst versuchen einzuloggen (User existiert bereits)
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (signInData?.session) {
      userId = signInData.session.user.id

      // last_login aktualisieren
      await supabase
        .from('nostr_identities')
        .update({ last_login: new Date().toISOString() })
        .eq('pubkey_hex', pubkey)

      return NextResponse.json({
        accessToken: signInData.session.access_token,
        refreshToken: signInData.session.refresh_token,
        userId,
        npub,
        isNewUser: false,
      })
    }

    // User nicht gefunden → neu anlegen
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // kein E-Mail-Bestätigungsflow nötig
    })

    if (createError || !newUser?.user) {
      console.error('Fehler beim Anlegen des Nostr-Users:', createError)
      return NextResponse.json({ error: 'Benutzer konnte nicht angelegt werden' }, { status: 500 })
    }

    userId = newUser.user.id

    // nostr_identities Eintrag anlegen
    await supabase.from('nostr_identities').insert({
      user_id: userId,
      pubkey_hex: pubkey,
      npub,
    })

    // Jetzt einloggen
    const { data: newSession, error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (loginError || !newSession?.session) {
      console.error('Login nach Registrierung fehlgeschlagen:', loginError)
      return NextResponse.json({ error: 'Login fehlgeschlagen' }, { status: 500 })
    }

    return NextResponse.json({
      accessToken: newSession.session.access_token,
      refreshToken: newSession.session.refresh_token,
      userId,
      npub,
      isNewUser: true,
    })

  } catch (err) {
    console.error('Nostr-Auth Fehler:', err)
    return NextResponse.json({ error: 'Interner Fehler' }, { status: 500 })
  }
}
