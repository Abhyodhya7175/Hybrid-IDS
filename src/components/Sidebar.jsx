import React from 'react'
import {
  ShieldCheck,
  LayoutDashboard,
  Activity,
  FileUp,
  Settings,
  X,
  Radio,
  Server,
} from 'lucide-react'

export function Sidebar({
  activePage,
  setActivePage,
  mobileMenu,
  setMobileMenu,
  apiStatus,
  apiBaseUrl,
  flowsCount,
  onRefreshHealth,
}) {
  const navigation = [
    { name: 'Overview', icon: LayoutDashboard, badge: null },
    {
      name: 'Traffic Analysis',
      icon: Activity,
      badge: flowsCount > 0 ? flowsCount : null,
    },
    { name: 'Upload Dataset', icon: FileUp, badge: null },
    { name: 'Settings', icon: Settings, badge: null },
  ]

  const statusColor =
    apiStatus === 'connected'
      ? 'bg-emerald-400 text-emerald-400'
      : apiStatus === 'checking'
      ? 'bg-amber-400 text-amber-400'
      : 'bg-rose-400 text-rose-400'

  const statusBorder =
    apiStatus === 'connected'
      ? 'border-emerald-500/20 bg-emerald-500/5'
      : apiStatus === 'checking'
      ? 'border-amber-500/20 bg-amber-500/5'
      : 'border-rose-500/20 bg-rose-500/5'

  const statusText =
    apiStatus === 'connected'
      ? 'Online & Ready'
      : apiStatus === 'checking'
      ? 'Probing Gateway'
      : 'API Disconnected'

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileMenu && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setMobileMenu(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col justify-between border-r border-zinc-800/80 bg-[#090b10] p-5 transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          mobileMenu ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          {/* Brand header */}
          <div className="flex items-center justify-between px-2 pt-2 pb-6">
            <div className="flex items-center gap-3">
              <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/10 border border-cyan-500/30 text-cyan-400 shadow-inner">
                <ShieldCheck size={22} className="stroke-[2.2]" />
                <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                  <span
                    className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${statusColor}`}
                  />
                  <span
                    className={`relative inline-flex h-2.5 w-2.5 rounded-full ${
                      apiStatus === 'connected'
                        ? 'bg-emerald-500'
                        : apiStatus === 'checking'
                        ? 'bg-amber-500'
                        : 'bg-rose-500'
                    }`}
                  />
                </span>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h1 className="text-base font-semibold tracking-tight text-white">
                    Hybrid IDS
                  </h1>
                  <span className="rounded bg-cyan-500/10 px-1.5 py-0.5 text-[10px] font-mono font-medium text-cyan-400 border border-cyan-500/20">
                    SOC
                  </span>
                </div>
                <p className="text-[11px] text-zinc-500 font-normal">
                  Intrusion Detection System
                </p>
              </div>
            </div>

            <button
              onClick={() => setMobileMenu(false)}
              className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white lg:hidden"
              aria-label="Close navigation"
            >
              <X size={18} />
            </button>
          </div>

          {/* Navigation Section */}
          <div className="mt-4">
            <p className="px-3 text-[11px] font-mono uppercase tracking-wider text-zinc-500">
              Navigation
            </p>

            <nav className="mt-2 space-y-1">
              {navigation.map(({ name, icon: Icon, badge }) => {
                const isActive = activePage === name
                return (
                  <button
                    key={name}
                    onClick={() => {
                      setActivePage(name)
                      setMobileMenu(false)
                    }}
                    className={`group relative flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-150 ${
                      isActive
                        ? 'bg-zinc-800/90 text-white shadow-sm border border-zinc-700/60'
                        : 'text-zinc-400 hover:bg-zinc-900/80 hover:text-zinc-200'
                    }`}
                  >
                    <Icon
                      size={18}
                      className={`transition-colors ${
                        isActive
                          ? 'text-cyan-400'
                          : 'text-zinc-400 group-hover:text-zinc-300'
                      }`}
                    />
                    <span>{name}</span>

                    {badge !== null && (
                      <span className="ml-auto rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] font-mono text-zinc-400 border border-zinc-700/50">
                        {badge}
                      </span>
                    )}

                    {isActive && (
                      <span className="absolute right-2.5 h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
                    )}
                  </button>
                )
              })}
            </nav>
          </div>
        </div>

        {/* Bottom Connection Status Card */}
        <div className="space-y-3 pt-4 border-t border-zinc-800/80">
          <div className={`rounded-xl border p-3 ${statusBorder} transition-colors`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span
                    className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${statusColor}`}
                  />
                  <span
                    className={`relative inline-flex h-2 w-2 rounded-full ${
                      apiStatus === 'connected'
                        ? 'bg-emerald-500'
                        : apiStatus === 'checking'
                        ? 'bg-amber-500'
                        : 'bg-rose-500'
                    }`}
                  />
                </span>
                <span className="text-xs font-medium text-zinc-200">
                  {statusText}
                </span>
              </div>

              {onRefreshHealth && (
                <button
                  onClick={onRefreshHealth}
                  title="Check connection"
                  className="rounded p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
                >
                  <Radio size={13} />
                </button>
              )}
            </div>

            <div className="mt-2 flex items-center gap-1.5 text-[11px] font-mono text-zinc-400 truncate">
              <Server size={12} className="shrink-0 text-zinc-500" />
              <span className="truncate" title={apiBaseUrl || 'Relative origin'}>
                {apiBaseUrl ? apiBaseUrl.replace(/^https?:\/\//, '') : 'local:proxy'}
              </span>
            </div>
          </div>

          <div className="px-1 text-[11px] text-zinc-400 font-mono flex items-center justify-between">
            <span>Dual XGBoost Engine</span>
            <span>v1.0</span>
          </div>
        </div>
      </aside>
    </>
  )
}

