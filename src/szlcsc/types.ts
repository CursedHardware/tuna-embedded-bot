export interface Payload<T> {
  code: number
  msg: string
  result: T
}

export interface ProductIntl {
  productId: number
  productCode: string
  productModel: string
  brandNameEn: string
  encapStandard: string
  productUnit: string
  minPacketUnit: string
  minPacketNumber: number
  stockNumber: number
  stockSz: number
  stockJs: number
  productPriceList: ProductPrice[]
  productImages: string[]
  pdfUrl: string
}

export interface ProductChina {
  code: string
  priceList: Array<{ price: number; startNumber: number }>
  param: Record<string, string> | null
}

export interface ProductPrice {
  ladder: number
  usdPrice: number
  currencyPrice: number
  currencySymbol: String
}
