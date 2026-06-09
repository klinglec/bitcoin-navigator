export type DataType =
  | 'text'
  | 'number'
  | 'boolean'
  | 'select'
  | 'multi_select'
  | 'url'
  | 'date'
  | 'percentage'

export interface Criteria {
  id: string
  slug: string
  name: string
  data_type: DataType
  unit: string | null
  is_filterable: boolean
  is_sortable: boolean
  is_highlighted: boolean
  sort_order: number
  options: string[] | null
  weight: number
}

export interface CriteriaValue {
  criteria_id: string
  value_number: number | null
  value_boolean: boolean | null
  value_text: string | null
  value_json: unknown
}

export interface Provider {
  id: string
  slug: string
  name: string
  logo_url: string | null
  website_url: string
  hq_country: string | null
  is_verified: boolean
  values: Record<string, CriteriaValue> // keyed by criteria slug
}

export interface Category {
  id: string
  slug: string
  name: string
  description: string | null
  criteria: Criteria[]
}

export interface ComparisonData {
  category: Category
  providers: Provider[]
}
