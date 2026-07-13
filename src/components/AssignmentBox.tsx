import { useDroppable } from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { SortableShipCard } from './SortableShipCard'
import { summarizeFleetComposition } from '../lib/fleetTypeSummary'
import { FLEET_CAPACITY, FLEET_TYPE_LABELS, type Box, type ShipInstance, type ShipMasterEntry, type Tag } from '../types/models'

export function boxOrderId(boxId: string): string {
  return `box-order-${boxId}`
}

export function AssignmentBox({
  box,
  tag,
  ships,
  shipMaster,
  selectedShipId,
  onSelectShip,
  onBoxClick,
  onRemoveShip,
}: {
  box: Box
  tag: Tag | undefined
  ships: ShipInstance[]
  shipMaster: ShipMasterEntry[]
  selectedShipId: string | null
  onSelectShip: (id: string) => void
  onBoxClick: () => void
  onRemoveShip: (shipInstanceId: string) => void
}) {
  const { setNodeRef: setDropRef, isOver } = useDroppable({ id: box.id })
  const {
    attributes,
    listeners,
    setNodeRef: setSortableRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: boxOrderId(box.id), data: { type: 'box', boxId: box.id } })
  const masterById = new Map(shipMaster.map((m) => [m.id, m]))
  const capacity = FLEET_CAPACITY[box.fleetType]
  const isFull = box.shipInstanceIds.length >= capacity
  const composition = summarizeFleetComposition(ships, shipMaster)

  function setRefs(node: HTMLDivElement | null) {
    setDropRef(node)
    setSortableRef(node)
  }

  return (
    <div
      ref={setRefs}
      onClick={onBoxClick}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : undefined }}
      className={`flex flex-col gap-2 p-2 rounded-md border min-h-32 ${
        isOver
          ? 'border-gray-900 dark:border-gray-100 bg-gray-50 dark:bg-gray-800/50'
          : 'border-gray-200 dark:border-gray-800'
      }`}
    >
      <div className="flex items-center justify-between gap-1">
        <div className="text-xs">
          <div className="font-medium">{box.purpose || '(用途未設定)'}</div>
          <div className="text-gray-500">
            {FLEET_TYPE_LABELS[box.fleetType]} / 札: {tag?.name ?? '(不明)'}
          </div>
          {composition && <div className="text-gray-500">{composition}</div>}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <span
            className={`text-xs px-1.5 py-0.5 rounded ${
              isFull ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200' : 'bg-gray-100 dark:bg-gray-800'
            }`}
          >
            {box.shipInstanceIds.length}/{capacity}
          </span>
          <button
            type="button"
            {...listeners}
            {...attributes}
            onClick={(e) => e.stopPropagation()}
            className="text-gray-400 dark:text-gray-500 cursor-grab touch-none select-none px-1"
            aria-label="艦隊の並び替え"
          >
            ⠿
          </button>
        </div>
      </div>

      <SortableContext
        items={ships.map((instance) => `box-${box.id}-${instance.id}`)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex flex-col gap-1">
          {ships.map((instance) => {
            const master = masterById.get(instance.masterId)
            if (!master) return null
            return (
              <div key={instance.id} className="flex items-center gap-1">
                <div className="flex-1 min-w-0">
                  <SortableShipCard
                    draggableId={`box-${box.id}-${instance.id}`}
                    instance={instance}
                    master={master}
                    boxId={box.id}
                    selected={selectedShipId === instance.id}
                    onClick={() => onSelectShip(instance.id)}
                  />
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    onRemoveShip(instance.id)
                  }}
                  className="text-xs px-1.5 py-1 rounded border border-gray-300 dark:border-gray-700 shrink-0"
                >
                  外す
                </button>
              </div>
            )
          })}
        </div>
      </SortableContext>
    </div>
  )
}
