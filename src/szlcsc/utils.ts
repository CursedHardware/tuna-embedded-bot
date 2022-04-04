import { Message } from 'telegraf/typings/core/types/typegram'
import { getEntities } from '../utils/telegraf'
import { getProductFromChina } from './china'

export async function getProductCodeFromId(id: number) {
  const result = await getProductFromChina(id)
  return result.code
}

export async function getProductCodeFromURL(input: string) {
  const url = new URL(input)
  if (url.host === 'item.szlcsc.com') {
    const match = /(?<id>\d+)\.html$/.exec(url.pathname)
    if (match?.groups?.id) return getProductCodeFromId(+match.groups.id)
  } else if (url.host === 'm.szlcsc.com') {
    const id = url.searchParams.get('productId')
    if (id) return getProductCodeFromId(+id)
  } else if (url.host.endsWith('lcsc.com')) {
    const match = /(?<code>C\d+)\.html$/.exec(url.pathname)
    if (match?.groups?.code) return match.groups.code
  }
  return null
}

export async function getProductCodeList(message: Message.TextMessage) {
  const products = Array.from(message.text.matchAll(/\b(C\d+)\b/gi)).map((match) => match[1])
  for (const url of getEntities(message, 'url')) {
    const code = await getProductCodeFromURL(url)
    if (code) products.push(code)
  }
  return new Set(products)
}
