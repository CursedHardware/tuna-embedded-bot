export interface Payload<T> {
  code: number
  remark: string
  result: T
}

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
