import { useMemo, useState } from 'react'
import { CsvImportPanel } from '../components/CsvImportPanel'
import { MasterShipCard } from '../components/MasterShipCard'
import { groupAllShipMaster } from '../lib/grouping'
import { compareShipTypeGroups, getShipTypeGroupLabel } from '../lib/shipTypeGroups'
import { useAppData } from '../state/AppDataContext'

export function ShipInstancesPage() {
  const { data } = useAppData()
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [showCsvImport, setShowCsvImport] = useState(false)

  const shipTypeOptions = useMemo(() => {
    const labels = new Set(data.shipMaster.flatMap((m) => m.refitForms.map((f) => getShipTypeGroupLabel(f.shipType))))
    return Array.from(labels).sort(compareShipTypeGroups)
  }, [data.shipMaster])

  const nameFiltered = useMemo(
    () => data.shipMaster.filter((m) => !search || m.name.includes(search)),
    [data.shipMaster, search],
  )

  const allGroups = useMemo(
    () => groupAllShipMaster(nameFiltered, data.shipInstances),
    [nameFiltered, data.shipInstances],
  )

  const groups = useMemo(
    () => (typeFilter ? allGroups.filter((g) => g.shipType === typeFilter) : allGroups),
    [allGroups, typeFilter],
  )

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-xl font-bold">保有艦娘登録</h1>
        <button
          type="button"
          onClick={() => setShowCsvImport((v) => !v)}
          className="px-3 py-1.5 rounded border border-gray-300 dark:border-gray-700 text-sm"
        >
          {showCsvImport ? '閉じる' : 'CSVインポート'}
        </button>
      </div>
      <p className="text-sm text-gray-500">
        艦娘をクリックすると、その場でレベル・改装形態を入力して登録できます。既に保有している艦娘は「×N」で保有数を表示します。
      </p>

      {showCsvImport && <CsvImportPanel onDone={() => setShowCsvImport(false)} />}

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
          {shipTypeOptions.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <span className="text-xs text-gray-500 self-center">
          {nameFiltered.length}隻中 保有{data.shipInstances.length}隻(全{data.shipMaster.length}隻)
        </span>
      </div>

      <div className="flex flex-col gap-5">
        {groups.map((group) => (
          <section key={group.shipType}>
            <h2 className="text-sm font-semibold text-gray-500 mb-2">{group.shipType}</h2>
            <div className="flex flex-col gap-3">
              {group.classes.map((cls) => (
                <div key={cls.shipClass}>
                  <h3 className="text-xs text-gray-400 mb-1">{cls.shipClass}</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5">
                    {cls.ships.map(({ master, instances }) => (
                      <MasterShipCard
                        key={master.id}
                        master={master}
                        instances={instances}
                        groupLabel={group.shipType}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
        {groups.length === 0 && <p className="text-sm text-gray-500">検索条件に一致する艦娘がいません。</p>}
      </div>
    </div>
  )
}
