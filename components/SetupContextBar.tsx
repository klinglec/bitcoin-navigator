'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { loadCart, type CartCategory, type SetupCart } from '@/lib/setupCart'

const STEPS: { category: CartCategory; label: string; href: string }[] = [
  { category: 'hardware-wallets', label: 'Hardware Wallet', href: '/vergleich/hardware-wallets' },
  { category: 'seed-backup',      label: 'Seed-Backup',     href: '/vergleich/seed-backup' },
  { category: 'boersen',          label: 'Börse',           href: '/vergleich/boersen' },
]

function SetupContextBarInner({ categorySlug }: { categorySlug: string }) {
  const searchParams = useSearchParams()
  const fromSetup = searchParams.get('from') === 'setup'
  const [cart, setCart] = useState<SetupCart | null>(null)

  useEffect(() => {
    setCart(loadCart())
    const onCartUpdate = (e: Event) => setCart((e as CustomEvent<SetupCart>).detail)
    window.addEventListener('btcnav:cart', onCartUpdate)
    return () => window.removeEventListener('btcnav:cart', onCartUpdate)
  }, [])

  const cartCount = cart?.items.length ?? 0
  if (!fromSetup && cartCount === 0) return null

  return (
    <div
      className="flex flex-wrap items-center gap-x-3 gap-y-1.5 px-4 py-2.5 rounded-xl mb-6 text-xs"
      style={{ background: '#1a1a1a', color: '#fff' }}
    >
      <Link href="/setup" style={{ color: '#888' }}>
        ← Mein Setup
      </Link>
      <span style={{ color: '#333' }}>|</span>

      {STEPS.map((step, i) => {
        const inCart = cart?.items.some(item => item.category === step.category) ?? false
        const isActive = step.category === categorySlug
        return (
          <span key={step.category} className="flex items-center gap-2">
            {i > 0 && <span style={{ color: '#444' }}>›</span>}
            <Link
              href={step.href + '?from=setup'}
              style={{
                color: inCart ? '#22c55e' : isActive ? '#fff' : '#666',
                fontWeight: isActive || inCart ? 600 : 400,
              }}
            >
              {inCart ? '✓ ' : ''}{step.label}
            </Link>
          </span>
        )
      })}

      <Link
        href="/setup/warenkorb"
        className="ml-auto font-bold px-3 py-1 rounded-md"
        style={{ background: '#f59e0b', color: '#1a1a1a' }}
      >
        Warenkorb{cartCount > 0 ? ` (${cartCount})` : ''} →
      </Link>
    </div>
  )
}

export default function SetupContextBar({ categorySlug }: { categorySlug: string }) {
  return (
    <Suspense fallback={null}>
      <SetupContextBarInner categorySlug={categorySlug} />
    </Suspense>
  )
}
