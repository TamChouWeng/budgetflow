import { Check, Download } from 'lucide-react'
import { useState } from 'react'
import { exportSnapshotToFile } from '../lib/datastore'

interface SaveToFileButtonProps {
  label?: string
  className?: string
}

const SaveToFileButton = ({ label = 'Save snapshot', className = '' }: SaveToFileButtonProps) => {
  const [isSaving, setIsSaving] = useState(false)
  const [savedAt, setSavedAt] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleClick = async () => {
    setIsSaving(true)
    setError(null)
    try {
      await exportSnapshotToFile()
      setSavedAt(new Date().toLocaleTimeString())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save snapshot')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <button
        type="button"
        onClick={handleClick}
        disabled={isSaving}
        className="inline-flex items-center gap-2 rounded-lg border border-brand-500/70 bg-brand-500/10 px-4 py-2 text-sm font-semibold text-brand-100 shadow-card transition hover:bg-brand-500/20 disabled:cursor-progress disabled:opacity-70"
      >
        {isSaving ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-brand-200 border-t-transparent" />
        ) : savedAt ? (
          <Check className="h-4 w-4" />
        ) : (
          <Download className="h-4 w-4" />
        )}
        {isSaving ? 'Saving…' : label}
      </button>
      {savedAt ? (
        <p className="text-xs text-emerald-300">
          Snapshot saved at <span className="font-medium">{savedAt}</span>
        </p>
      ) : null}
      {error ? <p className="text-xs text-rose-400">{error}</p> : null}
    </div>
  )
}

export default SaveToFileButton
