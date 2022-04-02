import { Composer } from 'telegraf'
import type { Message } from 'telegraf/typings/core/types/typegram'
import { getEntities, group } from '../utils/telegraf'
import { handle } from './handler'
import { getProductCodeFromURL } from './utils'

export const bot = Composer.command('/lc', async (ctx) => {
  const { via_bot, reply_to_message } = ctx.message
  if (via_bot) return
  const products = await getProducts(ctx.message)
  if (reply_to_message && 'text' in reply_to_message) {
    products.push(...(await getProducts(reply_to_message)))
  }
  await Promise.all(
    Array.from(new Set(products)).map((code) =>
      group(ctx, `Reading <code>${code}</code> from szlcsc.com`, () => handle(ctx, code)),
    ),
  )
})

export async function getProducts(message: Message.TextMessage) {
  const products: string[] = getProductCodeList(message.text)
  for (const url of getEntities(message, 'url')) {
    const code = await getProductCodeFromURL(url)
    if (code) products.push(code)
  }
  return products
}

function getProductCodeList(text: string) {
  return Array.from(text.matchAll(/\b(C\d+)\b/gi)).map((match) => match[1])
}
