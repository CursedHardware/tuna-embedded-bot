import Decimal from 'decimal.js'
import { identity, isEmpty } from 'lodash'
import fetch from 'node-fetch'
import urlcat from 'urlcat'
import { Product, SZLCSCError } from './types'

export const HOST = 'https://wwwapi.lcsc.com/v1'

export async function getProductFromIntl(product_code: string) {
  const response = await fetch(urlcat(HOST, '/products/detail', { product_code }))
  interface ProductLCSC {
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
    productPriceList: Array<{ ladder: number; usdPrice: number; discountRate: string }>
    productImages: string[]
    pdfUrl: string
  }
  const payload: ProductLCSC = await response.json()
  if (!payload?.brandNameEn) throw new SZLCSCError('No Result')
  return identity<Product>({
    id: payload.productId,
    code: payload.productCode,
    brand: payload.brandNameEn,
    model: payload.productModel,
    datasheetURL: isEmpty(payload.pdfUrl) ? undefined : payload.pdfUrl,
    package: {
      standard: payload.encapStandard,
      minUnit: payload.productUnit,
      unit: payload.minPacketUnit,
      amount: payload.minPacketNumber,
    },
    stocks: [
      { area: 'Jiangsu', amount: payload.stockJs },
      { area: 'Guangdong', amount: payload.stockSz },
    ],
    prices: payload.productPriceList.map((_) => ({
      symbol: 'USD',
      start: _.ladder,
      price: new Decimal(_.usdPrice).mul(_.discountRate ?? '1').toNumber(),
    })),
    photos: payload.productImages,
    links: { [payload.productCode]: `https://lcsc.com/product-detail/${payload.productCode}.html` },
  })
}
