import { getPromoCodes, getReferralLinks, countryFlag } from '@/lib/promotions'
import SiteHeader from '@/components/SiteHeader'
import Link from 'next/link'
import type { Metadata } from 'next'
import PromoCard from '@/components/PromoCard'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Bitcoin Aktionen & Promo-Codes 2026 – Rabatte & Boni | Bitcoin Navigator',
  description: 'Aktuelle Promo-Codes und Referral-Links für Bitcoin-Börsen und -Kredite im DACH-Raum. Spare bei deinem ersten Kauf oder Kredit.',
  alternates: { canonical: 'https://bitcoinnavigator.de/aktionen' },
  openGraph: {
    title: 'Bitcoin Aktionen & Promo-Codes 2026 | Bitcoin Navigator',
    description: 'Aktuelle Promo-Codes für Bitcoin-Börsen und Referral-Links für Bitcoin-Kredite im DACH-Raum.',
    url: 'https://bitcoinnavigator.de/aktionen',
  },
}

const CATEGORY_LABELS: Record<string, string> = {
  'btc-kredite': 'Bitcoin-Kredite',
  'boersen': 'Börsen',
  'hardware-wallets': 'Hardware Wallets',
}

export default async function AktionenPage() {
  const [promoCodes, referralLinks] = await Promise.all([
    getPromoCodes(),
    getReferralLinks(),
  ])

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
          Alle Codes und Referral-Links von Bitcoin Navigator geprüft und aktuell gültig.
        </p>

        {/* ── Promo-Codes ── */}
        {promoCodes.length > 0 && (
          <section className="mb-12">
            <h2 className="text-lg font-bold mb-4" style={{ color: '#1a1a1a', letterSpacing: '-0.02em' }}>
              Promo-Codes – Börsen
            </h2>
            <div className="flex flex-col gap-4">
              {promoCodes.map(promo => (
                <PromoCard
                  key={promo.provider_slug}
                  promo={promo}
                  flag={countryFlag(promo.provider_country)}
                />
              ))}
            </div>
          </section>
        )}

        {/* ── Referral-Links ── */}
        {referralLinks.length > 0 && (
          <section className="mb-12">
            <h2 className="text-lg font-bold mb-4" style={{ color: '#1a1a1a', letterSpacing: '-0.02em' }}>
              Referral-Links
            </h2>
            <div className="flex flex-col gap-4">
              {referralLinks.map(ref => (
                <div
                  key={`${ref.provider_slug}-${ref.url}`}
                  className="rounded-xl border bg-white"
                  style={{ borderColor: '#e0ddd8' }}
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Link
                            href={`/anbieter/${ref.provider_slug}`}
                            className="font-bold text-lg hover:underline"
                            style={{ color: '#1a1a1a', letterSpacing: '-0.02em' }}
                          >
                            {ref.provider_name}
                          </Link>
                          {ref.category_slug && (
                            <span
                              className="text-xs px-2 py-0.5 rounded"
                              style={{ background: '#f0ede8', color: '#666666' }}
                            >
                              {CATEGORY_LABELS[ref.category_slug] ?? ref.category_slug}
                            </span>
                          )}
                        </div>
                        {ref.provider_country && (
                          <p className="text-sm" style={{ color: '#999999' }}>
                            {countryFlag(ref.provider_country)} {ref.provider_country}
                          </p>
                        )}
                      </div>
                      <a
                        href={ref.url}
                        target="_blank"
                        rel="noopener noreferrer sponsored"
                        className="flex-shrink-0 px-4 py-2 rounded-lg text-sm font-bold transition-all hover:opacity-80"
                        style={{ background: '#1a1a1a', color: '#ffffff' }}
                      >
                        Zur Website →
                      </a>
                    </div>

                    {ref.benefit && (
                      <div
                        className="rounded-lg px-4 py-3 text-sm"
                        style={{ background: '#eef7ee', color: '#2a6a2a', border: '0.5px solid #b3d9b3', lineHeight: '1.5' }}
                      >
                        {ref.benefit}
                      </div>
                    )}
                  </div>

                  <div className="px-6 py-3 border-t" style={{ borderColor: '#e0ddd8' }}>
                    <Link
                      href={`/anbieter/${ref.provider_slug}`}
                      className="text-xs hover:underline"
                      style={{ color: '#666666' }}
                    >
                      {ref.provider_name} – alle Kriterien & Bewertungen →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <p className="mt-4 text-xs" style={{ color: '#999999', lineHeight: '1.6' }}>
          Affiliate-Hinweis: Links zu Anbieter-Websites können Affiliate- oder Referral-Links sein.
          Bitcoin Navigator erhält ggf. eine Provision. Die Bewertungen sind davon unabhängig.
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
