import { useDraggable } from '@dnd-kit/core'
import type { ShipInstance, ShipMasterEntry } from '../types/models'

export function ShipCard({
  draggableId,
  instance,
  master,
  sourceBoxId,
  selected,
  onClick,
  tagName,
}: {
  draggableId: string
  instance: ShipInstance
  master: ShipMasterEntry
  sourceBoxId: string | null
  selected: boolean
  onClick: () => void
  tagName?: string | null
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: draggableId,
    data: { shipInstanceId: instance.id, sourceBoxId },
  })

  const refitName = master.refitForms.find((f) => f.id === instance.refitFormId)?.name

  return (
    <button
      ref={setNodeRef}
      type="button"
      onClick={onClick}
      {...listeners}
      {...attributes}
      style={
        transform ? { transform: `translate(${transform.x}px, ${transform.y}px)`, zIndex: 50 } : undefined
      }
      className={`text-left text-xs px-2 py-1 rounded border w-full touch-none ${
        isDragging ? 'opacity-50' : ''
      } ${
        selected
          ? 'border-gray-900 dark:border-gray-100 bg-gray-100 dark:bg-gray-800'
          : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900'
      }`}
    >
      <div className="font-medium truncate">{master.name}</div>
      <div className="text-gray-500">
        Lv{instance.level} {refitName}
      </div>
      {tagName && (
        <div className="mt-0.5 inline-block text-[10px] px-1 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200">
          札: {tagName}
        </div>
      )}
    </button>
  )
}
