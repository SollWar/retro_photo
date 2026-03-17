import type { CaptureSettings, FilterDefinition } from './types'

export const RANDOM_FILTER_ID = 'random-filter'

export const RANDOM_FILTER_OPTION = {
  id: RANDOM_FILTER_ID,
  name: 'СЛУЧАЙНЫЙ ФИЛЬТР',
  description: 'В превью без эффекта, случайный фильтр применяется только при съемке.',
}

export const FILTERS: FilterDefinition[] = [
  {
    id: 'sunset-superia',
    name: 'SUNSET SUPERIA',
    description: 'Теплая пленка с янтарными тенями.',
    filter:
      'sepia(0.42) saturate(1.45) contrast(1.22) brightness(1.04) hue-rotate(-10deg)',
    tone: [255, 166, 85],
    previewTint: [255, 189, 108],
    previewTintOpacity: 0.14,
    bloomTint: [255, 212, 130],
    bloomOpacity: 0.18,
    grainScale: 1.05,
    lightLeak: 'from-orange-400/28 via-amber-200/12 to-transparent',
    dateTint: '#ffd28c',
    vignette: 0.3,
    grain: 0.18,
  },
  {
    id: 'kodachrome-64',
    name: 'KODACHROME 64',
    description: 'Глубокая ретро-пленка с насыщенными красными и золотыми.',
    filter:
      'sepia(0.34) saturate(1.62) contrast(1.28) brightness(1.02) hue-rotate(-18deg)',
    tone: [234, 112, 58],
    previewTint: [250, 167, 98],
    previewTintOpacity: 0.16,
    bloomTint: [255, 220, 149],
    bloomOpacity: 0.14,
    grainScale: 0.92,
    lightLeak: 'from-orange-500/26 via-yellow-200/10 to-transparent',
    dateTint: '#ffcf8e',
    vignette: 0.34,
    grain: 0.2,
  },
  {
    id: 'portra-400',
    name: 'PORTRA 400',
    description: 'Мягкая профессиональная пленка с пастельными светами.',
    filter:
      'sepia(0.18) saturate(1.08) contrast(0.94) brightness(1.08) hue-rotate(-6deg)',
    tone: [255, 208, 178],
    previewTint: [255, 221, 200],
    previewTintOpacity: 0.11,
    bloomTint: [255, 238, 218],
    bloomOpacity: 0.2,
    grainScale: 1.18,
    lightLeak: 'from-rose-100/24 via-amber-100/12 to-transparent',
    dateTint: '#ffe9d0',
    vignette: 0.18,
    grain: 0.12,
  },
  {
    id: 'neon-vhs',
    name: 'NEON VHS',
    description: 'Холодный VHS с яркими бликами.',
    filter: 'contrast(1.28) saturate(1.5) brightness(0.96) hue-rotate(14deg)',
    tone: [74, 214, 201],
    previewTint: [79, 167, 255],
    previewTintOpacity: 0.12,
    bloomTint: [255, 120, 222],
    bloomOpacity: 0.16,
    grainScale: 1.28,
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
    previewTint: [230, 230, 230],
    previewTintOpacity: 0.08,
    bloomTint: [255, 255, 255],
    bloomOpacity: 0.08,
    grainScale: 0.86,
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
    previewTint: [255, 233, 206],
    previewTintOpacity: 0.13,
    bloomTint: [255, 244, 222],
    bloomOpacity: 0.22,
    grainScale: 1.32,
    lightLeak: 'from-rose-200/24 via-amber-100/15 to-transparent',
    dateTint: '#fff0d8',
    vignette: 0.2,
    grain: 0.14,
  },
  {
    id: 'ccd-silver',
    name: 'CCD SILVER',
    description: 'Первые цифровые камеры с холодным серебристым светом.',
    filter:
      'contrast(1.12) saturate(0.92) brightness(1.08) hue-rotate(10deg) sepia(0.06)',
    tone: [160, 206, 255],
    previewTint: [172, 210, 255],
    previewTintOpacity: 0.12,
    bloomTint: [225, 238, 255],
    bloomOpacity: 0.16,
    grainScale: 0.78,
    lightLeak: 'from-sky-200/22 via-blue-100/10 to-transparent',
    dateTint: '#dcecff',
    vignette: 0.14,
    grain: 0.08,
  },
  {
    id: 'digicam-2001',
    name: 'DIGICAM 2001',
    description: 'Ранний CCD с легким цианом, вспышечным контрастом и crisp look.',
    filter:
      'contrast(1.22) saturate(1.08) brightness(1.05) hue-rotate(6deg) sepia(0.04)',
    tone: [132, 190, 255],
    previewTint: [170, 210, 255],
    previewTintOpacity: 0.1,
    bloomTint: [255, 255, 255],
    bloomOpacity: 0.1,
    grainScale: 0.72,
    lightLeak: 'from-cyan-200/18 via-white/8 to-transparent',
    dateTint: '#cfe7ff',
    vignette: 0.1,
    grain: 0.06,
  },
  {
    id: 'flashback-y2k',
    name: 'FLASHBACK Y2K',
    description: 'Попсовая ранняя цифра с теплыми лицами и ослепляющими светами.',
    filter:
      'contrast(1.16) saturate(1.26) brightness(1.1) sepia(0.14) hue-rotate(-8deg)',
    tone: [255, 194, 148],
    previewTint: [255, 214, 173],
    previewTintOpacity: 0.13,
    bloomTint: [255, 241, 224],
    bloomOpacity: 0.24,
    grainScale: 0.94,
    lightLeak: 'from-amber-200/28 via-white/8 to-transparent',
    dateTint: '#ffe3b0',
    vignette: 0.12,
    grain: 0.09,
  },
  {
    id: 'super-8-gold',
    name: 'SUPER 8 GOLD',
    description: 'Зернистая кинопленка с мягкими бликами и плотной рамкой.',
    filter:
      'sepia(0.48) saturate(1.28) contrast(1.12) brightness(0.98) hue-rotate(-15deg)',
    tone: [245, 173, 79],
    previewTint: [250, 188, 105],
    previewTintOpacity: 0.17,
    bloomTint: [255, 226, 146],
    bloomOpacity: 0.19,
    grainScale: 1.46,
    lightLeak: 'from-orange-400/30 via-yellow-100/12 to-transparent',
    dateTint: '#ffd784',
    vignette: 0.42,
    grain: 0.28,
  },
]

export const defaultSettings: CaptureSettings = {
  filterId: FILTERS[0].id,
  grainBoost: 0.8,
  vignetteBoost: 0.72,
  showTimestamp: true,
}

export function getFilterById(filterId: string) {
  return FILTERS.find((filter) => filter.id === filterId)
}

export function isRandomFilterId(filterId: string) {
  return filterId === RANDOM_FILTER_ID
}

export function pickRandomFilter() {
  if (FILTERS.length === 0) {
    return undefined
  }

  const randomIndex = Math.floor(Math.random() * FILTERS.length)
  return FILTERS[randomIndex]
}
