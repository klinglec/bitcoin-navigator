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
  is_editorial: boolean
  editorial_author: string | null
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
        .select('id, rating, title, body, pros, cons, created_at, user_id, is_editorial, editorial_author')
        .eq('provider_id', providerId)
        .eq('status', 'approved')
        .is('deleted_at', null)
        .order('is_editorial', { ascending: false }) // redaktionelle zuerst
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

  const editorialReviews = reviews.filter(r => r.is_editorial)
  const userReviews = reviews.filter(r => !r.is_editorial)

  if (loading) {
    return <p className="text-sm" style={{ color: '#666666' }}>Lade Reviews…</p>
  }

  function ReviewCard({ review }: { review: Review }) {
    const isEditorial = review.is_editorial
    return (
      <div
        className="rounded-xl border p-5"
        style={{
          background: isEditorial ? '#f7f6f3' : '#ffffff',
          borderColor: isEditorial ? '#c0bdb8' : '#e0ddd8',
          borderWidth: isEditorial ? '1px' : '1px',
        }}
      >
        <div className="flex items-start justify-between gap-4 mb-3">
          <div>
            {isEditorial && (
              <span
                className="inline-block text-xs font-medium px-2 py-0.5 rounded mb-2"
                style={{ background: '#1a1a1a', color: '#ffffff', fontSize: '10px', letterSpacing: '0.05em' }}
              >
                Redaktionelle Einschätzung
              </span>
            )}
            <div className="flex items-center gap-2">
              <Stars rating={review.rating} />
              <span className="text-xs" style={{ color: '#999999' }}>
                {review.rating}/5
              </span>
            </div>
            {review.title && (
              <p className="font-bold mt-1.5" style={{ color: '#1a1a1a', letterSpacing: '-0.01em' }}>
                {review.title}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3 flex-shrink-0 text-right">
            <div>
              <p className="text-xs" style={{ color: '#999999' }}>
                {isEditorial
                  ? (review.editorial_author ?? 'Redaktion')
                  : new Date(review.created_at).toLocaleDateString('de-DE')
                }
              </p>
              {!isEditorial && currentUserId && currentUserId === review.user_id && (
                <button
                  onClick={() => deleteReview(review.id)}
                  className="text-xs hover:opacity-50 transition-opacity mt-0.5"
                  style={{ color: '#999999' }}
                  title="Mein Review löschen"
                >
                  Löschen
                </button>
              )}
            </div>
          </div>
        </div>

        <p className="text-sm leading-relaxed mb-3" style={{ color: '#444444' }}>
          {review.body}
        </p>

        {(review.pros?.length > 0 || review.cons?.length > 0) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 pt-3 border-t"
            style={{ borderColor: '#e0ddd8' }}>
            {review.pros?.length > 0 && (
              <div>
                <p className="text-xs font-medium mb-1.5" style={{ color: '#2a6a2a' }}>Vorteile</p>
                <ul className="space-y-0.5">
                  {review.pros.map((p, i) => (
                    <li key={i} className="text-xs flex gap-1.5" style={{ color: '#666666' }}>
                      <span style={{ color: '#2a6a2a' }}>+</span> {p}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {review.cons?.length > 0 && (
              <div>
                <p className="text-xs font-medium mb-1.5" style={{ color: '#993333' }}>Nachteile</p>
                <ul className="space-y-0.5">
                  {review.cons.map((c, i) => (
                    <li key={i} className="text-xs flex gap-1.5" style={{ color: '#666666' }}>
                      <span style={{ color: '#993333' }}>−</span> {c}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Redaktionelle Einschätzungen zuerst */}
      {editorialReviews.length > 0 && (
        <div className="space-y-3">
          {editorialReviews.map(review => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      )}

      {/* Trenner wenn beides vorhanden */}
      {editorialReviews.length > 0 && userReviews.length > 0 && (
        <div className="flex items-center gap-3">
          <div className="flex-1 border-t" style={{ borderColor: '#e0ddd8' }} />
          <span className="text-xs" style={{ color: '#999999' }}>Nutzerbewertungen</span>
          <div className="flex-1 border-t" style={{ borderColor: '#e0ddd8' }} />
        </div>
      )}

      {/* Nutzer-Reviews */}
      {userReviews.length > 0 && (
        <div className="space-y-3">
          {userReviews.map(review => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      )}

      {/* Kein Nutzer-Review vorhanden */}
      {userReviews.length === 0 && (
        <p className="text-sm" style={{ color: '#999999' }}>
          Noch keine Nutzerbewertungen. Schreib als Erster eine Bewertung.
        </p>
      )}
    </div>
  )
}
