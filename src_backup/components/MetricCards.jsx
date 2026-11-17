import React from 'react'
import {
  Activity,
  ShieldCheck,
  ShieldAlert,
  Cpu,
} from 'lucide-react'
import { formatNumber } from '../utils'

export function MetricCards({
  flowsAnalyzed,
  benignCount,
  attackCount,
  apiStatus,
}) {
  const threatRate =
    flowsAnalyzed > 0
      ? ((attackCount / flowsAnalyzed) * 100).toFixed(1)
      : '0.0'

  const benignRate =
    flowsAnalyzed > 0
      ? ((benignCount / flowsAnalyzed) * 100).toFixed(1)
      : '0.0'

  return (
    <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {/* 1. Flows Analyzed */}
      <div className="group relative overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-5 backdrop-blur-sm transition-all duration-200 hover:border-zinc-700 hover:bg-zinc-900/60 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-zinc-400">
            Total Flows Analyzed
          </span>
          <div className="rounded-lg bg-cyan-500/10 p-2 text-cyan-400 border border-cyan-500/20">
            <Activity size={18} />
          </div>
        </div>

        <div className="mt-4 flex items-baseline gap-2">
          <p className="text-3xl font-semibold font-mono tracking-tight text-white">
            {formatNumber(flowsAnalyzed)}
          </p>
          <span className="text-xs text-zinc-500">records</span>
        </div>

        <p className="mt-2 text-xs text-zinc-500">
          {flowsAnalyzed > 0
            ? 'Actively parsed through pipeline'
            : 'Awaiting first flow analysis'}
        </p>
      </div>

      {/* 2. Benign Traffic */}
      <div className="group relative overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-5 backdrop-blur-sm transition-all duration-200 hover:border-zinc-700 hover:bg-zinc-900/60 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-zinc-400">
            Benign Verified
          </span>
          <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-400 border border-emerald-500/20">
            <ShieldCheck size={18} />
          </div>
        </div>

        <div className="mt-4 flex items-baseline gap-2">
          <p className="text-3xl font-semibold font-mono tracking-tight text-emerald-400">
            {formatNumber(benignCount)}
          </p>
          {flowsAnalyzed > 0 && (
            <span className="text-xs font-mono text-emerald-500/80">
              ({benignRate}%)
            </span>
          )}
        </div>

        <p className="mt-2 text-xs text-zinc-500">
          Normal verified network activity
        </p>
      </div>

      {/* 3. Attacks Detected */}
      <div
        className={`group relative overflow-hidden rounded-2xl border p-5 backdrop-blur-sm transition-all duration-200 shadow-sm ${
          attackCount > 0
            ? 'border-rose-500/40 bg-rose-950/10 hover:border-rose-500/60'
            : 'border-zinc-800/80 bg-zinc-900/40 hover:border-zinc-700 hover:bg-zinc-900/60'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-zinc-400">
            Threats Detected
          </span>
          <div
            className={`rounded-lg p-2 border ${
              attackCount > 0
                ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                : 'bg-zinc-800 text-zinc-400 border-zinc-700'
            }`}
          >
            <ShieldAlert size={18} />
          </div>
        </div>

        <div className="mt-4 flex items-baseline gap-2">
          <p
            className={`text-3xl font-semibold font-mono tracking-tight ${
              attackCount > 0 ? 'text-rose-400' : 'text-zinc-200'
            }`}
          >
            {formatNumber(attackCount)}
          </p>
          {flowsAnalyzed > 0 && (
            <span
              className={`text-xs font-mono ${
                attackCount > 0 ? 'text-rose-400' : 'text-zinc-500'
              }`}
            >
              ({threatRate}% rate)
            </span>
          )}
        </div>

        <p className="mt-2 text-xs text-zinc-500">
          {attackCount > 0
            ? 'Flagged for isolation / mitigation'
            : 'No anomalous threats flagged'}
        </p>
      </div>

      {/* 4. Model Status */}
      <div className="group relative overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-5 backdrop-blur-sm transition-all duration-200 hover:border-zinc-700 hover:bg-zinc-900/60 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-zinc-400">
            Model Engine
          </span>
          <div className="rounded-lg bg-indigo-500/10 p-2 text-indigo-400 border border-indigo-500/20">
            <Cpu size={18} />
          </div>
        </div>

        <div className="mt-4 flex items-baseline gap-2">
          <p className="text-xl font-semibold tracking-tight text-white">
            {apiStatus === 'connected' ? 'Two-Stage Active' : 'Standby'}
          </p>
        </div>

        <div className="mt-2 flex items-center gap-1.5 text-xs text-zinc-500">
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              apiStatus === 'connected' ? 'bg-emerald-400' : 'bg-amber-400'
            }`}
          />
          <span>Binary & Multiclass XGBoost</span>
        </div>
      </div>
    </section>
  )
}
