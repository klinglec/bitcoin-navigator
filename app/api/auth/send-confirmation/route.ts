import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

const RESEND_API_KEY = process.env.RESEND_API_KEY
if (!RESEND_API_KEY) throw new Error('RESEND_API_KEY nicht gesetzt')
const RESEND_KEY: string = RESEND_API_KEY

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'E-Mail fehlt' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()

    // Bestätigungslink via Supabase Admin generieren
    // magiclink statt signup – funktioniert auch für unbestätigte User
    const { data, error } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: email.trim().toLowerCase(),
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bitcoinnavigator.de'}/account/login`,
      },
    })

    if (error || !data?.properties?.action_link) {
      console.error('Fehler beim Generieren des Bestätigungslinks:', error)
      return NextResponse.json({ error: 'Link konnte nicht erstellt werden' }, { status: 500 })
    }

    const confirmationLink = data.properties.action_link

    // E-Mail via Resend API senden
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'noreply@bitcoinnavigator.de',
        to: email.trim().toLowerCase(),
        subject: 'Bitcoin Navigator – E-Mail bestätigen',
        html: `
          <div style="font-family: system-ui, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 24px; background: #f7f6f3;">
            <div style="background: #ffffff; border-radius: 12px; padding: 32px; border: 1px solid #e0ddd8;">
              <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 24px;">
                <div style="width: 32px; height: 32px; background: #F7931A; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-weight: bold; color: #1a1a1a; font-size: 16px;">₿</div>
                <span style="font-weight: 700; font-size: 16px; color: #1a1a1a;">Bitcoin Navigator</span>
              </div>
              <h1 style="font-size: 22px; font-weight: 700; color: #1a1a1a; margin: 0 0 12px; letter-spacing: -0.02em;">E-Mail bestätigen</h1>
              <p style="color: #666666; font-size: 15px; line-height: 1.6; margin: 0 0 28px;">
                Klicke auf den Button um deine E-Mail-Adresse zu bestätigen und dein Konto zu aktivieren.
              </p>
              <a href="${confirmationLink}"
                style="display: inline-block; background: #1a1a1a; color: #ffffff; padding: 14px 28px; border-radius: 8px; font-weight: 700; font-size: 15px; text-decoration: none;">
                E-Mail bestätigen →
              </a>
              <p style="color: #999999; font-size: 12px; margin: 24px 0 0; line-height: 1.5;">
                Der Link ist 24 Stunden gültig. Falls du kein Konto bei Bitcoin Navigator erstellt hast, ignoriere diese Mail.
              </p>
            </div>
            <p style="color: #999999; font-size: 11px; text-align: center; margin: 16px 0 0;">
              Bitcoin Navigator · DACH's Bitcoin-Vergleichsportal · <a href="https://bitcoinnavigator.de" style="color: #999999;">bitcoinnavigator.de</a>
            </p>
          </div>
        `,
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error('Resend Fehler:', err)
      return NextResponse.json({ error: 'E-Mail konnte nicht gesendet werden' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('send-confirmation Fehler:', err)
    return NextResponse.json({ error: 'Interner Fehler' }, { status: 500 })
  }
}
