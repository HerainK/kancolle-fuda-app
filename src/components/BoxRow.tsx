import { useState } from 'react'
import { useAppData } from '../state/AppDataContext'
import { removeBox, updateBox } from '../state/eventActions'
import { FLEET_CAPACITY, FLEET_TYPE_LABELS, type Box, type FleetType, type Tag } from '../types/models'

export function BoxRow({ eventId, box, tags }: { eventId: string; box: Box; tags: Tag[] }) {
  const { setData } = useAppData()
  const [editing, setEditing] = useState(false)
  const [fleetType, setFleetType] = useState<FleetType>(box.fleetType)
  const [tagId, setTagId] = useState(box.tagId)
  const [purpose, setPurpose] = useState(box.purpose)

  const tagName = tags.find((t) => t.id === box.tagId)?.name ?? '(不明な札)'

  function handleSave() {
    if (!tagId) return
    setData((prev) => updateBox(prev, eventId, box.id, { fleetType, tagId, purpose: purpose.trim() }))
    setEditing(false)
  }

  function handleDelete() {
    if (box.shipInstanceIds.length > 0) {
      if (!confirm(`この艦隊には${box.shipInstanceIds.length}隻の艦娘が入っています。削除しますか？`)) return
    }
    setData((prev) => removeBox(prev, eventId, box.id))
  }

  if (editing) {
    return (
      <div className="border border-gray-200 dark:border-gray-800 rounded-md p-3 flex flex-wrap items-end gap-2">
        <label className="flex flex-col text-xs gap-1">
          艦隊の種類
          <select
            className="border border-gray-300 dark:border-gray-700 rounded px-2 py-1 bg-transparent"
            value={fleetType}
            onChange={(e) => setFleetType(e.target.value as FleetType)}
          >
            {(Object.keys(FLEET_TYPE_LABELS) as FleetType[]).map((ft) => (
              <option key={ft} value={ft}>
                {FLEET_TYPE_LABELS[ft]}({FLEET_CAPACITY[ft]}隻)
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col text-xs gap-1">
          札
          <select
            className="border border-gray-300 dark:border-gray-700 rounded px-2 py-1 bg-transparent"
            value={tagId}
            onChange={(e) => setTagId(e.target.value)}
          >
            {tags.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col text-xs gap-1">
          用途
          <input
            className="border border-gray-300 dark:border-gray-700 rounded px-2 py-1 bg-transparent"
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
          />
        </label>
        <button
          type="button"
          onClick={handleSave}
          className="px-3 py-1 rounded bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900 text-sm"
        >
          保存
        </button>
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="px-3 py-1 rounded border border-gray-300 dark:border-gray-700 text-sm"
        >
          キャンセル
        </button>
      </div>
    )
  }

  return (
    <div className="border border-gray-200 dark:border-gray-800 rounded-md p-3 flex items-center justify-between gap-2">
      <div>
        <div className="font-medium">
          {purpose || '(用途未設定)'}
          <span className="ml-2 text-xs text-gray-500">
            {FLEET_TYPE_LABELS[box.fleetType]} / 札: {tagName}
          </span>
        </div>
        <div className="text-xs text-gray-500">
          {box.shipInstanceIds.length}/{FLEET_CAPACITY[box.fleetType]}
        </div>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="px-3 py-1 rounded border border-gray-300 dark:border-gray-700 text-sm"
        >
          編集
        </button>
        <button
          type="button"
          onClick={handleDelete}
          className="px-3 py-1 rounded border border-gray-300 dark:border-gray-700 text-sm"
        >
          削除
        </button>
      </div>
    </div>
  )
}
