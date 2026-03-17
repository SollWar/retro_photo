type CapturePreviewProps = {
  imageUrl: string
  filterName: string
  resolutionText: string
  aspectRatio: number
  isBusy: boolean
  onSave: () => void
  onShare: () => void
  onRetake: () => void
}

export function CapturePreview({
  imageUrl,
  filterName,
  resolutionText,
  aspectRatio,
  isBusy,
  onSave,
  onShare,
  onRetake,
}: CapturePreviewProps) {
  return (
    <div className="theme-shell fixed inset-0 z-50 overflow-hidden">
      <div className="mx-auto flex min-h-[100dvh] w-full max-w-[860px] flex-col px-3 pb-[calc(env(safe-area-inset-bottom)+16px)] pt-[calc(env(safe-area-inset-top)+12px)] sm:px-4">
        <div className="relative min-h-0 flex-1">
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className="theme-preview-surface relative w-full max-h-full max-w-full overflow-hidden rounded-[34px] border"
              style={{ aspectRatio: `${aspectRatio}` }}
            >
              <img
                src={imageUrl}
                alt="Снятая ретро-фотография"
                className="h-full w-full object-contain"
              />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-[linear-gradient(0deg,rgba(2,9,10,0.9),transparent)]" />
            </div>
          </div>
        </div>

        <div className="theme-panel-surface mt-3 rounded-[30px] border p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="theme-label font-mono text-[11px] uppercase tracking-[0.34em]">
                Снятый кадр
              </div>
              <div className="mt-3 font-mono text-[clamp(22px,4vw,34px)] uppercase tracking-[0.06em] text-[color:var(--theme-text)]">
                {filterName}
              </div>
              <div className="theme-text-soft mt-2 font-mono text-xs uppercase tracking-[0.2em]">
                {resolutionText}
              </div>
            </div>

            <button
              type="button"
              onClick={onRetake}
              className="theme-secondary-action rounded-[18px] border px-5 py-3 font-mono text-xs uppercase tracking-[0.22em] transition hover:brightness-110"
            >
              Переснять
            </button>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <button
              type="button"
              onClick={onSave}
              disabled={isBusy}
              className="theme-primary-action rounded-[20px] border px-5 py-4 font-mono text-sm uppercase tracking-[0.2em] transition hover:brightness-105 disabled:opacity-60"
            >
              {isBusy ? 'Сохраняю...' : 'Сохранить'}
            </button>
            <button
              type="button"
              onClick={onShare}
              disabled={isBusy}
              className="theme-secondary-action rounded-[20px] border px-5 py-4 font-mono text-sm uppercase tracking-[0.2em] transition hover:brightness-110 disabled:opacity-60"
            >
              Поделиться
            </button>
            <button
              type="button"
              onClick={onRetake}
              disabled={isBusy}
              className="theme-secondary-action rounded-[20px] border px-5 py-4 font-mono text-sm uppercase tracking-[0.2em] transition hover:brightness-110 disabled:opacity-60"
            >
              Назад к камере
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
