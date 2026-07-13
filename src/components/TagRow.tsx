import { useState } from 'react'
import { useAppData } from '../state/AppDataContext'
import { isTagInUse, removeTag, updateTag } from '../state/eventActions'
import type { Tag } from '../types/models'

export function TagRow({ eventId, tag }: { eventId: string; tag: Tag }) {
  const { data, setData } = useAppData()
  const [name, setName] = useState(tag.name)
  const inUse = isTagInUse(data, eventId, tag.id)

  return (
    <li className="flex items-center gap-2">
      <input
        className="border border-gray-300 dark:border-gray-700 rounded px-2 py-1 bg-transparent text-sm flex-1"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onBlur={() => {
          if (name.trim() && name !== tag.name) {
            setData((prev) => updateTag(prev, eventId, tag.id, name.trim()))
          }
        }}
      />
      <button
        type="button"
        disabled={inUse}
        title={inUse ? 'この札は艦隊で使用中のため削除できません' : '削除'}
        onClick={() => setData((prev) => removeTag(prev, eventId, tag.id))}
        className="text-xs px-2 py-1 rounded border border-gray-300 dark:border-gray-700 disabled:opacity-30 disabled:cursor-not-allowed"
      >
        削除
      </button>
    </li>
  )
}
