import Link from 'next/link'
import NavAuth from './NavAuth'

interface Props {
  activePath?: string
}

export default function SiteHeader({ activePath }: Props) {
  const navLinks = [
    { href: '/vergleich/boersen', label: 'Börsen' },
    { href: '/vergleich/hardware-wallets', label: 'Hardware Wallets' },
    { href: '/ratgeber', label: 'Ratgeber' },
  ]

  return (
    <header className="relative z-10 flex items-center justify-between px-6 md:px-12 py-6 border-b"
      style={{ borderColor: 'var(--border)' }}>
      <div className="flex items-center gap-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded flex items-center justify-center font-bold text-sm"
            style={{ background: 'var(--accent)', color: '#0a0a0a' }}>₿</div>
          <span className="font-bold text-sm tracking-widest uppercase hidden sm:block"
            style={{ letterSpacing: '0.15em' }}>
            Bitcoin Navigator
          </span>
        </Link>
        <nav className="hidden md:flex items-center gap-5 text-sm">
          {navLinks.map(link => (
            <Link key={link.href} href={link.href}
              className="transition-colors hover:text-white"
              style={{ color: activePath === link.href ? 'var(--accent)' : 'var(--text-secondary)' }}>
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
      <NavAuth />
    </header>
  )
}
