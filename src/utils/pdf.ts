import fs from 'fs/promises'
import tempy from 'tempy'
import { exec } from './process'

export function isPDF(input: string | undefined | null): input is string {
  return !!(input?.length && /\.pdf$/i.test(new URL(input).pathname))
}

export function getPDFPage(content: Buffer, index = 0) {
  return tempy.file.task(
    async (outputFile) => {
      const callback = (inputFile: string) => {
        return exec(
          'convert',
          '-density',
          '300',
          '-scale',
          '1280x1280',
          '-trim',
          '+repage',
          `${inputFile}[${index}]`,
          outputFile,
        )
      }
      await tempy.write.task(content, callback, { extension: '.pdf' })
      return fs.readFile(outputFile)
    },
    { extension: '.png' },
  )
}
