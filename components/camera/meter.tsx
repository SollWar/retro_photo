export function Meter({ active = 11 }: { active?: number }) {
  return (
    <div className="flex items-end gap-px">
      {Array.from({ length: 12 }).map((_, index) => (
        <span
          key={index}
          className={`block w-[3px] ${index < active ? 'bg-white' : 'bg-white/30'}`}
          style={{ height: `${4 + (index % 6) * 2}px` }}
        />
      ))}
    </div>
  )
}
