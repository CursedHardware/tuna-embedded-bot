export const routes = Object.freeze<Record<string, string>>({
  mcu: '/general_MCU',
  motor_soc: '/motor_SOC',
  wireless_soc: '/wireless_SOC',
  mos: '/power_device',
  ldo: '/linear_regulator',
  op: '/operational_amplifier',
  ds_nums: '/DigitalIsolator',
  ds_485: '/Iisolator_485',
  ds_can: '/Iisolator_CAN',
  ds_i2c: '/Iisolator_I2C',
  brushless: '/BLDC',
  brushed: '/Brushes_Stepper_Motor',
  tah: '/temperature_humidity_sensor',
})

export interface SearchedResult {
  id: number
  brand: string
  description: string
  package: string
  pat_number: string
  link: string
  tag: string
}

export class EMakerZoneError extends Error {
  name = 'EMakerZoneError'
}
