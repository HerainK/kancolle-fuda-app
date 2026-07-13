import { DndContext, PointerSensor, TouchSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AssignmentBox } from '../components/AssignmentBox'
import { ShipPool } from '../components/ShipPool'
import { useAppData } from '../state/AppDataContext'
import { assignShipToBox, canDropShip, removeShipFromBox } from '../state/assignmentActions'

export function AssignmentPage() {
  const { data, setData } = useAppData()
  // activationConstraintでわずかな移動量を要求しないと、タップ選択のための
  // 単純なクリックまでドラッグ開始と判定されてonClickが発火しなくなる
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } }),
  )
  const [selectedShipId, setSelectedShipId] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const event = data.events.find((e) => e.id === data.activeEventId) ?? data.events[0]

  useEffect(() => {
    if (!errorMessage) return
    const timer = setTimeout(() => setErrorMessage(null), 3000)
    return () => clearTimeout(timer)
  }, [errorMessage])

  const tagNameById = new Map(data.events.flatMap((e) => e.tags.map((t) => [t.id, t.name] as const)))

  function selectShip(id: string) {
    setSelectedShipId((prev) => (prev === id ? null : id))
    setErrorMessage(null)
  }

  function tryAssign(boxId: string, shipInstanceId: string) {
    const check = canDropShip(data, event.id, boxId, shipInstanceId)
    if (!check.ok) {
      setErrorMessage(check.reason)
      return
    }
    setData((prev) => assignShipToBox(prev, event.id, boxId, shipInstanceId))
    setErrorMessage(null)
  }

  function handleRemove(boxId: string, shipInstanceId: string) {
    setData((prev) => removeShipFromBox(prev, event.id, boxId, shipInstanceId))
  }

  function handleBoxClick(boxId: string) {
    if (!selectedShipId) return
    tryAssign(boxId, selectedShipId)
  }

  function handleDragEnd(dragEvent: DragEndEvent) {
    const { active, over } = dragEvent
    if (!over) return
    const activeData = active.data.current as { shipInstanceId: string; sourceBoxId: string | null }
    const destId = String(over.id)

    if (destId === 'pool') {
      if (activeData.sourceBoxId) {
        handleRemove(activeData.sourceBoxId, activeData.shipInstanceId)
      }
      return
    }
    tryAssign(destId, activeData.shipInstanceId)
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-xl font-bold">割り当て</h1>
          {selectedShipId && (
            <span className="text-xs text-gray-500">
              艦娘を選択中です。配置したい艦隊をタップ/クリックしてください。
            </span>
          )}
        </div>

        {errorMessage && (
          <p className="text-sm text-red-600 dark:text-red-400 border border-red-300 dark:border-red-800 rounded px-3 py-1.5">
            {errorMessage}
          </p>
        )}

        {event.boxes.length === 0 ? (
          <p className="text-sm text-gray-500">
            まだ艦隊が登録されていません。
            <Link to="/event-settings" className="underline ml-1">
              札・艦隊管理
            </Link>
            から艦隊を作成してください。
          </p>
        ) : (
          <div className="flex flex-col md:flex-row gap-4 items-start">
            <ShipPool
              ships={data.shipInstances}
              shipMaster={data.shipMaster}
              tagNameById={tagNameById}
              selectedShipId={selectedShipId}
              onSelectShip={selectShip}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 flex-1 w-full">
              {event.boxes.map((box) => (
                <AssignmentBox
                  key={box.id}
                  box={box}
                  tag={event.tags.find((t) => t.id === box.tagId)}
                  ships={box.shipInstanceIds
                    .map((id) => data.shipInstances.find((s) => s.id === id))
                    .filter((s): s is NonNullable<typeof s> => s !== undefined)}
                  shipMaster={data.shipMaster}
                  selectedShipId={selectedShipId}
                  onSelectShip={selectShip}
                  onBoxClick={() => handleBoxClick(box.id)}
                  onRemoveShip={(shipId) => handleRemove(box.id, shipId)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </DndContext>
  )
}
