import { randomBytes } from 'crypto'
import fs from 'fs/promises'
import urlcat from 'urlcat'
import { exec } from './process'

export function getLuckyURL(query: string) {
  return urlcat('https://duckduckgo.com', { q: `! ${query}` })
}

export async function download(url: string) {
  try {
    const outfile = randomBytes(16).toString('hex')
    await exec(
      'aria2c',
      '--check-certificate=false',
      '--max-concurrent-downloads=32',
      '--split=32',
      '--user-agent=Mozilla/5.0',
      '--dir=/tmp',
      `--out=${outfile}`,
      url,
    )
    return fs.readFile(`/tmp/${outfile}`)
  } catch {
    return null
  }
}
