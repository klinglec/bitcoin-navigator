'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import SiteHeader from '@/components/SiteHeader'
import {
  loadCart,
  removeFromCart,
  clearCart,
  computeTotals,
  CATEGORY_LABELS,
  CART_CATEGORIES,
  type SetupCart,
  type CartTotals,
  type CartCategory,
} from '@/lib/setupCart'

function PromoCodeCopy({ code, benefit }: { code: string; benefit: string | null }) {
  const [copied, setCopied] = useState(false)
  function copy() {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }
  return (
    <div className="flex items-center gap-2 mt-2">
      <span
        className="font-mono text-xs px-2 py-1 rounded"
        style={{ background: 'var(--surface-alt)', color: 'var(--text-primary)', border: '1px dashed var(--border)', letterSpacing: '0.08em' }}
      >
        {code}
      </span>
      <button
        onClick={copy}
        className="text-xs px-2 py-1 rounded border transition-all"
        style={{
          borderColor: copied ? '#16a34a' : 'var(--border)',
          color:       copied ? '#16a34a' : 'var(--text-secondary)',
          background:  'var(--surface)',
        }}
      >
        {copied ? '✓ Kopiert' : 'Kopieren'}
      </button>
      {benefit && (
        <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{benefit}</span>
      )}
    </div>
  )
}

const CATEGORY_HREFS: Record<CartCategory, string> = {
  'hardware-wallets': '/vergleich/hardware-wallets',
  'seed-backup':      '/vergleich/seed-backup',
  'boersen':          '/vergleich/boersen',
}

function CartCompletionBanner({ cart }: { cart: SetupCart }) {
  const allDone = CART_CATEGORIES.every(cat => cart.items.some(i => i.category === cat))
  const addedCount = cart.items.length

  return (
    <div
      className="rounded-xl border p-4 mb-6"
      style={{
        background: allDone ? '#f0fdf4' : '#fffbeb',
        borderColor: allDone ? '#bbf7d0' : '#fde68a',
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold" style={{ color: allDone ? '#15803d' : '#92400e' }}>
          {allDone
            ? '✓ Alle empfohlenen Produkte im Warenkorb'
            : `Empfehlungen aus deinem Setup — ${addedCount} von ${CART_CATEGORIES.length} vollständig`}
        </p>
      </div>
      <div className="flex flex-col gap-1.5">
        {CART_CATEGORIES.map(cat => {
          const item = cart.items.find(i => i.category === cat)
          return (
            <div key={cat} className="flex items-center justify-between text-xs">
              <span style={{ color: 'var(--text-secondary)' }}>{CATEGORY_LABELS[cat]}</span>
              {item ? (
                <span className="font-medium" style={{ color: '#16a34a' }}>✓ {item.productName}</span>
              ) : (
                <Link
                  href={CATEGORY_HREFS[cat] + '?from=setup'}
                  className="font-medium hover:underline"
                  style={{ color: '#b45309' }}
                >
                  Noch ausstehend →
                </Link>
              )}
            </div>
          )
        })}
      </div>
      {allDone && (
        <p className="text-xs mt-3" style={{ color: '#15803d' }}>
          Bereit zum Kalkulieren — nutze den Freedom-Rechner um die Kosten in deinen Plan einzurechnen.
        </p>
      )}
    </div>
  )
}

function fmtEur(v: number, decimals = 0) {
  return v.toLocaleString('de-DE', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) + ' €'
}

export default function WarenkorbPage() {
  const [cart, setCart] = useState<SetupCart | null>(null)
  const [totals, setTotals] = useState<CartTotals | null>(null)

  useEffect(() => {
    const c = loadCart()
    setCart(c)
    setTotals(computeTotals(c))
  }, [])

  function handleRemove(category: Parameters<typeof removeFromCart>[0]) {
    const updated = removeFromCart(category)
    setCart(updated)
    setTotals(computeTotals(updated))
  }

  function handleClearCart() {
    if (!confirm('Warenkorb wirklich leeren?')) return
    const empty = clearCart()
    setCart(empty)
    setTotals(computeTotals(empty))
  }

  if (!cart) return null  // SSR guard

  const isEmpty = cart.items.length === 0

  // URL-Params für den Rechner
  const rechnerParams = new URLSearchParams()
  if (totals && totals.totalOneTime > 0)     rechnerParams.set('setup_cost_onetime', totals.totalOneTime.toFixed(2))
  if (totals && totals.monthlyFeeEur !== null && totals.monthlyFeeEur > 0)
    rechnerParams.set('setup_cost_monthly', totals.monthlyFeeEur.toFixed(2))
  const rechnerUrl = `/rechner/freedom-boost${rechnerParams.toString() ? '?' + rechnerParams.toString() : ''}`

  return (
    <div className="relative min-h-screen" style={{ background: 'var(--bg)' }}>
      <SiteHeader activePath="/setup" />

      <main className="px-6 md:px-12 py-12 max-w-3xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <p className="text-xs tracking-widest uppercase mb-1 font-medium" style={{ color: 'var(--text-tertiary)' }}>
            Mein Setup
          </p>
          <div className="flex items-baseline justify-between gap-3">
            <div className="flex items-baseline gap-3">
              <h1 className="text-3xl md:text-4xl font-bold" style={{ letterSpacing: '-0.03em' }}>
                Warenkorb
              </h1>
              {!isEmpty && (
                <span className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                  {cart.items.length} Produkt{cart.items.length !== 1 ? 'e' : ''}
                </span>
              )}
            </div>
            {!isEmpty && (
              <button
                onClick={handleClearCart}
                className="text-xs transition-all hover:opacity-70"
                style={{ color: 'var(--text-tertiary)', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                Warenkorb leeren
              </button>
            )}
          </div>
          <Link href="/setup" className="text-xs mt-1 inline-block" style={{ color: 'var(--text-tertiary)', textDecoration: 'underline' }}>
            ← Zurück zum Setup
          </Link>
        </div>

        {isEmpty ? (
          /* ── Leerer Warenkorb ── */
          <div
            className="rounded-xl border px-8 py-16 text-center"
            style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
          >
            <p className="text-2xl mb-3">🛒</p>
            <p className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Dein Warenkorb ist leer</p>
            <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
              Füge Produkte aus dem Vergleich hinzu und rechne die Kosten in deinen Plan ein.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              {[
                { href: '/vergleich/hardware-wallets', label: 'Hardware Wallets' },
                { href: '/vergleich/seed-backup',      label: 'Seed-Backup' },
                { href: '/vergleich/boersen',          label: 'Börsen' },
              ].map(l => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="text-sm px-4 py-2 rounded-lg border transition-all hover:border-gray-400"
                  style={{ borderColor: 'var(--border)', color: 'var(--text-primary)', background: 'var(--surface)' }}
                >
                  {l.label} →
                </Link>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-6">

            {/* ── Vollständigkeits-Check ── */}
            <CartCompletionBanner cart={cart} />

            {/* ── Produktliste ── */}
            <div className="flex flex-col gap-3">
              {cart.items.map(item => (
                <div
                  key={item.category}
                  className="rounded-xl border p-5"
                  style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      {/* Kategorie-Label */}
                      <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-tertiary)' }}>
                        {CATEGORY_LABELS[item.category]}
                      </p>
                      {/* Produktname */}
                      <Link
                        href={item.productPageUrl}
                        className="font-bold text-base hover:underline"
                        style={{ color: 'var(--text-primary)', letterSpacing: '-0.01em' }}
                      >
                        {item.productName}
                      </Link>

                      {/* Kosten */}
                      <div className="flex flex-wrap gap-4 mt-2">
                        {item.oneTimeCost !== null && (
                          <div>
                            <p className="text-xs mb-0.5" style={{ color: 'var(--text-tertiary)' }}>Einmalkosten</p>
                            <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                              {fmtEur(item.oneTimeCost)}
                            </p>
                          </div>
                        )}
                        {item.feePercent !== null && (
                          <div>
                            <p className="text-xs mb-0.5" style={{ color: 'var(--text-tertiary)' }}>Gebühr</p>
                            <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                              {item.feePercent.toFixed(2).replace('.', ',')} % der Sparrate
                              {cart.sparrate !== null && (
                                <span className="font-normal ml-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
                                  ≈ {fmtEur((item.feePercent * cart.sparrate) / 100, 2)}/Mo.
                                </span>
                              )}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Promo Code */}
                      {item.promoCode && (
                        <PromoCodeCopy code={item.promoCode} benefit={item.promoCodeBenefit} />
                      )}
                    </div>

                    {/* Rechte Seite: Affiliate-Link + Entfernen */}
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      {item.affiliateUrl && (
                        <a
                          href={item.affiliateUrl}
                          target="_blank"
                          rel="noopener noreferrer sponsored"
                          className="text-xs font-medium px-3 py-1.5 rounded-lg transition-all hover:opacity-80"
                          style={{ background: '#1a1a1a', color: '#fff' }}
                        >
                          Zum Anbieter →
                        </a>
                      )}
                      <button
                        onClick={() => handleRemove(item.category)}
                        className="text-xs"
                        style={{ color: 'var(--text-tertiary)', background: 'none', border: 'none', cursor: 'pointer' }}
                      >
                        Entfernen
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* ── Gesamtkosten ── */}
            {totals && (
              <div
                className="rounded-xl border p-5"
                style={{ background: 'var(--surface-alt)', borderColor: '#1a1a1a' }}
              >
                <p className="font-semibold text-sm mb-4" style={{ color: 'var(--text-primary)' }}>
                  Gesamtkosten
                </p>
                <div className="flex flex-col gap-2">
                  {totals.totalOneTime > 0 && (
                    <div className="flex justify-between items-baseline">
                      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Einmalkosten (Monat 1)</p>
                      <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{fmtEur(totals.totalOneTime)}</p>
                    </div>
                  )}
                  {totals.totalFeePercent > 0 && (
                    <div className="flex justify-between items-baseline">
                      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        Gebühren
                        {cart.sparrate !== null
                          ? ` (${totals.totalFeePercent.toFixed(2).replace('.', ',')} % von ${fmtEur(cart.sparrate)}/Mo.)`
                          : ` (${totals.totalFeePercent.toFixed(2).replace('.', ',')} % der Sparrate)`}
                      </p>
                      <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                        {totals.monthlyFeeEur !== null
                          ? `≈ ${fmtEur(totals.monthlyFeeEur, 2)}/Mo.`
                          : `${totals.totalFeePercent.toFixed(2).replace('.', ',')} %`}
                      </p>
                    </div>
                  )}
                  {cart.sparrate !== null && totals.monthlyFeeEur !== null && totals.totalOneTime > 0 && (
                    <div
                      className="mt-2 pt-2 flex justify-between items-baseline border-t"
                      style={{ borderColor: 'var(--border)' }}
                    >
                      <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Effektive Sparrate</p>
                      <p className="font-bold" style={{ color: 'var(--text-primary)' }}>
                        {fmtEur(cart.sparrate - totals.monthlyFeeEur, 2)}/Mo.
                        <span className="font-normal text-xs ml-1" style={{ color: 'var(--text-tertiary)' }}>
                          statt {fmtEur(cart.sparrate, 0)}/Mo.
                        </span>
                      </p>
                    </div>
                  )}
                </div>

                {/* CTA zum Freedom-Rechner */}
                <div className="mt-5 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
                  <Link
                    href={rechnerUrl}
                    className="flex items-center justify-between w-full px-4 py-3 rounded-lg font-semibold text-sm transition-all hover:opacity-80"
                    style={{ background: '#1a1a1a', color: '#fff' }}
                  >
                    <span>Im Freedom-Rechner kalkulieren</span>
                    <span>→</span>
                  </Link>
                  <p className="text-xs mt-2" style={{ color: 'var(--text-tertiary)' }}>
                    Einmalkosten als Sonderausgabe in Monat 1 · Gebühren reduzieren effektive Sparrate
                  </p>
                </div>
              </div>
            )}

            {/* Weiter einkaufen */}
            <div className="flex flex-wrap gap-3 pt-2">
              <p className="text-xs w-full" style={{ color: 'var(--text-tertiary)' }}>Weiteres Produkt hinzufügen:</p>
              {[
                { href: '/vergleich/hardware-wallets', label: 'Hardware Wallets', disabled: cart.items.some(i => i.category === 'hardware-wallets') },
                { href: '/vergleich/seed-backup',      label: 'Seed-Backup',      disabled: cart.items.some(i => i.category === 'seed-backup') },
                { href: '/vergleich/boersen',          label: 'Börse',            disabled: cart.items.some(i => i.category === 'boersen') },
              ].filter(l => !l.disabled).map(l => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="text-xs px-3 py-1.5 rounded-lg border transition-all hover:border-gray-400"
                  style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
                >
                  + {l.label}
                </Link>
              ))}
            </div>

          </div>
        )}
      </main>
    </div>
  )
}
