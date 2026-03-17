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
          ? 'border-cyan-300 bg-cyan-400 text-[#04191a]'
          : 'border-cyan-500/30 bg-[#103234] text-cyan-100 hover:border-cyan-300/45 hover:bg-[#123c3f]'
      }`}
    >
      <div className="font-mono text-base uppercase tracking-[0.12em]">{label}</div>
      <div
        className={`mt-2 font-mono text-xs uppercase tracking-[0.16em] ${
          selected ? 'text-[#083234]/75' : 'text-cyan-200/60'
        }`}
      >
        {detail}
      </div>
    </button>
  )
}
