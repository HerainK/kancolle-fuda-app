import { BoxRow } from '../components/BoxRow'
import { NewBoxForm } from '../components/NewBoxForm'
import { NewTagForm } from '../components/NewTagForm'
import { TagRow } from '../components/TagRow'
import { useAppData } from '../state/AppDataContext'
import { clearAllBoxAssignments, clearAllTags } from '../state/eventActions'

export function EventSettingsPage() {
  const { data, setData } = useAppData()
  const event = data.events.find((e) => e.id === data.activeEventId) ?? data.events[0]

  function handleClearAllTags() {
    if (
      !confirm(
        '現在設定されている札をすべて削除します。艦隊もすべて削除され、艦娘のタグ状態もリセットされます。よろしいですか？',
      )
    ) {
      return
    }
    setData((prev) => clearAllTags(prev, event.id))
  }

  function handleClearAllAssignments() {
    if (
      !confirm('すべての艦隊から艦娘の割り当てを解除します(札・艦隊の設定自体は維持されます)。よろしいですか？')
    ) {
      return
    }
    setData((prev) => clearAllBoxAssignments(prev, event.id))
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-bold">札・艦隊管理</h1>

      <section className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-gray-500">札(タグ)</h2>
          {event.tags.length > 0 && (
            <button
              type="button"
              onClick={handleClearAllTags}
              className="text-xs px-2 py-1 rounded border border-red-300 text-red-600 dark:border-red-800 dark:text-red-400"
            >
              札をすべて削除
            </button>
          )}
        </div>
        <ul className="flex flex-col gap-1.5 max-w-md">
          {event.tags.map((tag) => (
            <TagRow key={tag.id} eventId={event.id} tag={tag} />
          ))}
        </ul>
        <NewTagForm eventId={event.id} />
      </section>

      <section className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-gray-500">艦隊</h2>
          {event.boxes.some((b) => b.shipInstanceIds.length > 0) && (
            <button
              type="button"
              onClick={handleClearAllAssignments}
              className="text-xs px-2 py-1 rounded border border-red-300 text-red-600 dark:border-red-800 dark:text-red-400"
            >
              艦娘の割り当てをすべて解除
            </button>
          )}
        </div>
        <div className="flex flex-col gap-2">
          {event.boxes.map((box) => (
            <BoxRow key={box.id} eventId={event.id} box={box} tags={event.tags} />
          ))}
        </div>
        <NewBoxForm eventId={event.id} tags={event.tags} />
      </section>
    </div>
  )
}
