'use client'

import { useMemo, useState } from 'react'

import { useBattery } from '@/hooks/use-battery'
import { useCamera } from '@/hooks/use-camera'
import { useClock } from '@/hooks/use-clock'
import { FILTERS, defaultSettings } from '@/lib/filters'
import type { CaptureSettings, MenuView } from '@/lib/types'

import { CameraHud } from './camera-hud'
import { CameraMenu } from './camera-menu'
import { PreviewEffects } from './preview-effects'

export function RetroCameraApp() {
  const [settings, setSettings] = useState<CaptureSettings>(defaultSettings)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [menuView, setMenuView] = useState<MenuView>('main')

  const {
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
  } = useCamera()
  const clockText = useClock()
  const { batteryLevel, isCharging } = useBattery()

  const activeFilter = useMemo(
    () => FILTERS.find((filter) => filter.id === settings.filterId) ?? FILTERS[0],
    [settings.filterId],
  )

  const cameraLabel =
    devices.find((device) => device.deviceId === activeDeviceId)?.label ||
    `CAM ${devices.length || 1}`
  const batteryText =
    batteryLevel === null ? 'BAT --' : `BAT ${batteryLevel}%${isCharging ? '+' : ''}`
  const lensText = devices.length > 1 ? `${devices.length} LENSES` : 'SINGLE LENS'
  const statusText = isReady ? 'READY' : 'BOOT'
  const stampText = settings.showTimestamp ? 'DATE ON' : 'DATE OFF'

  const openMenu = () => {
    setMenuView('main')
    setIsMenuOpen(true)
  }

  const closeMenu = () => {
    setIsMenuOpen(false)
    setMenuView('main')
  }

  const backMenu = () => {
    if (menuView === 'main') {
      setIsMenuOpen(false)
      return
    }

    setMenuView('main')
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <a ref={downloadAnchorRef} className="hidden" />
      <canvas ref={previewCanvasRef} className="hidden" />

      <section className="flex min-h-[100dvh] items-center justify-center bg-black p-3 sm:p-4">
        <div className="relative h-[min(100dvh-24px,calc((100vw-24px)*1.7))] w-full max-w-[min(560px,100vw-24px)] overflow-hidden rounded-[26px] bg-black shadow-[0_0_0_1px_rgba(255,255,255,0.08)] sm:h-[min(100dvh-32px,calc((100vw-32px)*1.65))] sm:max-w-[620px]">
          <video
            ref={videoRef}
            className="absolute inset-0 h-full w-full object-cover"
            autoPlay
            muted
            playsInline
            style={{ filter: activeFilter.filter }}
          />

          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_35%,rgba(0,0,0,0.52)_100%)]" />
          <div
            className={`pointer-events-none absolute inset-0 bg-gradient-to-r ${activeFilter.lightLeak}`}
          />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.03),transparent_22%,transparent_78%,rgba(255,255,255,0.02))]" />
          <PreviewEffects
            filter={activeFilter}
            grainBoost={settings.grainBoost}
            vignetteBoost={settings.vignetteBoost}
          />

          <CameraHud
            modeText={activeFilter.name}
            clockText={clockText}
            batteryText={batteryText}
            statusText={statusText}
            lensText={lensText}
            stampText={stampText}
            cameraLabel={cameraLabel}
            grainBoost={settings.grainBoost}
            vignetteBoost={settings.vignetteBoost}
            showTimestamp={settings.showTimestamp}
            dateTint={activeFilter.dateTint}
            isStarting={isStarting}
            error={error}
          />

          <button
            type="button"
            onClick={openMenu}
            className="absolute right-1 top-2 z-20 rounded-lg bg-black/45 px-3 py-2 font-mono text-[11px] uppercase tracking-[0.26em] text-white backdrop-blur-sm"
          >
            Set
          </button>

          <button
            type="button"
            onClick={() => capturePhoto(activeFilter, settings)}
            disabled={!isReady || isStarting}
            className="absolute bottom-4 left-[40%] z-20 h-20 w-20 rounded-full border-4 border-white bg-black/35 text-white shadow-[0_0_30px_rgba(255,255,255,0.15)] backdrop-blur-sm disabled:opacity-50"
          >
            <span className="block h-full w-full rounded-full border-2 border-white/70" />
          </button>

          <CameraMenu
            isOpen={isMenuOpen}
            menuView={menuView}
            settings={settings}
            cameraLabel={cameraLabel}
            activeDeviceId={activeDeviceId}
            devices={devices}
            onClose={closeMenu}
            onBack={backMenu}
            onMenuViewChange={setMenuView}
            onSettingsChange={setSettings}
            onCameraSelect={(deviceId) => {
              void startCamera(deviceId)
            }}
          />
        </div>
      </section>
    </main>
  )
}
