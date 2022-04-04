export interface SearchedResult {
  id: string
  model: string
}

export interface Product {
  brand_name: string
  model: string
  descr: string
  dsFile: { name: string; path: string } | null
  params: Array<{ name: string; value: string }>
}

export class SemieeError extends Error {
  name = 'SemieeError'
}
