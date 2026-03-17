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
        <span className="theme-hud-line absolute left-1/2 top-0 h-full w-px -translate-x-1/2" />
        <span className="theme-hud-line absolute left-0 top-1/2 h-px w-full -translate-y-1/2" />
        <span className="theme-hud-border absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full border" />
      </div>

      <div className="absolute inset-x-0 top-0 h-28 bg-[linear-gradient(180deg,rgba(2,9,10,0.5),transparent)]" />
      <div className="absolute inset-x-0 bottom-0 h-36 bg-[linear-gradient(0deg,rgba(2,9,10,0.9),transparent)]" />

      {showTimestamp ? (
        <div
          className="theme-status-panel absolute bottom-5 right-5 rounded-[14px] border px-3 py-2 font-mono text-sm tracking-[0.16em]"
          style={{ color: dateTint }}
        >
          {new Date().toLocaleDateString('ru-RU')}
        </div>
      ) : null}

      {isStarting ? (
        <div className="absolute inset-0 grid place-items-center bg-black/35">
          <div className="theme-status-panel rounded-[18px] border px-5 py-3 font-mono text-xs uppercase tracking-[0.28em]">
            Подключаем камеру
          </div>
        </div>
      ) : null}

      {error ? (
        <div className="theme-error-panel absolute bottom-28 left-1/2 -translate-x-1/2 rounded-[14px] border px-4 py-3 font-mono text-[10px] uppercase tracking-[0.2em]">
          {error}
        </div>
      ) : null}
    </div>
  )
}
