'use client'

import { useEffect, useMemo, useState, type ReactNode } from 'react'

import { useCamera } from '@/hooks/use-camera'
import { useInstallPrompt } from '@/hooks/use-install-prompt'
import { usePreviewPerformance } from '@/hooks/use-preview-performance'
import { downloadBlob, shareBlob } from '@/lib/camera-utils'
import { getCameraTheme } from '@/lib/camera-theme'
import {
  FILTERS,
  RANDOM_FILTER_OPTION,
  defaultSettings,
  getFilterById,
  isRandomFilterId,
  pickRandomFilter,
} from '@/lib/filters'
import type { CaptureSettings } from '@/lib/types'

import { CameraHud } from './camera-hud'
import { CameraMenu } from './camera-menu'
import { CapturePreview } from './capture-preview'
import { PreviewEffects } from './preview-effects'

type CapturedShot = {
  blob: Blob
  url: string
  filename: string
  filterId: string
  filterName: string
  resolutionText: string
  aspectRatio: number
}

function createFilename() {
  return `retro-shot-${Date.now()}.jpg`
}

export function RetroCameraApp() {
  const [settings, setSettings] = useState<CaptureSettings>(defaultSettings)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [capturedShot, setCapturedShot] = useState<CapturedShot | null>(null)
  const [isCaptureActionPending, setIsCaptureActionPending] = useState(false)
  const previewPerformance = usePreviewPerformance()

  const {
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
  } = useCamera(previewPerformance)
  const { canInstall, isInstalled, promptInstall } = useInstallPrompt()

  const selectedFilter = useMemo(() => getFilterById(settings.filterId), [settings.filterId])
  const isRandomFilterMode = isRandomFilterId(settings.filterId)
  const activeFilter = selectedFilter ?? FILTERS[0]
  const previewFilter = isRandomFilterMode ? null : activeFilter
  const themeFilter = capturedShot
    ? getFilterById(capturedShot.filterId) ?? activeFilter
    : isRandomFilterMode
      ? null
      : activeFilter
  const interfaceTheme = useMemo(
    () =>
      getCameraTheme(themeFilter, {
        randomMode: isRandomFilterMode && !capturedShot,
      }),
    [capturedShot, isRandomFilterMode, themeFilter],
  )

  const cameraLabel =
    devices.find((device) => device.deviceId === activeDeviceId)?.label ||
    `Камера ${devices.length || 1}`
  const modeText = isRandomFilterMode ? RANDOM_FILTER_OPTION.name : activeFilter.name
  const resolutionText = photoResolution
    ? `Фото ${photoResolution.width}x${photoResolution.height}`
    : `Формат ${Math.round(previewAspectRatio * 100) / 100}:1`

  useEffect(() => {
    return () => {
      if (capturedShot) {
        URL.revokeObjectURL(capturedShot.url)
      }
    }
  }, [capturedShot])

  async function handleCapture() {
    const filterForCapture = isRandomFilterMode ? pickRandomFilter() : activeFilter
    if (!filterForCapture) {
      return
    }

    const frame = await capturePhoto(filterForCapture, settings)
    if (!frame) {
      return
    }

    const objectUrl = URL.createObjectURL(frame.blob)
    setCapturedShot({
      blob: frame.blob,
      url: objectUrl,
      filename: createFilename(),
      filterId: filterForCapture.id,
      filterName: filterForCapture.name,
      resolutionText: `Фото ${frame.width}x${frame.height}`,
      aspectRatio: frame.width > 0 && frame.height > 0 ? frame.width / frame.height : previewAspectRatio,
    })
  }

  function handleRetake() {
    setCapturedShot(null)
  }

  async function handleSave() {
    if (!capturedShot) {
      return
    }

    setIsCaptureActionPending(true)
    const outcome = await shareBlob(capturedShot.blob, capturedShot.filename, 'Снимок ретро-камеры')
    if (outcome === 'unsupported') {
      downloadBlob(capturedShot.blob, capturedShot.filename)
    }
    setIsCaptureActionPending(false)
  }

  async function handleShare() {
    if (!capturedShot) {
      return
    }

    setIsCaptureActionPending(true)
    const outcome = await shareBlob(
      capturedShot.blob,
      capturedShot.filename,
      `${capturedShot.filterName} - снимок ретро-камеры`,
    )
    if (outcome === 'unsupported') {
      downloadBlob(capturedShot.blob, capturedShot.filename)
    }
    setIsCaptureActionPending(false)
  }

  async function handleCycleCamera() {
    if (devices.length <= 1) {
      return
    }

    const activeIndex = devices.findIndex((device) => device.deviceId === activeDeviceId)
    const nextIndex = activeIndex >= 0 ? (activeIndex + 1) % devices.length : 0
    const nextDevice = devices[nextIndex]

    if (!nextDevice) {
      return
    }

    await startCamera(nextDevice.deviceId)
  }

  return (
    <main
      style={interfaceTheme}
      className="min-h-screen overflow-hidden bg-[color:var(--theme-bg)] text-[color:var(--theme-text)]"
    >
      <canvas ref={previewCanvasRef} className="hidden" />

      <section className="theme-shell mx-auto flex h-[100dvh] w-full max-w-[860px] flex-col overflow-hidden px-3 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-[calc(env(safe-area-inset-top)+10px)] sm:px-4">
        <div className="relative min-h-0 flex-1">
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className="theme-preview-surface relative w-full max-h-full max-w-full overflow-hidden rounded-[34px] border"
              style={{ aspectRatio: `${previewAspectRatio}` }}
            >
              <div className="theme-preview-overlay pointer-events-none absolute inset-0" />
              <video
                ref={videoRef}
                className="absolute inset-0 h-full w-full object-cover opacity-[0.94]"
                autoPlay
                muted
                playsInline
                style={{ filter: previewFilter?.filter ?? 'none' }}
              />

              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_32%,rgba(0,0,0,0.54)_100%)]" />
              {previewFilter ? (
                <div
                  className={`pointer-events-none absolute inset-0 bg-gradient-to-r ${previewFilter.lightLeak}`}
                />
              ) : null}
              {previewFilter ? (
                <PreviewEffects
                  filter={previewFilter}
                  grainBoost={settings.grainBoost}
                  vignetteBoost={settings.vignetteBoost}
                  previewPerformance={previewPerformance}
                />
              ) : null}

              <CameraHud
                showTimestamp={settings.showTimestamp}
                dateTint={previewFilter?.dateTint ?? '#f0d1a2'}
                isStarting={isStarting}
                error={error}
              />

              <button
                type="button"
                onClick={() => setIsMenuOpen(true)}
                className="theme-status-panel theme-text-soft absolute right-3 top-3 z-20 rounded-[16px] border px-4 py-3 font-mono text-[11px] uppercase tracking-[0.26em] backdrop-blur-sm"
              >
                Меню
              </button>
            </div>
          </div>
        </div>

        <div className="theme-panel-surface mt-3 shrink-0 rounded-[26px] border p-3 sm:p-4">
          <div className="flex flex-wrap gap-2">
            <InfoPill strong>{modeText}</InfoPill>
            <InfoPill>{resolutionText}</InfoPill>
            <InfoPill>{cameraLabel}</InfoPill>
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-[minmax(0,1fr)_122px] sm:items-center">
            <button
              type="button"
              onClick={() => {
                void handleCycleCamera()
              }}
              disabled={devices.length <= 1 || isStarting}
              className="theme-secondary-action h-16 w-full rounded-[20px] border px-4 font-mono text-sm uppercase tracking-[0.16em] transition hover:brightness-110 disabled:opacity-50"
            >
              {devices.length > 1 ? 'Сменить камеру' : 'Одна камера'}
            </button>

            <button
              type="button"
              onClick={() => {
                void handleCapture()
              }}
              disabled={!isReady || isStarting}
              className="theme-primary-action h-16 w-full rounded-[20px] border px-4 shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_14px_24px_rgba(0,0,0,0.22)] transition hover:brightness-105 disabled:opacity-50"
            >
              <span className="theme-primary-action-inner grid h-full w-full place-items-center rounded-[14px] border font-mono text-sm uppercase tracking-[0.18em]">
                Снять
              </span>
            </button>
          </div>
        </div>

        <CameraMenu
          isOpen={isMenuOpen}
          settings={settings}
          activeDeviceId={activeDeviceId}
          devices={devices}
          canInstall={canInstall}
          isInstalled={isInstalled}
          onClose={() => setIsMenuOpen(false)}
          onSettingsChange={setSettings}
          onCameraSelect={(deviceId) => {
            void startCamera(deviceId)
          }}
          onInstall={() => {
            void promptInstall()
          }}
        />

        {capturedShot ? (
          <CapturePreview
            imageUrl={capturedShot.url}
            filterName={capturedShot.filterName}
            resolutionText={capturedShot.resolutionText}
            aspectRatio={capturedShot.aspectRatio}
            isBusy={isCaptureActionPending}
            onSave={() => {
              void handleSave()
            }}
            onShare={() => {
              void handleShare()
            }}
            onRetake={handleRetake}
          />
        ) : null}
      </section>
    </main>
  )
}

function InfoPill({
  children,
  strong = false,
}: {
  children: ReactNode
  strong?: boolean
}) {
  return (
    <div
      className={`rounded-full border px-3 py-2 font-mono text-[11px] uppercase tracking-[0.2em] ${
        strong ? 'theme-chip-strong' : 'theme-chip-soft'
      }`}
    >
      {children}
    </div>
  )
}
