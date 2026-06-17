'use client'

import Link from 'next/link'
import { useState, useRef } from 'react'
import NavAuth from './NavAuth'

interface Props {
  activePath?: string
}

const productLinks = [
  { href: '/vergleich/boersen', label: 'Börsen' },
  { href: '/vergleich/hardware-wallets', label: 'Hardware Wallets' },
  { href: '/vergleich/seed-backup', label: 'Seed-Backup' },
  { href: '/vergleich/btc-kredite', label: 'BTC-Kredite' },
  { href: '/vergleich/zahlungsdienste', label: 'Zahlungsdienste' },
]

const topLinks = [
  { href: '/setup', label: 'Mein Setup' },
  { href: '/rechner', label: 'Rechner' },
  { href: '/aktionen', label: 'Aktionen' },
  { href: '/ratgeber', label: 'Ratgeber' },
]

export default function SiteHeader({ activePath }: Props) {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const isProductActive = productLinks.some(l => activePath === l.href)

  const handleMouseEnter = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    setDropdownOpen(true)
  }

  const handleMouseLeave = () => {
    closeTimer.current = setTimeout(() => setDropdownOpen(false), 150)
  }

  return (
    <header
      className="relative z-50 flex items-center justify-between px-6 md:px-12 py-5 border-b"
      style={{ background: '#ffffff', borderBottom: '1.5px solid #1a1a1a' }}
    >
      <div className="flex items-center gap-8">
        <Link href="/" className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded flex items-center justify-center font-bold text-sm"
            style={{ background: 'var(--accent)', color: '#1a1a1a' }}
          >
            ₿
          </div>
          <span
            className="font-bold text-sm hidden sm:block"
            style={{ color: '#1a1a1a', letterSpacing: '-0.01em' }}
          >
            Bitcoin Navigator
          </span>
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-sm">
          {/* Dropdown: BTC-Produkte vergleichen */}
          <div
            className="relative"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <button
              className="flex items-center gap-1 transition-colors"
              style={{
                color: isProductActive ? '#1a1a1a' : '#666666',
                fontWeight: isProductActive ? 500 : 400,
                borderBottom: isProductActive ? '1.5px solid #1a1a1a' : '1.5px solid transparent',
                paddingBottom: '2px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: 'inherit',
                padding: '0 0 2px 0',
              }}
            >
              BTC-Produkte vergleichen
              <svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
                style={{ marginLeft: 2, transition: 'transform 0.15s', transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
              >
                <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            {dropdownOpen && (
              <div
                className="absolute top-full left-0 mt-2 py-1 rounded-lg shadow-lg"
                style={{
                  background: '#ffffff',
                  border: '1.5px solid #1a1a1a',
                  minWidth: '180px',
                  zIndex: 9999,
                }}
              >
                {productLinks.map(link => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="block px-4 py-2 transition-colors"
                    style={{
                      color: activePath === link.href ? '#1a1a1a' : '#666666',
                      fontWeight: activePath === link.href ? 500 : 400,
                      fontSize: '0.875rem',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#1a1a1a')}
                    onMouseLeave={e => (e.currentTarget.style.color = activePath === link.href ? '#1a1a1a' : '#666666')}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Reguläre Links */}
          {topLinks.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className="transition-colors"
              style={{
                color: activePath === link.href ? '#1a1a1a' : '#666666',
                fontWeight: activePath === link.href ? 500 : 400,
                borderBottom: activePath === link.href ? '1.5px solid #1a1a1a' : '1.5px solid transparent',
                paddingBottom: '2px',
              }}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
      <NavAuth />
    </header>
  )
}
