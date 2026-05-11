import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

type PageHeadingProps = {
  icon: LucideIcon
  title: string
  subtitle?: string
  /** Right-aligned actions (e.g. buttons) */
  actions?: ReactNode
  className?: string
  /** Tighter vertical padding (e.g. dense toolbars below) */
  dense?: boolean
}

/**
 * Standard page title row — matches Check-In History (icon tile + title + gray subtitle).
 */
export default function PageHeading({ icon: Icon, title, subtitle, actions, className, dense }: PageHeadingProps) {
  return (
    <div
      className={`bg-white border-b border-gray-200 -mx-4 sm:-mx-6 px-4 sm:px-6 flex flex-col gap-2 sm:gap-3 sm:flex-row sm:items-center sm:justify-between ${dense ? 'py-3' : 'py-4'} ${className ?? ''}`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
          <Icon className="w-5 h-5 text-blue-600" />
        </div>
        <div className="min-w-0">
          <h1 className="text-lg font-bold text-gray-900">{title}</h1>
          {subtitle ? <p className="text-xs text-gray-500">{subtitle}</p> : null}
        </div>
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div> : null}
    </div>
  )
}
