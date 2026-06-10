'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { getSupabaseBrowser } from '@/lib/supabase-browser'

export default function NavAuth() {
  const [email, setEmail] = useState<string | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const supabase = getSupabaseBrowser()

    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null)
      setLoaded(true)
    })

    // Auth-Status live aktualisieren (Login/Logout in anderem Tab)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setEmail(session?.user?.email ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  async function logout() {
    const supabase = getSupabaseBrowser()
    await supabase.auth.signOut()
    setEmail(null)
    setMenuOpen(false)
    router.refresh()
  }

  if (!loaded) return null

  if (!email) {
    return (
      <Link href="/account/login"
        className="font-mono text-xs px-3 py-1.5 rounded-full border transition-all hover:border-orange-500"
        style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
        Anmelden
      </Link>
    )
  }

  return (
    <div className="relative">
      <button
        onClick={() => setMenuOpen(v => !v)}
        className="font-mono text-xs px-3 py-1.5 rounded-full border transition-all"
        style={{ borderColor: 'var(--accent)', color: 'var(--accent)', background: 'var(--accent-dim)' }}
      >
        ◈ Konto
      </button>

      {menuOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />

          {/* Dropdown */}
          <div className="absolute right-0 top-10 z-20 w-52 rounded-xl border shadow-lg py-1"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <div className="px-4 py-2 border-b" style={{ borderColor: 'var(--border)' }}>
              <p className="font-mono text-xs truncate" style={{ color: 'var(--text-secondary)' }}>
                {email}
              </p>
            </div>
            <Link href="/account"
              onClick={() => setMenuOpen(false)}
              className="block px-4 py-2.5 text-sm hover:text-white transition-colors"
              style={{ color: 'var(--text-secondary)' }}>
              Mein Konto & Reviews
            </Link>
            <button
              onClick={logout}
              className="w-full text-left px-4 py-2.5 text-sm hover:text-white transition-colors"
              style={{ color: 'var(--text-secondary)' }}>
              Abmelden
            </button>
          </div>
        </>
      )}
    </div>
  )
}
