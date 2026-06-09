'use client'

import { useState } from 'react'

export default function PromoCodeButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false)

  function copy() {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <button
      onClick={copy}
      title="Code kopieren"
      className="font-mono text-sm px-3 py-1.5 rounded border transition-all hover:opacity-80 active:scale-95"
      style={{
        background: 'var(--accent-dim)',
        borderColor: 'var(--accent)',
        color: 'var(--accent)',
        letterSpacing: '0.1em',
      }}
    >
      {copied ? '✓ Kopiert!' : `${code} ⎘`}
    </button>
  )
}
