export interface Payload<T> {
  code: number
  msg: string
  data: T
}

export class XCCError extends Error {
  name = 'XCCError'

  constructor(message: string) {
    super(message)
  }
}
