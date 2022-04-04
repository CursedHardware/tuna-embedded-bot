import fetch from 'node-fetch'
import urlcat, { ParamMap } from 'urlcat'
import { EMakerZoneError } from './types'

const API_PLATFORM = 'https://platform.emakerzone.com'

export async function get<T>(pathname: string, params: ParamMap = {}) {
  interface Payload {
    errno: number
    errmsg: string
    data: T
  }
  const response = await fetch(urlcat(API_PLATFORM, pathname, params))
  const payload: Payload = await response.json()
  if (payload.errno !== 0) throw new EMakerZoneError(payload.errmsg)
  return payload.data
}
