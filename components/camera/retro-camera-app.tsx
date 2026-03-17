'use client'

import { useEffect, useMemo, useState, type ReactNode } from 'react'

import { useBattery } from '@/hooks/use-battery'
import { useCamera } from '@/hooks/use-camera'
import { useClock } from '@/hooks/use-clock'
import { useInstallPrompt } from '@/hooks/use-install-prompt'
import { downloadBlob, shareBlob } from '@/lib/camera-utils'
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
    <main className="min-h-screen overflow-hidden bg-[#120b08] text-white">
      <canvas ref={previewCanvasRef} className="hidden" />

      <section className="mx-auto flex min-h-[100dvh] w-full max-w-[860px] flex-col px-3 pb-[calc(env(safe-area-inset-bottom)+14px)] pt-[calc(env(safe-area-inset-top)+12px)] sm:px-4">
        <div className="relative min-h-0 flex-1 overflow-hidden rounded-[34px] border border-amber-200/16 bg-[#140d09] shadow-[0_30px_80px_rgba(0,0,0,0.5),inset_0_0_0_1px_rgba(255,214,170,0.03)]">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(203,148,89,0.18),transparent_28%),linear-gradient(180deg,rgba(255,228,190,0.05),transparent_22%,transparent_82%,rgba(214,155,91,0.05))]" />
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
            className="absolute right-3 top-3 z-20 rounded-[16px] border border-amber-200/20 bg-[#241710]/82 px-4 py-3 font-mono text-[11px] uppercase tracking-[0.26em] text-amber-100 shadow-[inset_0_0_0_1px_rgba(255,214,170,0.04)] backdrop-blur-sm"
          >
            Меню
          </button>
        </div>

        <div className="mt-3 rounded-[28px] border border-amber-200/18 bg-[#1a120d]/94 p-4 shadow-[0_24px_60px_rgba(0,0,0,0.35),inset_0_0_0_1px_rgba(255,214,170,0.04)]">
          <div className="flex flex-wrap gap-2">
            <InfoPill strong>{modeText}</InfoPill>
            <InfoPill>{clockText}</InfoPill>
            <InfoPill>{batteryText}</InfoPill>
            <InfoPill>{resolutionText}</InfoPill>
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-[minmax(0,1fr)_132px] sm:items-center">
            <div className="grid gap-2">
              <SummaryRow label="Камера" value={cameraLabel} />
              <SummaryRow
                label="Эффект"
                value={`Зерно ${grainPercent}% · Виньетка ${vignettePercent}%`}
              />
              <SummaryRow
                label="Штамп даты"
                value={settings.showTimestamp ? 'Включен' : 'Выключен'}
              />
            </div>

            <button
              type="button"
              onClick={() => {
                void handleCapture()
              }}
              disabled={!isReady || isStarting}
              className="h-20 w-full rounded-[22px] border border-amber-200/28 bg-[#d3a062] px-4 text-[#2b180d] shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_14px_24px_rgba(0,0,0,0.22)] transition hover:bg-[#e4b77b] disabled:opacity-50"
            >
              <span className="grid h-full w-full place-items-center rounded-[16px] border border-[#8f6138]/34 bg-[#e1bc87] font-mono text-sm uppercase tracking-[0.2em]">
                Снять
              </span>
            </button>
          </div>

          <div className="mt-3 rounded-[18px] border border-amber-200/12 bg-[#241710] px-4 py-3 text-sm text-amber-50/78">
            {isReady ? 'Камера готова к съемке.' : 'Запускаем камеру...'}
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
        strong
          ? 'border-amber-200/34 bg-[#d3a062] text-[#2b180d]'
          : 'border-amber-200/16 bg-[#241710] text-amber-50/82'
      }`}
    >
      {children}
    </div>
  )
}

function SummaryRow({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-[18px] border border-amber-200/14 bg-[#241710] px-4 py-3 shadow-[inset_0_0_0_1px_rgba(255,214,170,0.02)]">
      <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-amber-200/68">
        {label}
      </div>
      <div className="text-right text-sm leading-6 text-amber-50/82">{value}</div>
    </div>
  )
}
