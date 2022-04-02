import Decimal from 'decimal.js'
import fetch from 'node-fetch'
import type { Context } from 'telegraf'
import type { InputFile } from 'telegraf/typings/core/types/typegram'
import urlcat from 'urlcat'
import { formatPrice, toReadableNumber } from '../utils/number'
import { PriceItem, reply } from '../utils/reply'
import { Payload, SearchedProduct, SZLCSCError } from './types'
import { getInStock, getPackage, getProductFromChina, getProductFromIntl } from './utils'

export async function handle(ctx: Context, productCode: string) {
  productCode = productCode.toUpperCase()
  const product = await getProductFromIntl(productCode)
  const productChina = await getProductFromChina(product.productId)
  return reply(ctx, {
    brand: product.brandNameEn,
    model: product.productModel,
    datasheet() {
      const name = `${product.productCode}_${product.productModel}.pdf`
      return { url: product.pdfUrl, name }
    },
    *html(prices) {
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
      yield `Price List (CNY): ${makePriceList(prices, 'CNY')}`
      if (productChina.splitRatio > 1) {
        yield `Start Price (CNY): ${makeStartPrice(prices, 'CNY')}`
      }
      yield `Price List (USD): ${makePriceList(prices, 'USD')}`
      if (product.split > 1) {
        yield `Start Price (USD): ${makeStartPrice(prices, 'USD')}`
      }
    },
    *prices() {
      for (const _ of productChina.priceList) {
        yield { symbol: 'CNY', start: _.startNumber * productChina.splitRatio, price: _.price }
      }
      for (const _ of product.productPriceList) {
        yield { symbol: 'USD', start: _.ladder, price: _.usdPrice }
      }
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
  return payload.result.productList ?? []
}

function makeStartPrice(items: PriceItem[], symbol: string) {
  items = items.filter((item) => item.symbol === symbol)
  const { price, start } = items[0]
  const minimumPrice = new Decimal(price).mul(start).toFixed(2)
  return `${toReadableNumber(start)} PCS @ ${minimumPrice} ${symbol}`
}

function makePriceList(items: PriceItem[], symbol: string): string {
  items = items.filter((item) => item.symbol === symbol)
  return [items[0], items[items.length - 1]]
    .map(({ start, price }) => `${toReadableNumber(start)}+: ${formatPrice(price)}`)
    .join(', ')
}
