import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { groupShipInstances } from '../lib/grouping'
import { useAppData } from '../state/AppDataContext'
import { FLEET_CAPACITY, FLEET_TYPE_LABELS } from '../types/models'

export function DashboardPage() {
  const { data } = useAppData()
  const [search, setSearch] = useState('')
  const event = data.events.find((e) => e.id === data.activeEventId) ?? data.events[0]

  const masterById = useMemo(() => new Map(data.shipMaster.map((m) => [m.id, m])), [data.shipMaster])

  const boxesByShipId = useMemo(() => {
    const map = new Map<string, { purpose: string }[]>()
    for (const box of event.boxes) {
      for (const shipId of box.shipInstanceIds) {
        if (!map.has(shipId)) map.set(shipId, [])
        map.get(shipId)!.push({ purpose: box.purpose || '(用途未設定)' })
      }
    }
    return map
  }, [event])

  const tagNameById = useMemo(() => new Map(event.tags.map((t) => [t.id, t.name])), [event])

  const untaggedCount = data.shipInstances.filter((s) => s.currentTagId === null).length
  const taggedCount = data.shipInstances.length - untaggedCount
  const totalCapacity = event.boxes.reduce((sum, b) => sum + FLEET_CAPACITY[b.fleetType], 0)
  const totalOccupied = event.boxes.reduce((sum, b) => sum + b.shipInstanceIds.length, 0)
  const fullBoxCount = event.boxes.filter((b) => b.shipInstanceIds.length >= FLEET_CAPACITY[b.fleetType]).length

  const filteredInstances = useMemo(
    () => data.shipInstances.filter((s) => !search || masterById.get(s.masterId)?.name.includes(search)),
    [data.shipInstances, masterById, search],
  )

  const groups = useMemo(
    () => groupShipInstances(data.shipMaster, filteredInstances),
    [data.shipMaster, filteredInstances],
  )

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-bold">ダッシュボード</h1>

      <section className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <SummaryCard label="保有艦娘" value={`${data.shipInstances.length}隻`} />
        <SummaryCard label="未タグ" value={`${untaggedCount}隻`} />
        <SummaryCard label="タグ保持" value={`${taggedCount}隻`} />
        <SummaryCard label="艦隊の収容状況" value={`${totalOccupied}/${totalCapacity}`} />
        <SummaryCard label="艦隊の数" value={`${event.boxes.length}個`} />
        <SummaryCard label="満杯の艦隊" value={`${fullBoxCount}個`} />
        <SummaryCard label="札の数" value={`${event.tags.length}個`} />
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold text-gray-500">艦隊ごとの収容状況</h2>
        {event.boxes.length === 0 ? (
          <p className="text-sm text-gray-500">
            まだ艦隊が登録されていません。
            <Link to="/event-settings" className="underline ml-1">
              札・艦隊管理
            </Link>
            から作成してください。
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {event.boxes.map((box) => {
              const capacity = FLEET_CAPACITY[box.fleetType]
              const count = box.shipInstanceIds.length
              const isFull = count >= capacity
              const tagName = event.tags.find((t) => t.id === box.tagId)?.name ?? '(不明)'
              return (
                <div
                  key={box.id}
                  className="border border-gray-200 dark:border-gray-800 rounded-md p-2.5 flex flex-col gap-1.5"
                >
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <span className="font-medium">{box.purpose || '(用途未設定)'}</span>
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded ${
                        isFull
                          ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200'
                          : 'bg-gray-100 dark:bg-gray-800'
                      }`}
                    >
                      {count}/{capacity}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">
                    {FLEET_TYPE_LABELS[box.fleetType]} / 札: {tagName}
                  </div>
                  <div className="h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                    <div
                      className={`h-full ${isFull ? 'bg-red-500' : 'bg-gray-900 dark:bg-gray-100'}`}
                      style={{ width: `${Math.min(100, (count / capacity) * 100)}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold text-gray-500">艦娘のタグ状態</h2>
        <input
          className="border border-gray-300 dark:border-gray-700 rounded px-2 py-1 bg-transparent text-sm w-full sm:w-64"
          placeholder="艦娘名で検索"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="flex flex-col gap-5">
          {groups.map((group) => (
            <div key={group.shipType}>
              <h3 className="text-sm font-semibold text-gray-500 mb-2">{group.shipType}</h3>
              <div className="flex flex-col gap-3">
                {group.classes.map((cls) => (
                  <div key={cls.shipClass}>
                    <h4 className="text-xs text-gray-400 mb-1">{cls.shipClass}</h4>
                    <div className="flex flex-col gap-1">
                      {cls.ships.flatMap(({ master, instances }) =>
                        instances.map((inst) => {
                          const refitName = master.refitForms.find((f) => f.id === inst.refitFormId)?.name
                          const boxes = boxesByShipId.get(inst.id) ?? []
                          const tagName = inst.currentTagId ? tagNameById.get(inst.currentTagId) : null
                          return (
                            <div
                              key={inst.id}
                              className="flex flex-wrap items-center gap-2 text-xs border border-gray-100 dark:border-gray-800 rounded px-2 py-1"
                            >
                              <span className="font-medium">{master.name}</span>
                              <span className="text-gray-500">
                                Lv{inst.level} {refitName}
                              </span>
                              <span
                                className={`px-1.5 py-0.5 rounded ${
                                  tagName
                                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
                                    : 'bg-gray-100 text-gray-500 dark:bg-gray-800'
                                }`}
                              >
                                {tagName ? `札: ${tagName}` : '未タグ'}
                              </span>
                              <span className="text-gray-400">
                                {boxes.length > 0 ? boxes.map((b) => b.purpose).join(' / ') : '所属艦隊なし'}
                              </span>
                            </div>
                          )
                        }),
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {data.shipInstances.length === 0 && (
            <p className="text-sm text-gray-500">まだ保有艦娘が登録されていません。</p>
          )}
          {data.shipInstances.length > 0 && groups.length === 0 && (
            <p className="text-sm text-gray-500">検索条件に一致する艦娘がいません。</p>
          )}
        </div>
      </section>
    </div>
  )
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-gray-200 dark:border-gray-800 rounded-md p-2.5">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-lg font-bold">{value}</div>
    </div>
  )
}
