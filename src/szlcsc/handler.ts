import fetch from 'node-fetch'
import type { Context } from 'telegraf'
import type { InputMediaPhoto } from 'telegraf/typings/core/types/typegram'
import urlcat from 'urlcat'
import { NoResultError, SZLCSCError } from '../types'
import { reply, toReadableNumber } from '../utils'
import type { Payload, ProductIntl, SearchedProduct } from './types'
import { getInStock, getPackage, getProductFromChina } from './utils'

export async function handle(ctx: Context, productCode: string) {
  productCode = productCode.toUpperCase()
  const product = await getProductFromIntl(productCode)
  const productChina = await getProductFromChina(product.productId)
  return reply(ctx, {
    brand: product.brandNameEn,
    model: product.productModel,
    dsURL: product.pdfUrl,
    fileName: `${product.productCode}_${product.productModel}.pdf`,
    *html() {
      yield `Part#: <code>${product.productCode}</code>`
      yield `Brand: <code>${product.brandNameEn}</code>`
      yield `Model: <code>${product.productModel}</code>`
      yield `Package: <code>${product.encapStandard}</code> (${getPackage(product)})`
      yield `Stock: ${getInStock(product, product.stockNumber)}`
      yield `Stock (Jiangsu): ${getInStock(product, product.stockJs)}`
      yield `Stock (Shenzhen): ${getInStock(product, product.stockSz)}`
      yield `Price List (CNY): ${makeSimpleList(productChina.priceList)
        .map((_) => `${toReadableNumber(_.startNumber)}+: ${_.price}`)
        .join(', ')}`
      yield `Price List (USD): ${makeSimpleList(product.productPriceList)
        .map((_) => `${toReadableNumber(_.ladder)}+: ${_.usdPrice}`)
        .join(', ')}`
    },
    photos() {
      return (product.productImages ?? []).map((media): InputMediaPhoto => ({ type: 'photo', media }))
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
  if (payload.result.productList.length === 0) throw new NoResultError()
  return payload.result.productList
}

async function getProductFromIntl(product_code: string): Promise<ProductIntl> {
  const response = await fetch(urlcat('https://wwwapi.lcsc.com/v1/products/detail', { product_code }))
  const payload = await response.json()
  if (Array.isArray(payload)) throw new NoResultError()
  return payload
}

function makeSimpleList<T>(elements: T[]): [T, T] {
  return [elements[0], elements[elements.length - 1]]
}
