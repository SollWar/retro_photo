export function HudCorner({ className }: { className: string }) {
  return (
    <div
      className={`pointer-events-none absolute h-5 w-5 border-amber-200/90 ${className}`}
    />
  )
}
