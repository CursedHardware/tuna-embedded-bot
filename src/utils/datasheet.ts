import fs from 'fs/promises'
import tempy from 'tempy'
import { exec } from './process'

export function getLuckyURL(keywords: string[]) {
  const url = new URL('https://duckduckgo.com')
  url.searchParams.set('q', ['!', ...keywords].join(' '))
  return url.toString()
}

export function download(url: string) {
  return tempy.file.task(async (outputFile): Promise<Buffer> => {
    await exec(
      'aria2c',
      '--check-certificate=false',
      '--max-concurrent-downloads=32',
      '--split=32',
      '--user-agent=Mozilla/5.0',
      '--dir=/',
      `--out=${outputFile}`,
      url,
    )
    return fs.readFile(outputFile)
  })
}
