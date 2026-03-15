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

  return (
    <div className="absolute inset-0 z-30 bg-black/78 p-4">
      <div className="flex h-full flex-col overflow-hidden rounded-[22px] border border-white/15 bg-black/85">
        <div className="border-b border-white/15 px-4 py-3 font-mono text-sm uppercase tracking-[0.28em] text-white">
          {menuView === 'main' ? 'Camera Setup' : 'Select Option'}
        </div>

        <div className="flex-1 overflow-auto px-3 py-3">
          {menuView === 'main' ? (
            <div className="space-y-2">
              <MenuButton
                label="Picture Mode"
                value={
                  isRandomFilterId(settings.filterId)
                    ? RANDOM_FILTER_OPTION.name
                    : getFilterById(settings.filterId)?.name ?? FILTERS[0].name
                }
                onClick={() => onMenuViewChange('filter')}
              />
              <MenuButton
                label="Lens Select"
                value={cameraLabel}
                onClick={() => onMenuViewChange('camera')}
              />
              <MenuButton
                label="Grain Level"
                value={`${settings.grainBoost.toFixed(2)}x`}
                onClick={() => onMenuViewChange('grain')}
              />
              <MenuButton
                label="Vignette"
                value={`${settings.vignetteBoost.toFixed(2)}x`}
                onClick={() => onMenuViewChange('vignette')}
              />
              <MenuButton
                label="Date Stamp"
                value={settings.showTimestamp ? 'On' : 'Off'}
                onClick={() => onMenuViewChange('date')}
              />
              <MenuButton
                label="Install App"
                value={isInstalled ? 'Installed' : canInstall ? 'Ready' : 'Browser'}
                onClick={onInstall}
              />
            </div>
          ) : null}

          {menuView === 'filter' ? (
            <div className="space-y-2">
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
            <div className="space-y-2">
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
            <div className="space-y-2">
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
            <div className="space-y-2">
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
            <div className="space-y-2">
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

        <div className="grid grid-cols-2 gap-2 border-t border-white/15 p-3">
          <button
            type="button"
            onClick={onBack}
            className="rounded-full border border-white/20 px-3 py-2 font-mono text-xs uppercase tracking-[0.24em] text-white"
          >
            {menuView === 'main' ? 'Close' : 'Back'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/20 px-3 py-2 font-mono text-xs uppercase tracking-[0.24em] text-white"
          >
            Exit
          </button>
        </div>
      </div>
    </div>
  )
}
