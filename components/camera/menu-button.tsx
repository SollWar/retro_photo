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
      className="group flex w-full items-center justify-between rounded-[22px] border border-amber-200/18 bg-[#2a1b13] px-5 py-5 text-left shadow-[inset_0_0_0_1px_rgba(255,214,170,0.04)] transition hover:border-amber-200/40 hover:bg-[#342116]"
    >
      <span className="font-mono text-base uppercase tracking-[0.12em] text-amber-200">
        {label}
      </span>
      <span className="ml-4 font-mono text-sm uppercase tracking-[0.12em] text-amber-100/80 group-hover:text-amber-50">
        {value}
      </span>
    </button>
  )
}
