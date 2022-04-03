import fetch from 'node-fetch'
import type { Context } from 'telegraf'
import type { InputFile } from 'telegraf/typings/core/types/typegram'
import urlcat from 'urlcat'
import { NoResultError } from '../types'
import { formatPrice, toReadableNumber } from '../utils/number'
import { reply } from '../utils/reply'
import { Payload, ProductIntl, SearchedProduct, SZLCSCError } from './types'
import { getInStock, getPackage, getProductFromChina } from './utils'

export async function handle(ctx: Context, productCode: string) {
  productCode = productCode.toUpperCase()
  const product = await getProductFromIntl(productCode)
  const productChina = await getProductFromChina(product.productId)
  return reply(ctx, {
    brand: product.brandNameEn,
    model: product.productModel,
    datasheet: { url: product.pdfUrl, fileName: `${product.productCode}_${product.productModel}.pdf` },
    *html() {
      yield `Part#: <code>${product.productCode}</code>`
      yield `Brand: <code>${product.brandNameEn}</code>`
      yield `Model: <code>${product.productModel}</code>`
      yield `Package: <code>${product.encapStandard}</code> (${getPackage(product)})`
      if (product.stockJs && product.stockSz) {
        yield `Stock: ${getInStock(product, product.stockNumber)}`
      }
      if (product.stockJs) {
        yield `Stock (Jiangsu): ${getInStock(product, product.stockJs)}`
      }
      if (product.stockSz) {
        yield `Stock (Shenzhen): ${getInStock(product, product.stockSz)}`
      }
      yield 'Price List (CNY):'
      yield makePriceList(productChina.priceList, (_) => [_.startNumber * productChina.splitRatio, _.price])
      yield 'Price List (USD):'
      yield makePriceList(product.productPriceList, (_) => [_.ladder * product.split, _.usdPrice])
    },
    photos() {
      return (product.productImages ?? []).map((url): InputFile => ({ url }))
    },
    *markup() {
      yield { text: product.productCode, url: `https://lcsc.com/product-detail/${product.productCode}.html` }
      yield { text: '立创商城', url: `https://item.szlcsc.com/${product.productId}.html` }
    },
  })
}

export async function find(keyword: string) {
  const response = await fetch(urlcat('https://so.szlcsc.com/phone/p/product/search', { keyword }))
  const payload: Payload<{ productList: SearchedProduct[] }> = await response.json()
  if (payload.code !== 200) throw new SZLCSCError(payload.msg)
  return payload.result.productList
}

async function getProductFromIntl(product_code: string): Promise<ProductIntl> {
  const response = await fetch(urlcat('https://wwwapi.lcsc.com/v1/products/detail', { product_code }))
  const payload = await response.json()
  if (Array.isArray(payload)) throw new NoResultError()
  return payload
}

function makePriceList<T>(elements: T[], mapFn: (input: T) => [number, number]): string {
  return [elements[0], elements[elements.length - 1]]
    .map(mapFn)
    .map(([start, price]) => `${toReadableNumber(start)}+: ${formatPrice(price)}`)
    .join(', ')
}
