import fetch from 'node-fetch'
import { Context } from 'telegraf'
import type { InlineKeyboardMarkup, InputMediaPhoto } from 'telegraf/typings/core/types/typegram'
import type { ExtraReplyMessage } from 'telegraf/typings/telegram-types'
import urlcat from 'urlcat'
import { getPDFCover } from '../pdf'
import { getLuckyURL, toReadableNumber } from '../utils'
import type { Payload, ProductIntl, SearchedProduct } from './types'
import { getInStock, getPackage, getProductFromChina } from './utils'

export async function handle(ctx: Context, productCode: string) {
  productCode = productCode.toUpperCase()
  const product = await getProductFromIntl(productCode)
  const productChina = await getProductFromChina(product.productId)
  const lines = [
    `Brand: <code>${product.brandNameEn}</code>`,
    `Model: <code>${product.productModel}</code>`,
    `Package: <code>${product.encapStandard}</code> (${getPackage(product)})`,
    `Stock (Jiangsu): ${getInStock(product, product.stockJs)}`,
    `Stock (Shenzhen): ${getInStock(product, product.stockSz)}`,
    `Price List (CNY): ${makeSimpleList(productChina.priceList)
      .map((_) => `${toReadableNumber(_.startNumber)}+: ${_.price}`)
      .join(', ')}`,
    `Price List (USD): ${makeSimpleList(product.productPriceList)
      .map((_) => `${toReadableNumber(_.ladder)}+: ${_.usdPrice}`)
      .join(', ')}`,
  ]
  const datasheetURL = /\.pdf$/i.test(product.pdfUrl ?? '')
    ? product.pdfUrl
    : getLuckyURL(`${product.brandNameEn} ${product.productModel} datasheet filetype:pdf`)
  const reply_markup: InlineKeyboardMarkup = {
    inline_keyboard: [
      [
        { text: product.productCode, url: `https://www.lcsc.com/product-detail/${product.productCode}.html` },
        { text: product.productId.toString(), url: `https://item.szlcsc.com/${product.productId}.html` },
      ],
      [{ text: 'Datasheet', url: datasheetURL }],
    ],
  }
  const caption = lines.join('\n')
  const extra: ExtraReplyMessage = {
    parse_mode: 'HTML',
    reply_markup,
    reply_to_message_id: ctx.message?.message_id,
  }
  if (ctx.chat?.type === 'private') {
    const photos: InputMediaPhoto[] = []
    if (product.pdfUrl) {
      const source = await getPDFCover(product.pdfUrl)
      if (source) photos.push({ type: 'photo', media: { source } })
    }
    if (product.productImages?.length) {
      photos.push(...product.productImages.map((media): InputMediaPhoto => ({ type: 'photo', media })))
    }
    if (photos.length) {
      await ctx.replyWithMediaGroup(photos, extra)
    }
    if (/\.pdf$/i.test(product.pdfUrl ?? '')) {
      await ctx.replyWithDocument(product.pdfUrl, { caption, ...extra })
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
  const response = await fetch(urlcat('https://so.szlcsc.com/phone/p/product/search', { keyword }))
  const payload: Payload<{ productList: SearchedProduct[] }> = await response.json()
  if (payload.code !== 200) throw new Error(payload.msg)
  return payload.result.productList
}

async function getProductFromIntl(product_code: string): Promise<ProductIntl> {
  const response = await fetch(urlcat('https://wwwapi.lcsc.com/v1/products/detail', { product_code }))
  const payload = await response.json()
  if (payload?.length === 0) throw new Error('Not Found')
  return payload
}

function makeDatasheetPreview(elements: ProductIntl['paramVOList']) {
  if (!elements) return []
  elements = elements.filter(({ paramValueEn: value }) => !(value === '-' || value === '0'))
  if (elements.length === 0) return []
  // elements.sort((a, b) => a.paramNameEn.localeCompare(b.paramNameEn, 'zh-CN'))
  return [
    'Datasheet:',
    ...elements.map((element) =>
      `${element.paramNameEn}: ${element.paramValueEn}`
        .replace(/\uFF08/g, '(')
        .replace(/\uFF09/g, ')')
        .replace(/KB/g, 'kB')
        .replace(/MHz/g, 'Mhz')
        .replace(/FLASH/g, 'Flash')
        .replace(/(\d+)KX(\d+)/g, '$1k x $2')
        .replace(/(\d+(?:\.\d+)?)V/g, '$1v')
        .replace(/\xAE/g, '')
    ),
  ]
}

function makeSimpleList<T>(elements: T[]): [T, T] {
  return [elements[0], elements[elements.length - 1]]
}
