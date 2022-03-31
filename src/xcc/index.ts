import fetch from 'node-fetch'
import { Composer } from 'telegraf'
import urlcat, { ParamMap } from 'urlcat'
import { getKeyword } from '../utils'
import type { Payload } from './types'

export const bot = new Composer()

bot.command('/smd', async (ctx) => {
  interface Row {
    smd: string
    title: string
  }
  const { rows } = await get<{ rows: Row[] }>('/search/wareSmd', {
    searchContent: getKeyword(ctx.message),
    pageIndex: 1,
    pageSize: 50,
  })
  if (rows.length === 0) throw new Error('Not Found')
  const lines = rows.map((r) => `<pre>${r.smd}: ${r.title}</pre>`)
  await ctx.reply([...new Set(lines)].join('\n'), {
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
    searchContent: getKeyword(ctx.message),
    pageIndex: 1,
    pageSize: 50,
  })
  const rows = pageResult.rows.filter((r) => r.level === 1)
  if (rows.length === 0) throw new Error('Not Found')
  rows.sort((a, b) => a.pinTitle.localeCompare(b.pinTitle, 'en-US', { numeric: true }))
  const lines = rows.map((d) => `<pre>${d.pinTitle.replace(/ /g, '-')}</pre>`)
  await ctx.reply([...new Set(lines)].join('\n'), {
    parse_mode: 'HTML',
    reply_to_message_id: ctx.message.message_id,
  })
})

async function get<T>(pathname: string, params: ParamMap = {}) {
  const response = await fetch(urlcat('https://app-api.xcc.com', pathname, params))
  const payload: Payload<T> = await response.json()
  if (payload.code !== 200) throw new Error(payload.msg)
  return payload.data
}
