export function SelectButton({
  label,
  detail,
  selected,
  onClick,
}: {
  label: string
  detail: string
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-[18px] border px-4 py-4 text-left ${
        selected
          ? 'border-white bg-white text-black'
          : 'border-white/15 bg-white/[0.04] text-white'
      }`}
    >
      <div className="font-mono text-sm uppercase tracking-[0.18em]">{label}</div>
      <div
        className={`mt-1 font-mono text-[11px] uppercase tracking-[0.14em] ${
          selected ? 'text-black/70' : 'text-white/55'
        }`}
      >
        {detail}
      </div>
    </button>
  )
}
