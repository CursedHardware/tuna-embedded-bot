import { groupBy } from 'lodash'
import type { Context } from 'telegraf'
import { reply } from '../utils/reply'
import { getProductFromChina, getProductIdFromCode } from './china'
import { getProductFromIntl } from './intl'
import { getPackage, getReadablePrice, getReadableStock } from './product'
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
      yield `Part#: <code>${product.code}</code>`
      yield `Brand: <code>${product.brand}</code>`
      yield `Model: <code>${product.model}</code>`
      yield `Package: <code>${product.package.standard}</code> (${getPackage(product.package)})`
      {
        const { stocks, totalStocks } = getReadableStock(product.stocks, product.package)
        if (stocks.length > 1) yield `Stock: ${totalStocks}`
        yield* stocks.map((stock) => `Stock (${stock.area}): ${stock.amount}`)
      }
      for (const [symbol, prices] of Object.entries(groupBy(product.prices, 'symbol'))) {
        if (prices.length === 0) continue
        const { first, last, start } = getReadablePrice(prices, product.package)
        yield `Price List (${symbol}): ${first}, ${last}`
        if (start) yield `Start Price: ${start}`
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
