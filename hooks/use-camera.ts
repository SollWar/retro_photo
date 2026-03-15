import { useEffect, useRef, useState, type RefObject } from 'react'

import { drawPhotoOverlay, stopMediaStream } from '@/lib/camera-utils'
import type { CaptureSettings, FilterDefinition } from '@/lib/types'

type UseCameraResult = {
  videoRef: RefObject<HTMLVideoElement | null>
  previewCanvasRef: RefObject<HTMLCanvasElement | null>
  downloadAnchorRef: RefObject<HTMLAnchorElement | null>
  devices: MediaDeviceInfo[]
  activeDeviceId: string | null
  isReady: boolean
  isStarting: boolean
  error: string | null
  startCamera: (deviceId?: string) => Promise<void>
  capturePhoto: (filter: FilterDefinition, settings: CaptureSettings) => void
}

export function useCamera(): UseCameraResult {
  const videoRef = useRef<HTMLVideoElement>(null)
  const previewCanvasRef = useRef<HTMLCanvasElement>(null)
  const downloadAnchorRef = useRef<HTMLAnchorElement>(null)
  const activeStreamRef = useRef<MediaStream | null>(null)

  const [devices, setDevices] = useState<MediaDeviceInfo[]>([])
  const [activeDeviceId, setActiveDeviceId] = useState<string | null>(null)
  const [isReady, setIsReady] = useState(false)
  const [isStarting, setIsStarting] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastCaptureUrl, setLastCaptureUrl] = useState<string | null>(null)

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
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
          audio: false,
        })

        activeStreamRef.current = initialStream
        if (videoRef.current) {
          videoRef.current.srcObject = initialStream
        }

        const availableDevices = await navigator.mediaDevices.enumerateDevices()
        const videoInputs = availableDevices.filter(
          (device) => device.kind === 'videoinput',
        )

        setDevices(videoInputs)

        const initialTrack = initialStream.getVideoTracks()[0]
        const currentDeviceId = initialTrack.getSettings().deviceId
        setActiveDeviceId(currentDeviceId ?? videoInputs[0]?.deviceId ?? null)
        setIsReady(true)
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
              width: { ideal: 1920 },
              height: { ideal: 1080 },
            }
          : {
              facingMode: { ideal: 'environment' },
              width: { ideal: 1920 },
              height: { ideal: 1080 },
            },
        audio: false,
      })

      stopMediaStream(activeStreamRef.current)
      activeStreamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play().catch(() => undefined)
      }

      const track = stream.getVideoTracks()[0]
      setActiveDeviceId(track.getSettings().deviceId ?? deviceId ?? null)
      setIsReady(true)
    } catch {
      setError('Не удалось переключить камеру.')
    } finally {
      setIsStarting(false)
    }
  }

  function capturePhoto(filter: FilterDefinition, settings: CaptureSettings) {
    const video = videoRef.current
    const canvas = previewCanvasRef.current
    const anchor = downloadAnchorRef.current

    if (!video || !canvas || !anchor || video.videoWidth === 0 || video.videoHeight === 0) {
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

    canvas.toBlob(
      (blob) => {
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
      },
      'image/jpeg',
      0.95,
    )
  }

  return {
    videoRef,
    previewCanvasRef,
    downloadAnchorRef,
    devices,
    activeDeviceId,
    isReady,
    isStarting,
    error,
    startCamera,
    capturePhoto,
  }
}
