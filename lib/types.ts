export type FilterDefinition = {
  id: string
  name: string
  description: string
  filter: string
  tone: [number, number, number]
  previewTint: [number, number, number]
  previewTintOpacity: number
  bloomTint: [number, number, number]
  bloomOpacity: number
  grainScale: number
  lightLeak: string
  dateTint: string
  vignette: number
  grain: number
}

export type PreviewPerformanceProfile = 'full' | 'balanced'

export type CaptureSettings = {
  filterId: string
  grainBoost: number
  vignetteBoost: number
  showTimestamp: boolean
}

export type CaptureResolution = {
  width: number
  height: number
}

export type CapturedFrame = {
  blob: Blob
  width: number
  height: number
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
