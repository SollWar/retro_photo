import { useEffect, useRef, useState, type RefObject } from 'react'

import {
  canvasToBlob,
  drawBlobToCanvas,
  drawPhotoOverlay,
  stopMediaStream,
} from '@/lib/camera-utils'
import type {
  CapturedFrame,
  CaptureResolution,
  CaptureSettings,
  FilterDefinition,
  PreviewPerformanceProfile,
} from '@/lib/types'

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
  devices: MediaDeviceInfo[]
  activeDeviceId: string | null
  previewAspectRatio: number
  photoResolution: CaptureResolution | null
  isReady: boolean
  isStarting: boolean
  error: string | null
  startCamera: (deviceId?: string) => Promise<void>
  capturePhoto: (
    filter: FilterDefinition,
    settings: CaptureSettings,
  ) => Promise<CapturedFrame | null>
}

const IDEAL_CAPTURE_WIDTH = 4096
const IDEAL_CAPTURE_HEIGHT = 3072
const FULL_PREVIEW_WIDTH = 1920
const FULL_PREVIEW_HEIGHT = 1440
const BALANCED_PREVIEW_WIDTH = 1280
const BALANCED_PREVIEW_HEIGHT = 960

function getPreviewConstraints(
  profile: PreviewPerformanceProfile,
  deviceId?: string,
): MediaTrackConstraints {
  const isBalanced = profile === 'balanced'
  const baseConstraints: MediaTrackConstraints = {
    width: {
      ideal: isBalanced ? BALANCED_PREVIEW_WIDTH : FULL_PREVIEW_WIDTH,
    },
    height: {
      ideal: isBalanced ? BALANCED_PREVIEW_HEIGHT : FULL_PREVIEW_HEIGHT,
    },
    aspectRatio: { ideal: 4 / 3 },
    frameRate: isBalanced ? { ideal: 24, max: 24 } : { ideal: 30, max: 30 },
  }

  if (deviceId) {
    return {
      ...baseConstraints,
      deviceId: { exact: deviceId },
    }
  }

  return {
    ...baseConstraints,
    facingMode: { ideal: 'environment' },
  }
}

function selectMaxFourByThreeSize(capabilities?: {
  imageWidth?: { min?: number; max?: number; step?: number }
  imageHeight?: { min?: number; max?: number; step?: number }
}) {
  const maxWidth = capabilities?.imageWidth?.max ?? IDEAL_CAPTURE_WIDTH
  const maxHeight = capabilities?.imageHeight?.max ?? IDEAL_CAPTURE_HEIGHT
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
    const normalizedHeight =
      fallbackHeight + ((heightStep - (fallbackHeight % heightStep)) % heightStep)
    const normalizedWidth = Math.max(minWidth, Math.floor((normalizedHeight * 4) / 3))

    return {
      width: normalizedWidth,
      height: normalizedHeight,
    }
  }

  return { width, height }
}

async function getPreferredPhotoSize(
  track: MediaStreamTrack,
  fallbackWidth: number,
  fallbackHeight: number,
) {
  if (!('ImageCapture' in window)) {
    return { width: fallbackWidth, height: fallbackHeight }
  }

  try {
    const imageCapture = new (
      window as Window & { ImageCapture: new (track: MediaStreamTrack) => ImageCaptureLike }
    ).ImageCapture(track)
    const capabilities = await imageCapture.getPhotoCapabilities?.()
    return selectMaxFourByThreeSize(capabilities)
  } catch {
    return { width: fallbackWidth, height: fallbackHeight }
  }
}

export function useCamera(previewPerformance: PreviewPerformanceProfile): UseCameraResult {
  const videoRef = useRef<HTMLVideoElement>(null)
  const previewCanvasRef = useRef<HTMLCanvasElement>(null)
  const activeStreamRef = useRef<MediaStream | null>(null)

  const [devices, setDevices] = useState<MediaDeviceInfo[]>([])
  const [activeDeviceId, setActiveDeviceId] = useState<string | null>(null)
  const [previewAspectRatio, setPreviewAspectRatio] = useState(3 / 4)
  const [photoResolution, setPhotoResolution] = useState<CaptureResolution | null>(null)
  const [isReady, setIsReady] = useState(false)
  const [isStarting, setIsStarting] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function updatePreviewState(stream: MediaStream) {
    const track = stream.getVideoTracks()[0]
    const settings = track?.getSettings()
    const videoWidth = settings?.width ?? 1080
    const videoHeight = settings?.height ?? 1440
    const photoSize = track
      ? await getPreferredPhotoSize(track, videoWidth, videoHeight)
      : { width: videoWidth, height: videoHeight }

    const photoRatio =
      photoSize.width > 0 && photoSize.height > 0
        ? photoSize.width / photoSize.height
        : 4 / 3
    const isPortraitPreview = videoHeight >= videoWidth

    setPhotoResolution(photoSize)
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
    await updatePreviewState(stream)
    setIsReady(true)
  }

  useEffect(() => {
    return () => {
      stopMediaStream(activeStreamRef.current)
    }
  }, [])

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
          video: getPreviewConstraints(previewPerformance),
          audio: false,
        })

        await attachStream(initialStream)

        const availableDevices = await navigator.mediaDevices.enumerateDevices()
        const videoInputs = availableDevices.filter((device) => device.kind === 'videoinput')

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
        video: getPreviewConstraints(previewPerformance, deviceId),
        audio: false,
      })

      await attachStream(stream, deviceId)
    } catch {
      setError('Не удалось переключить камеру.')
    } finally {
      setIsStarting(false)
    }
  }

  async function capturePhoto(
    filter: FilterDefinition,
    settings: CaptureSettings,
  ): Promise<CapturedFrame | null> {
    const video = videoRef.current
    const canvas = previewCanvasRef.current
    const track = activeStreamRef.current?.getVideoTracks()[0] ?? null

    if (!video || !canvas) {
      return null
    }

    let blobFromCamera: Blob | null = null

    if ('ImageCapture' in window && track) {
      try {
        const imageCapture = new (
          window as Window & { ImageCapture: new (track: MediaStreamTrack) => ImageCaptureLike }
        ).ImageCapture(track)
        const bestSize = await getPreferredPhotoSize(
          track,
          video.videoWidth || IDEAL_CAPTURE_WIDTH,
          video.videoHeight || IDEAL_CAPTURE_HEIGHT,
        )
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
        return null
      }

      const sourceCanvas = document.createElement('canvas')
      sourceCanvas.width = canvas.width
      sourceCanvas.height = canvas.height
      const sourceCtx = sourceCanvas.getContext('2d')
      if (!sourceCtx) {
        return null
      }

      sourceCtx.drawImage(canvas, 0, 0)
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.filter = filter.filter
      ctx.drawImage(sourceCanvas, 0, 0, canvas.width, canvas.height)
      ctx.filter = 'none'
      drawPhotoOverlay(ctx, canvas.width, canvas.height, filter, settings)
    } else {
      if (video.videoWidth === 0 || video.videoHeight === 0) {
        return null
      }

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        return null
      }

      canvas.width = video.videoWidth
      canvas.height = video.videoHeight

      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.filter = filter.filter
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      ctx.filter = 'none'
      drawPhotoOverlay(ctx, canvas.width, canvas.height, filter, settings)
    }

    const blob = await canvasToBlob(canvas, 'image/jpeg', 0.95)
    if (!blob) {
      return null
    }

    return {
      blob,
      width: canvas.width,
      height: canvas.height,
    }
  }

  return {
    videoRef,
    previewCanvasRef,
    devices,
    activeDeviceId,
    previewAspectRatio,
    photoResolution,
    isReady,
    isStarting,
    error,
    startCamera,
    capturePhoto,
  }
}
