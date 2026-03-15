export function HudCorner({ className }: { className: string }) {
  return (
    <div
      className={`pointer-events-none absolute h-4 w-4 border-white/90 ${className}`}
    />
  )
}
