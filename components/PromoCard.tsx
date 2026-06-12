'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { PromoCode } from '@/lib/promotions'

interface Props {
  promo: PromoCode
  flag: string
}

export default function PromoCard({ promo, flag }: Props) {
  const [copied, setCopied] = useState(false)
  const [tooltipVisible, setTooltipVisible] = useState(false)

  function copyCode() {
    navigator.clipboard.writeText(promo.code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="rounded-xl border bg-white" style={{ borderColor: '#e0ddd8' }}>
      <div className="p-6">

        {/* Header: Provider + CTA */}
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <Link
              href={`/anbieter/${promo.provider_slug}`}
              className="font-bold text-lg hover:underline"
              style={{ color: '#1a1a1a', letterSpacing: '-0.02em' }}
            >
              {promo.provider_name}
            </Link>
            {promo.provider_country && (
              <p className="text-sm mt-0.5" style={{ color: '#999999' }}>
                {flag} {promo.provider_country}
              </p>
            )}
          </div>
          <a
            href={promo.provider_website}
            target="_blank"
            rel="noopener noreferrer sponsored"
            className="flex-shrink-0 px-4 py-2 rounded-lg text-sm font-bold transition-all hover:opacity-80"
            style={{ background: '#1a1a1a', color: '#ffffff' }}
          >
            Zur Website →
          </a>
        </div>

        {/* Promo-Code + Tooltip */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="relative">
            {/* Code-Button mit Hover-Tooltip */}
            <button
              onClick={copyCode}
              onMouseEnter={() => setTooltipVisible(true)}
              onMouseLeave={() => setTooltipVisible(false)}
              className="font-mono font-bold px-4 py-2.5 rounded-lg border transition-all hover:opacity-80 text-base tracking-wider"
              style={{
                background: 'rgba(247,147,26,0.08)',
                borderColor: '#F7931A',
                color: '#F7931A',
                letterSpacing: '0.12em',
              }}
            >
              {promo.code} {copied ? '✓' : '⎘'}
            </button>

            {/* Tooltip */}
            {tooltipVisible && promo.benefit && (
              <div
                className="absolute bottom-full left-0 mb-2 rounded-lg border text-sm px-4 py-3 z-10"
                style={{
                  background: '#1a1a1a',
                  color: '#ffffff',
                  borderColor: '#1a1a1a',
                  width: '280px',
                  lineHeight: '1.5',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
                }}
              >
                <p className="font-semibold mb-1" style={{ color: '#F7931A', fontSize: '11px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  Dein Vorteil
                </p>
                {promo.benefit}
                {/* Pfeil nach unten */}
                <div style={{
                  position: 'absolute',
                  bottom: '-6px',
                  left: '20px',
                  width: '12px',
                  height: '12px',
                  background: '#1a1a1a',
                  transform: 'rotate(45deg)',
                }} />
              </div>
            )}
          </div>

          <div>
            <p className="text-sm font-medium" style={{ color: '#1a1a1a' }}>
              {copied ? 'Kopiert!' : 'Code kopieren'}
            </p>
            {promo.benefit && (
              <p className="text-xs mt-0.5" style={{ color: '#999999' }}>
                Hover für Details
              </p>
            )}
          </div>
        </div>

        {/* Benefit immer sichtbar */}
        {promo.benefit && (
          <div
            className="mt-4 rounded-lg px-4 py-3 text-sm"
            style={{ background: '#eef7ee', color: '#2a6a2a', border: '0.5px solid #b3d9b3', lineHeight: '1.5' }}
          >
            <span className="font-semibold">Vorteil: </span>{promo.benefit}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-3 border-t flex items-center gap-2" style={{ borderColor: '#e0ddd8' }}>
        <Link
          href={`/anbieter/${promo.provider_slug}`}
          className="text-xs hover:underline"
          style={{ color: '#666666' }}
        >
          {promo.provider_name} – alle Kriterien & Bewertungen →
        </Link>
      </div>
    </div>
  )
}
