import fetch from 'node-fetch'
import { Context } from 'telegraf'
import urlcat, { ParamMap } from 'urlcat'
import { reply } from '../utils/reply'
import { ChipDetails as FlashDatasheet, FlashInfoError } from './types'

const HOST = 'https://flashinfo.top'

export async function find(keyword: string) {
  const response = await fetch(urlcat(HOST, '/SearchServlet', { keyword }))
  if (!response.ok) throw new FlashInfoError(response.statusText)
  const rows: string[] = await response.json()
  return rows ?? []
}

export async function handle(ctx: Context, partNumber: string) {
  const datasheet = await get<FlashDatasheet>('/searchFlashByPn', { partNumber })
  return reply(ctx, {
    brand: datasheet.brand,
    model: datasheet.micronPartnumber ?? datasheet.partNumber,
    datasheet: { keywords: [] },
    *html() {
      yield `Brand: <code>${datasheet.brand.split('/')[0]}</code>`
      if (datasheet.micronPartnumber) {
        yield `Part Number: <code>${datasheet.micronPartnumber}</code>`
        yield `FBGA Code: <code>${datasheet.partNumber}</code>`
      } else {
        yield `Part Number: <code>${datasheet.partNumber}</code>`
      }
      const properties = [
        datasheet.packageType,
        datasheet.flashUnit,
        datasheet.flashCapacity,
        `${datasheet.flashCs} CE`,
        `${datasheet.flashDie} Die`,
        datasheet.flashProcess,
      ]
      yield `${datasheet.flashType}: ${properties.join(', ')}`
      yield `Voltage: ${datasheet.voltage.replace(/VCC/g, 'Vcc').replace(/\s+/g, ' ')}`
      yield* datasheet.flashId.split(',').map((id) => `ID: <code>${id}</code>`)
    },
  })
}

async function get<T>(pathname: string, params: ParamMap = {}) {
  interface Payload {
    code: number
    msg: string
    data: T
  }
  const response = await fetch(urlcat(HOST, pathname, params))
  const payload: Payload = await response.json()
  if (payload.code !== 0) throw new FlashInfoError(payload.msg)
  return payload.data
}
