'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { getSupabaseBrowser } from '@/lib/supabase-browser'

interface AuthState {
  display: string
  isNostr: boolean
}

interface DropdownPos {
  top: number
  right: number
}

export default function NavAuth() {
  const [auth, setAuth] = useState<AuthState | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [dropdownPos, setDropdownPos] = useState<DropdownPos>({ top: 0, right: 0 })
  const buttonRef = useRef<HTMLButtonElement>(null)
  const router = useRouter()

  function resolveDisplay(email: string | undefined): AuthState {
    if (!email) return { display: '', isNostr: false }
    const npub = typeof window !== 'undefined' ? localStorage.getItem('bn_nostr_npub') : null
    if (npub || email.includes('@internal.bitcoinnavigator.de')) {
      return { display: npub ?? '⚡ Nostr', isNostr: true }
    }
    return { display: email, isNostr: false }
  }

  useEffect(() => {
    const supabase = getSupabaseBrowser()
    supabase.auth.getUser().then(({ data }) => {
      setAuth(data.user ? resolveDisplay(data.user.email) : null)
      setLoaded(true)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setAuth(session?.user ? resolveDisplay(session.user.email) : null)
    })
    return () => subscription.unsubscribe()
  }, [])

  const openMenu = useCallback(() => {
    if (!buttonRef.current) return
    const rect = buttonRef.current.getBoundingClientRect()
    setDropdownPos({
      top: rect.bottom + window.scrollY + 8,
      right: window.innerWidth - rect.right,
    })
    setMenuOpen(true)
  }, [])

  useEffect(() => {
    if (!menuOpen) return
    function handleClick() { setMenuOpen(false) }
    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [menuOpen])

  async function logout() {
    localStorage.removeItem('bn_nostr_npub')
    const supabase = getSupabaseBrowser()
    await supabase.auth.signOut()
    setAuth(null)
    setMenuOpen(false)
    router.push('/')
  }

  if (!loaded) return null

  if (!auth) {
    return (
      <Link
        href="/account/login"
        className="text-xs px-3 py-1.5 rounded-full border transition-all hover:opacity-70"
        style={{ borderColor: '#e0ddd8', color: '#666666', background: '#ffffff' }}
      >
        Anmelden
      </Link>
    )
  }

  const dropdown = menuOpen ? createPortal(
    <div
      onClick={e => e.stopPropagation()}
      style={{
        position: 'absolute',
        top: dropdownPos.top,
        right: dropdownPos.right,
        zIndex: 9999,
        width: '224px',
        background: '#ffffff',
        border: '0.5px solid #e0ddd8',
        borderRadius: '12px',
        boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
        padding: '4px 0',
      }}
    >
      <div style={{ padding: '8px 16px 8px', borderBottom: '0.5px solid #e0ddd8' }}>
        <p style={{ fontSize: '11px', color: '#999999', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {auth.display}
        </p>
        {auth.isNostr && (
          <p style={{ fontSize: '11px', color: '#F7931A', marginTop: '2px' }}>Nostr-Konto</p>
        )}
      </div>
      <Link
        href="/account"
        onClick={() => setMenuOpen(false)}
        style={{ display: 'block', padding: '10px 16px', fontSize: '14px', color: '#444444' }}
      >
        Mein Konto &amp; Reviews
      </Link>
      <button
        onClick={logout}
        style={{ display: 'block', width: '100%', textAlign: 'left', padding: '10px 16px', fontSize: '14px', color: '#444444', background: 'none', border: 'none', cursor: 'pointer' }}
      >
        Abmelden
      </button>
    </div>,
    document.body
  ) : null

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={e => { e.stopPropagation(); menuOpen ? setMenuOpen(false) : openMenu() }}
        className="text-xs px-3 py-1.5 rounded-full border transition-all hover:opacity-80 flex items-center gap-1.5"
        style={{
          borderColor: auth.isNostr ? '#F7931A' : '#e0ddd8',
          color: auth.isNostr ? '#F7931A' : '#1a1a1a',
          background: auth.isNostr ? 'rgba(247,147,26,0.08)' : '#ffffff',
        }}
      >
        {auth.isNostr ? '⚡' : '◈'} Konto
      </button>
      {dropdown}
    </div>
  )
}
