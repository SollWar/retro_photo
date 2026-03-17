import { useEffect, useRef, useState, type RefObject } from 'react'

import { drawBlobToCanvas, drawPhotoOverlay, stopMediaStream } from '@/lib/camera-utils'
import type { CaptureSettings, FilterDefinition } from '@/lib/types'

type ImageCaptureLike = {
  getPhotoCapabilities?: () => Promise<{
    imageWidth?: { min?: number; max?: number; step?: number }
    imageHeight?: { min?: number; max?: number; step?: number }
  }>
  takePhoto: (settings?: { imageWidth?: number; imageHeight?: number }) => Promise<Blob>
}

type UseCameraResult = {
  videoRef: RefObject<HTMLVideoElement | null>
  previewCanvasRef: RefObject<HTMLCanvasElement | null>
  downloadAnchorRef: RefObject<HTMLAnchorElement | null>
  devices: MediaDeviceInfo[]
  activeDeviceId: string | null
  previewAspectRatio: number
  isReady: boolean
  isStarting: boolean
  error: string | null
  startCamera: (deviceId?: string) => Promise<void>
  capturePhoto: (filter: FilterDefinition, settings: CaptureSettings) => Promise<void>
}

export function useCamera(): UseCameraResult {
  const videoRef = useRef<HTMLVideoElement>(null)
  const previewCanvasRef = useRef<HTMLCanvasElement>(null)
  const downloadAnchorRef = useRef<HTMLAnchorElement>(null)
  const activeStreamRef = useRef<MediaStream | null>(null)

  const [devices, setDevices] = useState<MediaDeviceInfo[]>([])
  const [activeDeviceId, setActiveDeviceId] = useState<string | null>(null)
  const [previewAspectRatio, setPreviewAspectRatio] = useState(3 / 4)
  const [isReady, setIsReady] = useState(false)
  const [isStarting, setIsStarting] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastCaptureUrl, setLastCaptureUrl] = useState<string | null>(null)

  function selectMaxFourByThreeSize(capabilities?: {
    imageWidth?: { min?: number; max?: number; step?: number }
    imageHeight?: { min?: number; max?: number; step?: number }
  }) {
    const maxWidth = capabilities?.imageWidth?.max ?? 4096
    const maxHeight = capabilities?.imageHeight?.max ?? 3072
    const minWidth = capabilities?.imageWidth?.min ?? 640
    const minHeight = capabilities?.imageHeight?.min ?? 480
    const widthStep = Math.max(1, capabilities?.imageWidth?.step ?? 1)
    const heightStep = Math.max(1, capabilities?.imageHeight?.step ?? 1)

    let width = Math.min(maxWidth, Math.floor((maxHeight * 4) / 3))
    let height = Math.floor((width * 3) / 4)

    width -= width % widthStep
    height -= height % heightStep

    if (height > maxHeight) {
      height = maxHeight - (maxHeight % heightStep)
      width = Math.floor((height * 4) / 3)
      width -= width % widthStep
    }

    if (width < minWidth || height < minHeight) {
      const fallbackHeight = Math.max(minHeight, 480)
      const normalizedHeight = fallbackHeight + ((heightStep - (fallbackHeight % heightStep)) % heightStep)
      const normalizedWidth = Math.max(
        minWidth,
        Math.floor((normalizedHeight * 4) / 3),
      )

      return {
        width: normalizedWidth,
        height: normalizedHeight,
      }
    }

    return { width, height }
  }

  async function updatePreviewAspectRatio(stream: MediaStream) {
    const track = stream.getVideoTracks()[0]
    const settings = track?.getSettings()
    const videoWidth = settings?.width ?? 1080
    const videoHeight = settings?.height ?? 1440
    let photoWidth = videoWidth
    let photoHeight = videoHeight

    if ('ImageCapture' in window && track) {
      try {
        const imageCapture = new (window as Window & { ImageCapture: new (track: MediaStreamTrack) => ImageCaptureLike }).ImageCapture(track)
        const capabilities = await imageCapture.getPhotoCapabilities?.()
        const bestSize = selectMaxFourByThreeSize(capabilities)
        photoWidth = bestSize.width
        photoHeight = bestSize.height
      } catch {
        // Ignore unsupported ImageCapture capabilities.
      }
    }

    const photoRatio = photoWidth > 0 && photoHeight > 0 ? photoWidth / photoHeight : 4 / 3
    const isPortraitPreview = videoHeight >= videoWidth
    setPreviewAspectRatio(isPortraitPreview ? 1 / photoRatio : photoRatio)
  }

  async function attachStream(stream: MediaStream, requestedDeviceId?: string) {
    stopMediaStream(activeStreamRef.current)
    activeStreamRef.current = stream

    if (videoRef.current) {
      videoRef.current.srcObject = stream
      await videoRef.current.play().catch(() => undefined)
    }

    const track = stream.getVideoTracks()[0]
    setActiveDeviceId(track.getSettings().deviceId ?? requestedDeviceId ?? null)
    await updatePreviewAspectRatio(stream)
    setIsReady(true)
  }

  useEffect(() => {
    return () => {
      stopMediaStream(activeStreamRef.current)
    }
  }, [])

  useEffect(() => {
    return () => {
      if (lastCaptureUrl) {
        URL.revokeObjectURL(lastCaptureUrl)
      }
    }
  }, [lastCaptureUrl])

  useEffect(() => {
    async function bootstrapCamera() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError('Браузер не поддерживает доступ к камере.')
        setIsStarting(false)
        return
      }

      setIsStarting(true)
      setError(null)

      try {
        const initialStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 4096 },
            height: { ideal: 3072 },
          },
          audio: false,
        })

        await attachStream(initialStream)

        const availableDevices = await navigator.mediaDevices.enumerateDevices()
        const videoInputs = availableDevices.filter(
          (device) => device.kind === 'videoinput',
        )

        setDevices(videoInputs)

        const initialTrack = initialStream.getVideoTracks()[0]
        const currentDeviceId = initialTrack.getSettings().deviceId
        setActiveDeviceId(currentDeviceId ?? videoInputs[0]?.deviceId ?? null)
      } catch {
        setError('Не удалось получить доступ к камере. Проверьте разрешения браузера.')
      } finally {
        setIsStarting(false)
      }
    }

    void bootstrapCamera()
  }, [])

  useEffect(() => {
    const handleDeviceChange = async () => {
      try {
        const availableDevices = await navigator.mediaDevices.enumerateDevices()
        setDevices(availableDevices.filter((device) => device.kind === 'videoinput'))
      } catch {
        // Ignore enumerateDevices errors after permissions change.
      }
    }

    navigator.mediaDevices?.addEventListener?.('devicechange', handleDeviceChange)
    return () => {
      navigator.mediaDevices?.removeEventListener?.('devicechange', handleDeviceChange)
    }
  }, [])

  async function startCamera(deviceId?: string) {
    setError(null)
    setIsStarting(true)

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: deviceId
          ? {
              deviceId: { exact: deviceId },
              width: { ideal: 4096 },
              height: { ideal: 3072 },
            }
          : {
              facingMode: { ideal: 'environment' },
              width: { ideal: 4096 },
              height: { ideal: 3072 },
            },
        audio: false,
      })

      await attachStream(stream, deviceId)
    } catch {
      setError('Не удалось переключить камеру.')
    } finally {
      setIsStarting(false)
    }
  }

  async function capturePhoto(filter: FilterDefinition, settings: CaptureSettings) {
    const video = videoRef.current
    const canvas = previewCanvasRef.current
    const anchor = downloadAnchorRef.current
    const track = activeStreamRef.current?.getVideoTracks()[0] ?? null

    if (!video || !canvas || !anchor) {
      return
    }

    let blobFromCamera: Blob | null = null

    if ('ImageCapture' in window && track) {
      try {
        const imageCapture = new (window as Window & { ImageCapture: new (track: MediaStreamTrack) => ImageCaptureLike }).ImageCapture(track)
        const capabilities = await imageCapture.getPhotoCapabilities?.()
        const bestSize = selectMaxFourByThreeSize(capabilities)
        blobFromCamera = await imageCapture.takePhoto({
          imageWidth: bestSize.width,
          imageHeight: bestSize.height,
        })
      } catch {
        // Fallback to current video frame if takePhoto fails.
      }
    }

    if (blobFromCamera) {
      const ctx = await drawBlobToCanvas(blobFromCamera, canvas)
      if (!ctx) {
        return
      }

      const sourceCanvas = document.createElement('canvas')
      sourceCanvas.width = canvas.width
      sourceCanvas.height = canvas.height
      const sourceCtx = sourceCanvas.getContext('2d')
      if (!sourceCtx) {
        return
      }

      sourceCtx.drawImage(canvas, 0, 0)
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.filter = filter.filter
      ctx.drawImage(sourceCanvas, 0, 0, canvas.width, canvas.height)
      ctx.filter = 'none'
      drawPhotoOverlay(ctx, canvas.width, canvas.height, filter, settings)
    } else {
      if (video.videoWidth === 0 || video.videoHeight === 0) {
        return
      }

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        return
      }

      const width = video.videoWidth
      const height = video.videoHeight

      canvas.width = width
      canvas.height = height

      ctx.clearRect(0, 0, width, height)
      ctx.filter = filter.filter
      ctx.drawImage(video, 0, 0, width, height)
      ctx.filter = 'none'
      drawPhotoOverlay(ctx, width, height, filter, settings)
    }

    canvas.toBlob((blob) => {
      if (!blob) {
        return
      }

      if (lastCaptureUrl) {
        URL.revokeObjectURL(lastCaptureUrl)
      }

      const objectUrl = URL.createObjectURL(blob)
      setLastCaptureUrl(objectUrl)
      anchor.href = objectUrl
      anchor.download = `retro-shot-${Date.now()}.jpg`
      anchor.click()
    }, 'image/jpeg', 0.95)
  }

  return {
    videoRef,
    previewCanvasRef,
    downloadAnchorRef,
    devices,
    activeDeviceId,
    previewAspectRatio,
    isReady,
    isStarting,
    error,
    startCamera,
    capturePhoto,
  }
}
