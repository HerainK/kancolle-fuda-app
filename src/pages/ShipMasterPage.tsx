import { useMemo, useState } from 'react'
import { NewShipMasterForm } from '../components/NewShipMasterForm'
import { ShipMasterRow } from '../components/ShipMasterRow'
import { compareShipTypeGroups, getShipTypeGroupLabel } from '../lib/shipTypeGroups'
import { useAppData } from '../state/AppDataContext'

export function ShipMasterPage() {
  const { data } = useAppData()
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)

  const shipTypes = useMemo(
    () =>
      Array.from(new Set(data.shipMaster.map((s) => getShipTypeGroupLabel(s.shipType)))).sort(
        compareShipTypeGroups,
      ),
    [data.shipMaster],
  )

  const filtered = useMemo(() => {
    return data.shipMaster.filter((s) => {
      if (typeFilter && getShipTypeGroupLabel(s.shipType) !== typeFilter) return false
      if (search && !s.name.includes(search)) return false
      return true
    })
  }, [data.shipMaster, search, typeFilter])

  const grouped = useMemo(() => {
    const map = new Map<string, typeof filtered>()
    for (const s of filtered) {
      const label = getShipTypeGroupLabel(s.shipType)
      if (!map.has(label)) map.set(label, [])
      map.get(label)!.push(s)
    }
    return Array.from(map.entries()).sort((a, b) => compareShipTypeGroups(a[0], b[0]))
  }, [filtered])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-xl font-bold">艦娘マスタ管理</h1>
        <button
          type="button"
          onClick={() => setShowAddForm((v) => !v)}
          className="px-3 py-1.5 rounded bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900 text-sm"
        >
          {showAddForm ? '閉じる' : '+ 新規艦娘を追加'}
        </button>
      </div>

      {showAddForm && <NewShipMasterForm onDone={() => setShowAddForm(false)} />}

      <div className="flex flex-wrap gap-2">
        <input
          className="border border-gray-300 dark:border-gray-700 rounded px-2 py-1 bg-transparent text-sm"
          placeholder="艦娘名で検索"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="border border-gray-300 dark:border-gray-700 rounded px-2 py-1 bg-transparent text-sm"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          <option value="">すべての艦種</option>
          {shipTypes.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <span className="text-xs text-gray-500 self-center">{filtered.length}隻</span>
      </div>

      <div className="flex flex-col gap-4">
        {grouped.map(([shipType, ships]) => (
          <section key={shipType}>
            <h2 className="text-sm font-semibold text-gray-500 mb-2">
              {shipType} ({ships.length})
            </h2>
            <div className="flex flex-col gap-1.5">
              {ships.map((ship) => (
                <ShipMasterRow key={ship.id} ship={ship} />
              ))}
            </div>
          </section>
        ))}
        {grouped.length === 0 && (
          <p className="text-sm text-gray-500">該当する艦娘がありません。</p>
        )}
      </div>
    </div>
  )
}
