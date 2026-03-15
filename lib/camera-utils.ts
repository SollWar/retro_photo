import type { CaptureSettings, FilterDefinition } from './types'

export function stopMediaStream(stream: MediaStream | null) {
  stream?.getTracks().forEach((track) => track.stop())
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

export function drawPhotoOverlay(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  filter: FilterDefinition,
  settings: CaptureSettings,
) {
  const centerX = width / 2
  const centerY = height / 2

  const vignette = ctx.createRadialGradient(
    centerX,
    centerY,
    Math.min(width, height) * 0.18,
    centerX,
    centerY,
    Math.max(width, height) * 0.72,
  )
  const vignetteStrength = clamp(filter.vignette * settings.vignetteBoost, 0, 0.8)
  vignette.addColorStop(0, 'rgba(0,0,0,0)')
  vignette.addColorStop(0.65, 'rgba(0,0,0,0)')
  vignette.addColorStop(1, `rgba(0,0,0,${vignetteStrength})`)
  ctx.fillStyle = vignette
  ctx.fillRect(0, 0, width, height)

  const leak = ctx.createLinearGradient(0, 0, width * 0.7, height)
  leak.addColorStop(0, `rgba(${filter.tone[0]}, ${filter.tone[1]}, ${filter.tone[2]}, 0.34)`)
  leak.addColorStop(0.28, `rgba(${filter.tone[0]}, ${filter.tone[1]}, ${filter.tone[2]}, 0.12)`)
  leak.addColorStop(0.8, 'rgba(255,255,255,0)')
  ctx.fillStyle = leak
  ctx.fillRect(0, 0, width, height)

  const grainOpacity = clamp(filter.grain * settings.grainBoost, 0.06, 0.38)
  const imageData = ctx.getImageData(0, 0, width, height)
  const data = imageData.data

  for (let index = 0; index < data.length; index += 4) {
    const noise = (Math.random() - 0.5) * 255 * grainOpacity
    data[index] = clamp(data[index] + noise, 0, 255)
    data[index + 1] = clamp(data[index + 1] + noise, 0, 255)
    data[index + 2] = clamp(data[index + 2] + noise, 0, 255)
  }

  ctx.putImageData(imageData, 0, 0)

  if (!settings.showTimestamp) {
    return
  }

  const stamp = new Date().toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  })

  ctx.save()
  ctx.translate(width - 44, height - 38)
  ctx.font = `${Math.max(18, width * 0.02)}px monospace`
  ctx.textAlign = 'right'
  ctx.shadowColor = 'rgba(0,0,0,0.55)'
  ctx.shadowBlur = 10
  ctx.fillStyle = filter.dateTint
  ctx.fillText(stamp, 0, 0)
  ctx.restore()
}
