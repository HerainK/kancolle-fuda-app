import { useState } from 'react'
import { InstanceForm } from './InstanceForm'
import { refitFormsInGroup } from '../lib/grouping'
import { useAppData } from '../state/AppDataContext'
import { addShipInstance, removeShipInstance, updateShipInstance } from '../state/shipInstanceActions'
import type { ShipInstance, ShipMasterEntry } from '../types/models'

export function MasterShipCard({
  master,
  instances,
  groupLabel,
}: {
  master: ShipMasterEntry
  instances: ShipInstance[]
  /** この一覧が属する艦種グループ。新規登録時はこのグループの改装形態のみを選択肢にする */
  groupLabel: string
}) {
  const { setData } = useAppData()
  const [expanded, setExpanded] = useState(false)
  const [addingNew, setAddingNew] = useState(false)
  const [editingInstanceId, setEditingInstanceId] = useState<string | null>(null)

  const bucketRefitForms = refitFormsInGroup(master, groupLabel)

  function handleRegisterNew(level: number, refitFormId: string) {
    setData((prev) => addShipInstance(prev, { masterId: master.id, level, refitFormId }))
    setAddingNew(false)
  }

  function handleUpdate(instanceId: string, level: number, refitFormId: string) {
    setData((prev) => updateShipInstance(prev, instanceId, { level, refitFormId }))
    setEditingInstanceId(null)
  }

  function handleDelete(instance: ShipInstance) {
    if (!confirm(`${master.name} (Lv${instance.level}) を削除しますか？`)) return
    setData((prev) => removeShipInstance(prev, instance.id))
  }

  return (
    <div className="border border-gray-200 dark:border-gray-800 rounded-md">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between gap-2 px-2.5 py-1.5 text-left text-sm"
      >
        <span>{master.name}</span>
        {instances.length > 0 && (
          <span className="text-xs px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200">
            ×{instances.length}
          </span>
        )}
      </button>

      {expanded && (
        <div className="px-2.5 pb-2.5 flex flex-col gap-2 border-t border-gray-100 dark:border-gray-800 pt-2">
          {instances.map((inst) => {
            const refitName = master.refitForms.find((f) => f.id === inst.refitFormId)?.name
            if (editingInstanceId === inst.id) {
              return (
                <InstanceForm
                  key={inst.id}
                  refitForms={master.refitForms}
                  initialLevel={inst.level}
                  initialRefitFormId={inst.refitFormId}
                  submitLabel="更新"
                  onSubmit={(level, refitFormId) => handleUpdate(inst.id, level, refitFormId)}
                  onCancel={() => setEditingInstanceId(null)}
                />
              )
            }
            return (
              <div key={inst.id} className="flex items-center justify-between gap-2 text-xs">
                <span>
                  Lv{inst.level} {refitName} ・ {inst.currentTagId ? '札あり' : '未タグ'}
                </span>
                <span className="flex gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => setEditingInstanceId(inst.id)}
                    className="px-2 py-0.5 rounded border border-gray-300 dark:border-gray-700"
                  >
                    編集
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(inst)}
                    className="px-2 py-0.5 rounded border border-gray-300 dark:border-gray-700"
                  >
                    削除
                  </button>
                </span>
              </div>
            )
          })}

          {instances.length === 0 || addingNew ? (
            <InstanceForm
              refitForms={bucketRefitForms}
              initialLevel={1}
              initialRefitFormId={bucketRefitForms[0]?.id ?? ''}
              submitLabel="登録"
              onSubmit={handleRegisterNew}
              onCancel={() => (instances.length === 0 ? setExpanded(false) : setAddingNew(false))}
            />
          ) : (
            <button
              type="button"
              onClick={() => setAddingNew(true)}
              className="self-start text-xs px-2 py-1 rounded border border-gray-300 dark:border-gray-700"
            >
              + 新規追加(重複所持)
            </button>
          )}
        </div>
      )}
    </div>
  )
}
