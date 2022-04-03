import fetch from 'node-fetch'
import { Composer } from 'telegraf'
import urlcat, { ParamMap } from 'urlcat'
import { NoResultError } from '../types'
import { getQuery } from '../utils/telegraf'
import { Payload, XCCError } from './types'

export const bot = new Composer()

bot.command('/mark', async (ctx) => {
  interface Row {
    smd: string
    title: string
  }
  const { rows } = await get<{ rows: Row[] }>('/search/wareSmd', {
    searchContent: getQuery(ctx.message),
    pageIndex: 1,
    pageSize: 50,
  })
  if (rows.length === 0) throw new NoResultError()
  const lines = rows.map((r) => `<pre>${r.smd}: ${r.title}</pre>`)
  await ctx.reply(Array.from(new Set(lines)).join('\n'), {
    parse_mode: 'HTML',
    reply_to_message_id: ctx.message.message_id,
  })
})

bot.command('/pin2pin', async (ctx) => {
  interface Row {
    level: number
    pinTitle: string
  }
  const { pageResult } = await get<{ pageResult: { rows: Row[] } }>('/search/ware-pin', {
    searchContent: getQuery(ctx.message),
    pageIndex: 1,
    pageSize: 50,
  })
  const rows = pageResult.rows.filter((r) => r.level === 1)
  if (rows.length === 0) throw new NoResultError()
  rows.sort((a, b) => a.pinTitle.localeCompare(b.pinTitle, 'en-US', { numeric: true }))
  const lines = rows.map((d) => `<pre>${d.pinTitle.replace(/ /g, '-')}</pre>`)
  await ctx.reply(Array.from(new Set(lines)).join('\n'), {
    parse_mode: 'HTML',
    reply_to_message_id: ctx.message.message_id,
  })
})

async function get<T>(pathname: string, params: ParamMap = {}) {
  const response = await fetch(urlcat('https://app-api.xcc.com', pathname, params))
  const payload: Payload<T> = await response.json()
  if (payload.code !== 200) throw new XCCError(payload.msg)
  return payload.data
}
