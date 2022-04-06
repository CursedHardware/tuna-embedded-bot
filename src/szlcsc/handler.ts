import Decimal from 'decimal.js'
import { findLast, groupBy } from 'lodash'
import type { Context } from 'telegraf'
import { reply } from '../utils/reply'
import { getProductFromChina, getProductIdFromCode } from './china'
import { getProductFromIntl } from './intl'
import { SZLCSCError } from './types'
export { find } from './china'

export async function handle(ctx: Context, code: string) {
  const product = await getProduct(code)
  return reply(ctx, {
    brand: product.brand,
    model: product.model,
    photos: product.photos,
    datasheet: {
      url: product.datasheetURL,
      name: `${product.code}_${product.model}.pdf`,
    },
    links: product.links,
    *html() {
      const pkg = product.package
      yield `Part#: <code>${product.code}</code>`
      yield `Brand: <code>${product.brand}</code>`
      yield `Model: <code>${product.model}</code>`
      yield `Package: <code>${pkg.standard}</code> (${pkg})`
      const inStocks = product.stocks.filter(({ amount }) => amount > 0)
      if (inStocks.length > 1) {
        const totalStocks = Decimal.sum(...inStocks.map((stock) => stock.amount))
        yield `Stock: ${pkg.toStockString(totalStocks)}`
      }
      for (const { area, amount } of inStocks) {
        yield `Stock (${area}): ${pkg.toStockString(amount)}`
      }
      for (const [symbol, prices] of Object.entries(groupBy(product.prices, 'symbol'))) {
        if (prices.length === 0) continue
        const firstPrice = pkg.toPriceString(prices[0])
        const lastPrice = pkg.toPriceString(prices[prices.length - 1])
        yield `Price List (${symbol}): ${firstPrice} | ${lastPrice}`
        const startPrice = prices[0]
        if (startPrice.start > 1) {
          yield pkg.toStartPriceString(startPrice)
        }
        const medianPrice = findLast(prices, ({ start }) => start <= 1000)
        if (medianPrice) {
          yield pkg.toStartPriceString(medianPrice)
        }
      }
    },
  })
}

async function getProduct(code: string) {
  code = code.toUpperCase()
  try {
    const product = await getProductFromIntl(code)
    try {
      const productChina = await getProductFromChina(product.id)
      product.prices = [...product.prices, ...productChina.prices]
      product.links = { ...product.links, ...productChina.links }
    } catch {
      // ignore
    }
    return product
  } catch {
    const productId = await getProductIdFromCode(code)
    if (!productId) throw new SZLCSCError('No Found')
    return getProductFromChina(productId)
  }
}
