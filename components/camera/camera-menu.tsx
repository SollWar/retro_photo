import type { Dispatch, ReactNode, SetStateAction } from 'react'

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
  const grainPercent = toPercent(settings.grainBoost, GRAIN_MIN, GRAIN_MAX)
  const vignettePercent = toPercent(settings.vignetteBoost, VIGNETTE_MIN, VIGNETTE_MAX)

  return (
    <div className="fixed inset-0 z-40 overflow-y-auto overflow-x-hidden bg-[radial-gradient(circle_at_top,rgba(203,148,89,0.18),transparent_28%),linear-gradient(180deg,#120b08,#050302)]">
      <div className="mx-auto flex min-h-[100dvh] w-full max-w-[860px] min-w-0 flex-col px-3 pb-[calc(env(safe-area-inset-bottom)+16px)] pt-[calc(env(safe-area-inset-top)+12px)] sm:px-4">
        <div className="rounded-[30px] border border-amber-200/18 bg-[#1a120d]/96 p-5 shadow-[0_30px_80px_rgba(0,0,0,0.5),inset_0_0_0_1px_rgba(255,214,170,0.04)] sm:p-6">
          <div className="flex items-start justify-between gap-4 border-b border-amber-200/10 pb-5">
            <div>
              <div className="font-mono text-[11px] uppercase tracking-[0.34em] text-amber-200/72">
                Настройки
              </div>
              <div className="mt-3 font-mono text-[clamp(26px,5vw,40px)] uppercase tracking-[0.06em] text-white">
                Параметры камеры
              </div>
              <div className="mt-3 max-w-[32rem] text-sm leading-6 text-amber-50/70">
                Все настройки собраны на одном экране. Эффект, текстура и камера
                меняются сразу, а превью остается чистым, если включен случайный режим.
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="grid h-12 w-12 shrink-0 place-items-center rounded-full border border-amber-200/18 bg-[#241710]/82 text-4xl leading-none text-amber-50/92 transition hover:border-amber-200/38 hover:text-amber-100"
            >
              <span className="-mt-1">×</span>
            </button>
          </div>

          <div className="mt-5 grid gap-4">
            <ControlCard
              label="Фильтр"
              value={selectedFilter.name}
              helper={selectedFilter.description}
            >
              <div className="-mx-1 overflow-x-auto px-1 pb-1">
                <div className="flex min-w-max gap-2">
                {filterOptions.map((option) => (
                  <ProfileButton
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
                  </ProfileButton>
                ))}
                </div>
              </div>
              {settings.filterId === RANDOM_FILTER_ID ? (
                <div className="mt-3 font-mono text-[11px] uppercase tracking-[0.2em] text-amber-200/78">
                  В превью без эффекта, случайный фильтр применяется только при съемке.
                </div>
              ) : null}
            </ControlCard>

            <ControlCard
              label="Зерно"
              value={`${grainPercent}%`}
              helper="Плотность пленочного шума в превью и на сохраненном кадре."
            >
              <StripeSlider
                label="Зерно"
                value={settings.grainBoost}
                min={GRAIN_MIN}
                max={GRAIN_MAX}
                segments={24}
                onChange={(nextValue) => {
                  onSettingsChange((current) => ({
                    ...current,
                    grainBoost: nextValue,
                  }))
                }}
              />
            </ControlCard>

            <ControlCard
              label="Виньетка"
              value={`${vignettePercent}%`}
              helper="Затемнение по краям, чтобы фильтры ощущались плотнее и глубже."
            >
              <StripeSlider
                label="Виньетка"
                value={settings.vignetteBoost}
                min={VIGNETTE_MIN}
                max={VIGNETTE_MAX}
                segments={24}
                onChange={(nextValue) => {
                  onSettingsChange((current) => ({
                    ...current,
                    vignetteBoost: nextValue,
                  }))
                }}
              />
            </ControlCard>

            <ControlCard
              label="Штамп даты"
              value={settings.showTimestamp ? 'Включен' : 'Выключен'}
              helper="Штамп даты виден в предпросмотре и впекается в итоговое фото."
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
                  Вкл
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
                  Выкл
                </SegmentButton>
              </div>
            </ControlCard>

            <ControlCard
              label="Камера"
              value={devices.length > 1 ? `${devices.length} камеры` : 'Одна камера'}
              helper="Активная камера переключается здесь же, без отдельного подменю."
            >
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {devices.length > 0 ? (
                  devices.map((device, index) => (
                    <ProfileButton
                      key={device.deviceId}
                      active={device.deviceId === activeDeviceId}
                      onClick={() => onCameraSelect(device.deviceId)}
                    >
                      {device.label || `Камера ${index + 1}`}
                    </ProfileButton>
                  ))
                ) : (
                  <div className="rounded-[16px] border border-amber-200/14 bg-[#251811] px-4 py-4 text-sm text-amber-50/62">
                    Камеры появятся здесь после выдачи разрешения браузеру.
                  </div>
                )}
              </div>
            </ControlCard>

            <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
              <button
                type="button"
                onClick={onClose}
                className="rounded-[22px] bg-[#d3a062] px-6 py-4 font-mono text-sm uppercase tracking-[0.24em] text-[#2b180d] shadow-[0_0_0_1px_rgba(255,255,255,0.08)] transition hover:bg-[#e4b77b]"
              >
                Вернуться к камере
              </button>

              {canInstall ? (
                <button
                  type="button"
                  onClick={onInstall}
                  className="rounded-[22px] border border-amber-200/18 bg-[#241710] px-6 py-4 font-mono text-sm uppercase tracking-[0.2em] text-amber-100 transition hover:border-amber-200/38"
                >
                  Установить приложение
                </button>
              ) : (
                <div className="rounded-[22px] border border-amber-200/14 bg-[#241710] px-6 py-4 font-mono text-sm uppercase tracking-[0.2em] text-amber-50/70">
                  {isInstalled ? 'Приложение установлено' : 'Веб-режим'}
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
    <section className="min-w-0 rounded-[26px] border border-amber-200/16 bg-[#241710] p-5 shadow-[inset_0_0_0_1px_rgba(255,214,170,0.03)]">
      <div className="flex items-start justify-between gap-3">
        <div className="font-mono text-[11px] uppercase tracking-[0.34em] text-amber-200/74">
          {label}
        </div>
        <div className="max-w-[52%] text-right font-mono text-sm uppercase tracking-[0.2em] text-amber-200">
          {value}
        </div>
      </div>
      <div className="mt-3 text-sm leading-6 text-amber-50/70">{helper}</div>
      <div className="mt-5">{children}</div>
    </section>
  )
}

function StripeSlider({
  label,
  value,
  min,
  max,
  segments,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  segments: number
  onChange: (value: number) => void
}) {
  const activeBars = Math.max(
    1,
    Math.min(segments, Math.round(((value - min) / (max - min)) * segments)),
  )

  return (
    <div
      className="grid gap-px overflow-hidden rounded-[8px] bg-[#493224] p-1"
      style={{ gridTemplateColumns: `repeat(${segments}, minmax(0, 1fr))` }}
      role="slider"
      aria-label={label}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={value}
    >
      {Array.from({ length: segments }).map((_, index) => {
        const nextValue = min + ((index + 1) / segments) * (max - min)

        return (
          <button
            type="button"
            key={index}
            onClick={() => onChange(Number(nextValue.toFixed(2)))}
            className={`h-6 rounded-[2px] transition ${
              index < activeBars
                ? 'bg-[#d3a062] hover:bg-[#e4b77b]'
                : 'bg-[#6c4a35] hover:bg-[#82593f]'
            }`}
          />
        )
      })}
    </div>
  )
}

function ProfileButton({
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
      className={`min-w-0 shrink-0 rounded-[16px] border px-3 py-4 text-left font-mono text-[11px] uppercase leading-5 tracking-[0.16em] transition ${
        active
          ? 'border-amber-200 bg-[#d3a062] text-[#2b180d]'
          : 'border-amber-200/18 bg-[#322117] text-amber-100 hover:border-amber-200/40'
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
          ? 'border-amber-200 bg-[#d3a062] text-[#2b180d]'
          : 'border-amber-200/16 bg-[#322117] text-amber-100 hover:border-amber-200/40'
      }`}
    >
      {children}
    </button>
  )
}
