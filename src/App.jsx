import { useEffect, useState, useCallback } from 'react'
import Papa from 'papaparse'
import { Sidebar } from './components/Sidebar'
import { Header } from './components/Header'
import { MetricCards } from './components/MetricCards'
import { PipelineArchitecture } from './components/PipelineArchitecture'
import { TrafficTable } from './components/TrafficTable'
import { FlowDetailModal } from './components/FlowDetailModal'
import { UploadSection } from './components/UploadSection'
import { SettingsSection } from './components/SettingsSection'
import { DEFAULT_78_FEATURES } from './constants'

export function App() {
  const [activePage, setActivePage] = useState('Overview')
  const [inputMode, setInputMode] = useState('CSV Upload')
  const [mobileMenu, setMobileMenu] = useState(false)
  const [features, setFeatures] = useState(DEFAULT_78_FEATURES)
  const [selectedFile, setSelectedFile] = useState(null)
  const [predictions, setPredictions] = useState([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [manualValues, setManualValues] = useState(() =>
    Object.fromEntries(DEFAULT_78_FEATURES.map((name) => [name, '']))
  )
  const [manualResult, setManualResult] = useState(null)
  const [selectedFlowDetail, setSelectedFlowDetail] = useState(null)

  const defaultEnvUrl = (import.meta.env.VITE_API_BASE_URL || '')
    .trim()
    .replace(/\/$/, '')

  const [apiBaseUrl, setApiBaseUrl] = useState(() => {
    return localStorage.getItem('hids_custom_api_url') || defaultEnvUrl
  })

  const [apiStatus, setApiStatus] = useState('checking')

  // Check backend health status (for user-triggered refreshes)
  const checkAPI = useCallback(async () => {
    setApiStatus('checking')
    try {
      const response = await fetch(`${apiBaseUrl}/health`)
      if (!response.ok) throw new Error('API unavailable')

      const data = await response.json()
      setApiStatus(
        data.status === 'ok' &&
          data.binary_model_loaded &&
          data.multiclass_model_loaded
          ? 'connected'
          : 'offline'
      )
    } catch {
      setApiStatus('offline')
    }
  }, [apiBaseUrl])

  // Probe API on mount or when apiBaseUrl changes
  useEffect(() => {
    let active = true

    async function probe() {
      try {
        const response = await fetch(`${apiBaseUrl}/health`)
        if (!response.ok) throw new Error('API unavailable')

        const data = await response.json()
        if (active) {
          setApiStatus(
            data.status === 'ok' &&
              data.binary_model_loaded &&
              data.multiclass_model_loaded
              ? 'connected'
              : 'offline'
          )
        }
      } catch {
        if (active) setApiStatus('offline')
      }
    }

    probe()

    return () => {
      active = false
    }
  }, [apiBaseUrl])

  // Load feature schema from API
  useEffect(() => {
    let active = true

    async function loadFeatures() {
      try {
        const response = await fetch(`${apiBaseUrl}/features`)
        if (!response.ok) {
          throw new Error(`Feature request failed: ${response.status}`)
        }

        const data = await response.json()

        if (!Array.isArray(data.features) || data.features.length !== 78) {
          throw new Error('API did not return the expected 78 features.')
        }

        if (active) {
          setFeatures(data.features)
          setManualValues(
            Object.fromEntries(data.features.map((name) => [name, '']))
          )
        }
      } catch {
        if (active) {
          setFeatures((prev) =>
            prev.length === 78 ? prev : DEFAULT_78_FEATURES
          )
          setManualValues((prev) =>
            Object.keys(prev).length === 78
              ? prev
              : Object.fromEntries(DEFAULT_78_FEATURES.map((name) => [name, '']))
          )
        }
      }
    }

    loadFeatures()

    return () => {
      active = false
    }
  }, [apiBaseUrl])

  async function readApiResponse(response) {
    const data = await response.json().catch(() => ({}))

    if (!response.ok) {
      const detail = data.detail
      const message =
        typeof detail === 'string'
          ? detail
          : detail?.message || `Request failed: HTTP ${response.status}`

      throw new Error(message)
    }

    return data
  }

  function normalizePrediction(prediction, index, inputFeatures = null) {
    return {
      id: `${Date.now()}-${index}`,
      flowId: index + 1,
      binaryDecision: prediction.binary_decision,
      predictedLabel: prediction.predicted_label,
      attackProbability: Number(prediction.attack_probability),
      multiclassConfidence: prediction.multiclass_confidence,
      threshold: prediction.threshold,
      features: inputFeatures ? { ...inputFeatures } : null,
    }
  }

  async function analyzeCsv() {
    if (!selectedFile) {
      setErrorMessage('Choose a CSV file first.')
      return
    }

    if (features.length !== 78) {
      setErrorMessage('The API feature list is not ready.')
      return
    }

    setIsAnalyzing(true)
    setErrorMessage('')
    setSuccessMessage('')

    try {
      const parsed = await new Promise((resolve, reject) => {
        Papa.parse(selectedFile, {
          header: true,
          skipEmptyLines: 'greedy',
          transformHeader: (header) => header.trim().replace(/^\uFEFF/, ''),
          complete: resolve,
          error: reject,
        })
      })

      if (parsed.errors?.length) {
        throw new Error(`CSV parsing error: ${parsed.errors[0].message}`)
      }

      const rows = parsed.data || []

      if (!rows.length) {
        throw new Error('The CSV file contains no data rows.')
      }

      const headers = parsed.meta.fields || []
      const missingHeaders = features.filter(
        (feature) => !headers.includes(feature)
      )

      if (missingHeaders.length) {
        throw new Error(
          `CSV is missing ${missingHeaders.length} required feature columns. ` +
            `Examples: ${missingHeaders.slice(0, 5).join(', ')}`
        )
      }

      const records = rows.map((row, rowIndex) => {
        const values = {}

        for (const feature of features) {
          const raw = row[feature]

          if (raw === undefined || String(raw).trim() === '') {
            throw new Error(`Row ${rowIndex + 2}: missing value for "${feature}".`)
          }

          const value = Number(raw)

          if (!Number.isFinite(value)) {
            throw new Error(
              `Row ${rowIndex + 2}: "${feature}" must be a finite number.`
            )
          }

          values[feature] = value
        }

        return { features: values }
      })

      // Batch in chunks of 100
      const batchSize = 100
      const allPredictions = []

      for (let start = 0; start < records.length; start += batchSize) {
        const batchRecords = records.slice(start, start + batchSize)

        const response = await fetch(`${apiBaseUrl}/predict/batch`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ records: batchRecords }),
        })

        const data = await readApiResponse(response)

        if (
          !Array.isArray(data.predictions) ||
          data.predictions.length !== batchRecords.length ||
          data.count !== batchRecords.length
        ) {
          throw new Error('The API returned an unexpected batch response.')
        }

        allPredictions.push(
          ...data.predictions.map((item, index) =>
            normalizePrediction(
              item,
              start + index,
              batchRecords[index].features
            )
          )
        )
      }

      setPredictions((previous) => [...allPredictions, ...previous])
      setSuccessMessage(
        `Successfully analyzed ${allPredictions.length} network flows.`
      )
      setSelectedFile(null)
    } catch (error) {
      setErrorMessage(error.message || 'CSV analysis failed.')
    } finally {
      setIsAnalyzing(false)
    }
  }

  async function analyzeManualEntry(event) {
    event.preventDefault()
    setIsAnalyzing(true)
    setErrorMessage('')
    setSuccessMessage('')
    setManualResult(null)

    try {
      const values = {}

      for (const feature of features) {
        const raw = manualValues[feature]

        if (raw === undefined || String(raw).trim() === '') {
          throw new Error(`Enter a value for "${feature}".`)
        }

        const value = Number(raw)

        if (!Number.isFinite(value)) {
          throw new Error(`"${feature}" must be a finite number.`)
        }

        values[feature] = value
      }

      const response = await fetch(`${apiBaseUrl}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ features: values }),
      })

      const data = await readApiResponse(response)
      const result = normalizePrediction(data, 0,values)

      setManualResult(result)
      setPredictions((previous) => [result, ...previous])
      setSuccessMessage('Single-flow prediction completed successfully.')
    } catch (error) {
      setErrorMessage(error.message || 'Manual prediction failed.')
    } finally {
      setIsAnalyzing(false)
    }
  }

  // Calculated Metrics
  const flowsAnalyzed = predictions.length
  const benignCount = predictions.filter(
    (item) => item.binaryDecision === 'BENIGN'
  ).length
  const attackCount = predictions.filter(
    (item) => item.binaryDecision === 'ATTACK'
  ).length

  return (
    <div className="min-h-screen bg-[#090b10] text-zinc-100 flex flex-col">
      {/* Sidebar Navigation */}
      <Sidebar
        activePage={activePage}
        setActivePage={setActivePage}
        mobileMenu={mobileMenu}
        setMobileMenu={setMobileMenu}
        apiStatus={apiStatus}
        apiBaseUrl={apiBaseUrl}
        flowsCount={flowsAnalyzed}
        onRefreshHealth={checkAPI}
      />

      {/* Main Container */}
      <div className="min-h-screen flex flex-col lg:pl-72">
        {/* Top Header */}
        <Header
          activePage={activePage}
          setActivePage={setActivePage}
          setMobileMenu={setMobileMenu}
          apiStatus={apiStatus}
          onRefreshHealth={checkAPI}
          isAnalyzing={isAnalyzing}
        />

        {/* Page Main Content Area */}
        <main className="flex-1 space-y-6 p-4 sm:p-6 md:p-8 max-w-7xl w-full mx-auto">
          {/* OVERVIEW VIEW */}
          {activePage === 'Overview' && (
            <>
              {/* Overview Hero Section */}
              <section className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 border-b border-zinc-800/80 pb-6">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono uppercase tracking-widest text-cyan-400">
                      Security Operations Center
                    </span>
                    <span className="h-1 w-1 rounded-full bg-cyan-400" />
                    <span className="text-[11px] font-mono text-zinc-400">
                      Telemetry & Threat Stream
                    </span>
                  </div>
                  <h2 className="mt-2 text-2xl font-bold tracking-tight text-white md:text-3xl">
                    Network Traffic Overview
                  </h2>
                  <p className="mt-1 max-w-2xl text-xs sm:text-sm text-zinc-400 leading-relaxed">
                    Cascaded two-stage machine learning inference for rapid high-throughput intrusion detection and attack taxonomy classification.
                  </p>
                </div>

                <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
                  <span className="inline-block h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
                  <span>Session Monitor Active</span>
                </div>
              </section>

              {/* Real-time Metric Cards */}
              <MetricCards
                flowsAnalyzed={flowsAnalyzed}
                benignCount={benignCount}
                attackCount={attackCount}
                apiStatus={apiStatus}
              />

              {/* Two-Stage Pipeline Architecture */}
              <PipelineArchitecture />

              {/* Data Ingestion Section */}
              <UploadSection
                inputMode={inputMode}
                setInputMode={setInputMode}
                features={features}
                selectedFile={selectedFile}
                setSelectedFile={setSelectedFile}
                isAnalyzing={isAnalyzing}
                apiStatus={apiStatus}
                analyzeCsv={analyzeCsv}
                analyzeManualEntry={analyzeManualEntry}
                manualValues={manualValues}
                setManualValues={setManualValues}
                manualResult={manualResult}
                errorMessage={errorMessage}
                setErrorMessage={setErrorMessage}
                successMessage={successMessage}
                setSuccessMessage={setSuccessMessage}
              />

              {/* Recent Detection Results Preview */}
              <TrafficTable
                predictions={predictions}
                onSelectFlow={setSelectedFlowDetail}
                onClearPredictions={() => setPredictions([])}
                onIngestClick={() => setActivePage('Upload Dataset')}
              />
            </>
          )}

          {/* TRAFFIC ANALYSIS VIEW */}
          {activePage === 'Traffic Analysis' && (
            <>
              <MetricCards
                flowsAnalyzed={flowsAnalyzed}
                benignCount={benignCount}
                attackCount={attackCount}
                apiStatus={apiStatus}
              />

              <TrafficTable
                predictions={predictions}
                onSelectFlow={setSelectedFlowDetail}
                onClearPredictions={() => setPredictions([])}
                onIngestClick={() => setActivePage('Upload Dataset')}
              />
            </>
          )}

          {/* UPLOAD DATASET VIEW */}
          {activePage === 'Upload Dataset' && (
            <UploadSection
              inputMode={inputMode}
              setInputMode={setInputMode}
              features={features}
              selectedFile={selectedFile}
              setSelectedFile={setSelectedFile}
              isAnalyzing={isAnalyzing}
              apiStatus={apiStatus}
              analyzeCsv={analyzeCsv}
              analyzeManualEntry={analyzeManualEntry}
              manualValues={manualValues}
              setManualValues={setManualValues}
              manualResult={manualResult}
              errorMessage={errorMessage}
              setErrorMessage={setErrorMessage}
              successMessage={successMessage}
              setSuccessMessage={setSuccessMessage}
            />
          )}

          {/* SETTINGS VIEW */}
          {activePage === 'Settings' && (
            <SettingsSection
              apiBaseUrl={apiBaseUrl}
              setApiBaseUrl={setApiBaseUrl}
              defaultEnvUrl={defaultEnvUrl}
              apiStatus={apiStatus}
              onRefreshHealth={checkAPI}
              features={features}
              setPredictions={setPredictions}
              onClearPredictions={() => setPredictions([])}
              setSuccessMessage={setSuccessMessage}
            />
          )}
        </main>

        {/* Minimalist Footer */}
        <footer className="border-t border-zinc-800/80 py-4 px-6 text-center text-[11px] font-mono text-zinc-400">
          Hybrid IDS · Two-Stage XGBoost Pipeline · Research Prototype
        </footer>
      </div>

      {/* Inspect Detail Modal */}
      {/*selectedFlowDetail && (
  <FlowDetailModal
    flow={selectedFlowDetail}
    apiBaseUrl={apiBaseUrl}
    onClose={() => setSelectedFlowDetail(null)}
  />
)*/}

      {selectedFlowDetail && (
        <FlowDetailModal
          flow={selectedFlowDetail}
          apiBaseUrl={apiBaseUrl}
          onClose={() => setSelectedFlowDetail(null)}
        />
      )}
    </div>
  )
}

export default App
