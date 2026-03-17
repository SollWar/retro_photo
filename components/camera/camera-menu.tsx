import type { Dispatch, SetStateAction } from 'react'

import {
  FILTERS,
  RANDOM_FILTER_ID,
  RANDOM_FILTER_OPTION,
  getFilterById,
  isRandomFilterId,
} from '@/lib/filters'
import { grainOptions, vignetteOptions } from '@/lib/options'
import type { CaptureSettings, MenuView } from '@/lib/types'

import { MenuButton } from './menu-button'
import { SelectButton } from './select-button'

type CameraMenuProps = {
  isOpen: boolean
  menuView: MenuView
  settings: CaptureSettings
  cameraLabel: string
  activeDeviceId: string | null
  devices: MediaDeviceInfo[]
  canInstall: boolean
  isInstalled: boolean
  onClose: () => void
  onBack: () => void
  onMenuViewChange: (view: MenuView) => void
  onSettingsChange: Dispatch<SetStateAction<CaptureSettings>>
  onCameraSelect: (deviceId: string) => void
  onInstall: () => void
}

export function CameraMenu({
  isOpen,
  menuView,
  settings,
  cameraLabel,
  activeDeviceId,
  devices,
  canInstall,
  isInstalled,
  onClose,
  onBack,
  onMenuViewChange,
  onSettingsChange,
  onCameraSelect,
  onInstall,
}: CameraMenuProps) {
  if (!isOpen) {
    return null
  }

  const selectedFilterName =
    isRandomFilterId(settings.filterId)
      ? RANDOM_FILTER_OPTION.name
      : getFilterById(settings.filterId)?.name ?? FILTERS[0].name

  const sensorItems = [
    {
      label: 'Noise Floor',
      value: Math.round(settings.vignetteBoost / 1.45 * 100),
      onClick: () => onMenuViewChange('vignette'),
    },
    {
      label: 'Silver Grain',
      value: Math.round(settings.grainBoost / 1.35 * 100),
      onClick: () => onMenuViewChange('grain'),
    },
    {
      label: 'Color Bleed',
      value: isRandomFilterId(settings.filterId) ? 100 : Math.min(100, 42 + selectedFilterName.length * 3),
      onClick: () => onMenuViewChange('filter'),
    },
  ]

  const mainTitle = menuView === 'main' ? 'Sensor Emulation' : 'Select Option'

  return (
    <div className="absolute inset-0 z-30 bg-[linear-gradient(to_top,rgba(0,0,0,0.92),rgba(0,0,0,0.2))]">
      <div className="absolute inset-x-0 bottom-0 max-h-[72vh] rounded-t-[32px] border-t border-cyan-400/20 bg-[#081f20] shadow-[0_-20px_60px_rgba(0,0,0,0.45)]">
        <div className="flex justify-center pt-4">
          <div className="h-2 w-20 rounded-full bg-cyan-400/40" />
        </div>

        <div className="flex items-center justify-between border-b border-cyan-400/12 px-7 py-6">
          <div className="flex items-center gap-4">
            <div className="grid h-10 w-10 place-items-center text-cyan-300">
              <div className="grid grid-cols-3 gap-1">
                {Array.from({ length: 9 }).map((_, index) => (
                  <span
                    key={index}
                    className={`block h-1.5 w-1.5 ${index % 2 === 0 ? 'bg-cyan-300' : 'bg-cyan-300/45'}`}
                  />
                ))}
              </div>
            </div>
            <div className="font-mono text-[clamp(24px,4vw,34px)] uppercase tracking-[0.04em] text-white">
              {mainTitle}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="grid h-12 w-12 place-items-center rounded-full border border-cyan-400/20 text-4xl leading-none text-white/90 transition hover:border-cyan-300/40 hover:text-cyan-200"
          >
            <span className="-mt-1">×</span>
          </button>
        </div>

        <div className="max-h-[calc(72vh-108px)] overflow-auto px-6 pb-6 pt-5">
          {menuView === 'main' ? (
            <div className="space-y-7">
              <div className="grid gap-5">
                {sensorItems.map((item) => (
                  <SensorCard
                    key={item.label}
                    label={item.label}
                    value={item.value}
                    onClick={item.onClick}
                  />
                ))}
              </div>

              <section>
                <div className="mb-4 font-mono text-sm uppercase tracking-[0.28em] text-cyan-300/70">
                  Standard Profiles
                </div>
                <div className="flex gap-3 overflow-x-auto pb-2">
                  <ProfileChip
                    active={settings.filterId === RANDOM_FILTER_ID}
                    label={RANDOM_FILTER_OPTION.name}
                    onClick={() => onMenuViewChange('filter')}
                  />
                  {FILTERS.map((filter) => (
                    <ProfileChip
                      key={filter.id}
                      active={settings.filterId === filter.id}
                      label={filter.name}
                      onClick={() => onMenuViewChange('filter')}
                    />
                  ))}
                </div>
              </section>

              <div className="grid grid-cols-[1fr_92px] gap-4">
                <button
                  type="button"
                  onClick={() => onMenuViewChange('filter')}
                  className="rounded-[18px] bg-cyan-400 px-6 py-6 font-mono text-[clamp(20px,3vw,28px)] uppercase tracking-[0.08em] text-[#062021] shadow-[0_0_0_1px_rgba(255,255,255,0.1)]"
                >
                  Apply Sensor Map
                </button>
                <button
                  type="button"
                  onClick={onInstall}
                  className="grid place-items-center rounded-[18px] border border-cyan-400/25 bg-[#103234] font-mono text-xs uppercase tracking-[0.18em] text-cyan-300"
                >
                  {isInstalled ? 'ON' : canInstall ? 'APP' : 'WEB'}
                </button>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <MenuButton
                  label="Lens Select"
                  value={cameraLabel}
                  onClick={() => onMenuViewChange('camera')}
                />
                <MenuButton
                  label="Date Stamp"
                  value={settings.showTimestamp ? 'On' : 'Off'}
                  onClick={() => onMenuViewChange('date')}
                />
              </div>
            </div>
          ) : null}

          {menuView === 'filter' ? (
            <div className="space-y-3">
              <SelectButton
                label={RANDOM_FILTER_OPTION.name}
                detail={RANDOM_FILTER_OPTION.description}
                selected={settings.filterId === RANDOM_FILTER_ID}
                onClick={() => {
                  onSettingsChange((current) => ({
                    ...current,
                    filterId: RANDOM_FILTER_ID,
                  }))
                  onMenuViewChange('main')
                }}
              />
              {FILTERS.map((filter) => (
                <SelectButton
                  key={filter.id}
                  label={filter.name}
                  detail={filter.description}
                  selected={filter.id === settings.filterId}
                  onClick={() => {
                    onSettingsChange((current) => ({ ...current, filterId: filter.id }))
                    onMenuViewChange('main')
                  }}
                />
              ))}
            </div>
          ) : null}

          {menuView === 'camera' ? (
            <div className="space-y-3">
              {devices.map((device, index) => (
                <SelectButton
                  key={device.deviceId}
                  label={device.label || `Camera ${index + 1}`}
                  detail={device.deviceId === activeDeviceId ? 'Active lens' : 'Tap to switch'}
                  selected={device.deviceId === activeDeviceId}
                  onClick={() => {
                    onCameraSelect(device.deviceId)
                    onMenuViewChange('main')
                  }}
                />
              ))}
            </div>
          ) : null}

          {menuView === 'grain' ? (
            <div className="space-y-3">
              {grainOptions.map((option) => (
                <SelectButton
                  key={option}
                  label={`${option.toFixed(2)}x`}
                  detail="Film grain intensity"
                  selected={option === settings.grainBoost}
                  onClick={() => {
                    onSettingsChange((current) => ({ ...current, grainBoost: option }))
                    onMenuViewChange('main')
                  }}
                />
              ))}
            </div>
          ) : null}

          {menuView === 'vignette' ? (
            <div className="space-y-3">
              {vignetteOptions.map((option) => (
                <SelectButton
                  key={option}
                  label={`${option.toFixed(2)}x`}
                  detail="Frame edge darkening"
                  selected={option === settings.vignetteBoost}
                  onClick={() => {
                    onSettingsChange((current) => ({ ...current, vignetteBoost: option }))
                    onMenuViewChange('main')
                  }}
                />
              ))}
            </div>
          ) : null}

          {menuView === 'date' ? (
            <div className="space-y-3">
              <SelectButton
                label="Date On"
                detail="Print date on preview and photo"
                selected={settings.showTimestamp}
                onClick={() => {
                  onSettingsChange((current) => ({ ...current, showTimestamp: true }))
                  onMenuViewChange('main')
                }}
              />
              <SelectButton
                label="Date Off"
                detail="Save clean photo without stamp"
                selected={!settings.showTimestamp}
                onClick={() => {
                  onSettingsChange((current) => ({ ...current, showTimestamp: false }))
                  onMenuViewChange('main')
                }}
              />
            </div>
          ) : null}
        </div>
      </div>

      {menuView !== 'main' ? (
        <button
          type="button"
          onClick={onBack}
          className="absolute left-6 top-6 rounded-full border border-cyan-400/25 bg-[#0b2324]/90 px-4 py-2 font-mono text-xs uppercase tracking-[0.22em] text-cyan-200"
        >
          Back
        </button>
      ) : null}
    </div>
  )
}

function SensorCard({
  label,
  value,
  onClick,
}: {
  label: string
  value: number
  onClick: () => void
}) {
  const activeBars = Math.max(1, Math.min(28, Math.round((value / 100) * 28)))

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-[24px] border border-cyan-500/28 bg-[#103234] px-5 py-5 text-left shadow-[inset_0_0_0_1px_rgba(0,255,255,0.04)] transition hover:border-cyan-300/40 hover:bg-[#123c3f]"
    >
      <div className="mb-5 flex items-center justify-between font-mono text-[clamp(20px,3vw,32px)] uppercase tracking-[0.06em] text-cyan-300">
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <div
        className="grid gap-px overflow-hidden rounded-[6px] bg-[#13585a] p-1"
        style={{ gridTemplateColumns: 'repeat(28, minmax(0, 1fr))' }}
      >
        {Array.from({ length: 28 }).map((_, index) => (
          <span
            key={index}
            className={`h-6 rounded-[1px] ${index < activeBars ? 'bg-cyan-400' : 'bg-[#155153]'}`}
          />
        ))}
      </div>
    </button>
  )
}

function ProfileChip({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-[12px] border px-6 py-4 font-mono text-[clamp(16px,2vw,24px)] uppercase tracking-[0.04em] transition ${
        active
          ? 'border-cyan-300 bg-cyan-400 text-[#082324]'
          : 'border-cyan-500/35 bg-[#103234] text-cyan-300'
      }`}
    >
      {label}
    </button>
  )
}
