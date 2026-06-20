'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import {
  addToCart,
  removeFromCart,
  isInCart,
  getCartItem,
  loadCart,
  type CartItem,
  type CartCategory,
  type SetupCart,
} from '@/lib/setupCart'

interface NextCategory {
  label: string
  href: string
}

interface Props {
  item: CartItem
  /** Kompakte Darstellung für enge Layouts */
  compact?: boolean
  /** Nächste Setup-Kategorie — wenn gesetzt, wird nach dem Hinzufügen ein Hint angezeigt */
  nextCategory?: NextCategory
}

export default function AddToCartButton({ item, compact = false, nextCategory }: Props) {
  const [state, setState] = useState<'idle' | 'in-cart' | 'replace'>('idle')
  const [showHint, setShowHint] = useState(false)
  const [cartCount, setCartCount] = useState(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    // Initialen Zustand aus localStorage lesen
    const existing = getCartItem(item.category as CartCategory)
    if (!existing) {
      setState('idle')
    } else if (existing.productId === item.productId) {
      setState('in-cart')
    } else {
      setState('replace')
    }
    setCartCount(loadCart().items.length)

    // Echtzeit-Updates wenn andere Karten geändert werden
    const onCartUpdate = (e: Event) => {
      const cart = (e as CustomEvent<SetupCart>).detail
      setCartCount(cart.items.length)
      const ex = cart.items.find(i => i.category === item.category)
      if (!ex) setState('idle')
      else if (ex.productId === item.productId) setState('in-cart')
      else setState('replace')
    }
    window.addEventListener('btcnav:cart', onCartUpdate)
    return () => {
      window.removeEventListener('btcnav:cart', onCartUpdate)
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [item.productId, item.category])

  function handleClick() {
    if (state === 'in-cart') {
      removeFromCart(item.category as CartCategory)
      setState('idle')
      setShowHint(false)
      if (timerRef.current) clearTimeout(timerRef.current)
    } else {
      addToCart(item)
      setState('in-cart')
      setCartCount(prev => prev + (state === 'replace' ? 0 : 1))
      // Hint anzeigen
      setShowHint(true)
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => setShowHint(false), 6000)
    }
  }

  function dismissHint() {
    setShowHint(false)
    if (timerRef.current) clearTimeout(timerRef.current)
  }

  if (compact) {
    return (
      <button
        onClick={handleClick}
        title={
          state === 'in-cart' ? 'Aus Warenkorb entfernen'
          : state === 'replace' ? 'Anderen Anbieter ersetzen'
          : 'Zum Warenkorb hinzufügen'
        }
        className="flex items-center justify-center w-8 h-8 rounded-lg border transition-all text-xs"
        style={{
          borderColor: state === 'in-cart' ? '#1a1a1a' : '#e5e5e5',
          background:  state === 'in-cart' ? '#1a1a1a' : 'var(--surface)',
          color:       state === 'in-cart' ? '#fff' : state === 'replace' ? '#b45309' : 'var(--text-secondary)',
        }}
      >
        {state === 'in-cart' ? '✓' : state === 'replace' ? '↺' : '+'}
      </button>
    )
  }

  return (
    <div className="flex flex-col gap-0">
      <button
        onClick={handleClick}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all whitespace-nowrap"
        style={{
          borderColor: state === 'in-cart' ? '#1a1a1a'
                     : state === 'replace' ? '#f59e0b'
                     : '#e5e5e5',
          background:  state === 'in-cart' ? '#1a1a1a'
                     : state === 'replace' ? '#fffbeb'
                     : 'var(--surface)',
          color:       state === 'in-cart' ? '#fff'
                     : state === 'replace' ? '#b45309'
                     : 'var(--text-secondary)',
        }}
      >
        {state === 'in-cart' && <span>✓</span>}
        {state === 'in-cart'  ? 'Im Warenkorb'
         : state === 'replace' ? '↺ Ersetzen'
         : '+ Warenkorb'}
      </button>

      {/* ── Post-Add Hint ── */}
      {showHint && (
        <div
          className="mt-2 px-3 py-2.5 rounded-lg border text-xs"
          style={{ background: '#f0fdf4', borderColor: '#bbf7d0' }}
        >
          <p className="font-semibold mb-2" style={{ color: '#15803d' }}>
            ✓ {item.productName} hinzugefügt
          </p>
          <div className="flex flex-wrap gap-2">
            {nextCategory && (
              <Link
                href={nextCategory.href + '?from=setup'}
                onClick={dismissHint}
                className="px-3 py-1.5 rounded-lg font-semibold transition-all hover:opacity-80"
                style={{ background: '#1a1a1a', color: '#fff' }}
              >
                {nextCategory.label} →
              </Link>
            )}
            <Link
              href="/setup/warenkorb"
              onClick={dismissHint}
              className="px-3 py-1.5 rounded-lg font-medium border transition-all hover:border-gray-400"
              style={{ borderColor: '#e5e5e5', color: 'var(--text-primary)', background: '#fff' }}
            >
              Zum Warenkorb ({cartCount})
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
