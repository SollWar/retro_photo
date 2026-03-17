import { HudCorner } from './hud-corner'

type CameraHudProps = {
  showTimestamp: boolean
  dateTint: string
  isStarting: boolean
  error: string | null
}

export function CameraHud({
  showTimestamp,
  dateTint,
  isStarting,
  error,
}: CameraHudProps) {
  return (
    <div className="pointer-events-none absolute inset-0">
      <HudCorner className="left-[18%] top-[18%] border-l border-t" />
      <HudCorner className="right-[18%] top-[18%] border-r border-t" />
      <HudCorner className="bottom-[20%] left-[18%] border-b border-l" />
      <HudCorner className="bottom-[20%] right-[18%] border-b border-r" />

      <div className="absolute left-1/2 top-[45%] h-9 w-9 -translate-x-1/2 -translate-y-1/2">
        <span className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-cyan-300/85" />
        <span className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-cyan-300/85" />
        <span className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-300/80" />
      </div>

      <div className="absolute inset-x-0 top-0 h-28 bg-[linear-gradient(180deg,rgba(2,9,10,0.5),transparent)]" />
      <div className="absolute inset-x-0 bottom-0 h-36 bg-[linear-gradient(0deg,rgba(2,9,10,0.9),transparent)]" />

      {showTimestamp ? (
        <div
          className="absolute bottom-5 right-5 rounded-[14px] border border-cyan-400/15 bg-[#081b1c]/66 px-3 py-2 font-mono text-sm tracking-[0.16em] shadow-[inset_0_0_0_1px_rgba(0,255,255,0.03)]"
          style={{ color: dateTint }}
        >
          {new Date().toLocaleDateString('ru-RU')}
        </div>
      ) : null}

      {isStarting ? (
        <div className="absolute inset-0 grid place-items-center bg-[#041011]/55">
          <div className="rounded-[18px] border border-cyan-400/24 bg-[#0b2324]/88 px-5 py-3 font-mono text-xs uppercase tracking-[0.28em] text-cyan-200">
            Connecting Camera
          </div>
        </div>
      ) : null}

      {error ? (
        <div className="absolute bottom-28 left-1/2 -translate-x-1/2 rounded-[14px] border border-red-400/40 bg-[#2a1212]/88 px-4 py-3 font-mono text-[10px] uppercase tracking-[0.2em] text-red-200">
          {error}
        </div>
      ) : null}
    </div>
  )
}
