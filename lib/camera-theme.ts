import type { CSSProperties } from 'react'

import type { FilterDefinition } from './types'

type Rgb = [number, number, number]

const RANDOM_TONE: Rgb = [211, 160, 98]
const RANDOM_TINT: Rgb = [232, 190, 132]
const RANDOM_BLOOM: Rgb = [246, 225, 188]

function mixColor(base: Rgb, target: Rgb, weight: number): Rgb {
  const ratio = Math.min(1, Math.max(0, weight))

  return [
    Math.round(base[0] + (target[0] - base[0]) * ratio),
    Math.round(base[1] + (target[1] - base[1]) * ratio),
    Math.round(base[2] + (target[2] - base[2]) * ratio),
  ]
}

function rgba([red, green, blue]: Rgb, alpha = 1) {
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`
}

export function getCameraTheme(
  filter: FilterDefinition | null,
  options?: { randomMode?: boolean },
) {
  const tone = filter?.tone ?? RANDOM_TONE
  const tint = filter?.previewTint ?? RANDOM_TINT
  const bloom = filter?.bloomTint ?? RANDOM_BLOOM
  const randomMode = options?.randomMode ?? false

  const accent = mixColor(tint, bloom, 0.34)
  const accentSoft = mixColor(accent, [255, 245, 224], 0.22)
  const accentText = mixColor([43, 24, 13], tone, 0.18)
  const bg = mixColor([18, 11, 8], tone, filter ? 0.1 : 0.08)
  const bgSoft = mixColor([20, 13, 9], tone, filter ? 0.14 : 0.1)
  const panel = mixColor([26, 18, 13], tone, filter ? 0.2 : 0.16)
  const card = mixColor([36, 23, 16], tone, filter ? 0.18 : 0.14)
  const chip = mixColor([36, 24, 17], tone, filter ? 0.24 : 0.18)
  const borderBase = mixColor(accentSoft, [255, 239, 213], 0.12)
  const label = mixColor(accentSoft, [255, 231, 196], 0.18)
  const text = mixColor([245, 235, 220], bloom, 0.14)
  const textSoft = mixColor([213, 191, 163], text, 0.3)
  const inactiveStripe = mixColor(card, tone, 0.18)
  const shellGlow = mixColor(tone, accentSoft, 0.35)
  const shellLine = mixColor(bloom, tone, 0.18)
  const previewGlow = mixColor(tone, tint, 0.35)

  return {
    '--theme-bg': rgba(bg),
    '--theme-bg-soft': rgba(bgSoft),
    '--theme-panel': rgba(panel, 0.94),
    '--theme-card': rgba(card),
    '--theme-chip': rgba(chip),
    '--theme-border': rgba(borderBase, 0.18),
    '--theme-border-soft': rgba(borderBase, 0.14),
    '--theme-border-strong': rgba(accentSoft, 0.34),
    '--theme-border-faint': rgba(accentSoft, 0.05),
    '--theme-text': rgba(text),
    '--theme-text-soft': rgba(textSoft, 0.78),
    '--theme-label': rgba(label, 0.74),
    '--theme-accent': rgba(accent),
    '--theme-accent-soft': rgba(accentSoft),
    '--theme-accent-text': rgba(accentText),
    '--theme-accent-ring': rgba(accentText, 0.34),
    '--theme-hud-line': rgba(accentSoft, 0.86),
    '--theme-status-panel': rgba(panel, 0.88),
    '--theme-inactive-stripe': rgba(inactiveStripe),
    '--theme-shell-background': `radial-gradient(circle at top, ${rgba(shellGlow, randomMode ? 0.16 : 0.18)}, transparent 28%), linear-gradient(180deg, ${rgba(shellLine, 0.05)}, ${rgba(bg)} 82%)`,
    '--theme-preview-background': `radial-gradient(circle at top, ${rgba(previewGlow, 0.18)}, transparent 28%), linear-gradient(180deg, ${rgba(bloom, 0.05)}, transparent 22%, transparent 82%, ${rgba(tone, 0.05)})`,
    '--theme-error-border': 'rgba(248, 113, 113, 0.4)',
    '--theme-error-background': 'rgba(42, 18, 18, 0.88)',
    '--theme-error-text': 'rgb(254, 202, 202)',
  } as CSSProperties
}
