'use client'

import { useEffect, useMemo, useState, type ReactNode } from 'react'

import { useBattery } from '@/hooks/use-battery'
import { useCamera } from '@/hooks/use-camera'
import { useClock } from '@/hooks/use-clock'
import { useInstallPrompt } from '@/hooks/use-install-prompt'
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
}

function createFilename() {
  return `retro-shot-${Date.now()}.jpg`
}

export function RetroCameraApp() {
  const [settings, setSettings] = useState<CaptureSettings>(defaultSettings)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [capturedShot, setCapturedShot] = useState<CapturedShot | null>(null)
  const [isCaptureActionPending, setIsCaptureActionPending] = useState(false)

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
  } = useCamera()
  const clockText = useClock()
  const { batteryLevel, isCharging } = useBattery()
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
  const grainPercent = Math.round(((settings.grainBoost - 0.55) / (1.35 - 0.55)) * 100)
  const vignettePercent = Math.round(((settings.vignetteBoost - 0.45) / (1.45 - 0.45)) * 100)

  const cameraLabel =
    devices.find((device) => device.deviceId === activeDeviceId)?.label ||
    `Камера ${devices.length || 1}`
  const batteryText =
    batteryLevel === null ? 'Заряд --' : `Заряд ${batteryLevel}%${isCharging ? ' +' : ''}`
  const modeText = isRandomFilterMode ? RANDOM_FILTER_OPTION.name : activeFilter.name
  const resolutionText = photoResolution
    ? `Фото ${photoResolution.width}x${photoResolution.height}`
    : `Формат ${Math.round(previewAspectRatio * 100) / 100}:1`
  const statusText = isReady ? 'Готово к съемке' : 'Запуск камеры'

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

  return (
    <main
      style={interfaceTheme}
      className="min-h-screen overflow-hidden bg-[color:var(--theme-bg)] text-[color:var(--theme-text)]"
    >
      <canvas ref={previewCanvasRef} className="hidden" />

      <section className="theme-shell mx-auto flex h-[100dvh] w-full max-w-[860px] flex-col overflow-hidden px-3 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-[calc(env(safe-area-inset-top)+10px)] sm:px-4">
        <div className="theme-preview-surface relative min-h-0 flex-1 overflow-hidden rounded-[34px] border">
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

        <div className="theme-panel-surface mt-3 shrink-0 rounded-[26px] border p-3 sm:p-4">
          <div className="flex flex-wrap gap-2">
            <InfoPill strong>{modeText}</InfoPill>
            <InfoPill>{clockText}</InfoPill>
            <InfoPill>{batteryText}</InfoPill>
            <InfoPill>{resolutionText}</InfoPill>
          </div>

          <div className="mt-2 flex flex-wrap gap-2">
            <CompactPill label="Камера" value={cameraLabel} />
            <CompactPill label="Зерно" value={`${grainPercent}%`} />
            <CompactPill label="Виньетка" value={`${vignettePercent}%`} />
            <CompactPill
              label="Дата"
              value={settings.showTimestamp ? 'Вкл' : 'Выкл'}
            />
            <CompactPill label="Статус" value={statusText} />
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-[minmax(0,1fr)_122px] sm:items-center">
            <div className="theme-card-surface theme-text-soft rounded-[18px] border px-4 py-3 text-sm">
              {error
                ? 'Камера недоступна. Проверь разрешения браузера.'
                : isReady
                  ? 'Все параметры под рукой, можно снимать.'
                  : 'Подготавливаем камеру и доступные объективы.'}
            </div>

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

function CompactPill({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="theme-chip-soft flex items-center gap-2 rounded-full border px-3 py-2 shadow-[inset_0_0_0_1px_var(--theme-border-faint)]">
      <div className="theme-label font-mono text-[9px] uppercase tracking-[0.2em]">
        {label}
      </div>
      <div className="text-sm leading-5 text-[color:var(--theme-text)]">{value}</div>
    </div>
  )
}
