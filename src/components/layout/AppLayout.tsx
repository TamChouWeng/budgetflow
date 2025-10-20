import {
  BriefcaseBusiness,
  Building2,
  Database,
  Landmark,
  LayoutDashboard,
  LineChart,
  Menu,
  Settings as SettingsIcon,
} from 'lucide-react'
import { useState, type ComponentType } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { useBudgetStore } from '../../lib/datastore'

type NavItem = {
  to: string
  label: string
  icon: ComponentType<{ className?: string }>
}

const navItems: NavItem[] = [
  {
    to: '/',
    label: 'Dashboard',
    icon: LayoutDashboard,
  },
  {
    to: '/investments',
    label: 'Investments',
    icon: LineChart,
  },
  {
    to: '/business',
    label: 'Business',
    icon: BriefcaseBusiness,
  },
  {
    to: '/property',
    label: 'Property',
    icon: Building2,
  },
  {
    to: '/fixed-deposits',
    label: 'Fixed Deposits',
    icon: Landmark,
  },
  {
    to: '/settings',
    label: 'Settings',
    icon: SettingsIcon,
  },
  {
    to: '/data',
    label: 'Data',
    icon: Database,
  },
]

const AppLayout = () => {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const baseCurrency = useBudgetStore((state) => state.settings.baseCurrency)

  const renderNavLink = (
    item: NavItem,
    isMobile = false,
    onNavigate?: () => void,
  ) => {
    const Icon = item.icon
    return (
      <NavLink
        key={item.to}
        to={item.to}
        end={item.to === '/'}
        className={({ isActive }) => {
          const base = [
            'flex items-center gap-3 px-3 py-2 text-sm font-medium transition-colors',
            isMobile ? 'rounded-lg' : 'rounded-xl',
            isActive
              ? 'bg-brand-500/10 text-brand-200'
              : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-100',
          ]
          return base.join(' ')
        }}
        onClick={onNavigate}
      >
        <Icon className="h-4 w-4" aria-hidden />
        {item.label}
      </NavLink>
    )
  }

  return (
    <div className="flex h-full min-h-screen bg-slate-950 text-slate-100">
      <aside className="hidden w-64 flex-shrink-0 border-r border-slate-800 bg-slate-900/60 px-6 py-8 md:flex md:flex-col">
        <div className="mb-10 text-xl font-semibold tracking-tight text-white">
          Budgetflow
        </div>
        <nav className="flex flex-1 flex-col gap-2 text-sm font-medium">
          {navItems.map((item) => renderNavLink(item))}
        </nav>
        <p className="mt-6 text-xs text-slate-500">Netlify-ready · Offline capable</p>
      </aside>
      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-slate-800 bg-slate-900/80 px-4 py-3 backdrop-blur lg:px-8">
          <button
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-800 text-slate-100 md:hidden"
            onClick={() => setMobileNavOpen((prev) => !prev)}
            aria-label="Toggle navigation"
          >
            <Menu className="h-5 w-5" aria-hidden />
          </button>
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-brand-400">Budgetflow</p>
            <h1 className="text-lg font-semibold text-slate-100">
              Investment &amp; Business Spending Tracker
            </h1>
          </div>
          <span className="hidden rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-1 text-xs font-medium text-slate-300 md:inline-flex">
            Base currency: {baseCurrency}
          </span>
        </header>
        {mobileNavOpen ? (
          <nav className="grid gap-2 border-b border-slate-800 bg-slate-900/90 px-4 py-4 md:hidden">
            {navItems.map((item) =>
              renderNavLink(item, true, () => setMobileNavOpen(false)),
            )}
          </nav>
        ) : null}
        <main className="flex-1 overflow-y-auto px-4 py-8 lg:px-8">
          <div className="mx-auto w-full max-w-6xl space-y-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

export default AppLayout
