'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getSupabaseBrowser } from '@/lib/supabase-browser'
import ReviewForm from './ReviewForm'
import ReviewList from './ReviewList'

interface Props {
  providerId: string
  categoryId: string
  providerName: string
}

export default function ReviewSection({ providerId, categoryId, providerName }: Props) {
  const [user, setUser] = useState<{ id: string; email_confirmed_at?: string } | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    const supabase = getSupabaseBrowser()
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user as typeof user)
      setLoaded(true)
    })
  }, [])

  function openForm() {
    setShowForm(true)
    // Kurz warten, dann zum Formular scrollen
    setTimeout(() => {
      document.getElementById('review-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 50)
  }

  return (
    <section className="mt-12 pt-8 border-t" style={{ borderColor: '#e0ddd8' }}>
      <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
        <h2 className="text-xl font-bold flex items-center gap-2">
          Einschätzungen & Erfahrungen
        </h2>

        {loaded && (
          user ? (
            <button
              onClick={() => setShowForm(v => !v)}
              className="px-5 py-2 rounded-xl text-sm font-bold transition-all hover:opacity-80"
              style={{ background: '#1a1a1a', color: '#ffffff', border: 'none', cursor: 'pointer' }}
            >
              {showForm ? '✕ Abbrechen' : '+ Erfahrung teilen'}
            </button>
          ) : (
            <Link href="/account/login"
              className="px-5 py-2 rounded-xl text-sm font-bold transition-all hover:opacity-80"
              style={{ background: '#1a1a1a', color: '#ffffff', textDecoration: 'none' }}>
              Anmelden & bewerten
            </Link>
          )
        )}
      </div>

      {showForm && user && (
        <div className="mb-8" id="review-form">
          <ReviewForm
            providerId={providerId}
            categoryId={categoryId}
            providerName={providerName}
          />
        </div>
      )}

      <ReviewList
        providerId={providerId}
        onWriteReview={user ? openForm : undefined}
        isLoggedIn={!!user}
      />
    </section>
  )
}
