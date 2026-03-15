import type { CaptureSettings, FilterDefinition } from './types'

export const FILTERS: FilterDefinition[] = [
  {
    id: 'sunset-superia',
    name: 'SUNSET SUPERIA',
    description: 'Теплая пленка с янтарными тенями.',
    filter:
      'sepia(0.42) saturate(1.45) contrast(1.22) brightness(1.04) hue-rotate(-10deg)',
    tone: [255, 166, 85],
    lightLeak: 'from-orange-400/28 via-amber-200/12 to-transparent',
    dateTint: '#ffd28c',
    vignette: 0.3,
    grain: 0.18,
  },
  {
    id: 'neon-vhs',
    name: 'NEON VHS',
    description: 'Холодный VHS с яркими бликами.',
    filter: 'contrast(1.28) saturate(1.5) brightness(0.96) hue-rotate(14deg)',
    tone: [74, 214, 201],
    lightLeak: 'from-fuchsia-500/22 via-cyan-300/10 to-transparent',
    dateTint: '#92fff4',
    vignette: 0.4,
    grain: 0.24,
  },
  {
    id: 'mono-noir',
    name: 'MONO NOIR',
    description: 'Жесткий монохромный режим.',
    filter: 'grayscale(1) contrast(1.4) brightness(0.92)',
    tone: [240, 240, 240],
    lightLeak: 'from-white/12 via-transparent to-black/20',
    dateTint: '#f5f5f5',
    vignette: 0.46,
    grain: 0.22,
  },
  {
    id: 'polaroid-dream',
    name: 'POLAROID DREAM',
    description: 'Мягкий выцветший полароид.',
    filter: 'sepia(0.22) saturate(1.1) contrast(0.9) brightness(1.12)',
    tone: [255, 214, 180],
    lightLeak: 'from-rose-200/24 via-amber-100/15 to-transparent',
    dateTint: '#fff0d8',
    vignette: 0.2,
    grain: 0.14,
  },
]

export const defaultSettings: CaptureSettings = {
  filterId: FILTERS[0].id,
  grainBoost: 0.8,
  vignetteBoost: 0.72,
  showTimestamp: true,
}
