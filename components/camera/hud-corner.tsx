export function HudCorner({ className }: { className: string }) {
  return (
    <div
      className={`theme-hud-border pointer-events-none absolute h-5 w-5 ${className}`}
    />
  )
}
