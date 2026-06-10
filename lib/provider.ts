import { createClient } from '@supabase/supabase-js'
import type { Criteria, CriteriaValue } from './types'

function getClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export interface ProviderDetail {
  id: string
  slug: string
  name: string
  logo_url: string | null
  website_url: string
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
        criteria_id, value_number, value_boolean, value_text, value_json,
        criteria(id, slug, name, data_type, unit, is_highlighted, sort_order, options, is_filterable, is_sortable, weight,
          category_id,
          categories(slug, name)
        )
      )
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
      value: { criteria_id: cv.criteria_id, value_number: cv.value_number, value_boolean: cv.value_boolean, value_text: cv.value_text, value_json: cv.value_json },
    })
  }

  // Sort items within each group
  for (const group of Object.values(groupMap)) {
    group.items.sort((a, b) => a.criteria.sort_order - b.criteria.sort_order)
  }

  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    logo_url: p.logo_url,
    website_url: p.website_url,
    hq_country: p.hq_country,
    is_verified: p.is_verified,
    description: p.description,
    founded_year: p.founded_year,
    categories,
    criteriaGroups: Object.values(groupMap),
  }
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
