import type { CSSProperties } from 'react'
import type { DraggableAttributes } from '@dnd-kit/core'
import type { SyntheticListenerMap } from '@dnd-kit/core/dist/hooks/utilities'
import type { ShipInstance, ShipMasterEntry } from '../types/models'

export function ShipCardView({
  refCallback,
  style,
  listeners,
  attributes,
  isDragging,
  selected,
  onClick,
  master,
  instance,
  tagName,
}: {
  refCallback: (el: HTMLButtonElement | null) => void
  style?: CSSProperties
  listeners?: SyntheticListenerMap
  attributes?: DraggableAttributes
  isDragging: boolean
  selected: boolean
  onClick: () => void
  master: ShipMasterEntry
  instance: ShipInstance
  tagName?: string | null
}) {
  const refitName = master.refitForms.find((f) => f.id === instance.refitFormId)?.name

  return (
    <button
      ref={refCallback}
      type="button"
      onClick={onClick}
      {...listeners}
      {...attributes}
      style={style}
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
