export interface Payload<T> {
  code: number
  msg: string
  data: T
}

export interface WareSMDElement {
  id: number
  pins: string
  smd: string
  title: string
  sources: string
  brandId: string
  brandName: string
  brandNameCn: string
  brandNameEn: string
  describee: string
  packages: string
}
