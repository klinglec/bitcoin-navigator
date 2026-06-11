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
              className="px-5 py-2 rounded-xl text-sm font-bold border transition-all hover:opacity-70"
              style={{ background: '#ffffff', borderColor: '#e0ddd8', color: '#1a1a1a' }}
            >
              {showForm ? 'Abbrechen' : '+ Review schreiben'}
            </button>
          ) : (
            <Link href="/account/login"
              className="px-5 py-2 rounded-xl text-sm font-bold border transition-all hover:opacity-70"
              style={{ background: '#ffffff', borderColor: '#e0ddd8', color: '#1a1a1a' }}>
              Anmelden zum Bewerten
            </Link>
          )
        )}
      </div>

      {showForm && user && (
        <div className="mb-8">
          <ReviewForm
            providerId={providerId}
            categoryId={categoryId}
            providerName={providerName}
          />
        </div>
      )}

      <ReviewList providerId={providerId} />
    </section>
  )
}
