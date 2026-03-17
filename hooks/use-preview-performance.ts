'use client'

import { useState } from 'react'

import type { PreviewPerformanceProfile } from '@/lib/types'

type NavigatorWithPerformanceHints = Navigator & {
  deviceMemory?: number
}

function detectPreviewPerformanceProfile(): PreviewPerformanceProfile {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return 'full'
  }

  const navigatorWithHints = navigator as NavigatorWithPerformanceHints
  const deviceMemory = navigatorWithHints.deviceMemory
  const cpuCores = navigator.hardwareConcurrency ?? 8
  const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

  if (prefersReducedMotion) {
    return 'balanced'
  }

  if ((deviceMemory !== undefined && deviceMemory <= 4) || cpuCores <= 6) {
    return 'balanced'
  }

  return 'full'
}

export function usePreviewPerformance() {
  const [previewPerformance] = useState<PreviewPerformanceProfile>(() =>
    detectPreviewPerformanceProfile(),
  )

  return previewPerformance
}
