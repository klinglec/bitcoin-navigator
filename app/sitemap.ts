import { MetadataRoute } from 'next'
import { createClient } from '@supabase/supabase-js'

export const revalidate = 3600

const BASE = 'https://bitcoinnavigator.de'

async function getProviderSlugs(): Promise<{ slug: string; updated_at: string }[]> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const { data } = await supabase
    .from('providers')
    .select('slug, updated_at')
    .eq('is_active', true)
    .is('deleted_at', null)
  return data ?? []
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const providers = await getProviderSlugs()

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: BASE,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${BASE}/vergleich/boersen`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${BASE}/vergleich/hardware-wallets`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${BASE}/vergleich/seed-backup`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${BASE}/aktionen`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${BASE}/ratgeber`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${BASE}/ratgeber/bitcoin-boerse-gebuehren`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${BASE}/ratgeber/hardware-wallet-erklaerung`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${BASE}/ratgeber/bitcoin-sparplan-dca`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${BASE}/ratgeber/seed-phrase-sichern`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${BASE}/impressum`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.2,
    },
    {
      url: `${BASE}/datenschutz`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.2,
    },
  ]

  const providerRoutes: MetadataRoute.Sitemap = providers.map(p => ({
    url: `${BASE}/anbieter/${p.slug}`,
    lastModified: new Date(p.updated_at),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  return [...staticRoutes, ...providerRoutes]
}
