import fs from 'fs/promises'
import tempy from 'tempy'
import urlcat from 'urlcat'
import { exec } from './process'

export function getLuckyURL(keywords: string[]) {
  return urlcat('https://duckduckgo.com', { q: ['!', ...keywords].join(' ') })
}

export function download(url: string) {
  return tempy.file.task(async (inputFile): Promise<Buffer> => {
    await exec(
      'aria2c',
      '--check-certificate=false',
      '--max-concurrent-downloads=32',
      '--split=32',
      '--user-agent=Mozilla/5.0',
      '--dir=/',
      `--out=${inputFile}`,
      url,
    )
    return fs.readFile(inputFile)
  })
}
