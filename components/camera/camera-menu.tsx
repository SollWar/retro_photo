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
    <div className="theme-shell fixed inset-0 z-40 overflow-y-auto overflow-x-hidden">
      <div className="mx-auto flex min-h-[100dvh] w-full max-w-[860px] min-w-0 flex-col px-3 pb-[calc(env(safe-area-inset-bottom)+16px)] pt-[calc(env(safe-area-inset-top)+12px)] sm:px-4">
        <div className="theme-panel-surface rounded-[30px] border p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4 border-b border-[color:var(--theme-border-soft)] pb-5">
            <div>
              <div className="theme-label font-mono text-[11px] uppercase tracking-[0.34em]">
                Настройки
              </div>
              <div className="mt-3 font-mono text-[clamp(26px,5vw,40px)] uppercase tracking-[0.06em] text-[color:var(--theme-text)]">
                Параметры камеры
              </div>
              <div className="theme-text-soft mt-3 max-w-[32rem] text-sm leading-6">
                Все настройки собраны на одном экране. Эффект, текстура и камера
                меняются сразу, а превью остается чистым, если включен случайный режим.
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="theme-secondary-action grid h-12 w-12 shrink-0 place-items-center rounded-full border text-4xl leading-none transition hover:brightness-110"
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
                <div className="theme-label mt-3 font-mono text-[11px] uppercase tracking-[0.2em]">
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
                  <div className="theme-card-surface theme-text-soft rounded-[16px] border px-4 py-4 text-sm">
                    Камеры появятся здесь после выдачи разрешения браузеру.
                  </div>
                )}
              </div>
            </ControlCard>

            <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
              <button
                type="button"
                onClick={onClose}
                className="theme-primary-action rounded-[22px] border px-6 py-4 font-mono text-sm uppercase tracking-[0.24em] shadow-[0_0_0_1px_rgba(255,255,255,0.08)] transition hover:brightness-105"
              >
                Вернуться к камере
              </button>

              {canInstall ? (
                <button
                  type="button"
                  onClick={onInstall}
                  className="theme-secondary-action rounded-[22px] border px-6 py-4 font-mono text-sm uppercase tracking-[0.2em] transition hover:brightness-110"
                >
                  Установить приложение
                </button>
              ) : (
                <div className="theme-secondary-action theme-text-soft rounded-[22px] border px-6 py-4 font-mono text-sm uppercase tracking-[0.2em]">
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
    <section className="theme-card-surface min-w-0 rounded-[26px] border p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="theme-label font-mono text-[11px] uppercase tracking-[0.34em]">
          {label}
        </div>
        <div className="max-w-[52%] text-right font-mono text-sm uppercase tracking-[0.2em] text-[color:var(--theme-text)]">
          {value}
        </div>
      </div>
      <div className="theme-text-soft mt-3 text-sm leading-6">{helper}</div>
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
      className="theme-stripe-track grid gap-px overflow-hidden rounded-[8px] p-1"
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
                ? 'theme-stripe-active hover:brightness-105'
                : 'theme-stripe-inactive hover:brightness-110'
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
        active ? 'theme-chip-strong' : 'theme-chip-soft hover:brightness-110'
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
        active ? 'theme-chip-strong' : 'theme-chip-soft hover:brightness-110'
      }`}
    >
      {children}
    </button>
  )
}
