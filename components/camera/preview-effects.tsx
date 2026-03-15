import type { CSSProperties } from 'react'

import type { FilterDefinition } from '@/lib/types'

type PreviewEffectsProps = {
  filter: FilterDefinition
  grainBoost: number
  vignetteBoost: number
}

export function PreviewEffects({
  filter,
  grainBoost,
  vignetteBoost,
}: PreviewEffectsProps) {
  const grainOpacity = Math.min(0.36, Math.max(0.08, filter.grain * grainBoost))
  const vignetteOpacity = Math.min(0.78, Math.max(0.12, filter.vignette * vignetteBoost))
  const grainScale = Math.max(0.72, Math.min(1.5, filter.grainScale))
  const grainPrimary = Math.round(14 * grainScale)
  const grainSecondary = Math.round(17 * grainScale)
  const grainTertiary = Math.round(9 * grainScale)

  return (
    <>
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(circle at center, rgba(0,0,0,0) 42%, rgba(0,0,0,${vignetteOpacity * 0.38}) 72%, rgba(0,0,0,${vignetteOpacity}) 100%)`,
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 mix-blend-soft-light"
        style={{
          background: `linear-gradient(180deg, rgba(${filter.previewTint[0]}, ${filter.previewTint[1]}, ${filter.previewTint[2]}, ${filter.previewTintOpacity}) 0%, rgba(${filter.previewTint[0]}, ${filter.previewTint[1]}, ${filter.previewTint[2]}, ${filter.previewTintOpacity * 0.5}) 48%, rgba(0,0,0,0) 100%)`,
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 mix-blend-screen"
        style={{
          background: `radial-gradient(circle at 22% 18%, rgba(${filter.bloomTint[0]}, ${filter.bloomTint[1]}, ${filter.bloomTint[2]}, ${filter.bloomOpacity}) 0%, rgba(${filter.bloomTint[0]}, ${filter.bloomTint[1]}, ${filter.bloomTint[2]}, ${filter.bloomOpacity * 0.38}) 24%, rgba(255,255,255,0) 60%)`,
        }}
      />
      <div
        className="preview-grain pointer-events-none absolute inset-0"
        style={
          {
            '--grain-opacity': grainOpacity.toFixed(3),
            '--grain-primary': `${grainPrimary}px`,
            '--grain-secondary': `${grainSecondary}px`,
            '--grain-tertiary': `${grainTertiary}px`,
          } as CSSProperties
        }
      />
      <div
        className="pointer-events-none absolute inset-0 mix-blend-screen"
        style={{
          background: `linear-gradient(115deg, rgba(${filter.tone[0]}, ${filter.tone[1]}, ${filter.tone[2]}, 0.16), rgba(255,255,255,0) 34%, rgba(${filter.tone[0]}, ${filter.tone[1]}, ${filter.tone[2]}, 0.08) 70%, rgba(0,0,0,0) 100%)`,
          opacity: Math.min(0.34, 0.12 + grainOpacity * 0.45),
        }}
      />
    </>
  )
}
