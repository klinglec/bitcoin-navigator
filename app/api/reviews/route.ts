import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

const MAX_REVIEWS_PER_DAY = 3
const MAX_BODY_LENGTH = 2000
const MIN_BODY_LENGTH = 30

function sanitize(text: string): string {
  return text
    .replace(/<[^>]*>/g, '')
    .replace(/&[a-z]+;/gi, ' ')
    .trim()
    .slice(0, MAX_BODY_LENGTH)
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // ── Honeypot: Bot-Erkennung ──────────────────────────────
    // Das Feld "website" ist für echte Nutzer unsichtbar (CSS hidden).
    // Bots füllen es oft automatisch aus.
    if (body.website) {
      // Stille Ablehnung (kein Fehler) damit Bots nicht lernen
      return NextResponse.json({ success: true }, { status: 201 })
    }

    // ── Auth: JWT aus Header validieren ─────────────────────
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Nicht angemeldet.' }, { status: 401 })
    }

    // Client mit User-JWT initialisieren → auth.uid() in RLS-Policies funktioniert
    const token = authHeader.replace('Bearer ', '')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Ungültige Sitzung.' }, { status: 401 })
    }

    // ── E-Mail-Verifizierung prüfen ──────────────────────────
    if (!user.email_confirmed_at) {
      return NextResponse.json(
        { error: 'Bitte bestätige zuerst deine E-Mail-Adresse.' },
        { status: 403 }
      )
    }

    // ── Rate Limiting: max. 3 Reviews pro Tag ────────────────
    const startOfDay = new Date()
    startOfDay.setHours(0, 0, 0, 0)

    const { count } = await supabase
      .from('user_reviews')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', startOfDay.toISOString())

    if ((count ?? 0) >= MAX_REVIEWS_PER_DAY) {
      return NextResponse.json(
        { error: `Maximal ${MAX_REVIEWS_PER_DAY} Reviews pro Tag möglich.` },
        { status: 429 }
      )
    }

    // ── Input-Validierung ────────────────────────────────────
    const { provider_id, category_id, rating, title, body: reviewBody, pros, cons } = body

    if (!provider_id || !category_id) {
      return NextResponse.json({ error: 'Ungültige Anfrage.' }, { status: 400 })
    }

    const ratingNum = Number(rating)
    if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return NextResponse.json({ error: 'Bewertung muss zwischen 1 und 5 liegen.' }, { status: 400 })
    }

    const cleanBody = sanitize(String(reviewBody ?? ''))
    if (cleanBody.length < MIN_BODY_LENGTH) {
      return NextResponse.json(
        { error: `Review muss mindestens ${MIN_BODY_LENGTH} Zeichen enthalten.` },
        { status: 400 }
      )
    }

    const cleanTitle = title ? sanitize(String(title)).slice(0, 100) : null
    const cleanPros = Array.isArray(pros) ? pros.map((p: string) => sanitize(String(p)).slice(0, 200)) : []
    const cleanCons = Array.isArray(cons) ? cons.map((c: string) => sanitize(String(c)).slice(0, 200)) : []

    // ── IP-Hash für Duplikat-Erkennung (DSGVO-konform) ───────
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown'
    const ipBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(ip))
    const ipHash = Array.from(new Uint8Array(ipBuffer)).map(b => b.toString(16).padStart(2, '0')).join('')

    // ── In DB schreiben ──────────────────────────────────────
    const { error: insertError } = await supabase
      .from('user_reviews')
      .insert({
        provider_id,
        category_id,
        user_id: user.id,
        rating: ratingNum,
        title: cleanTitle,
        body: cleanBody,
        pros: cleanPros.filter(Boolean),
        cons: cleanCons.filter(Boolean),
        status: 'pending',          // Moderation Queue
        ip_hash: ipHash,
      })

    if (insertError) {
      console.error('Review insert error:', insertError)
      return NextResponse.json({ error: 'Fehler beim Speichern.' }, { status: 500 })
    }

    // ── Benachrichtigung per E-Mail (fire & forget) ──────────
    sendReviewNotification({ provider_id, rating: ratingNum, title: cleanTitle, body: cleanBody }).catch(
      (err) => console.error('Review notification error:', err)
    )

    return NextResponse.json(
      { message: 'Danke! Dein Review wird nach Prüfung veröffentlicht.' },
      { status: 201 }
    )

  } catch (err) {
    console.error('Review API error:', err)
    return NextResponse.json({ error: 'Interner Fehler.' }, { status: 500 })
  }
}

// ── Interne Hilfsfunktion: Benachrichtigungs-E-Mail ─────────────────────────
async function sendReviewNotification({
  provider_id, rating, title, body,
}: {
  provider_id: string
  rating: number
  title: string | null
  body: string
}) {
  const resendKey = process.env.RESEND_API_KEY
  if (!resendKey) return

  // Provider-Namen nachschlagen
  const admin = getSupabaseAdmin()
  const { data: provider } = await admin
    .from('providers')
    .select('name')
    .eq('id', provider_id)
    .single()

  const providerName = provider?.name ?? provider_id
  const stars        = '★'.repeat(rating) + '☆'.repeat(5 - rating)
  const titleText    = title ?? '(kein Titel)'
  const createdAt    = new Date().toLocaleString('de-DE', { timeZone: 'Europe/Berlin' })

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'noreply@bitcoinnavigator.de',
      to:   'klinglec@googlemail.com',
      subject: `Neues Review: ${providerName} ${stars}`,
      html: `
        <div style="font-family: system-ui, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 24px; background: #f7f6f3;">
          <div style="background: #ffffff; border-radius: 12px; padding: 32px; border: 1px solid #e0ddd8;">
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 24px;">
              <div style="width: 32px; height: 32px; background: #F7931A; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-weight: bold; color: #fff; font-size: 16px;">₿</div>
              <span style="font-weight: 700; font-size: 16px; color: #1a1a1a;">Bitcoin Navigator</span>
            </div>
            <h1 style="font-size: 20px; font-weight: 700; color: #1a1a1a; margin: 0 0 4px; letter-spacing: -0.02em;">Neues Review zur Freigabe</h1>
            <p style="color: #999; font-size: 13px; margin: 0 0 24px;">${createdAt}</p>
            <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-bottom: 20px;">
              <tr>
                <td style="color: #888; padding: 6px 0; width: 110px;">Anbieter</td>
                <td style="color: #1a1a1a; font-weight: 600; padding: 6px 0;">${providerName}</td>
              </tr>
              <tr>
                <td style="color: #888; padding: 6px 0;">Bewertung</td>
                <td style="color: #F7931A; font-size: 16px; padding: 6px 0;">${stars} <span style="color: #888; font-size: 13px;">(${rating}/5)</span></td>
              </tr>
              <tr>
                <td style="color: #888; padding: 6px 0;">Titel</td>
                <td style="color: #1a1a1a; padding: 6px 0;">${titleText}</td>
              </tr>
            </table>
            <div style="background: #f7f6f3; border-radius: 8px; padding: 16px; font-size: 14px; color: #333; line-height: 1.6; margin-bottom: 24px;">
              ${escapeHtml(body).replace(/\n/g, '<br>')}
            </div>
            <a href="https://supabase.com/dashboard/project/xllborggqanaufzkthvb/editor?table=user_reviews"
              style="display: inline-block; background: #1a1a1a; color: #fff; padding: 12px 24px; border-radius: 8px; font-weight: 700; font-size: 14px; text-decoration: none;">
              Zur Moderation →
            </a>
          </div>
          <p style="color: #bbb; font-size: 11px; text-align: center; margin: 16px 0 0;">
            Bitcoin Navigator · <a href="https://bitcoinnavigator.de" style="color: #bbb;">bitcoinnavigator.de</a>
          </p>
        </div>
      `,
    }),
  })
}

// DELETE: Eigenes Review löschen (DSGVO Löschrecht)
export async function DELETE(req: NextRequest) {
  try {
    const { review_id } = await req.json()

    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Nicht angemeldet.' }, { status: 401 })
    }

    const token2 = authHeader.replace('Bearer ', '')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: `Bearer ${token2}` } } }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Ungültige Sitzung.' }, { status: 401 })
    }

    // Soft-Delete: deleted_at setzen statt tatsächlich löschen
    const { error } = await supabase
      .from('user_reviews')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', review_id)
      .eq('user_id', user.id)   // RLS: nur eigene Reviews

    if (error) {
      return NextResponse.json({ error: 'Löschen fehlgeschlagen.' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Review gelöscht.' })

  } catch (err) {
    console.error('Review delete error:', err)
    return NextResponse.json({ error: 'Interner Fehler.' }, { status: 500 })
  }
}
