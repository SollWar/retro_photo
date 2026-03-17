import type { CSSProperties, Dispatch, ReactNode, SetStateAction } from 'react'

import {
  FILTERS,
  RANDOM_FILTER_ID,
  RANDOM_FILTER_OPTION,
  getFilterById,
  isRandomFilterId,
} from '@/lib/filters'
import type { CaptureSettings } from '@/lib/types'

type CameraMenuProps = {
  isOpen: boolean
  settings: CaptureSettings
  activeDeviceId: string | null
  devices: MediaDeviceInfo[]
  canInstall: boolean
  isInstalled: boolean
  onClose: () => void
  onSettingsChange: Dispatch<SetStateAction<CaptureSettings>>
  onCameraSelect: (deviceId: string) => void
  onInstall: () => void
}

const filterOptions = [RANDOM_FILTER_OPTION, ...FILTERS]
const GRAIN_MIN = 0.55
const GRAIN_MAX = 1.35
const VIGNETTE_MIN = 0.45
const VIGNETTE_MAX = 1.45

function toPercent(value: number, min: number, max: number) {
  return Math.round(((value - min) / (max - min)) * 100)
}

export function CameraMenu({
  isOpen,
  settings,
  activeDeviceId,
  devices,
  canInstall,
  isInstalled,
  onClose,
  onSettingsChange,
  onCameraSelect,
  onInstall,
}: CameraMenuProps) {
  if (!isOpen) {
    return null
  }

  const selectedFilter =
    isRandomFilterId(settings.filterId)
      ? RANDOM_FILTER_OPTION
      : getFilterById(settings.filterId) ?? FILTERS[0]
  const selectedFilterIndex = Math.max(
    0,
    filterOptions.findIndex((option) => option.id === settings.filterId),
  )
  const grainPercent = toPercent(settings.grainBoost, GRAIN_MIN, GRAIN_MAX)
  const vignettePercent = toPercent(settings.vignetteBoost, VIGNETTE_MIN, VIGNETTE_MAX)
  const filterPercent =
    filterOptions.length > 1
      ? (selectedFilterIndex / (filterOptions.length - 1)) * 100
      : 100

  return (
    <div className="fixed inset-0 z-40 overflow-y-auto bg-[radial-gradient(circle_at_top,rgba(37,220,224,0.16),transparent_28%),linear-gradient(180deg,#071718,#02090a)]">
      <div className="mx-auto flex min-h-[100dvh] w-full max-w-[860px] flex-col px-3 pb-[calc(env(safe-area-inset-bottom)+16px)] pt-[calc(env(safe-area-inset-top)+12px)] sm:px-4">
        <div className="rounded-[30px] border border-cyan-400/18 bg-[#081f20]/96 p-5 shadow-[0_30px_80px_rgba(0,0,0,0.5),inset_0_0_0_1px_rgba(0,255,255,0.04)] sm:p-6">
          <div className="flex items-start justify-between gap-4 border-b border-cyan-400/12 pb-5">
            <div>
              <div className="font-mono text-[11px] uppercase tracking-[0.34em] text-cyan-300/72">
                Sensor Controls
              </div>
              <div className="mt-3 font-mono text-[clamp(26px,5vw,40px)] uppercase tracking-[0.06em] text-white">
                Camera Setup
              </div>
              <div className="mt-3 max-w-[32rem] text-sm leading-6 text-cyan-50/70">
                Один экран настроек без вложенных меню. Фильтр, текстура и оптика
                меняются сразу, а превью остается чистым, если включен случайный режим.
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="grid h-12 w-12 shrink-0 place-items-center rounded-full border border-cyan-400/18 bg-[#0b2324]/82 text-4xl leading-none text-white/92 transition hover:border-cyan-300/38 hover:text-cyan-200"
            >
              <span className="-mt-1">×</span>
            </button>
          </div>

          <div className="mt-5 grid gap-4">
            <ControlCard
              label="Picture Profile"
              value={selectedFilter.name}
              helper={selectedFilter.description}
            >
              <input
                type="range"
                min={0}
                max={filterOptions.length - 1}
                step={1}
                value={selectedFilterIndex}
                style={{ '--slider-fill': `${filterPercent}%` } as CSSProperties}
                onChange={(event) => {
                  const nextOption = filterOptions[Number(event.target.value)]
                  if (!nextOption) {
                    return
                  }

                  onSettingsChange((current) => ({
                    ...current,
                    filterId: nextOption.id,
                  }))
                }}
                className="range-slider w-full"
              />
              <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
                {filterOptions.map((option) => (
                  <ChipButton
                    key={option.id}
                    active={settings.filterId === option.id}
                    onClick={() => {
                      onSettingsChange((current) => ({
                        ...current,
                        filterId: option.id,
                      }))
                    }}
                  >
                    {option.name}
                  </ChipButton>
                ))}
              </div>
              {settings.filterId === RANDOM_FILTER_ID ? (
                <div className="mt-3 font-mono text-[11px] uppercase tracking-[0.2em] text-cyan-300/78">
                  Preview clean, random filter applies only on capture.
                </div>
              ) : null}
            </ControlCard>

            <ControlCard
              label="Film Grain"
              value={`${grainPercent}%`}
              helper="Плотность пленочного шума в превью и на сохраненном кадре."
            >
              <input
                type="range"
                min={GRAIN_MIN}
                max={GRAIN_MAX}
                step={0.05}
                value={settings.grainBoost}
                style={{ '--slider-fill': `${grainPercent}%` } as CSSProperties}
                onChange={(event) => {
                  onSettingsChange((current) => ({
                    ...current,
                    grainBoost: Number(event.target.value),
                  }))
                }}
                className="range-slider w-full"
              />
              <ScaleRow activePercent={grainPercent} />
            </ControlCard>

            <ControlCard
              label="Edge Vignette"
              value={`${vignettePercent}%`}
              helper="Затемнение по краям, чтобы фильтры ощущались плотнее и глубже."
            >
              <input
                type="range"
                min={VIGNETTE_MIN}
                max={VIGNETTE_MAX}
                step={0.05}
                value={settings.vignetteBoost}
                style={{ '--slider-fill': `${vignettePercent}%` } as CSSProperties}
                onChange={(event) => {
                  onSettingsChange((current) => ({
                    ...current,
                    vignetteBoost: Number(event.target.value),
                  }))
                }}
                className="range-slider w-full"
              />
              <ScaleRow activePercent={vignettePercent} />
            </ControlCard>

            <ControlCard
              label="Date Stamp"
              value={settings.showTimestamp ? 'Enabled' : 'Disabled'}
              helper="Штамп даты виден в live preview и впекается в итоговое фото."
            >
              <div className="grid grid-cols-2 gap-3">
                <SegmentButton
                  active={settings.showTimestamp}
                  onClick={() => {
                    onSettingsChange((current) => ({
                      ...current,
                      showTimestamp: true,
                    }))
                  }}
                >
                  On
                </SegmentButton>
                <SegmentButton
                  active={!settings.showTimestamp}
                  onClick={() => {
                    onSettingsChange((current) => ({
                      ...current,
                      showTimestamp: false,
                    }))
                  }}
                >
                  Off
                </SegmentButton>
              </div>
            </ControlCard>

            <ControlCard
              label="Lens Select"
              value={devices.length > 1 ? `${devices.length} cameras` : 'Single lens'}
              helper="Активная камера переключается здесь же, без отдельного подменю."
            >
              <div className="flex gap-2 overflow-x-auto pb-1">
                {devices.length > 0 ? (
                  devices.map((device, index) => (
                    <ChipButton
                      key={device.deviceId}
                      active={device.deviceId === activeDeviceId}
                      onClick={() => onCameraSelect(device.deviceId)}
                    >
                      {device.label || `Camera ${index + 1}`}
                    </ChipButton>
                  ))
                ) : (
                  <div className="rounded-[16px] border border-cyan-400/14 bg-[#0c2b2d] px-4 py-4 text-sm text-cyan-50/62">
                    Камеры появятся здесь после выдачи разрешения браузеру.
                  </div>
                )}
              </div>
            </ControlCard>

            <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
              <button
                type="button"
                onClick={onClose}
                className="rounded-[22px] bg-cyan-400 px-6 py-4 font-mono text-sm uppercase tracking-[0.24em] text-[#062021] shadow-[0_0_0_1px_rgba(255,255,255,0.08)] transition hover:bg-cyan-300"
              >
                Return To Camera
              </button>

              {canInstall ? (
                <button
                  type="button"
                  onClick={onInstall}
                  className="rounded-[22px] border border-cyan-400/18 bg-[#0d2b2d] px-6 py-4 font-mono text-sm uppercase tracking-[0.2em] text-cyan-200 transition hover:border-cyan-300/38"
                >
                  Install App
                </button>
              ) : (
                <div className="rounded-[22px] border border-cyan-400/14 bg-[#0d2b2d] px-6 py-4 font-mono text-sm uppercase tracking-[0.2em] text-cyan-100/70">
                  {isInstalled ? 'App Installed' : 'Web Mode'}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ControlCard({
  label,
  value,
  helper,
  children,
}: {
  label: string
  value: string
  helper: string
  children: ReactNode
}) {
  return (
    <section className="rounded-[26px] border border-cyan-400/16 bg-[#0d2b2d] p-5 shadow-[inset_0_0_0_1px_rgba(0,255,255,0.03)]">
      <div className="flex items-start justify-between gap-3">
        <div className="font-mono text-[11px] uppercase tracking-[0.34em] text-cyan-300/74">
          {label}
        </div>
        <div className="font-mono text-sm uppercase tracking-[0.2em] text-cyan-300">
          {value}
        </div>
      </div>
      <div className="mt-3 text-sm leading-6 text-cyan-50/70">{helper}</div>
      <div className="mt-5">{children}</div>
    </section>
  )
}

function ScaleRow({ activePercent }: { activePercent: number }) {
  const activeBars = Math.max(1, Math.min(24, Math.round((activePercent / 100) * 24)))

  return (
    <div
      className="mt-4 grid gap-px overflow-hidden rounded-[6px] bg-[#11494b] p-1"
      style={{ gridTemplateColumns: 'repeat(24, minmax(0, 1fr))' }}
    >
      {Array.from({ length: 24 }).map((_, index) => (
        <span
          key={index}
          className={`h-4 rounded-[1px] ${index < activeBars ? 'bg-cyan-400' : 'bg-[#155153]'}`}
        />
      ))}
    </div>
  )
}

function ChipButton({
  children,
  active,
  onClick,
}: {
  children: ReactNode
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-[14px] border px-4 py-3 font-mono text-xs uppercase tracking-[0.18em] transition ${
        active
          ? 'border-cyan-300 bg-cyan-400 text-[#082324]'
          : 'border-cyan-400/18 bg-[#103234] text-cyan-200 hover:border-cyan-300/40'
      }`}
    >
      {children}
    </button>
  )
}

function SegmentButton({
  children,
  active,
  onClick,
}: {
  children: ReactNode
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-[18px] border px-4 py-4 font-mono text-sm uppercase tracking-[0.2em] transition ${
        active
          ? 'border-cyan-300 bg-cyan-400 text-[#082324]'
          : 'border-cyan-400/16 bg-[#103234] text-cyan-200 hover:border-cyan-300/40'
      }`}
    >
      {children}
    </button>
  )
}
