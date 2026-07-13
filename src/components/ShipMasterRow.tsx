import { useState } from 'react'
import { useAppData } from '../state/AppDataContext'
import {
  addRefitForm,
  isRefitFormInUse,
  removeRefitForm,
  updateRefitForm,
  updateShipMasterEntry,
} from '../state/shipMasterActions'
import type { AppData } from '../lib/appData'
import type { ShipMasterEntry } from '../types/models'

function RefitFormRow({
  data,
  setData,
  shipId,
  formId,
  name: formName,
  shipType: formShipType,
}: {
  data: AppData
  setData: (updater: (prev: AppData) => AppData) => void
  shipId: string
  formId: string
  name: string
  shipType: string
}) {
  const [name, setName] = useState(formName)
  const [shipType, setShipType] = useState(formShipType)
  const inUse = isRefitFormInUse(data, formId)

  return (
    <li className="flex items-center gap-2">
      <input
        className="border border-gray-300 dark:border-gray-700 rounded px-2 py-1 bg-transparent text-sm flex-1"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onBlur={() => {
          if (name.trim() && name !== formName) {
            setData((prev) => updateRefitForm(prev, shipId, formId, { name: name.trim() }))
          }
        }}
      />
      <input
        className="border border-gray-300 dark:border-gray-700 rounded px-2 py-1 bg-transparent text-sm w-28"
        placeholder="艦種"
        value={shipType}
        onChange={(e) => setShipType(e.target.value)}
        onBlur={() => {
          if (shipType.trim() && shipType !== formShipType) {
            setData((prev) => updateRefitForm(prev, shipId, formId, { shipType: shipType.trim() }))
          }
        }}
      />
      <button
        type="button"
        disabled={inUse}
        title={inUse ? 'この改装形態は保有艦娘で使用中のため削除できません' : '削除'}
        onClick={() => setData((prev) => removeRefitForm(prev, shipId, formId))}
        className="text-xs px-2 py-1 rounded border border-gray-300 dark:border-gray-700 disabled:opacity-30 disabled:cursor-not-allowed"
      >
        削除
      </button>
    </li>
  )
}

export function ShipMasterRow({ ship }: { ship: ShipMasterEntry }) {
  const { data, setData } = useAppData()
  const [expanded, setExpanded] = useState(false)
  const [name, setName] = useState(ship.name)
  const [shipType, setShipType] = useState(ship.shipType)
  const [shipClass, setShipClass] = useState(ship.shipClass ?? '')
  const [newRefitName, setNewRefitName] = useState('')
  const [newRefitType, setNewRefitType] = useState(ship.shipType)

  function saveBasicInfo() {
    if (!name.trim() || !shipType.trim()) return
    setData((prev) =>
      updateShipMasterEntry(prev, ship.id, {
        name: name.trim(),
        shipType: shipType.trim(),
        shipClass: shipClass.trim() || undefined,
      }),
    )
  }

  function handleAddRefitForm() {
    if (!newRefitName.trim() || !newRefitType.trim()) return
    setData((prev) => addRefitForm(prev, ship.id, { name: newRefitName.trim(), shipType: newRefitType.trim() }))
    setNewRefitName('')
    setNewRefitType(ship.shipType)
  }

  const hasTypeChange = new Set(ship.refitForms.map((f) => f.shipType)).size > 1

  return (
    <div className="border border-gray-200 dark:border-gray-800 rounded-md">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 text-left"
      >
        <span>
          <span className="font-medium">{ship.name}</span>
          {ship.shipClass && (
            <span className="ml-2 text-xs text-gray-500">{ship.shipClass}</span>
          )}
          <span className="ml-2 text-xs text-gray-500">
            改装形態:{' '}
            {ship.refitForms
              .map((f) => (hasTypeChange ? `${f.name}(${f.shipType})` : f.name))
              .join(' / ')}
          </span>
        </span>
        <span className="text-gray-400 text-xs">{expanded ? '閉じる' : '編集'}</span>
      </button>

      {expanded && (
        <div className="px-3 pb-3 flex flex-col gap-3 border-t border-gray-100 dark:border-gray-800 pt-3">
          <div className="flex flex-wrap gap-2">
            <label className="flex flex-col text-xs gap-1">
              艦娘名
              <input
                className="border border-gray-300 dark:border-gray-700 rounded px-2 py-1 bg-transparent"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>
            <label className="flex flex-col text-xs gap-1">
              艦種(代表)
              <input
                className="border border-gray-300 dark:border-gray-700 rounded px-2 py-1 bg-transparent"
                value={shipType}
                onChange={(e) => setShipType(e.target.value)}
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
              type="button"
              onClick={saveBasicInfo}
              className="self-end px-3 py-1 rounded bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900 text-sm"
            >
              保存
            </button>
          </div>

          <div>
            <div className="text-xs text-gray-500 mb-1">
              改装形態(改装により艦種が変わる艦は、形態ごとに艦種を個別に設定できます)
            </div>
            <ul className="flex flex-col gap-1">
              {ship.refitForms.map((form) => (
                <RefitFormRow
                  key={form.id}
                  data={data}
                  setData={setData}
                  shipId={ship.id}
                  formId={form.id}
                  name={form.name}
                  shipType={form.shipType}
                />
              ))}
            </ul>
            <div className="flex gap-2 mt-2">
              <input
                className="border border-gray-300 dark:border-gray-700 rounded px-2 py-1 bg-transparent text-sm"
                placeholder="新しい改装形態名 (例: 改二)"
                value={newRefitName}
                onChange={(e) => setNewRefitName(e.target.value)}
              />
              <input
                className="border border-gray-300 dark:border-gray-700 rounded px-2 py-1 bg-transparent text-sm w-28"
                placeholder="艦種"
                value={newRefitType}
                onChange={(e) => setNewRefitType(e.target.value)}
              />
              <button
                type="button"
                onClick={handleAddRefitForm}
                className="px-3 py-1 rounded border border-gray-300 dark:border-gray-700 text-sm"
              >
                追加
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
