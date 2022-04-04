export interface ChipDetails {
  id: number
  partNumber: string
  brand: string
  flashType: string
  flashCapacity: string
  flashUnit: string
  flashBitWeigh: string
  flashProcess: string
  generation: number
  flashCs: number
  flashDie: number
  voltage: string
  packageType: string
  flashId: string
  flashRb: string
  workingType: string
  micronPartnumber: string
  nandController: string
  flashController: string
}

export class FlashInfoError extends Error {
  name = 'FlashInfoError'
}
