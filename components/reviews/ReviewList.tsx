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
  is_external: boolean
  source_platform: string | null
  source_url: string | null
  review_count_ext: number | null
  retrieved_at: string | null
}

interface Props {
  providerId: string
  onWriteReview?: () => void
  isLoggedIn?: boolean
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

export default function ReviewList({ providerId, onWriteReview, isLoggedIn }: Props) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  useEffect(() => {
    const supabase = getSupabaseBrowser()

    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUserId(user?.id ?? null)

      const { data } = await supabase
        .from('user_reviews')
        .select('id, rating, title, body, pros, cons, created_at, user_id, is_editorial, editorial_author, is_external, source_platform, source_url, review_count_ext, retrieved_at')
        .eq('provider_id', providerId)
        .eq('status', 'approved')
        .is('deleted_at', null)
        .order('is_editorial', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(30)

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
  const externalReviews  = reviews.filter(r => !r.is_editorial && r.is_external)
  const userReviews      = reviews.filter(r => !r.is_editorial && !r.is_external)

  if (loading) {
    return <p className="text-sm" style={{ color: '#666666' }}>Lade Reviews…</p>
  }

  function Divider({ label }: { label: string }) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex-1 border-t" style={{ borderColor: '#e0ddd8' }} />
        <span className="text-xs" style={{ color: '#999999' }}>{label}</span>
        <div className="flex-1 border-t" style={{ borderColor: '#e0ddd8' }} />
      </div>
    )
  }

  function ReviewCard({ review }: { review: Review }) {
    const isEditorial = review.is_editorial
    const isExternal  = review.is_external

    return (
      <div
        className="rounded-xl border p-5"
        style={{
          background: isEditorial ? '#f7f6f3' : '#ffffff',
          borderColor: isEditorial ? '#c0bdb8' : '#e0ddd8',
        }}
      >
        <div className="flex items-start justify-between gap-4 mb-3">
          <div>
            {/* Badge */}
            {isEditorial && (
              <span
                className="inline-block text-xs font-medium px-2 py-0.5 rounded mb-2"
                style={{ background: '#1a1a1a', color: '#ffffff', fontSize: '10px', letterSpacing: '0.05em' }}
              >
                Redaktionelle Einschätzung
              </span>
            )}
            {isExternal && review.source_platform && (
              <span
                className="inline-block text-xs font-medium px-2 py-0.5 rounded mb-2"
                style={{ background: '#f0ede8', color: '#666666', fontSize: '10px', letterSpacing: '0.05em', border: '1px solid #e0ddd8' }}
              >
                {review.source_platform}
                {review.review_count_ext ? ` · ${review.review_count_ext.toLocaleString('de-DE')} Bewertungen` : ''}
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
              {isEditorial && (
                <p className="text-xs" style={{ color: '#999999' }}>
                  {review.editorial_author ?? 'Redaktion'}
                </p>
              )}
              {isExternal && review.retrieved_at && (
                <p className="text-xs" style={{ color: '#999999' }}>
                  Stand: {new Date(review.retrieved_at).toLocaleDateString('de-DE', { month: '2-digit', year: 'numeric' })}
                </p>
              )}
              {!isEditorial && !isExternal && (
                <>
                  <p className="text-xs" style={{ color: '#999999' }}>
                    {new Date(review.created_at).toLocaleDateString('de-DE')}
                  </p>
                  {currentUserId && currentUserId === review.user_id && (
                    <button
                      onClick={() => deleteReview(review.id)}
                      className="text-xs hover:opacity-50 transition-opacity mt-0.5"
                      style={{ color: '#999999' }}
                      title="Mein Review löschen"
                    >
                      Löschen
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        <p className="text-sm leading-relaxed mb-3" style={{ color: '#444444' }}>
          {review.body}
        </p>

        {/* Pros/Cons nur bei redaktionellen und Nutzer-Reviews */}
        {!isExternal && (review.pros?.length > 0 || review.cons?.length > 0) && (
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

        {/* Quellenlink bei externen Reviews */}
        {isExternal && review.source_url && (
          <div className="mt-3 pt-3 border-t" style={{ borderColor: '#e0ddd8' }}>
            <a
              href={review.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs hover:opacity-70 transition-opacity"
              style={{ color: '#999999', textDecoration: 'none' }}
            >
              Quelle: {review.source_platform} →
            </a>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">

      {/* Redaktionelle Einschätzungen */}
      {editorialReviews.length > 0 && (
        <div className="space-y-3">
          {editorialReviews.map(review => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      )}

      {/* "Was andere sagen" – externe Quellen */}
      {externalReviews.length > 0 && (
        <>
          {editorialReviews.length > 0 && <Divider label="Was andere sagen" />}
          <div className="space-y-3">
            {externalReviews.map(review => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>
        </>
      )}

      {/* Divider vor Nutzer-Reviews */}
      {(editorialReviews.length > 0 || externalReviews.length > 0) && userReviews.length > 0 && (
        <Divider label="Erfahrungen unserer Nutzer" />
      )}

      {/* Nutzer-Reviews */}
      {userReviews.length > 0 && (
        <div className="space-y-3">
          {userReviews.map(review => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      )}

      {/* Empty State */}
      {userReviews.length === 0 && (
        <div
          className="rounded-xl border p-5 text-center"
          style={{ background: '#fafaf8', borderColor: '#e0ddd8', borderStyle: 'dashed' }}
        >
          <p className="text-sm font-medium mb-1" style={{ color: '#1a1a1a' }}>
            Noch keine Erfahrungsberichte
          </p>
          <p className="text-xs mb-4" style={{ color: '#999999' }}>
            Schreib als Erstes eine Bewertung und hilf anderen Bitcoin-Nutzern.
          </p>
          {isLoggedIn && onWriteReview ? (
            <button
              onClick={onWriteReview}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all hover:opacity-80"
              style={{ background: '#1a1a1a', color: '#ffffff', border: 'none', cursor: 'pointer' }}
            >
              Erfahrung teilen →
            </button>
          ) : (
            <a
              href="/account/login"
              className="px-4 py-2 rounded-lg text-sm font-medium inline-block transition-all hover:opacity-80"
              style={{ background: '#1a1a1a', color: '#ffffff', textDecoration: 'none' }}
            >
              Anmelden und bewerten →
            </a>
          )}
        </div>
      )}

    </div>
  )
}
