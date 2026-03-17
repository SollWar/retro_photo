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
      className="group flex w-full items-center justify-between rounded-[22px] border border-cyan-500/30 bg-[#103234] px-5 py-5 text-left shadow-[inset_0_0_0_1px_rgba(0,255,255,0.04)] transition hover:border-cyan-300/45 hover:bg-[#123c3f]"
    >
      <span className="font-mono text-base uppercase tracking-[0.12em] text-cyan-300">
        {label}
      </span>
      <span className="ml-4 font-mono text-sm uppercase tracking-[0.12em] text-cyan-200/80 group-hover:text-cyan-100">
        {value}
      </span>
    </button>
  )
}
