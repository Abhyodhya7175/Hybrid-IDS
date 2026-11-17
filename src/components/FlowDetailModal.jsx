
import React, { useEffect, useState } from 'react'
import {
  X,
  ShieldCheck,
  ShieldAlert,
  Gauge,
  Percent,
  Brain,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react'

function ShapExplanation({ title, explanation, color }) {
  if (!explanation?.top_features?.length) return null

  const features = explanation.top_features
  const maxValue = Math.max(
    ...features.map((item) => Math.abs(Number(item.shap_value))),
    0.000001
  )

  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 space-y-4">
      <div>
        <h4 className="text-sm font-semibold text-white">{title}</h4>
        <p className="mt-1 text-[11px] text-zinc-500">
          Contributions to the {explanation.explained_class} model score
        </p>
      </div>

      <div className="space-y-3">
        {features.map((item, index) => {
          const shapValue = Number(item.shap_value)
          const positive = shapValue >= 0
          const width = (Math.abs(shapValue) / maxValue) * 100

          return (
            <div key={`${item.feature}-${index}`} className="space-y-1.5">
              <div className="flex items-start justify-between gap-3">
                <span className="text-xs text-zinc-300 break-all">
                  {item.feature}
                </span>
                <span
                  className={`shrink-0 text-xs font-mono ${
                    positive ? 'text-rose-400' : 'text-cyan-400'
                  }`}
                >
                  {positive ? '+' : ''}
                  {shapValue.toFixed(4)}
                </span>
              </div>

              <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-800">
                <div
                  className={`h-full rounded-full ${
                    positive ? 'bg-rose-500' : 'bg-cyan-500'
                  }`}
                  style={{ width: `${width}%` }}
                />
              </div>

              <div className="flex flex-wrap justify-between gap-2 text-[10px] text-zinc-500">
                <span>
                  Feature value: {Number(item.feature_value).toLocaleString(
                    'en-US',
                    { maximumFractionDigits: 4 }
                  )}
                </span>
                <span>
                  {positive ? 'Increases' : 'Decreases'} class score
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

export function FlowDetailModal({ flow, apiBaseUrl, onClose }) {
  const [explanation, setExplanation] = useState(null)
  const [explainLoading, setExplainLoading] = useState(false)
  const [explainError, setExplainError] = useState('')

  const isAttack = flow?.binaryDecision === 'ATTACK'
  const attackProb = (Number(flow?.attackProbability) * 100).toFixed(4)

  const confidence =
    flow?.multiclassConfidence != null
      ? (Number(flow.multiclassConfidence) * 100).toFixed(2) + '%'
      : 'N/A'

  useEffect(() => {
    if (!flow?.features || !apiBaseUrl) {
      setExplainError(
        'Original feature values are unavailable for this flow. Run a new prediction to generate its explanation.'
      )
      return
    }

    const controller = new AbortController()

    async function fetchExplanation() {
      setExplainLoading(true)
      setExplainError('')
      setExplanation(null)

      try {
        const response = await fetch(`${apiBaseUrl}/explain`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ features: flow.features }),
          signal: controller.signal,
        })

        const data = await response.json().catch(() => ({}))

        if (!response.ok) {
          const detail = data.detail
          throw new Error(
            typeof detail === 'string'
              ? detail
              : detail?.message || `Explanation request failed: HTTP ${response.status}`
          )
        }

        setExplanation(data)
      } catch (error) {
        if (error.name !== 'AbortError') {
          setExplainError(error.message || 'Unable to load SHAP explanation.')
        }
      } finally {
        if (!controller.signal.aborted) {
          setExplainLoading(false)
        }
      }
    }

    fetchExplanation()

    return () => controller.abort()
  }, [flow?.id, flow?.features, apiBaseUrl])

  if (!flow) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/75 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-zinc-800 bg-[#0c0e14] p-5 sm:p-6 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
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
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white"
            aria-label="Close flow details"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mt-5 space-y-4">
          {/* Classification */}
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

            <div className="mt-1 flex items-baseline justify-between gap-3">
              <span
                className={`text-xl font-bold ${
                  isAttack ? 'text-rose-400' : 'text-emerald-400'
                }`}
              >
                {flow.predictedLabel || 'Unspecified'}
              </span>

              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-mono border ${
                  isAttack
                    ? 'border-rose-500/30 bg-rose-500/20 text-rose-300'
                    : 'border-emerald-500/30 bg-emerald-500/20 text-emerald-300'
                }`}
              >
                {flow.binaryDecision}
              </span>
            </div>
          </div>

          {/* Metrics */}
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
                    width: `${Math.min(
                      100,
                      Math.max(0, Number(flow.attackProbability) * 100)
                    )}%`,
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

          {/* Pipeline metadata */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 space-y-2.5 text-xs">
            <div className="flex items-center justify-between text-zinc-400">
              <span>Decision Threshold</span>
              <span className="font-mono text-zinc-200">
                {flow.threshold != null ? flow.threshold : '0.50 (Default)'}
              </span>
            </div>

            <div className="flex items-center justify-between text-zinc-400">
              <span>Feature Vector Dimensions</span>
              <span className="font-mono text-zinc-200">
                {flow.features ? Object.keys(flow.features).length : 78} attributes
              </span>
            </div>

            <div className="flex items-center justify-between text-zinc-400">
              <span>Pipeline Stage 1 Status</span>
              <span className="font-mono text-emerald-400">
                Evaluated (Binary)
              </span>
            </div>

            <div className="flex items-center justify-between text-zinc-400">
              <span>Pipeline Stage 2 Status</span>
              <span className={`font-mono ${isAttack ? 'text-cyan-400' : 'text-zinc-500'}`}>
                {isAttack ? 'Evaluated (Multiclass)' : 'Skipped (BENIGN)'}
              </span>
            </div>
          </div>

          {/* SHAP section */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
              <Brain size={18} className="text-violet-400" />
              <div>
                <h4 className="text-sm font-semibold text-white">
                  Explainable AI (SHAP)
                </h4>
                <p className="text-[11px] text-zinc-500">
                  Feature contributions behind this prediction
                </p>
              </div>
            </div>

            {explainLoading && (
              <div className="flex items-center justify-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/40 p-6 text-sm text-zinc-400">
                <Loader2 size={17} className="animate-spin text-violet-400" />
                Calculating SHAP explanation...
              </div>
            )}

            {explainError && (
              <div className="flex items-start gap-2 rounded-xl border border-rose-500/20 bg-rose-500/5 p-3 text-xs text-rose-300">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                <span>{explainError}</span>
              </div>
            )}

            {explanation && (
              <>
                <div className="flex items-center gap-2 text-xs text-emerald-400">
                  <CheckCircle2 size={14} />
                  <span>Explanation generated successfully</span>
                </div>

                <ShapExplanation
                  title="Stage 1: Binary Classification"
                  explanation={explanation.binary_explanation}
                />

                {explanation.multiclass_explanation ? (
                  <ShapExplanation
                    title={`Stage 2: ${explanation.multiclass_explanation.explained_class} Classification`}
                    explanation={explanation.multiclass_explanation}
                  />
                ) : (
                  <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
                    <p className="text-xs font-medium text-zinc-300">
                      Multiclass explanation not applicable
                    </p>
                    <p className="mt-1 text-[11px] text-zinc-500">
                      The binary model classified this flow as BENIGN, so the
                      multiclass model was not executed.
                    </p>
                  </div>
                )}
              </>
            )}

            <p className="text-[10px] leading-relaxed text-zinc-500">
              SHAP values represent contributions to the model output score.
              They describe how features influence the model's prediction and
              do not establish causal relationships.
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2 text-xs font-semibold text-zinc-200 hover:bg-zinc-700 hover:text-white"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  )
}

export default FlowDetailModal
