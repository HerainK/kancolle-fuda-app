import { useState } from 'react'
import { useAppData } from '../state/AppDataContext'
import { addShipMasterEntry } from '../state/shipMasterActions'

export function NewShipMasterForm({ onDone }: { onDone: () => void }) {
  const { setData } = useAppData()
  const [name, setName] = useState('')
  const [shipType, setShipType] = useState('')
  const [shipClass, setShipClass] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !shipType.trim()) return
    setData((prev) =>
      addShipMasterEntry(prev, {
        name: name.trim(),
        shipType: shipType.trim(),
        shipClass: shipClass.trim() || undefined,
        refitFormNames: ['無印'],
      }),
    )
    setName('')
    setShipType('')
    setShipClass('')
    onDone()
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-wrap items-end gap-2 border border-gray-200 dark:border-gray-800 rounded-md p-3"
    >
      <label className="flex flex-col text-xs gap-1">
        艦娘名 *
        <input
          required
          className="border border-gray-300 dark:border-gray-700 rounded px-2 py-1 bg-transparent"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </label>
      <label className="flex flex-col text-xs gap-1">
        艦種 *
        <input
          required
          className="border border-gray-300 dark:border-gray-700 rounded px-2 py-1 bg-transparent"
          value={shipType}
          onChange={(e) => setShipType(e.target.value)}
          placeholder="例: 駆逐艦"
        />
      </label>
      <label className="flex flex-col text-xs gap-1">
        艦級(姉妹艦グループ)
        <input
          className="border border-gray-300 dark:border-gray-700 rounded px-2 py-1 bg-transparent"
          value={shipClass}
          onChange={(e) => setShipClass(e.target.value)}
        />
      </label>
      <button
        type="submit"
        className="px-3 py-1 rounded bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900 text-sm"
      >
        追加(改装形態「無印」で作成)
      </button>
      <button
        type="button"
        onClick={onDone}
        className="px-3 py-1 rounded border border-gray-300 dark:border-gray-700 text-sm"
      >
        キャンセル
      </button>
    </form>
  )
}
