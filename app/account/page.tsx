'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { getSupabaseBrowser } from '@/lib/supabase-browser'
import SiteHeader from '@/components/SiteHeader'

interface MyReview {
  id: string
  rating: number
  title: string | null
  body: string
  status: string
  created_at: string
  providers: { name: string; slug: string } | null
}

function Stars({ rating }: { rating: number }) {
  return (
    <span>
      {[1,2,3,4,5].map(s => (
        <span key={s} style={{ color: s <= rating ? 'var(--accent)' : 'var(--border)' }}>★</span>
      ))}
    </span>
  )
}

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  pending:  { label: 'In Prüfung', color: '#f59e0b' },
  approved: { label: 'Veröffentlicht', color: '#22c55e' },
  rejected: { label: 'Abgelehnt', color: '#ef4444' },
  flagged:  { label: 'Gemeldet', color: '#f59e0b' },
}

export default function AccountPage() {
  const [email, setEmail] = useState<string | null>(null)
  const [reviews, setReviews] = useState<MyReview[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const supabase = getSupabaseBrowser()

    async function load() {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.replace('/account/login')
        return
      }

      setEmail(user.email ?? null)

      const { data } = await supabase
        .from('user_reviews')
        .select('id, rating, title, body, status, created_at, providers(name, slug)')
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })

      setReviews((data ?? []) as MyReview[])
      setLoading(false)
    }

    load()
  }, [router])

  async function deleteReview(reviewId: string) {
    const supabase = getSupabaseBrowser()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const res = await fetch('/api/reviews', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ review_id: reviewId }),
    })

    if (res.ok) {
      setReviews(prev => prev.filter(r => r.id !== reviewId))
    }
  }

  async function logout() {
    const supabase = getSupabaseBrowser()
    await supabase.auth.signOut()
    router.replace('/')
  }

  return (
    <div className="relative min-h-screen grid-bg">
      <SiteHeader />

      <main className="relative z-10 px-6 md:px-12 py-12 max-w-2xl">
        <p className="font-mono text-xs tracking-widest uppercase mb-2" style={{ color: 'var(--accent)' }}>
          Mein Konto
        </p>
        <h1 className="text-3xl font-extrabold mb-1">Account</h1>
        {email && (
          <p className="text-sm mb-8" style={{ color: 'var(--text-secondary)' }}>{email}</p>
        )}

        {/* Account-Aktionen */}
        <div className="flex gap-3 mb-12">
          <button
            onClick={logout}
            className="px-5 py-2.5 rounded-xl text-sm border font-medium transition-all hover:border-orange-500"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
            Abmelden
          </button>
        </div>

        {/* Meine Reviews */}
        <section>
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <span style={{ color: 'var(--accent)' }}>◈</span> Meine Reviews
          </h2>

          {loading ? (
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Lade…</p>
          ) : reviews.length === 0 ? (
            <div className="rounded-xl border p-6 text-center" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
              <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
                Du hast noch keine Reviews geschrieben.
              </p>
              <Link href="/vergleich/boersen"
                className="text-sm font-medium transition-colors hover:text-white"
                style={{ color: 'var(--accent)' }}>
                Jetzt Börsen bewerten →
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map(review => {
                const statusInfo = STATUS_LABEL[review.status] ?? { label: review.status, color: 'var(--text-secondary)' }
                return (
                  <div key={review.id} className="rounded-xl border p-5"
                    style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div>
                        <Stars rating={review.rating} />
                        {review.providers && (
                          <Link href={`/anbieter/${review.providers.slug}`}
                            className="text-sm font-bold mt-1 block hover:underline"
                            style={{ color: 'var(--text-primary)' }}>
                            {review.providers.name}
                          </Link>
                        )}
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span className="font-mono text-xs px-2 py-0.5 rounded-full"
                          style={{ color: statusInfo.color, background: `${statusInfo.color}22` }}>
                          {statusInfo.label}
                        </span>
                        <span className="font-mono text-xs" style={{ color: 'var(--text-secondary)' }}>
                          {new Date(review.created_at).toLocaleDateString('de-DE')}
                        </span>
                      </div>
                    </div>
                    {review.title && (
                      <p className="font-medium text-sm mb-1">{review.title}</p>
                    )}
                    <p className="text-sm leading-relaxed mb-3" style={{ color: 'var(--text-secondary)' }}>
                      {review.body.slice(0, 200)}{review.body.length > 200 ? '…' : ''}
                    </p>
                    <button
                      onClick={() => deleteReview(review.id)}
                      className="text-xs font-mono transition-colors hover:text-red-400"
                      style={{ color: 'var(--text-secondary)' }}>
                      Review löschen
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* DSGVO-Hinweis */}
        <p className="mt-12 text-xs font-mono" style={{ color: 'var(--border)' }}>
          Gemäß DSGVO kannst du alle deine Daten löschen. Schreibe dazu an{' '}
          <a href="mailto:christian-klingler@gmx.net" className="hover:text-white transition-colors"
            style={{ color: 'var(--text-secondary)' }}>
            christian-klingler@gmx.net
          </a>.
        </p>
      </main>
    </div>
  )
}
