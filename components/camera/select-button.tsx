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
      className={`w-full rounded-[22px] border px-5 py-5 text-left transition ${
        selected
          ? 'border-amber-200 bg-[#d3a062] text-[#2b180d]'
          : 'border-amber-200/18 bg-[#2a1b13] text-amber-50 hover:border-amber-200/40 hover:bg-[#342116]'
      }`}
    >
      <div className="font-mono text-base uppercase tracking-[0.12em]">{label}</div>
      <div
        className={`mt-2 font-mono text-xs uppercase tracking-[0.16em] ${
          selected ? 'text-[#5a381f]/80' : 'text-amber-100/60'
        }`}
      >
        {detail}
      </div>
    </button>
  )
}
