import React from 'react'
import { Menu, FileUp, RefreshCw } from 'lucide-react'

export function Header({
  activePage,
  setActivePage,
  setMobileMenu,
  apiStatus,
  onRefreshHealth,
  isAnalyzing,
}) {
  const getPageDescription = () => {
    switch (activePage) {
      case 'Overview':
        return 'Real-time telemetry, threat ratio & detection pipeline overview'
      case 'Traffic Analysis':
        return 'Deep inspection of analyzed network flows and classification details'
      case 'Upload Dataset':
        return 'Ingest network flow records via CSV or evaluate single flow vectors'
      case 'Settings':
        return 'Inference endpoint configuration, diagnostics & model metadata'
      default:
        return 'Security Operations Center'
    }
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-zinc-800/80 bg-[#090b10]/85 px-4 md:px-8 backdrop-blur-md">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setMobileMenu(true)}
          className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-800/80 hover:text-white lg:hidden transition-colors"
          aria-label="Toggle navigation"
        >
          <Menu size={20} />
        </button>

        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold tracking-tight text-white">
              {activePage}
            </h2>
            <span className="hidden sm:inline-block h-3.5 w-px bg-zinc-800" />
            <p className="hidden sm:inline-block text-xs text-zinc-400 truncate max-w-md">
              {getPageDescription()}
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        {/* API Health Pill */}
        <div
          onClick={onRefreshHealth}
          className="group flex cursor-pointer items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/90 px-3 py-1.5 text-xs text-zinc-300 transition-colors hover:border-zinc-700"
          title="Click to check API status"
        >
          <span
            className={`h-2 w-2 rounded-full ${
              apiStatus === 'connected'
                ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]'
                : apiStatus === 'checking'
                ? 'bg-amber-400 animate-pulse'
                : 'bg-rose-500'
            }`}
          />
          <span className="text-[11px] font-medium hidden sm:inline">
            {apiStatus === 'connected'
              ? 'Inference Engine Ready'
              : apiStatus === 'checking'
              ? 'Connecting...'
              : 'Backend Offline'}
          </span>
          <RefreshCw
            size={11}
            className={`text-zinc-500 group-hover:text-zinc-300 transition-transform ${
              isAnalyzing || apiStatus === 'checking' ? 'animate-spin' : ''
            }`}
          />
        </div>

        {/* Quick Jump to Ingestion */}
        {activePage !== 'Upload Dataset' && (
          <button
            onClick={() => setActivePage('Upload Dataset')}
            className="flex items-center gap-1.5 rounded-lg bg-zinc-100 px-3 py-1.5 text-xs font-semibold text-zinc-950 hover:bg-white transition-all shadow-sm active:scale-95"
          >
            <FileUp size={14} className="stroke-[2.2]" />
            <span className="hidden sm:inline">Ingest Traffic</span>
          </button>
        )}
      </div>
    </header>
  )
}
