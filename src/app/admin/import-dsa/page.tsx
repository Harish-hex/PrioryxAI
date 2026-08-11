'use client'
import { useState } from 'react'

export default function ImportDSAPage() {
  const [file, setFile] = useState<File | null>(null)
  const [status, setStatus] = useState('')

  async function handleImport() {
    if (!file) return
    setStatus('Uploading...')

    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/admin/import-dsa', {
        method: 'POST',
        body: formData
      })
      const json = await res.json()
      setStatus(json.message ?? (json.error ? `Error: ${json.error}` : 'Done'))
    } catch (e: any) {
      setStatus(`Error: ${e.message}`)
    }
  }

  return (
    <div className="max-w-lg mx-auto p-6 mt-12 bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800">
      <h1 className="text-xl font-semibold mb-4 text-slate-900 dark:text-white">Import DSA Questions</h1>
      <input type="file" accept=".xlsx,.xls,.csv"
        onChange={e => setFile(e.target.files?.[0] ?? null)}
        className="border border-slate-300 dark:border-slate-700 rounded p-2 w-full mb-4 bg-transparent text-slate-800 dark:text-slate-200" />
      <button onClick={handleImport}
        disabled={!file}
        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded disabled:opacity-50 transition-colors w-full">
        Import Questions
      </button>
      {status && <p className="mt-4 text-sm font-medium text-slate-600 dark:text-slate-400">{status}</p>}
    </div>
  )
}
