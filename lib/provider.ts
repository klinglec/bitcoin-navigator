import { createClient } from '@supabase/supabase-js'
import type { Criteria, CriteriaValue } from './types'

function getClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        fetch: (url: RequestInfo | URL, init?: RequestInit) =>
          fetch(url, { ...init, next: { revalidate: 3600 } } as RequestInit),
      },
    }
  )
}

export interface ProviderDetail {
  id: string
  slug: string
  name: string
  logo_url: string | null
  website_url: string
  affiliate_url: string | null
  hq_country: string | null
  is_verified: boolean
  description: string | null
  founded_year: number | null
  categories: { id: string; slug: string; name: string }[]
  criteriaGroups: {
    category: { slug: string; name: string }
    items: { criteria: Criteria; value: CriteriaValue }[]
  }[]
}

export async function getProviderDetail(slug: string): Promise<ProviderDetail | null> {
  const supabase = getClient()

  const { data: provider } = await supabase
    .from('providers')
    .select(`
      id, slug, name, logo_url, website_url, hq_country,
      is_verified, description, founded_year,
      provider_categories(
        categories(id, slug, name)
      ),
      criteria_values(
        criteria_id, value_number, value_boolean, value_text, value_json, notes,
        criteria(id, slug, name, data_type, unit, is_highlighted, sort_order, options, is_filterable, is_sortable, weight,
          category_id,
          categories(slug, name)
        )
      ),
      affiliate_links(url, is_active)
    `)
    .eq('slug', slug)
    .eq('is_active', true)
    .is('deleted_at', null)
    .single()

  if (!provider) return null

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const p = provider as any

  const categories = (p.provider_categories ?? []).map((pc: any) => pc.categories)

  // Group criteria values by category
  const groupMap: Record<string, { category: { slug: string; name: string }; items: { criteria: Criteria; value: CriteriaValue }[] }> = {}

  for (const cv of p.criteria_values ?? []) {
    if (!cv.criteria) continue
    const cat = cv.criteria.categories
    if (!cat) continue
    if (!groupMap[cat.slug]) {
      groupMap[cat.slug] = { category: cat, items: [] }
    }
    groupMap[cat.slug].items.push({
      criteria: cv.criteria as Criteria,
      value: { criteria_id: cv.criteria_id, value_number: cv.value_number, value_boolean: cv.value_boolean, value_text: cv.value_text, value_json: cv.value_json, notes: cv.notes },
    })
  }

  // Sort items within each group
  for (const group of Object.values(groupMap)) {
    group.items.sort((a, b) => a.criteria.sort_order - b.criteria.sort_order)
  }

  const activeAffiliate = ((p.affiliate_links ?? []) as { url: string; is_active: boolean }[]).find(l => l.is_active)

  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    logo_url: p.logo_url,
    website_url: p.website_url,
    affiliate_url: activeAffiliate?.url ?? null,
    hq_country: p.hq_country,
    is_verified: p.is_verified,
    description: p.description,
    founded_year: p.founded_year,
    categories,
    criteriaGroups: Object.values(groupMap),
  }
}

export interface EditorialReview {
  rating: number
  title: string | null
  body: string
  editorial_author: string | null
}

export async function getEditorialReviews(providerId: string): Promise<EditorialReview[]> {
  const supabase = getClient()
  const { data } = await supabase
    .from('user_reviews')
    .select('rating, title, body, editorial_author')
    .eq('provider_id', providerId)
    .eq('is_editorial', true)
    .eq('status', 'approved')
    .is('deleted_at', null)
  return (data ?? []) as EditorialReview[]
}

export async function getAllProviderSlugs(): Promise<string[]> {
  const supabase = getClient()
  const { data } = await supabase
    .from('providers')
    .select('slug')
    .eq('is_active', true)
    .is('deleted_at', null)
  return (data ?? []).map(p => p.slug)
}
