import { Composer } from 'telegraf'
import { getQuery } from '../utils/telegraf'
import { findMark, findPin2Pin } from './handler'
import { XCCError } from './types'

export const bot = new Composer()

bot.command('/mark', async (ctx) => {
  const rows = await findMark(getQuery(ctx.message))
  if (rows.length === 0) throw new XCCError('No Result')
  const lines = rows.map((r) => `<pre>${r.smd}: ${r.title}</pre>`)
  await ctx.reply(Array.from(new Set(lines)).join('\n'), {
    parse_mode: 'HTML',
    reply_to_message_id: ctx.message.message_id,
  })
})

bot.command('/pin2pin', async (ctx) => {
  let rows = await findPin2Pin(getQuery(ctx.message))
  rows = rows.filter((r) => r.level === 1)
  if (rows.length === 0) throw new XCCError('No Result')
  rows.sort((a, b) => a.pinTitle.localeCompare(b.pinTitle, 'en-US', { numeric: true }))
  const lines = rows.map((d) => `<pre>${d.pinTitle.replace(/ /g, '-')}</pre>`)
  await ctx.reply(Array.from(new Set(lines)).join('\n'), {
    parse_mode: 'HTML',
    reply_to_message_id: ctx.message.message_id,
  })
})
