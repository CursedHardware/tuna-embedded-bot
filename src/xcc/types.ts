export interface Payload<T> {
  code: number
  msg: string
  data: T
}

export interface WareDetailRow {
  brandName: string
  pdfUrl: string
  title: string
}

export class XCCError extends Error {
  name = 'XCCError'

  constructor(message: string) {
    super(message)
  }
}
