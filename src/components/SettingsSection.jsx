import React, { useState } from 'react'
import {
  Server,
  RefreshCw,
  Database,
  Sparkles,
  Search,
} from 'lucide-react'
import { DEMO_PREDICTIONS } from '../constants'

export function SettingsSection({
  apiBaseUrl,
  setApiBaseUrl,
  defaultEnvUrl,
  apiStatus,
  onRefreshHealth,
  features,
  setPredictions,
  onClearPredictions,
  setSuccessMessage,
}) {
  const [customUrl, setCustomUrl] = useState(apiBaseUrl)
  const [featureSearch, setFeatureSearch] = useState('')

  const handleSaveUrl = (e) => {
    e.preventDefault()
    const trimmed = customUrl.trim().replace(/\/$/, '')
    setApiBaseUrl(trimmed)
    localStorage.setItem('hids_custom_api_url', trimmed)
    setSuccessMessage(`API Base URL updated to: ${trimmed || '(relative origin)'}`)
    setTimeout(() => {
      onRefreshHealth()
    }, 100)
  }

  const handleResetDefaultUrl = () => {
    setCustomUrl(defaultEnvUrl)
    setApiBaseUrl(defaultEnvUrl)
    localStorage.removeItem('hids_custom_api_url')
    setSuccessMessage(`API Base URL restored to environment default: ${defaultEnvUrl}`)
    setTimeout(() => {
      onRefreshHealth()
    }, 100)
  }

  const handleLoadDemoData = () => {
    setPredictions(DEMO_PREDICTIONS)
    setSuccessMessage('Loaded 6 demo flow telemetry records into the dashboard.')
  }

  const filteredFeatures = features.filter((f) =>
    f.toLowerCase().includes(featureSearch.toLowerCase().trim())
  )

  return (
    <section className="space-y-6">
      {/* 1. API Configuration */}
      <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-5 md:p-6 backdrop-blur-sm shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="rounded-lg bg-zinc-800 p-2 text-zinc-300 border border-zinc-700/50">
            <Server size={18} />
          </div>
          <div>
            <h3 className="text-base font-semibold tracking-tight text-white">
              Inference Endpoint Gateway
            </h3>
            <p className="text-xs text-zinc-400">
              Configure the REST backend server providing /health, /features, and /predict endpoints
            </p>
          </div>
        </div>

        <form onSubmit={handleSaveUrl} className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              API Base URL
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                placeholder="e.g. http://127.0.0.1:8000 or https://your-tunnel.trycloudflare.com"
                className="flex-1 rounded-xl border border-zinc-800 bg-zinc-950/80 px-3.5 py-2 text-xs font-mono text-zinc-100 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20"
              />
              <button
                type="submit"
                className="rounded-xl bg-zinc-100 px-4 py-2 text-xs font-semibold text-zinc-950 hover:bg-white transition-all shadow-sm active:scale-95"
              >
                Save & Test
              </button>
              {defaultEnvUrl && (
                <button
                  type="button"
                  onClick={handleResetDefaultUrl}
                  className="rounded-xl border border-zinc-800 bg-zinc-900 px-3.5 py-2 text-xs font-medium text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
                >
                  Reset Default
                </button>
              )}
            </div>
            <p className="mt-1.5 text-[11px] text-zinc-400">
              Current environment origin: <span className="font-mono text-zinc-400">{defaultEnvUrl || 'relative'}</span>
            </p>
          </div>
        </form>

        {/* Live Diagnostics Card */}
        <div className="mt-5 rounded-xl border border-zinc-800 bg-zinc-950/60 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-300">
              Backend Health Probing
            </span>
            <button
              onClick={onRefreshHealth}
              className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900 px-2.5 py-1 text-[11px] font-mono text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
            >
              <RefreshCw size={11} />
              Re-probe Now
            </button>
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-zinc-800/80 bg-zinc-900/40 p-3">
              <span className="text-[10px] font-mono text-zinc-400 uppercase">
                Gateway Status
              </span>
              <p
                className={`mt-1 text-sm font-semibold ${
                  apiStatus === 'connected'
                    ? 'text-emerald-400'
                    : apiStatus === 'checking'
                    ? 'text-amber-400'
                    : 'text-rose-400'
                }`}
              >
                {apiStatus === 'connected'
                  ? 'Healthy & Online'
                  : apiStatus === 'checking'
                  ? 'Checking Ping...'
                  : 'Connection Refused'}
              </p>
            </div>

            <div className="rounded-lg border border-zinc-800/80 bg-zinc-900/40 p-3">
              <span className="text-[10px] font-mono text-zinc-400 uppercase">
                Binary XGBoost
              </span>
              <p className="mt-1 text-sm font-semibold text-zinc-200">
                {apiStatus === 'connected' ? 'Loaded (binary_decision)' : 'Standby'}
              </p>
            </div>

            <div className="rounded-lg border border-zinc-800/80 bg-zinc-900/40 p-3">
              <span className="text-[10px] font-mono text-zinc-400 uppercase">
                Multiclass XGBoost
              </span>
              <p className="mt-1 text-sm font-semibold text-zinc-200">
                {apiStatus === 'connected' ? 'Loaded (attack_type)' : 'Standby'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Feature Schema Explorer */}
      <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-5 md:p-6 backdrop-blur-sm shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-800/80 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="rounded-lg bg-zinc-800 p-2 text-zinc-300 border border-zinc-700/50">
              <Database size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold tracking-tight text-white">
                  Feature Schema Definition
                </h3>
                <span className="rounded bg-cyan-500/10 px-2 py-0.5 text-[10px] font-mono text-cyan-400 border border-cyan-500/20">
                  {features.length} Features
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                All 78 statistical attributes strictly required by the inference pipeline
              </p>
            </div>
          </div>

          <div className="relative min-w-[200px]">
            <Search
              size={13}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
            />
            <input
              type="text"
              placeholder="Search features..."
              value={featureSearch}
              onChange={(e) => setFeatureSearch(e.target.value)}
              className="w-full rounded-lg border border-zinc-800 bg-zinc-950/80 pl-8 pr-3 py-1 text-xs text-zinc-200 placeholder-zinc-500 outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        <div className="mt-4 max-h-60 overflow-y-auto pr-1">
          <div className="flex flex-wrap gap-1.5">
            {filteredFeatures.map((name, i) => (
              <span
                key={name}
                className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-950/70 px-2.5 py-1 text-[11px] font-mono text-zinc-300 hover:border-zinc-700"
              >
                <span className="text-[9px] text-zinc-400">{i + 1}</span>
                <span>{name}</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Session & Data Management */}
      <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-5 md:p-6 backdrop-blur-sm shadow-sm">
        <h3 className="text-base font-semibold tracking-tight text-white">
          Session & Telemetry Management
        </h3>
        <p className="mt-0.5 text-xs text-zinc-400">
          Manage local session records or populate realistic test flows
        </p>

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            onClick={handleLoadDemoData}
            className="flex items-center gap-1.5 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-xs font-semibold text-cyan-300 hover:bg-cyan-500/20 transition-colors shadow-sm"
          >
            <Sparkles size={14} />
            Load Sample Telemetry Records
          </button>

          <button
            onClick={onClearPredictions}
            className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2 text-xs font-medium text-zinc-400 hover:border-rose-500/30 hover:bg-rose-500/10 hover:text-rose-400 transition-colors"
          >
            Reset Analyzed History
          </button>
        </div>
      </div>
    </section>
  )
}
