type CapturePreviewProps = {
  imageUrl: string
  filterName: string
  resolutionText: string
  isBusy: boolean
  onSave: () => void
  onShare: () => void
  onRetake: () => void
}

export function CapturePreview({
  imageUrl,
  filterName,
  resolutionText,
  isBusy,
  onSave,
  onShare,
  onRetake,
}: CapturePreviewProps) {
  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-[radial-gradient(circle_at_top,rgba(37,220,224,0.16),transparent_28%),linear-gradient(180deg,#071718,#02090a)]">
      <div className="mx-auto flex min-h-[100dvh] w-full max-w-[860px] flex-col px-3 pb-[calc(env(safe-area-inset-bottom)+16px)] pt-[calc(env(safe-area-inset-top)+12px)] sm:px-4">
        <div className="relative flex-1 overflow-hidden rounded-[34px] border border-cyan-400/18 bg-[#041112] shadow-[0_28px_80px_rgba(0,0,0,0.5)]">
          <img
            src={imageUrl}
            alt="Captured retro photo"
            className="h-full w-full object-contain"
          />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-[linear-gradient(0deg,rgba(2,9,10,0.9),transparent)]" />
        </div>

        <div className="mt-3 rounded-[30px] border border-cyan-400/18 bg-[#081f20]/94 p-5 shadow-[0_24px_60px_rgba(0,0,0,0.35),inset_0_0_0_1px_rgba(0,255,255,0.04)]">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="font-mono text-[11px] uppercase tracking-[0.34em] text-cyan-300/72">
                Captured Frame
              </div>
              <div className="mt-3 font-mono text-[clamp(22px,4vw,34px)] uppercase tracking-[0.06em] text-white">
                {filterName}
              </div>
              <div className="mt-2 font-mono text-xs uppercase tracking-[0.2em] text-cyan-100/70">
                {resolutionText}
              </div>
            </div>

            <button
              type="button"
              onClick={onRetake}
              className="rounded-[18px] border border-cyan-400/18 bg-[#0b2324]/82 px-5 py-3 font-mono text-xs uppercase tracking-[0.22em] text-cyan-200 transition hover:border-cyan-300/40"
            >
              Retake
            </button>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <button
              type="button"
              onClick={onSave}
              disabled={isBusy}
              className="rounded-[20px] bg-cyan-400 px-5 py-4 font-mono text-sm uppercase tracking-[0.2em] text-[#062021] transition hover:bg-cyan-300 disabled:opacity-60"
            >
              {isBusy ? 'Working...' : 'Save'}
            </button>
            <button
              type="button"
              onClick={onShare}
              disabled={isBusy}
              className="rounded-[20px] border border-cyan-400/18 bg-[#0d2b2d] px-5 py-4 font-mono text-sm uppercase tracking-[0.2em] text-cyan-200 transition hover:border-cyan-300/38 disabled:opacity-60"
            >
              Share
            </button>
            <button
              type="button"
              onClick={onRetake}
              disabled={isBusy}
              className="rounded-[20px] border border-cyan-400/18 bg-[#0d2b2d] px-5 py-4 font-mono text-sm uppercase tracking-[0.2em] text-cyan-200 transition hover:border-cyan-300/38 disabled:opacity-60"
            >
              Back To Camera
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
