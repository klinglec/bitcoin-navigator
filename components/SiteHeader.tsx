import Link from 'next/link'
import NavAuth from './NavAuth'

interface Props {
  activePath?: string
}

export default function SiteHeader({ activePath }: Props) {
  const navLinks = [
    { href: '/vergleich/boersen', label: 'Börsen' },
    { href: '/vergleich/hardware-wallets', label: 'Hardware Wallets' },
    { href: '/vergleich/seed-backup', label: 'Seed-Backup' },
    { href: '/vergleich/btc-kredite', label: 'BTC-Kredite' },
    { href: '/aktionen', label: 'Aktionen' },
    { href: '/ratgeber', label: 'Ratgeber' },
  ]

  return (
    <header
      className="relative z-10 flex items-center justify-between px-6 md:px-12 py-5 border-b"
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
          {navLinks.map(link => (
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
