import { useState } from 'react'
import type { RefitForm } from '../types/models'

export function InstanceForm({
  refitForms,
  initialLevel,
  initialRefitFormId,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  refitForms: RefitForm[]
  initialLevel: number
  initialRefitFormId: string
  submitLabel: string
  onSubmit: (level: number, refitFormId: string) => void
  onCancel: () => void
}) {
  const [level, setLevel] = useState(initialLevel)
  const [refitFormId, setRefitFormId] = useState(initialRefitFormId)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!refitFormId || level < 1) return
    onSubmit(level, refitFormId)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-2 text-xs">
      <label className="flex flex-col gap-1">
        レベル
        <input
          type="number"
          min={1}
          max={999}
          required
          className="border border-gray-300 dark:border-gray-700 rounded px-1.5 py-1 bg-transparent w-16"
          value={level}
          onChange={(e) => setLevel(Number(e.target.value))}
        />
      </label>
      <label className="flex flex-col gap-1">
        改装形態
        <select
          required
          className="border border-gray-300 dark:border-gray-700 rounded px-1.5 py-1 bg-transparent"
          value={refitFormId}
          onChange={(e) => setRefitFormId(e.target.value)}
        >
          {refitForms.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </select>
      </label>
      <button
        type="submit"
        className="px-2.5 py-1 rounded bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900"
      >
        {submitLabel}
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="px-2.5 py-1 rounded border border-gray-300 dark:border-gray-700"
      >
        キャンセル
      </button>
    </form>
  )
}
