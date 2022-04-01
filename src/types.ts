export class NoResultError extends Error {
  name = 'NoResultError'

  constructor() {
    super('No Result')
  }
}

export class IntelError extends Error {
  name = 'IntelError'

  constructor(message: string) {
    super(message)
  }
}

export class SemieeError extends Error {
  name = 'XCCError'

  constructor(message: string) {
    super(message)
  }
}

export class SZLCSCError extends Error {
  name = 'SZLCSCError'

  constructor(message: string) {
    super(message)
  }
}

export class XCCError extends Error {
  name = 'XCCError'

  constructor(message: string) {
    super(message)
  }
}
