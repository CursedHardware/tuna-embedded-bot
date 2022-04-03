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
      yield `Price List (CNY): ${makePriceList(prices, 'CNY', product.productUnit)}`
      if (productChina.splitRatio > 1) {
        yield `Start Price (CNY): ${makeStartPrice(prices, 'CNY', product.productUnit)}`
      }
      yield `Price List (USD): ${makePriceList(prices, 'USD', product.productUnit)}`
      if (product.split > 1) {
        yield `Start Price (USD): ${makeStartPrice(prices, 'USD', product.productUnit)}`
      }
    },
    *prices() {
      if (productChina.priceDiscount) {
        for (let { spNumber: start, price, discount } of productChina.priceDiscount.priceList) {
          price = new Decimal(price).mul(discount).toNumber()
          start = new Decimal(start).mul(productChina.splitRatio).toNumber()
          yield { symbol: 'CNY', start, price }
        }
      } else {
        for (let { startNumber: start, price } of productChina.priceList) {
          start = new Decimal(start).mul(productChina.splitRatio).toNumber()
          yield { symbol: 'CNY', start, price }
        }
      }
      for (const { ladder, usdPrice, discountRate } of product.productPriceList) {
        const price = new Decimal(usdPrice).mul(discountRate ?? '1').toNumber()
        yield { symbol: 'USD', start: ladder, price }
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

function makeStartPrice(items: PriceItem[], symbol: string, unit: string) {
  items = items.filter((item) => item.symbol === symbol)
  const { price, start } = items[0]
  const minimumPrice = new Decimal(price).mul(start).toFixed(2)
  return `${toReadableNumber(start)} ${unit}/${minimumPrice}`
}

function makePriceList(items: PriceItem[], symbol: string, unit: string): string {
  items = items.filter((item) => item.symbol === symbol)
  return [items[0], items[items.length - 1]]
    .map(({ start, price }) => `${toReadableNumber(start)}+: ${formatPrice(price, unit)}`)
    .join(', ')
}
