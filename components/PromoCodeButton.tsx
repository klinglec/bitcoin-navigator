'use client'

import { useState } from 'react'

interface Props {
  code: string
  benefit?: string | null
}

export default function PromoCodeButton({ code, benefit }: Props) {
  const [copied, setCopied] = useState(false)
  const [tooltip, setTooltip] = useState(false)

  function copy() {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="relative inline-block">
      <button
        onClick={copy}
        onMouseEnter={() => benefit && setTooltip(true)}
        onMouseLeave={() => setTooltip(false)}
        title={benefit ?? 'Code kopieren'}
        className="font-mono text-sm px-3 py-1.5 rounded border transition-all hover:opacity-80 active:scale-95"
        style={{
          background: 'rgba(247,147,26,0.10)',
          borderColor: '#F7931A',
          color: '#F7931A',
          letterSpacing: '0.1em',
        }}
      >
        {copied ? '✓ Kopiert!' : `${code} ⎘`}
      </button>

      {tooltip && benefit && (
        <div
          style={{
            position: 'absolute',
            bottom: 'calc(100% + 8px)',
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#1a1a1a',
            color: '#ffffff',
            borderRadius: '8px',
            padding: '10px 14px',
            fontSize: '12px',
            lineHeight: '1.5',
            width: '240px',
            zIndex: 9999,
            boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
            pointerEvents: 'none',
          }}
        >
          <p style={{ color: '#F7931A', fontSize: '10px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '4px' }}>
            Dein Vorteil
          </p>
          {benefit}
          <div style={{
            position: 'absolute',
            bottom: '-5px',
            left: '50%',
            transform: 'translateX(-50%) rotate(45deg)',
            width: '10px',
            height: '10px',
            background: '#1a1a1a',
          }} />
        </div>
      )}
    </div>
  )
}
