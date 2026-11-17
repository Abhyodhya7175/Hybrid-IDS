import React from 'react'
import { ArrowRight, GitBranch } from 'lucide-react'

export function PipelineArchitecture() {
  return (
    <section className="rounded-2xl border border-zinc-800/80 bg-zinc-900/30 p-5 md:p-6 backdrop-blur-sm shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="rounded-lg bg-zinc-800/80 p-1.5 text-zinc-300 border border-zinc-700/50">
            <GitBranch size={16} />
          </div>
          <div>
            <h3 className="text-sm font-semibold tracking-tight text-white">
              Hybrid Detection Architecture
            </h3>
            <p className="text-xs text-zinc-400">
              Two-stage cascaded XGBoost inference pipeline
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-2.5 py-1 text-[11px] font-mono text-cyan-300">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
            Active Cascade
          </span>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-[1fr_auto_1fr_auto_1fr] md:items-center">
        {/* Stage 1 */}
        <div className="group rounded-xl border border-zinc-800 bg-zinc-950/60 p-4 transition-colors hover:border-zinc-700">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-cyan-400">
              STAGE 01
            </span>
            <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] font-mono text-zinc-400">
              Vector Ingest
            </span>
          </div>
          <h4 className="mt-2 text-sm font-medium text-white">
            Feature Extraction
          </h4>
          <p className="mt-1 text-xs text-zinc-400 leading-relaxed">
            78 statistical flow dimensions (IAT, packet lengths, TCP flags, bulk rates).
          </p>
        </div>

        {/* Separator 1 */}
        <div className="hidden md:flex items-center justify-center text-zinc-600">
          <ArrowRight size={18} />
        </div>

        {/* Stage 2 */}
        <div className="group rounded-xl border border-zinc-800 bg-zinc-950/60 p-4 transition-colors hover:border-zinc-700">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-emerald-400">
              STAGE 02
            </span>
            <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-mono text-emerald-400 border border-emerald-500/20">
              Filter Gate
            </span>
          </div>
          <h4 className="mt-2 text-sm font-medium text-white">
            Binary XGBoost
          </h4>
          <p className="mt-1 text-xs text-zinc-400 leading-relaxed">
            High-throughput discriminator separating BENIGN traffic from malicious anomalies.
          </p>
        </div>

        {/* Separator 2 */}
        <div className="hidden md:flex items-center justify-center text-zinc-600">
          <ArrowRight size={18} />
        </div>

        {/* Stage 3 */}
        <div className="group rounded-xl border border-zinc-800 bg-zinc-950/60 p-4 transition-colors hover:border-zinc-700">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-indigo-400">
              STAGE 03
            </span>
            <span className="rounded bg-indigo-500/10 px-1.5 py-0.5 text-[10px] font-mono text-indigo-400 border border-indigo-500/20">
              Classifier
            </span>
          </div>
          <h4 className="mt-2 text-sm font-medium text-white">
            Multiclass XGBoost
          </h4>
          <p className="mt-1 text-xs text-zinc-400 leading-relaxed">
            Pinpoints exact attack taxonomy: DoS, PortScan, DDoS, Brute-force, or Infiltration.
          </p>
        </div>
      </div>
    </section>
  )
}
