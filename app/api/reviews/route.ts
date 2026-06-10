import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const MAX_REVIEWS_PER_DAY = 3
const MAX_BODY_LENGTH = 2000
const MIN_BODY_LENGTH = 30

function sanitize(text: string): string {
  // HTML-Tags entfernen, Whitespace normalisieren
  return text
    .replace(/<[^>]*>/g, '')
    .replace(/&[a-z]+;/gi, ' ')
    .trim()
    .slice(0, MAX_BODY_LENGTH)
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

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

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

    return NextResponse.json(
      { message: 'Danke! Dein Review wird nach Prüfung veröffentlicht.' },
      { status: 201 }
    )

  } catch (err) {
    console.error('Review API error:', err)
    return NextResponse.json({ error: 'Interner Fehler.' }, { status: 500 })
  }
}

// DELETE: Eigenes Review löschen (DSGVO Löschrecht)
export async function DELETE(req: NextRequest) {
  try {
    const { review_id } = await req.json()

    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Nicht angemeldet.' }, { status: 401 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

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
