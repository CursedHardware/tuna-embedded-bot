export interface WareDetailRow {
  brandName: string
  pdfUrl: string
  title: string
}

export class XCCError extends Error {
  name = 'XCCError'
}
