import { HudCorner } from './hud-corner'
import { Meter } from './meter'

type CameraHudProps = {
  modeText: string
  clockText: string
  batteryText: string
  statusText: string
  lensText: string
  stampText: string
  cameraLabel: string
  grainBoost: number
  vignetteBoost: number
  showTimestamp: boolean
  dateTint: string
  isStarting: boolean
  error: string | null
}

export function CameraHud({
  modeText,
  clockText,
  batteryText,
  statusText,
  lensText,
  stampText,
  cameraLabel,
  grainBoost,
  vignetteBoost,
  showTimestamp,
  dateTint,
  isStarting,
  error,
}: CameraHudProps) {
  return (
    <div className="absolute inset-0">
      <div className="pointer-events-none absolute left-4 top-4 font-mono text-[10px] uppercase tracking-[0.22em] text-white">
        {modeText}
      </div>

      <div className="pointer-events-none absolute left-1/2 top-4 -translate-x-1/2 font-mono text-[10px] uppercase tracking-[0.22em] text-white">
        {clockText}
      </div>

      <div className="pointer-events-none absolute right-4 top-4 flex flex-col items-end gap-1 font-mono text-[9px] uppercase tracking-[0.2em] text-white">
        <span>{batteryText}</span>
        <span>{lensText}</span>
        <span>{stampText}</span>
      </div>

      <HudCorner className="left-[20%] top-[24%] border-l border-t" />
      <HudCorner className="right-[20%] top-[24%] border-r border-t" />
      <HudCorner className="bottom-[28%] left-[20%] border-b border-l" />
      <HudCorner className="bottom-[28%] right-[20%] border-b border-r" />

      <div className="pointer-events-none absolute left-1/2 top-1/2 h-7 w-7 -translate-x-1/2 -translate-y-1/2">
        <span className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-white/90" />
        <span className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-white/90" />
      </div>

      <div className="pointer-events-none absolute bottom-5 left-4 font-mono text-[9px] uppercase tracking-[0.18em] text-white">
        <div className="mb-2 flex items-end gap-1">
          <span>G</span>
          <Meter active={Math.max(3, Math.round(grainBoost * 7))} />
        </div>
        <div className="mb-2 flex items-end gap-1">
          <span>V</span>
          <Meter active={Math.max(3, Math.round(vignetteBoost * 7))} />
        </div>
        <div>{cameraLabel}</div>
      </div>

      <div className="pointer-events-none absolute bottom-5 right-4 text-right font-mono text-[9px] uppercase tracking-[0.18em] text-white">
        <div>{statusText}</div>
        <div>{lensText}</div>
        <div>{showTimestamp ? 'STAMPED JPG' : 'CLEAN JPG'}</div>
      </div>

      {showTimestamp ? (
        <div
          className="pointer-events-none absolute bottom-20 right-5 font-mono text-sm tracking-[0.16em]"
          style={{ color: dateTint }}
        >
          {new Date().toLocaleDateString('ru-RU')}
        </div>
      ) : null}

      {isStarting ? (
        <div className="absolute inset-0 grid place-items-center bg-black/45">
          <div className="border border-white px-4 py-2 font-mono text-xs uppercase tracking-[0.28em] text-white">
            Connecting Camera
          </div>
        </div>
      ) : null}

      {error ? (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 border border-red-400 bg-black/80 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-red-300">
          {error}
        </div>
      ) : null}
    </div>
  )
}
