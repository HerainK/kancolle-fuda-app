import { useDroppable } from '@dnd-kit/core'
import { useMemo, useState } from 'react'
import { ShipCard } from './ShipCard'
import { compareShipTypeGroups, getShipTypeGroupLabel } from '../lib/shipTypeGroups'
import type { ShipInstance, ShipMasterEntry } from '../types/models'

export function ShipPool({
  ships,
  shipMaster,
  tagNameById,
  selectedShipId,
  onSelectShip,
}: {
  ships: ShipInstance[]
  shipMaster: ShipMasterEntry[]
  tagNameById: Map<string, string>
  selectedShipId: string | null
  onSelectShip: (id: string) => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: 'pool' })
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [tagFilter, setTagFilter] = useState('')
  const [sortByTag, setSortByTag] = useState(false)

  const masterById = useMemo(() => new Map(shipMaster.map((m) => [m.id, m])), [shipMaster])

  const shipTypes = useMemo(
    () =>
      Array.from(
        new Set(shipMaster.flatMap((m) => m.refitForms.map((f) => getShipTypeGroupLabel(f.shipType)))),
      ).sort(compareShipTypeGroups),
    [shipMaster],
  )

  const tagOptions = useMemo(
    () => Array.from(tagNameById.entries()).sort((a, b) => a[1].localeCompare(b[1], 'ja')),
    [tagNameById],
  )

  const filtered = useMemo(() => {
    const result = ships.filter((s) => {
      const master = masterById.get(s.masterId)
      if (!master) return false
      if (typeFilter) {
        const form = master.refitForms.find((f) => f.id === s.refitFormId)
        const label = getShipTypeGroupLabel(form?.shipType ?? master.shipType)
        if (label !== typeFilter) return false
      }
      if (tagFilter === 'untagged') {
        if (s.currentTagId !== null) return false
      } else if (tagFilter) {
        if (s.currentTagId !== tagFilter) return false
      }
      if (search && !master.name.includes(search)) return false
      return true
    })
    if (!sortByTag) return result
    return [...result].sort((a, b) => {
      const tagA = a.currentTagId ? (tagNameById.get(a.currentTagId) ?? '') : ''
      const tagB = b.currentTagId ? (tagNameById.get(b.currentTagId) ?? '') : ''
      if (!tagA && tagB) return -1
      if (tagA && !tagB) return 1
      return tagA.localeCompare(tagB, 'ja')
    })
  }, [ships, masterById, search, typeFilter, tagFilter, sortByTag, tagNameById])

  const untaggedCount = ships.filter((s) => s.currentTagId === null).length

  return (
    <div className="flex flex-col gap-2 w-full md:w-64 shrink-0">
      <h2 className="text-sm font-semibold text-gray-500">
        艦娘プール (未タグ {untaggedCount} / 全{ships.length})
      </h2>
      <div className="flex gap-1">
        <input
          className="border border-gray-300 dark:border-gray-700 rounded px-2 py-1 bg-transparent text-xs flex-1 min-w-0"
          placeholder="名前で検索"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="border border-gray-300 dark:border-gray-700 rounded px-1 py-1 bg-transparent text-xs"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          <option value="">全艦種</option>
          {shipTypes.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <select
          className="border border-gray-300 dark:border-gray-700 rounded px-1 py-1 bg-transparent text-xs"
          value={tagFilter}
          onChange={(e) => setTagFilter(e.target.value)}
        >
          <option value="">全ての札</option>
          <option value="untagged">未タグ</option>
          {tagOptions.map(([id, name]) => (
            <option key={id} value={id}>
              {name}
            </option>
          ))}
        </select>
      </div>
      <label className="flex items-center gap-1 text-xs text-gray-500">
        <input type="checkbox" checked={sortByTag} onChange={(e) => setSortByTag(e.target.checked)} />
        付与されている札で並び替え
      </label>
      <div
        ref={setNodeRef}
        className={`flex flex-col gap-1.5 p-2 rounded-md border min-h-40 max-h-[70vh] overflow-y-auto ${
          isOver
            ? 'border-gray-900 dark:border-gray-100 bg-gray-50 dark:bg-gray-800/50'
            : 'border-gray-200 dark:border-gray-800'
        }`}
      >
        {filtered.map((instance) => {
          const master = masterById.get(instance.masterId)
          if (!master) return null
          return (
            <ShipCard
              key={instance.id}
              draggableId={`pool-${instance.id}`}
              instance={instance}
              master={master}
              sourceBoxId={null}
              selected={selectedShipId === instance.id}
              onClick={() => onSelectShip(instance.id)}
              tagName={instance.currentTagId ? tagNameById.get(instance.currentTagId) : null}
            />
          )
        })}
        {filtered.length === 0 && <p className="text-xs text-gray-400">該当する艦娘がいません</p>}
      </div>
    </div>
  )
}
