import { DEFAULT_78_FEATURES, BENIGN_SAMPLE_PRESET, ATTACK_SAMPLE_PRESET } from './constants'

/**
 * Generates a valid CSV file string with all 78 required feature headers
 * and 2 realistic sample rows (1 Benign HTTPS flow, 1 DoS/PortScan attack flow).
 */
export function generateSampleCsvContent(features = DEFAULT_78_FEATURES) {
  const headers = features.join(',')
  
  const benignRow = features
    .map((feature) => BENIGN_SAMPLE_PRESET[feature] ?? 0)
    .join(',')

  const attackRow = features
    .map((feature) => ATTACK_SAMPLE_PRESET[feature] ?? 0)
    .join(',')

  return `${headers}\n${benignRow}\n${attackRow}\n`
}

/**
 * Triggers a client-side download of a text/csv file
 */
export function downloadFile(content, fileName, mimeType = 'text/csv;charset=utf-8;') {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', fileName)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Exports predictions array to a CSV file
 */
export function exportPredictionsToCsv(predictions) {
  if (!predictions || predictions.length === 0) return

  const headers = ['Flow ID', 'Decision', 'Predicted Label', 'Attack Probability (%)', 'Multiclass Confidence (%)', 'Threshold']
  const rows = predictions.map((p) => [
    p.flowId,
    p.binaryDecision,
    `"${p.predictedLabel || ''}"`,
    (p.attackProbability * 100).toFixed(4),
    p.multiclassConfidence != null ? (p.multiclassConfidence * 100).toFixed(2) : 'N/A',
    p.threshold != null ? p.threshold : 'N/A',
  ])

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
  downloadFile(csvContent, `hids_detection_results_${Date.now()}.csv`)
}

export function formatPercent(value, digits = 2) {
  if (value == null || Number.isNaN(Number(value))) return '0%'
  return `${(Number(value) * 100).toFixed(digits)}%`
}

export function formatNumber(value) {
  if (value == null) return '0'
  return new Intl.NumberFormat().format(value)
}

