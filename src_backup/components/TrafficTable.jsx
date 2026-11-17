import React, { useState, useMemo } from 'react'
import {
  Search,
  Download,
  ShieldCheck,
  ShieldAlert,
  ChevronRight,
  Database,
  Trash2,
  ArrowUpDown,
} from 'lucide-react'
import { exportPredictionsToCsv } from '../utils'

export function TrafficTable({
  predictions,
  onSelectFlow,
  onClearPredictions,
  onIngestClick,
}) {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterDecision, setFilterDecision] = useState('ALL') // 'ALL' | 'ATTACK' | 'BENIGN'
  const [sortBy, setSortBy] = useState('DEFAULT') // 'DEFAULT' | 'PROB_DESC' | 'ID_ASC'

  const filteredPredictions = useMemo(() => {
    let list = [...predictions]

    if (filterDecision === 'ATTACK') {
      list = list.filter((p) => p.binaryDecision === 'ATTACK')
    } else if (filterDecision === 'BENIGN') {
      list = list.filter((p) => p.binaryDecision === 'BENIGN')
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      list = list.filter(
        (p) =>
          String(p.flowId).toLowerCase().includes(q) ||
          String(p.predictedLabel).toLowerCase().includes(q) ||
          String(p.binaryDecision).toLowerCase().includes(q)
      )
    }

    if (sortBy === 'PROB_DESC') {
      list.sort((a, b) => b.attackProbability - a.attackProbability)
    } else if (sortBy === 'ID_ASC') {
      list.sort((a, b) => a.flowId - b.flowId)
    }

    return list
  }, [predictions, filterDecision, searchQuery, sortBy])

  const attackCount = predictions.filter((p) => p.binaryDecision === 'ATTACK').length
  const benignCount = predictions.filter((p) => p.binaryDecision === 'BENIGN').length

  const handleRowClick = (item) => {
    if (onSelectFlow) {
      onSelectFlow(item)
    }
  }

  return (
    <section className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 backdrop-blur-sm shadow-sm overflow-hidden">
      {/* Top Controls Bar */}
      <div className="flex flex-col gap-4 border-b border-zinc-800/80 p-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold tracking-tight text-white">
              Traffic Detection Records
            </h3>
            <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs font-mono text-zinc-400 border border-zinc-700/60">
              {predictions.length} flows
            </span>
          </div>
          <p className="mt-1 text-xs text-zinc-400">
            Real-time classifications evaluated by the binary and multiclass models
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search Input */}
          <div className="relative min-w-[200px] flex-1 sm:flex-initial">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
            />
            <input
              type="text"
              placeholder="Search flow ID, label..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950/80 pl-9 pr-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 outline-none transition-colors focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20"
            />
          </div>

          {/* Decision Filter Pills */}
          <div className="flex items-center rounded-xl border border-zinc-800 bg-zinc-950/80 p-1 text-xs">
            <button
              onClick={() => setFilterDecision('ALL')}
              className={`rounded-lg px-2.5 py-1 font-medium transition-colors ${
                filterDecision === 'ALL'
                  ? 'bg-zinc-800 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              All ({predictions.length})
            </button>
            <button
              onClick={() => setFilterDecision('ATTACK')}
              className={`rounded-lg px-2.5 py-1 font-medium transition-colors ${
                filterDecision === 'ATTACK'
                  ? 'bg-rose-500/20 text-rose-300 font-semibold shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Attacks ({attackCount})
            </button>
            <button
              onClick={() => setFilterDecision('BENIGN')}
              className={`rounded-lg px-2.5 py-1 font-medium transition-colors ${
                filterDecision === 'BENIGN'
                  ? 'bg-emerald-500/20 text-emerald-300 font-semibold shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Benign ({benignCount})
            </button>
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-1 rounded-xl border border-zinc-800 bg-zinc-950/80 px-2.5 py-1 text-xs text-zinc-400">
            <ArrowUpDown size={12} className="text-zinc-500" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent text-xs text-zinc-300 outline-none cursor-pointer"
            >
              <option value="DEFAULT" className="bg-zinc-900">Latest First</option>
              <option value="PROB_DESC" className="bg-zinc-900">Highest Threat %</option>
              <option value="ID_ASC" className="bg-zinc-900">Flow ID (Ascending)</option>
            </select>
          </div>

          {/* Export CSV button */}
          <button
            onClick={() => exportPredictionsToCsv(predictions)}
            disabled={predictions.length === 0}
            className="flex items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-950/80 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            title="Download results as CSV"
          >
            <Download size={13} />
            <span className="hidden sm:inline">Export</span>
          </button>

          {/* Clear results button */}
          {predictions.length > 0 && onClearPredictions && (
            <button
              onClick={onClearPredictions}
              className="rounded-xl border border-zinc-800 bg-zinc-950/80 p-1.5 text-zinc-500 hover:border-rose-500/30 hover:bg-rose-500/10 hover:text-rose-400 transition-colors"
              title="Clear all records"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Table Body */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px] text-left text-xs">
          <thead className="border-b border-zinc-800 bg-zinc-950/40 font-mono text-[11px] uppercase tracking-wider text-zinc-500">
            <tr>
              <th className="px-5 py-3.5 font-medium">Flow ID</th>
              <th className="px-5 py-3.5 font-medium">Binary Decision</th>
              <th className="px-5 py-3.5 font-medium">Classification</th>
              <th className="px-5 py-3.5 font-medium">Attack Probability</th>
              <th className="px-5 py-3.5 font-medium">Confidence</th>
              <th className="px-5 py-3.5 font-medium text-right">Details</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-zinc-800/60 font-sans">
            {filteredPredictions.length === 0 ? (
              <tr>
                <td colSpan="6" className="py-14 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-800/50 text-zinc-500 border border-zinc-700/50">
                    <Database size={22} />
                  </div>
                  <h4 className="mt-3 text-sm font-medium text-zinc-300">
                    {predictions.length === 0
                      ? 'No network traffic analyzed yet'
                      : 'No records matched your filters'}
                  </h4>
                  <p className="mx-auto mt-1 max-w-sm text-xs text-zinc-500">
                    {predictions.length === 0
                      ? 'Upload a network flow CSV dataset or submit a single flow vector to initiate automated threat analysis.'
                      : 'Try resetting the search query or switching the decision filter back to All.'}
                  </p>
                  {predictions.length === 0 && onIngestClick && (
                    <button
                      onClick={onIngestClick}
                      className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-cyan-400 px-4 py-2 text-xs font-semibold text-zinc-950 transition-colors hover:bg-cyan-300 shadow-sm"
                    >
                      <Download size={14} />
                      Ingest Network CSV
                    </button>
                  )}
                </td>
              </tr>
            ) : (
              filteredPredictions.slice(0, 150).map((item) => {
                const isAttack = item.binaryDecision === 'ATTACK'
                const prob = Number(item.attackProbability) || 0
                const probPercent = (prob * 100).toFixed(2)

                return (
                  <tr
                    key={item.id}
                    onClick={() => handleRowClick(item)}
                    className="group cursor-pointer transition-colors hover:bg-zinc-800/40"
                  >
                    {/* Flow ID */}
                    <td className="px-5 py-3.5 font-mono text-zinc-300">
                      #{item.flowId}
                    </td>

                    {/* Binary Decision */}
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 font-mono text-[11px] font-medium border ${
                          isAttack
                            ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        }`}
                      >
                        {isAttack ? (
                          <ShieldAlert size={12} className="stroke-[2.5]" />
                        ) : (
                          <ShieldCheck size={12} className="stroke-[2.5]" />
                        )}
                        {item.binaryDecision}
                      </span>
                    </td>

                    {/* Predicted Class */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-medium ${
                            isAttack ? 'text-zinc-100' : 'text-zinc-300'
                          }`}
                        >
                          {item.predictedLabel || 'Unspecified'}
                        </span>
                        {isAttack && (
                          <span className="rounded bg-rose-500/10 px-1.5 py-0.2 text-[10px] font-mono text-rose-300 border border-rose-500/20">
                            MALICIOUS
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Attack Probability with mini bar */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <span className="w-14 font-mono text-zinc-300">
                          {probPercent}%
                        </span>
                        <div className="h-1.5 w-20 overflow-hidden rounded-full bg-zinc-800">
                          <div
                            className={`h-full rounded-full transition-all ${
                              isAttack ? 'bg-rose-500' : 'bg-emerald-400'
                            }`}
                            style={{ width: `${Math.min(100, Math.max(2, prob * 100))}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Confidence */}
                    <td className="px-5 py-3.5 font-mono text-zinc-400">
                      {item.multiclassConfidence != null
                        ? `${(item.multiclassConfidence * 100).toFixed(1)}%`
                        : '—'}
                    </td>

                    {/* Action */}
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleRowClick(item)
                        }}
                        className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
                      >
                        <span>Inspect</span>
                        <ChevronRight size={13} />
                      </button>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Table Footer */}
      {filteredPredictions.length > 0 && (
        <div className="flex items-center justify-between border-t border-zinc-800 px-5 py-3 text-xs text-zinc-500 font-mono">
          <span>
            Showing {Math.min(150, filteredPredictions.length)} of {filteredPredictions.length} matching flows
          </span>
          <span>Click any record to inspect telemetry</span>
        </div>
      )}
    </section>
  )
}
