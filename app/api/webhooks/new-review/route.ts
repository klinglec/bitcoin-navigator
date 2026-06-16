import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET!
const RESEND_API_KEY = process.env.RESEND_API_KEY!
const NOTIFY_EMAIL   = 'klinglec@googlemail.com'

export async function POST(req: NextRequest) {
  // 1. Secret prüfen
  const secret = req.headers.get('x-webhook-secret')
  if (!secret || secret !== WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Payload lesen
  const payload = await req.json()
  const review = payload?.record

  if (!review || payload?.type !== 'INSERT') {
    return NextResponse.json({ ok: true }) // ignorieren
  }

  // 3. Provider-Namen nachschlagen
  const supabase = getSupabaseAdmin()
  const { data: provider } = await supabase
    .from('providers')
    .select('name')
    .eq('id', review.provider_id)
    .single()

  const providerName = provider?.name ?? review.provider_id
  const rating       = review.rating ?? 0
  const stars        = '★'.repeat(rating) + '☆'.repeat(5 - rating)
  const title        = review.title ?? '(kein Titel)'
  const body         = review.body  ?? ''
  const createdAt    = new Date(review.created_at).toLocaleString('de-DE', { timeZone: 'Europe/Berlin' })

  // 4. E-Mail via Resend
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'noreply@bitcoinnavigator.de',
      to:   NOTIFY_EMAIL,
      subject: `Neues Review: ${providerName} ${stars}`,
      html: `
        <div style="font-family: system-ui, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 24px; background: #f7f6f3;">
          <div style="background: #ffffff; border-radius: 12px; padding: 32px; border: 1px solid #e0ddd8;">

            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 24px;">
              <div style="width: 32px; height: 32px; background: #F7931A; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-weight: bold; color: #fff; font-size: 16px;">₿</div>
              <span style="font-weight: 700; font-size: 16px; color: #1a1a1a;">Bitcoin Navigator</span>
            </div>

            <h1 style="font-size: 20px; font-weight: 700; color: #1a1a1a; margin: 0 0 4px; letter-spacing: -0.02em;">
              Neues Review zur Freigabe
            </h1>
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
                <td style="color: #1a1a1a; padding: 6px 0;">${title}</td>
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

  if (!res.ok) {
    const err = await res.text()
    console.error('Resend Fehler:', err)
    return NextResponse.json({ error: 'E-Mail fehlgeschlagen' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
