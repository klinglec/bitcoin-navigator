'use client'

import { useEffect, useState } from 'react'
import { getSupabaseBrowser } from '@/lib/supabase-browser'

interface Review {
  id: string
  rating: number
  title: string | null
  body: string
  pros: string[]
  cons: string[]
  created_at: string
  user_id: string | null
}

interface Props {
  providerId: string
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

export default function ReviewList({ providerId }: Props) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  useEffect(() => {
    const supabase = getSupabaseBrowser()

    async function load() {
      // Aktuelle User-ID laden (für Lösch-Button)
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUserId(user?.id ?? null)

      // Approved Reviews laden
      const { data } = await supabase
        .from('user_reviews')
        .select('id, rating, title, body, pros, cons, created_at, user_id')
        .eq('provider_id', providerId)
        .eq('status', 'approved')
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(20)

      setReviews(data ?? [])
      setLoading(false)
    }

    load()
  }, [providerId])

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

  if (loading) {
    return <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Lade Reviews…</p>
  }

  if (reviews.length === 0) {
    return (
      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
        Noch keine Reviews. Sei der Erste!
      </p>
    )
  }

  return (
    <div className="space-y-4">
      {reviews.map(review => (
        <div key={review.id} className="rounded-xl border p-5"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <div className="flex items-start justify-between gap-4 mb-3">
            <div>
              <Stars rating={review.rating} />
              {review.title && (
                <p className="font-bold mt-1">{review.title}</p>
              )}
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <p className="font-mono text-xs" style={{ color: 'var(--text-secondary)' }}>
                {new Date(review.created_at).toLocaleDateString('de-DE')}
              </p>
              {currentUserId && currentUserId === review.user_id && (
                <button
                  onClick={() => deleteReview(review.id)}
                  className="font-mono text-xs hover:text-red-400 transition-colors"
                  style={{ color: 'var(--text-secondary)' }}
                  title="Mein Review löschen"
                >
                  Löschen
                </button>
              )}
            </div>
          </div>

          <p className="text-sm leading-relaxed mb-3" style={{ color: 'var(--text-secondary)' }}>
            {review.body}
          </p>

          {(review.pros?.length > 0 || review.cons?.length > 0) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 pt-3 border-t"
              style={{ borderColor: 'var(--border)' }}>
              {review.pros?.length > 0 && (
                <div>
                  <p className="text-xs font-mono mb-1.5" style={{ color: '#22c55e' }}>Vorteile</p>
                  <ul className="space-y-0.5">
                    {review.pros.map((p, i) => (
                      <li key={i} className="text-xs flex gap-1.5" style={{ color: 'var(--text-secondary)' }}>
                        <span style={{ color: '#22c55e' }}>+</span> {p}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {review.cons?.length > 0 && (
                <div>
                  <p className="text-xs font-mono mb-1.5" style={{ color: '#ef4444' }}>Nachteile</p>
                  <ul className="space-y-0.5">
                    {review.cons.map((c, i) => (
                      <li key={i} className="text-xs flex gap-1.5" style={{ color: 'var(--text-secondary)' }}>
                        <span style={{ color: '#ef4444' }}>−</span> {c}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
