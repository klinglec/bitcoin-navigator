import { createClient } from '@supabase/supabase-js'
import type { Category, Criteria, Provider, ComparisonData } from './types'

function getClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export async function getComparisonData(categorySlug: string): Promise<ComparisonData> {
  const supabase = getClient()

  // 1. Category + all criteria
  const { data: category, error: catError } = await supabase
    .from('categories')
    .select(`
      id, slug, name, description,
      criteria(id, slug, name, data_type, unit, is_filterable, is_sortable,
               is_highlighted, sort_order, options, weight)
    `)
    .eq('slug', categorySlug)
    .single()

  if (catError || !category) throw new Error(`Category not found: ${categorySlug}`)

  const sortedCriteria = (category.criteria as Criteria[]).sort(
    (a, b) => a.sort_order - b.sort_order
  )
  const criteriaById: Record<string, Criteria> = Object.fromEntries(
    sortedCriteria.map(c => [c.id, c])
  )

  // 2. Providers in this category with all their criteria values
  const { data: rows, error: provError } = await supabase
    .from('provider_categories')
    .select(`
      sort_order,
      providers(
        id, slug, name, logo_url, website_url, hq_country, is_verified,
        criteria_values(criteria_id, value_number, value_boolean, value_text, value_json)
      )
    `)
    .eq('category_id', category.id)
    .order('sort_order')

  if (provError) throw provError

  const providers: Provider[] = (rows ?? []).map((row) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const p = (row.providers as any) as {
      id: string; slug: string; name: string; logo_url: string | null
      website_url: string; hq_country: string | null; is_verified: boolean
      criteria_values: { criteria_id: string; value_number: number | null
        value_boolean: boolean | null; value_text: string | null; value_json: unknown }[]
    }

    const values: Provider['values'] = {}
    for (const cv of p.criteria_values ?? []) {
      const criteria = criteriaById[cv.criteria_id]
      if (criteria) values[criteria.slug] = cv
    }

    return {
      id: p.id,
      slug: p.slug,
      name: p.name,
      logo_url: p.logo_url,
      website_url: p.website_url,
      hq_country: p.hq_country,
      is_verified: p.is_verified,
      values,
    }
  })

  return {
    category: { ...category, criteria: sortedCriteria },
    providers,
  }
}
