import { useState } from 'react'
import { useAppData } from '../state/AppDataContext'
import { addBox } from '../state/eventActions'
import { FLEET_CAPACITY, FLEET_TYPE_LABELS, type FleetType, type Tag } from '../types/models'

export function NewBoxForm({ eventId, tags }: { eventId: string; tags: Tag[] }) {
  const { setData } = useAppData()
  const [fleetType, setFleetType] = useState<FleetType>('normal')
  const [tagId, setTagId] = useState('')
  const [purpose, setPurpose] = useState('')

  // tagsは札の追加/削除により後から変化するため、現在のtagIdが
  // その時点のtags一覧に存在しない場合は先頭の札を実効値として使う
  // (useStateの初期値はマウント時の一度きりなので、それだけでは追従できない)。
  const selectedTagId = tags.some((t) => t.id === tagId) ? tagId : (tags[0]?.id ?? '')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedTagId) return
    setData((prev) => addBox(prev, eventId, { fleetType, tagId: selectedTagId, purpose: purpose.trim() }))
    setPurpose('')
  }

  if (tags.length === 0) {
    return <p className="text-sm text-gray-500">先に札を登録すると艦隊を作成できます。</p>
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-wrap items-end gap-2 border border-gray-200 dark:border-gray-800 rounded-md p-3"
    >
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
        札 *
        <select
          required
          className="border border-gray-300 dark:border-gray-700 rounded px-2 py-1 bg-transparent"
          value={selectedTagId}
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
          placeholder="例: E1-1ゲージ目"
          value={purpose}
          onChange={(e) => setPurpose(e.target.value)}
        />
      </label>
      <button
        type="submit"
        className="px-3 py-1 rounded bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900 text-sm"
      >
        艦隊を追加
      </button>
    </form>
  )
}
