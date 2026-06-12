import { getPromoCodes, countryFlag } from '@/lib/promotions'
import SiteHeader from '@/components/SiteHeader'
import Link from 'next/link'
import type { Metadata } from 'next'
import PromoCard from '@/components/PromoCard'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Bitcoin Aktionen & Promo-Codes 2026 – Rabatte & Boni | Bitcoin Navigator',
  description: 'Aktuelle Promo-Codes und Aktionen für Bitcoin-Börsen im DACH-Raum. Spare bei deinem ersten Bitcoin-Kauf mit exklusiven Rabatten von Coinfinity, 21bitcoin und mehr.',
  alternates: { canonical: 'https://bitcoinnavigator.de/aktionen' },
  openGraph: {
    title: 'Bitcoin Aktionen & Promo-Codes 2026 | Bitcoin Navigator',
    description: 'Aktuelle Promo-Codes für Bitcoin-Börsen in Deutschland, Österreich & Schweiz.',
    url: 'https://bitcoinnavigator.de/aktionen',
  },
}

export default async function AktionenPage() {
  const promoCodes = await getPromoCodes()

  return (
    <div className="min-h-screen" style={{ background: '#f7f6f3' }}>
      <SiteHeader activePath="/aktionen" />

      <main className="px-6 md:px-12 py-12 max-w-3xl">
        <p className="text-xs font-medium tracking-widest uppercase mb-2" style={{ color: '#999999' }}>
          Aktionen
        </p>
        <h1 className="text-3xl md:text-4xl font-bold mb-3" style={{ letterSpacing: '-0.03em' }}>
          Bitcoin Promo-Codes & Aktionen
        </h1>
        <p className="text-base mb-10" style={{ color: '#666666', maxWidth: '560px', lineHeight: '1.6' }}>
          Spare bei deinem ersten Bitcoin-Kauf. Alle Codes sind von Bitcoin Navigator geprüft
          und aktuell gültig.
        </p>

        {promoCodes.length === 0 ? (
          <p style={{ color: '#999999' }}>Aktuell keine Aktionen verfügbar.</p>
        ) : (
          <div className="flex flex-col gap-4">
            {promoCodes.map(promo => (
              <PromoCard
                key={promo.provider_slug}
                promo={promo}
                flag={countryFlag(promo.provider_country)}
              />
            ))}
          </div>
        )}

        <p className="mt-10 text-xs" style={{ color: '#999999', lineHeight: '1.6' }}>
          Affiliate-Hinweis: Links zu Anbieter-Websites können Affiliate-Links sein.
          Bitcoin Navigator erhält ggf. eine Provision bei Registrierung über diese Links.
          Die Promo-Codes und Bewertungen sind davon unabhängig.
        </p>
      </main>

      <footer className="px-6 md:px-12 py-8 border-t mt-8 text-xs" style={{ borderColor: '#e0ddd8', color: '#999999' }}>
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <span>© 2026 Bitcoin Navigator</span>
          <div className="flex gap-4">
            <Link href="/impressum" className="hover:opacity-70">Impressum</Link>
            <Link href="/datenschutz" className="hover:opacity-70">Datenschutz</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
