export type FilterDefinition = {
  id: string
  name: string
  description: string
  filter: string
  tone: [number, number, number]
  lightLeak: string
  dateTint: string
  vignette: number
  grain: number
}

export type CaptureSettings = {
  filterId: string
  grainBoost: number
  vignetteBoost: number
  showTimestamp: boolean
}

export type BatteryManagerLike = {
  level: number
  charging: boolean
  addEventListener: (type: string, listener: () => void) => void
  removeEventListener: (type: string, listener: () => void) => void
}

export type NavigatorWithBattery = Navigator & {
  getBattery?: () => Promise<BatteryManagerLike>
}

export type MenuView = 'main' | 'filter' | 'camera' | 'grain' | 'vignette' | 'date'
