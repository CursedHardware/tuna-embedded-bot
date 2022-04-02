import { Composer } from 'telegraf'
import { getQuery } from '../utils/telegraf'
import { findARK } from './handler'

export const bot = Composer.command('/ark', async (ctx) => {
  const query = getQuery(ctx.message)
  const results = await findARK(query)
  results.sort((a, b) => a.label.localeCompare(b.label, 'en-US', { numeric: true }))
  const links = results.map(({ prodUrl, label }) => {
    label = label.replace(/[\xAE\u2122]/g, '')
    const url = new URL(prodUrl, 'https://ark.intel.com')
    if (url.pathname.endsWith('search.html')) {
      url.searchParams.set('q', label)
    }
    label = label
      .replace(/^Intel \S+ Processor/g, '')
      .replace(/^Intel \S+ (\S+) Processor/g, '$1')
      .replace(/^Intel UHD Graphics (\d+)/, 'UHD$1')
      .replace(/\s+/g, ' ')
      .trim()
    return `<a href="${url.toString()}">${label}</a>`
  })
  await ctx.reply(links.join('\n'), {
    parse_mode: 'HTML',
    reply_to_message_id: ctx.message.message_id,
    disable_web_page_preview: true,
  })
})
