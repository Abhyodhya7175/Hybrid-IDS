import React from 'react'
import {
  X,
  ShieldCheck,
  ShieldAlert,
  Gauge,
  Percent,
} from 'lucide-react'

export function FlowDetailModal({ flow, onClose }) {
  if (!flow) return null

  const isAttack = flow.binaryDecision === 'ATTACK'
  const attackProb = (Number(flow.attackProbability) * 100).toFixed(4)
  const confidence =
    flow.multiclassConfidence != null
      ? (Number(flow.multiclassConfidence) * 100).toFixed(2) + '%'
      : 'N/A'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/75 backdrop-blur-sm transition-opacity">
      <div
        className="relative w-full max-w-lg rounded-2xl border border-zinc-800 bg-[#0c0e14] p-6 shadow-2xl transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-xl border ${
                isAttack
                  ? 'border-rose-500/30 bg-rose-500/10 text-rose-400'
                  : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
              }`}
            >
              {isAttack ? <ShieldAlert size={20} /> : <ShieldCheck size={20} />}
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">
                Network Flow #{flow.flowId}
              </h3>
              <p className="text-xs text-zinc-400 font-mono">
                ID: {flow.id}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="mt-5 space-y-4">
          {/* Main classification banner */}
          <div
            className={`rounded-xl border p-4 ${
              isAttack
                ? 'border-rose-500/30 bg-rose-500/10'
                : 'border-emerald-500/30 bg-emerald-500/10'
            }`}
          >
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
              Primary Model Classification
            </span>
            <div className="mt-1 flex items-baseline justify-between">
              <span
                className={`text-xl font-bold ${
                  isAttack ? 'text-rose-400' : 'text-emerald-400'
                }`}
              >
                {flow.predictedLabel || 'Unspecified'}
              </span>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-mono font-medium border ${
                  isAttack
                    ? 'border-rose-500/30 bg-rose-500/20 text-rose-300'
                    : 'border-emerald-500/30 bg-emerald-500/20 text-emerald-300'
                }`}
              >
                {flow.binaryDecision}
              </span>
            </div>
          </div>

          {/* Metrics grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3.5">
              <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                <Gauge size={14} className="text-cyan-400" />
                <span>Attack Probability</span>
              </div>
              <p className="mt-2 text-lg font-mono font-semibold text-white">
                {attackProb}%
              </p>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
                <div
                  className={`h-full rounded-full ${
                    isAttack ? 'bg-rose-500' : 'bg-emerald-400'
                  }`}
                  style={{
                    width: `${Math.min(100, Math.max(2, flow.attackProbability * 100))}%`,
                  }}
                />
              </div>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3.5">
              <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                <Percent size={14} className="text-indigo-400" />
                <span>Multiclass Confidence</span>
              </div>
              <p className="mt-2 text-lg font-mono font-semibold text-white">
                {confidence}
              </p>
              <span className="text-[11px] text-zinc-500 font-mono">
                XGBoost multiclass output
              </span>
            </div>
          </div>

          {/* Model decision metadata */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 space-y-2.5 text-xs">
            <div className="flex items-center justify-between text-zinc-400">
              <span>Decision Threshold</span>
              <span className="font-mono text-zinc-200">
                {flow.threshold != null ? flow.threshold : '0.50 (Default)'}
              </span>
            </div>
            <div className="flex items-center justify-between text-zinc-400">
              <span>Feature Vector Dimensions</span>
              <span className="font-mono text-zinc-200">78 statistical attributes</span>
            </div>
            <div className="flex items-center justify-between text-zinc-400">
              <span>Pipeline Stage 1 Status</span>
              <span className="font-mono text-emerald-400">Evaluated (Binary)</span>
            </div>
            <div className="flex items-center justify-between text-zinc-400">
              <span>Pipeline Stage 2 Status</span>
              <span className="font-mono text-cyan-400">Evaluated (Multiclass)</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2 text-xs font-semibold text-zinc-200 hover:bg-zinc-700 hover:text-white transition-colors"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  )
}
