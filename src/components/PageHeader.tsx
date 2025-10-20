import type { ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  description?: string
  actions?: ReactNode
}

const PageHeader = ({ title, description, actions }: PageHeaderProps) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-900/40 px-6 py-5">
      <div className="max-w-2xl space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight text-white">{title}</h1>
        {description ? <p className="text-sm text-slate-400">{description}</p> : null}
      </div>
      {actions ? <div className="flex items-center gap-3">{actions}</div> : null}
    </div>
  )
}

export default PageHeader
