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
  split: number
  stockNumber: number
  stockSz: number
  stockJs: number
  productPriceList: ProductPrice[]
  productImages: string[]
  pdfUrl: string
}

export interface ProductChina {
  code: string
  priceDiscount: {
    priceList: Array<{ discount: number; spNumber: number; price: number }>
  }
  priceList: Array<{ price: number; startNumber: number; endNumber: number }>
  splitRatio: number
  param: Record<string, string> | null
}

export interface SearchedProduct {
  id: number
  code: string
}

export interface ProductPrice {
  ladder: number
  usdPrice: number
  discountRate: string
}

export class SZLCSCError extends Error {
  name = 'SZLCSCError'

  constructor(message: string) {
    super(message)
  }
}
