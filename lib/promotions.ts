import { createClient } from '@supabase/supabase-js'

function getClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export interface PromoCode {
  provider_slug: string
  provider_name: string
  provider_country: string | null
  provider_website: string
  code: string
  benefit: string | null
}

const COUNTRY_FLAGS: Record<string, string> = {
  DE: '🇩🇪', AT: '🇦🇹', CH: '🇨🇭', US: '🇺🇸',
}

export function countryFlag(code: string | null): string {
  return code ? (COUNTRY_FLAGS[code] ?? '') : ''
}

export async function getPromoCodes(): Promise<PromoCode[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = getClient() as any

  const { data: rows } = await supabase
    .from('providers')
    .select(`
      slug, name, hq_country, website_url,
      criteria_values(value_text, notes, criteria(slug, categories(slug)))
    `)
    .eq('is_active', true)
    .is('deleted_at', null)

  if (!rows) return []

  const result: PromoCode[] = []
  for (const p of rows) {
    const cvs: unknown[] = Array.isArray(p.criteria_values) ? p.criteria_values : []
    for (const cv of cvs) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const c = cv as any
      if (
        c?.criteria?.slug === 'promo_code' &&
        c?.criteria?.categories?.slug === 'boersen' &&
        c?.value_text
      ) {
        result.push({
          provider_slug: p.slug,
          provider_name: p.name,
          provider_country: p.hq_country,
          provider_website: p.website_url,
          code: c.value_text,
          benefit: c.notes ?? null,
        })
      }
    }
  }
  return result
}
