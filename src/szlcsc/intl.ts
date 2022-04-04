import Decimal from 'decimal.js'
import fetch from 'node-fetch'
import { InputFile } from 'telegraf/typings/core/types/typegram'
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
    split: number
    stockNumber: number
    stockSz: number
    stockJs: number
    productPriceList: Array<{ ladder: number; usdPrice: number; discountRate: string }>
    productImages: string[]
    pdfUrl: string
  }
  const payload: ProductLCSC = await response.json()
  if (!payload?.brandNameEn) throw new SZLCSCError('No Result')
  return Object.freeze<Product>({
    id: payload.productId,
    code: payload.productCode,
    brand: payload.brandNameEn,
    model: payload.productModel,
    package: {
      standard: payload.encapStandard,
      minUnit: payload.productUnit,
      unit: payload.minPacketUnit,
      amount: payload.minPacketNumber,
    },
    stocks: [
      { area: 'Jiangsu', amount: payload.stockJs },
      { area: 'Shenzhen', amount: payload.stockSz },
    ],
    prices: payload.productPriceList.map((_) => ({
      symbol: 'USD',
      start: _.ladder,
      price: new Decimal(_.usdPrice).mul(_.discountRate ?? '1').toNumber(),
    })),
    photos: payload.productImages.map((url): InputFile => ({ url })),
  })
}

// return reply(ctx, {
//   brand: product.brandNameEn,
//   model: product.productModel,
//   datasheet() {
//     const name = `${product.productCode}_${product.productModel}.pdf`
//     return { url: product.pdfUrl, name }
//   },
//   *html(prices) {
//     yield `Part#: <code>${product.productCode}</code>`
//     yield `Brand: <code>${product.brandNameEn}</code>`
//     yield `Model: <code>${product.productModel}</code>`
//     yield `Package: <code>${product.encapStandard}</code> (${getPackage(product)})`
//     if (product.stockJs && product.stockSz) {
//       yield `Stock: ${getInStock(product, product.stockNumber)}`
//     }
//     if (product.stockJs) {
//       yield `Stock (Jiangsu): ${getInStock(product, product.stockJs)}`
//     }
//     if (product.stockSz) {
//       yield `Stock (Shenzhen): ${getInStock(product, product.stockSz)}`
//     }
//     yield `Price List (CNY): ${makePriceList(prices, 'CNY', product.productUnit)}`
//     if (productChina.splitRatio > 1) {
//       yield `Start Price (CNY): ${makeStartPrice(prices, 'CNY', product.productUnit)}`
//     }
//     yield `Price List (USD): ${makePriceList(prices, 'USD', product.productUnit)}`
//     if (product.split > 1) {
//       yield `Start Price (USD): ${makeStartPrice(prices, 'USD', product.productUnit)}`
//     }
//   },
//   *prices() {
//     if (productChina.priceDiscount) {
//       for (let { spNumber: start, price, discount } of productChina.priceDiscount.priceList) {
//         price = new Decimal(price).mul(discount).toNumber()
//         start = new Decimal(start).mul(productChina.splitRatio).toNumber()
//         yield { symbol: 'CNY', start, price }
//       }
//     } else {
//       for (let { startNumber: start, price } of productChina.priceList) {
//         start = new Decimal(start).mul(productChina.splitRatio).toNumber()
//         yield { symbol: 'CNY', start, price }
//       }
//     }
//     for (const { ladder, usdPrice, discountRate } of product.productPriceList) {
//       const price = new Decimal(usdPrice).mul(discountRate ?? '1').toNumber()
//       yield { symbol: 'USD', start: ladder, price }
//     }
//   },
//   photos() {
//     return (product.productImages ?? []).map((url): InputFile => ({ url }))
//   },
//   *markup() {
//     yield { text: product.productCode, url: `https://lcsc.com/product-detail/${product.productCode}.html` }
//     yield { text: '立创商城', url: `https://item.szlcsc.com/${product.productId}.html` }
//   },
// })

export async function findSearchLink(keyword: string, type = 'LCSC Part Number') {
  const response = await fetch(urlcat(HOST, '/search/search-link', { type, keyword }))
  interface Payload {
    url: string
  }
  const payload: Payload = await response.json()
  return payload?.url
}
