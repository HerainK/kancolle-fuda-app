import { useState } from 'react'
import { useAppData } from '../state/AppDataContext'
import { addTag } from '../state/eventActions'

export function NewTagForm({ eventId }: { eventId: string }) {
  const { setData } = useAppData()
  const [name, setName] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setData((prev) => addTag(prev, eventId, name.trim()))
    setName('')
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        className="border border-gray-300 dark:border-gray-700 rounded px-2 py-1 bg-transparent text-sm"
        placeholder="新しい札名 (例: 第三十一戦隊)"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <button type="submit" className="px-3 py-1 rounded border border-gray-300 dark:border-gray-700 text-sm">
        追加
      </button>
    </form>
  )
}
