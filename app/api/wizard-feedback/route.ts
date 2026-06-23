import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const rating = Number(body.rating)

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Ungültige Bewertung' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()
    const { error } = await supabase
      .from('wizard_feedback')
      .insert({ rating })

    if (error) {
      console.error('wizard_feedback insert error:', error)
      return NextResponse.json({ error: 'Datenbankfehler' }, { status: 500 })
    }

    return NextResponse.json({ success: true }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Serverfehler' }, { status: 500 })
  }
}
