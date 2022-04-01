import fetch from 'node-fetch'
import { Context, Markup } from 'telegraf'
import type { InputMediaPhoto } from 'telegraf/typings/core/types/typegram'
import type { ExtraReplyMessage } from 'telegraf/typings/telegram-types'
import urlcat from 'urlcat'
import { getPDFCover, isPDF } from '../pdf'
import { NoResultError, SZLCSCError } from '../types'
import { download, getDatasheetURL, toReadableNumber } from '../utils'
import type { Payload, ProductIntl, SearchedProduct } from './types'
import { getInStock, getPackage, getProductFromChina } from './utils'

export async function handle(ctx: Context, productCode: string) {
  productCode = productCode.toUpperCase()
  const product = await getProductFromIntl(productCode)
  const productChina = await getProductFromChina(product.productId)
  const lines = [
    `Part#: #${product.productCode}`,
    `Brand: <code>${product.brandNameEn}</code>`,
    `Model: <code>${product.productModel}</code>`,
    `Package: <code>${product.encapStandard}</code> (${getPackage(product)})`,
    `Stock: ${getInStock(product, product.stockNumber)}`,
    `Stock (Jiangsu): ${getInStock(product, product.stockJs)}`,
    `Stock (Shenzhen): ${getInStock(product, product.stockSz)}`,
    `Price List (CNY): ${makeSimpleList(productChina.priceList)
      .map((_) => `${toReadableNumber(_.startNumber)}+: ${_.price}`)
      .join(', ')}`,
    `Price List (USD): ${makeSimpleList(product.productPriceList)
      .map((_) => `${toReadableNumber(_.ladder)}+: ${_.usdPrice}`)
      .join(', ')}`,
  ]
  const markup = Markup.inlineKeyboard(
    [
      Markup.button.url(product.productCode, `https://www.lcsc.com/product-detail/${product.productCode}.html`),
      Markup.button.url('立创商城', `https://item.szlcsc.com/${product.productId}.html`),
      Markup.button.url('Datasheet', getDatasheetURL(product.pdfUrl, product.brandNameEn, product.productModel)),
    ],
    { columns: 2 }
  )
  const caption = lines.join('\n')
  const extra: ExtraReplyMessage = {
    parse_mode: 'HTML',
    reply_markup: markup.reply_markup,
    reply_to_message_id: ctx.message?.message_id,
  }
  const pdfSource = isPDF(product.pdfUrl) ? await download(product.pdfUrl) : undefined
  if (ctx.chat?.type === 'private') {
    const photos: InputMediaPhoto[] = []
    if (pdfSource) {
      photos.push({ type: 'photo', media: { source: await getPDFCover(pdfSource) } })
    }
    if (product.productImages?.length) {
      const images = await Promise.all(product.productImages.map(download))
      photos.push(...images.map((source): InputMediaPhoto => ({ type: 'photo', media: { source } })))
    }
    if (photos.length) {
      await ctx.replyWithMediaGroup(photos, extra)
    }
    if (pdfSource) {
      const filename = `${product.productCode}_${product.productModel}.pdf`
      await ctx.replyWithDocument({ source: pdfSource, filename }, { caption, ...extra })
    } else {
      await ctx.reply(caption, extra)
    }
  } else if (product.productImages[0]) {
    await ctx.replyWithPhoto(product.productImages[0], { caption, ...extra })
  } else {
    await ctx.reply(caption, extra)
  }
}

export async function search(keyword: string) {
  const response = await fetch(urlcat('https://so.szlcsc.com/phone/p/product/search', { keyword }), { timeout: 2000 })
  const payload: Payload<{ productList: SearchedProduct[] }> = await response.json()
  if (payload.code !== 200) throw new SZLCSCError(payload.msg)
  if (payload.result.productList.length === 0) throw new NoResultError()
  return payload.result.productList
}

async function getProductFromIntl(product_code: string): Promise<ProductIntl> {
  const response = await fetch(urlcat('https://wwwapi.lcsc.com/v1/products/detail', { product_code }))
  const payload = await response.json()
  if (payload?.length === 0) throw new NoResultError()
  return payload
}

function makeSimpleList<T>(elements: T[]): [T, T] {
  return [elements[0], elements[elements.length - 1]]
}
