export function MenuButton({
  label,
  value,
  onClick,
}: {
  label: string
  value: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between rounded-[18px] border border-white/15 bg-white/[0.04] px-4 py-4 text-left"
    >
      <span className="font-mono text-sm uppercase tracking-[0.18em] text-white">
        {label}
      </span>
      <span className="ml-4 font-mono text-[11px] uppercase tracking-[0.18em] text-white/60">
        {value}
      </span>
    </button>
  )
}
