import { getPromoCodes, countryFlag } from '@/lib/promotions'
import SiteHeader from '@/components/SiteHeader'
import Link from 'next/link'
import type { Metadata } from 'next'
import PromoCodeButton from '@/components/PromoCodeButton'

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

        {/* Header */}
        <p className="text-xs font-medium tracking-widest uppercase mb-2" style={{ color: '#999999' }}>
          Aktionen
        </p>
        <h1 className="text-3xl md:text-4xl font-bold mb-3" style={{ letterSpacing: '-0.03em' }}>
          Bitcoin Promo-Codes & Aktionen
        </h1>
        <p className="text-base mb-10" style={{ color: '#666666', maxWidth: '560px', lineHeight: '1.6' }}>
          Spare bei deinem ersten Bitcoin-Kauf. Alle Codes sind von Bitcoin Navigator geprüft
          und aktuell gültig. Täglich aktualisiert.
        </p>

        {/* Promo-Code Cards */}
        {promoCodes.length === 0 ? (
          <p style={{ color: '#999999' }}>Aktuell keine Aktionen verfügbar.</p>
        ) : (
          <div className="flex flex-col gap-4">
            {promoCodes.map(promo => (
              <div
                key={promo.provider_slug}
                className="rounded-xl border bg-white"
                style={{ borderColor: '#e0ddd8' }}
              >
                <div className="p-6">
                  {/* Provider */}
                  <div className="flex items-start justify-between gap-4 mb-4">
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
                          {countryFlag(promo.provider_country)} {promo.provider_country}
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

                  {/* Benefit */}
                  {promo.benefit && (
                    <div
                      className="rounded-lg px-4 py-3 mb-4 text-sm"
                      style={{ background: '#eef7ee', color: '#2a6a2a', border: '0.5px solid #b3d9b3' }}
                    >
                      ✓ {promo.benefit}
                    </div>
                  )}

                  {/* Promo Code */}
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-sm font-medium" style={{ color: '#666666' }}>
                      Promo-Code:
                    </span>
                    <PromoCodeButton code={promo.code} />
                  </div>
                </div>

                {/* Footer */}
                <div
                  className="px-6 py-3 border-t flex items-center gap-2"
                  style={{ borderColor: '#e0ddd8' }}
                >
                  <span className="text-xs" style={{ color: '#999999' }}>
                    Detailseite:
                  </span>
                  <Link
                    href={`/anbieter/${promo.provider_slug}`}
                    className="text-xs font-medium hover:underline"
                    style={{ color: '#666666' }}
                  >
                    {promo.provider_name} – alle Kriterien & Bewertungen →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Hinweis */}
        <p className="mt-10 text-xs" style={{ color: '#999999', lineHeight: '1.6' }}>
          Affiliate-Hinweis: Links zu Anbieter-Websites können Affiliate-Links sein.
          Bitcoin Navigator erhält ggf. eine Provision, wenn du dich über diese Links registrierst.
          Die Promo-Codes und Bewertungen sind davon unabhängig.
        </p>
      </main>

      <footer
        className="px-6 md:px-12 py-8 border-t mt-8 text-xs"
        style={{ borderColor: '#e0ddd8', color: '#999999' }}
      >
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
