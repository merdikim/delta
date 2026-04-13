import type { ReactNode } from "react"

function SectionBadge({ badge, text }: { badge: ReactNode, text:string }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-primary/80 bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-emerald-900 shadow-sm backdrop-blur">
      {badge}
      <span>{text}</span>
    </div>
  )
}

export default SectionBadge