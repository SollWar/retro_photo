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

  ctx.save()
  ctx.globalCompositeOperation = 'soft-light'
  ctx.fillStyle = `rgba(${filter.previewTint[0]}, ${filter.previewTint[1]}, ${filter.previewTint[2]}, ${filter.previewTintOpacity})`
  ctx.fillRect(0, 0, width, height)
  ctx.restore()

  const bloom = ctx.createRadialGradient(
    width * 0.18,
    height * 0.16,
    0,
    width * 0.18,
    height * 0.16,
    Math.max(width, height) * 0.8,
  )
  bloom.addColorStop(
    0,
    `rgba(${filter.bloomTint[0]}, ${filter.bloomTint[1]}, ${filter.bloomTint[2]}, ${filter.bloomOpacity})`,
  )
  bloom.addColorStop(0.45, `rgba(${filter.bloomTint[0]}, ${filter.bloomTint[1]}, ${filter.bloomTint[2]}, ${filter.bloomOpacity * 0.32})`)
  bloom.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.save()
  ctx.globalCompositeOperation = 'screen'
  ctx.fillStyle = bloom
  ctx.fillRect(0, 0, width, height)
  ctx.restore()

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

export async function drawBlobToCanvas(
  blob: Blob,
  canvas: HTMLCanvasElement,
): Promise<CanvasRenderingContext2D | null> {
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    return null
  }

  if ('createImageBitmap' in window) {
    const bitmap = await createImageBitmap(blob)
    canvas.width = bitmap.width
    canvas.height = bitmap.height
    ctx.clearRect(0, 0, bitmap.width, bitmap.height)
    ctx.drawImage(bitmap, 0, 0, bitmap.width, bitmap.height)
    bitmap.close()
    return ctx
  }

  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const objectUrl = URL.createObjectURL(blob)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(objectUrl)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('Failed to load captured image blob'))
    }
    img.src = objectUrl
  })

  canvas.width = image.naturalWidth
  canvas.height = image.naturalHeight
  ctx.clearRect(0, 0, image.naturalWidth, image.naturalHeight)
  ctx.drawImage(image, 0, 0, image.naturalWidth, image.naturalHeight)

  return ctx
}

export function canvasToBlob(
  canvas: HTMLCanvasElement,
  type = 'image/jpeg',
  quality = 0.95,
) {
  return new Promise<Blob | null>((resolve) => {
    canvas.toBlob((blob) => resolve(blob), type, quality)
  })
}

export function downloadBlob(blob: Blob, filename: string) {
  const objectUrl = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = objectUrl
  anchor.download = filename
  anchor.click()
  setTimeout(() => URL.revokeObjectURL(objectUrl), 0)
}

export async function shareBlob(blob: Blob, filename: string, title: string) {
  if (typeof navigator === 'undefined' || !navigator.share) {
    return 'unsupported' as const
  }

  try {
    const file = new File([blob], filename, { type: blob.type || 'image/jpeg' })
    const shareData: ShareData = {
      title,
      files: [file],
    }

    const navigatorWithCanShare = navigator as Navigator & {
      canShare?: (data?: ShareData) => boolean
    }

    if (navigatorWithCanShare.canShare && !navigatorWithCanShare.canShare(shareData)) {
      return 'unsupported' as const
    }

    await navigator.share(shareData)
    return 'shared' as const
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      return 'cancelled' as const
    }

    return 'unsupported' as const
  }
}
