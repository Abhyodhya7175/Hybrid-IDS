import React, { useState } from 'react'
import {
  FileUp,
  FileSpreadsheet,
  Download,
  AlertCircle,
  CheckCircle2,
  Trash2,
  Search,
  Sparkles,
  RotateCcw,
} from 'lucide-react'
import { generateSampleCsvContent, downloadFile } from '../utils'
import { BENIGN_SAMPLE_PRESET, ATTACK_SAMPLE_PRESET } from '../constants'

export function UploadSection({
  inputMode,
  setInputMode,
  features,
  selectedFile,
  setSelectedFile,
  isAnalyzing,
  apiStatus,
  analyzeCsv,
  analyzeManualEntry,
  manualValues,
  setManualValues,
  manualResult,
  errorMessage,
  setErrorMessage,
  successMessage,
  setSuccessMessage,
}) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [featureSearch, setFeatureSearch] = useState('')

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = () => {
    setIsDragOver(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragOver(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0]
      if (file.name.endsWith('.csv') || file.type.includes('csv')) {
        setSelectedFile(file)
        setErrorMessage('')
        setSuccessMessage('')
      } else {
        setErrorMessage('Please select a valid .csv file.')
      }
    }
  }

  const filteredFeatures = features.filter((feat) =>
    feat.toLowerCase().includes(featureSearch.toLowerCase().trim())
  )

  const handleLoadBenignPreset = () => {
    setManualValues((prev) => {
      const updated = { ...prev }
      for (const feat of features) {
        updated[feat] = BENIGN_SAMPLE_PRESET[feat] ?? 0
      }
      return updated
    })
    setSuccessMessage('Loaded Benign HTTPS flow preset sample.')
  }

  const handleLoadAttackPreset = () => {
    setManualValues((prev) => {
      const updated = { ...prev }
      for (const feat of features) {
        updated[feat] = ATTACK_SAMPLE_PRESET[feat] ?? 0
      }
      return updated
    })
    setSuccessMessage('Loaded DoS / PortScan anomaly preset sample.')
  }

  const handleClearManualFields = () => {
    setManualValues(Object.fromEntries(features.map((name) => [name, ''])))
    setSuccessMessage('')
    setErrorMessage('')
  }

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <section className="space-y-6">
      {/* Messages */}
      {errorMessage && (
        <div
          role="alert"
          className="flex items-start justify-between rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs text-rose-300"
        >
          <div className="flex items-center gap-2.5">
            <AlertCircle size={16} className="shrink-0 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage('')}
            className="text-rose-400 hover:text-white"
          >
            ×
          </button>
        </div>
      )}

      {successMessage && (
        <div
          role="status"
          className="flex items-start justify-between rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs text-emerald-300"
        >
          <div className="flex items-center gap-2.5">
            <CheckCircle2 size={16} className="shrink-0 text-emerald-400" />
            <span>{successMessage}</span>
          </div>
          <button
            onClick={() => setSuccessMessage('')}
            className="text-emerald-400 hover:text-white"
          >
            ×
          </button>
        </div>
      )}

      {/* Main Ingestion Box */}
      <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-5 md:p-6 backdrop-blur-sm shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-base font-semibold tracking-tight text-white">
              Data Ingestion Hub
            </h3>
            <p className="mt-0.5 text-xs text-zinc-400">
              Submit batch network traffic datasets or single flow feature vectors
            </p>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center rounded-xl border border-zinc-800 bg-zinc-950/80 p-1 text-xs">
            <button
              onClick={() => setInputMode('CSV Upload')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition-all ${
                inputMode === 'CSV Upload'
                  ? 'bg-zinc-800 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <FileSpreadsheet size={13} />
              CSV Dataset Ingestion
            </button>
            <button
              onClick={() => setInputMode('Manual Entry')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition-all ${
                inputMode === 'Manual Entry'
                  ? 'bg-zinc-800 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Sparkles size={13} />
              Single Flow Entry
            </button>
          </div>
        </div>

        {/* CSV Upload Mode */}
        {inputMode === 'CSV Upload' ? (
          <div className="mt-6 space-y-4">
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`relative rounded-2xl border-2 border-dashed p-8 md:p-10 text-center transition-all ${
                isDragOver
                  ? 'border-cyan-400 bg-cyan-500/10'
                  : 'border-zinc-700/60 bg-zinc-950/40 hover:border-zinc-600'
              }`}
            >
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-800/80 text-cyan-400 border border-zinc-700/50 shadow-inner">
                <FileUp size={26} />
              </div>

              <h4 className="mt-4 text-sm font-semibold text-white">
                Drag & drop your network flow CSV file
              </h4>
              <p className="mx-auto mt-1.5 max-w-md text-xs text-zinc-400 leading-relaxed">
                Requires the 78 benchmark numeric flow features. Batches are parsed and evaluated through the cascaded XGBoost pipeline in chunks of 100.
              </p>

              {/* Hidden file input */}
              <input
                id="csv-file-input"
                type="file"
                accept=".csv,text/csv"
                onChange={(event) => {
                  setSelectedFile(event.target.files?.[0] || null)
                  setErrorMessage('')
                  setSuccessMessage('')
                }}
                className="hidden"
              />

              <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                <label
                  htmlFor="csv-file-input"
                  className="cursor-pointer rounded-xl bg-zinc-800 px-4 py-2 text-xs font-semibold text-zinc-200 hover:bg-zinc-700 hover:text-white transition-all border border-zinc-700 shadow-sm active:scale-95"
                >
                  Browse Computer
                </label>

                <button
                  onClick={() => {
                    const content = generateSampleCsvContent(features)
                    downloadFile(content, 'hids_78_features_sample.csv')
                  }}
                  className="flex items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900/80 px-4 py-2 text-xs font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
                >
                  <Download size={13} />
                  Download 78-Feature Sample CSV
                </button>
              </div>

              {/* Selected File Card */}
              {selectedFile && (
                <div className="mx-auto mt-5 flex max-w-md items-center justify-between rounded-xl border border-zinc-700/80 bg-zinc-900/90 p-3 text-left">
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <div className="rounded-lg bg-cyan-500/10 p-2 text-cyan-400">
                      <FileSpreadsheet size={16} />
                    </div>
                    <div className="overflow-hidden">
                      <p className="truncate text-xs font-medium text-white">
                        {selectedFile.name}
                      </p>
                      <p className="text-[11px] font-mono text-zinc-400">
                        {formatFileSize(selectedFile.size)}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedFile(null)}
                    className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-800 hover:text-rose-400 transition-colors"
                    title="Remove file"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              )}
            </div>

            {/* Ingestion Execute Button */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2 text-xs text-zinc-400">
                <span
                  className={`h-2 w-2 rounded-full ${
                    apiStatus === 'connected' ? 'bg-emerald-400' : 'bg-rose-500'
                  }`}
                />
                <span>
                  {apiStatus === 'connected'
                    ? 'Inference backend ready'
                    : 'Backend disconnected — configure API in Settings'}
                </span>
              </div>

              <button
                onClick={analyzeCsv}
                disabled={!selectedFile || isAnalyzing || apiStatus !== 'connected'}
                className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-cyan-400 px-6 py-2.5 text-xs font-semibold text-zinc-950 transition-all hover:bg-cyan-300 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm active:scale-95"
              >
                {isAnalyzing ? (
                  <>
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-zinc-950 border-t-transparent" />
                    <span>Analyzing Ingested Flows...</span>
                  </>
                ) : (
                  <span>Analyze Dataset</span>
                )}
              </button>
            </div>
          </div>
        ) : (
          /* Manual Entry Mode */
          <div className="mt-6 space-y-4">
            {/* Toolbar for presets and search */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-800/80 pb-4">
              {/* Presets */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleLoadBenignPreset}
                  className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-300 hover:bg-emerald-500/20 transition-colors"
                >
                  Load Normal Flow Preset
                </button>
                <button
                  type="button"
                  onClick={handleLoadAttackPreset}
                  className="rounded-lg border border-rose-500/20 bg-rose-500/10 px-3 py-1.5 text-xs font-medium text-rose-300 hover:bg-rose-500/20 transition-colors"
                >
                  Load Attack Flow Preset
                </button>
                <button
                  type="button"
                  onClick={handleClearManualFields}
                  className="rounded-lg border border-zinc-800 bg-zinc-900 px-2.5 py-1.5 text-xs text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
                  title="Reset all values"
                >
                  <RotateCcw size={13} />
                </button>
              </div>

              {/* Feature search filter */}
              <div className="relative min-w-[200px]">
                <Search
                  size={13}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
                />
                <input
                  type="text"
                  placeholder="Filter 78 features..."
                  value={featureSearch}
                  onChange={(e) => setFeatureSearch(e.target.value)}
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-950/80 pl-8 pr-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            {/* Feature Inputs Form */}
            {features.length === 0 ? (
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-6 text-center text-xs text-amber-300">
                Loading feature schema...
              </div>
            ) : (
              <form onSubmit={analyzeManualEntry}>
                <div className="max-h-[460px] overflow-y-auto pr-2">
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredFeatures.map((feature) => (
                      <div
                        key={feature}
                        className="rounded-xl border border-zinc-800/80 bg-zinc-950/50 p-2.5 focus-within:border-cyan-500/50 transition-colors"
                      >
                        <label className="block text-[11px] font-medium text-zinc-400 truncate mb-1">
                          {feature}
                        </label>
                        <input
                          type="number"
                          step="any"
                          value={manualValues[feature] ?? ''}
                          onChange={(e) =>
                            setManualValues((prev) => ({
                              ...prev,
                              [feature]: e.target.value,
                            }))
                          }
                          required
                          placeholder="0.0"
                          className="w-full rounded-md border border-zinc-800 bg-zinc-900/80 px-2.5 py-1.5 font-mono text-xs text-zinc-100 outline-none focus:border-cyan-500 focus:bg-zinc-900 transition-colors"
                        />
                      </div>
                    ))}
                  </div>

                  {filteredFeatures.length === 0 && (
                    <div className="py-8 text-center text-xs text-zinc-500">
                      No features matching "{featureSearch}".
                    </div>
                  )}
                </div>

                <div className="mt-5 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-zinc-800/80 pt-4">
                  <span className="text-xs text-zinc-400 font-mono">
                    78 attributes required for dual XGBoost inference
                  </span>

                  <button
                    type="submit"
                    disabled={
                      isAnalyzing ||
                      apiStatus !== 'connected' ||
                      features.length !== 78
                    }
                    className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-cyan-400 px-6 py-2.5 text-xs font-semibold text-zinc-950 transition-all hover:bg-cyan-300 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm active:scale-95"
                  >
                    {isAnalyzing ? (
                      <>
                        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-zinc-950 border-t-transparent" />
                        <span>Predicting Flow...</span>
                      </>
                    ) : (
                      <span>Predict Single Flow</span>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>

      {/* Latest Prediction Result Showcase */}
      {manualResult && (
        <section className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-5 md:p-6 backdrop-blur-sm shadow-sm">
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono uppercase tracking-wider text-cyan-400">
                Latest Single Prediction
              </span>
              <span className="rounded-full bg-cyan-500/10 px-2 py-0.5 text-[10px] font-mono text-cyan-300 border border-cyan-500/20">
                Real-time
              </span>
            </div>

            <span
              className={`rounded-full px-2.5 py-0.5 font-mono text-xs font-semibold border ${
                manualResult.binaryDecision === 'ATTACK'
                  ? 'border-rose-500/30 bg-rose-500/15 text-rose-300'
                  : 'border-emerald-500/30 bg-emerald-500/15 text-emerald-300'
              }`}
            >
              {manualResult.binaryDecision}
            </span>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4">
              <span className="text-[11px] text-zinc-400 font-mono">
                Predicted Class
              </span>
              <p className="mt-1 text-lg font-bold text-white">
                {manualResult.predictedLabel}
              </p>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4">
              <span className="text-[11px] text-zinc-400 font-mono">
                Attack Probability
              </span>
              <p className="mt-1 text-lg font-mono font-bold text-white">
                {(manualResult.attackProbability * 100).toFixed(4)}%
              </p>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4">
              <span className="text-[11px] text-zinc-400 font-mono">
                Multiclass Confidence
              </span>
              <p className="mt-1 text-lg font-mono font-bold text-white">
                {manualResult.multiclassConfidence != null
                  ? `${(manualResult.multiclassConfidence * 100).toFixed(2)}%`
                  : 'N/A'}
              </p>
            </div>
          </div>
        </section>
      )}
    </section>
  )
}
