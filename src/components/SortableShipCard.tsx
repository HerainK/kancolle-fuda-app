import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ShipCardView } from './ShipCardView'
import type { ShipInstance, ShipMasterEntry } from '../types/models'

export function SortableShipCard({
  draggableId,
  instance,
  master,
  boxId,
  selected,
  onClick,
  tagName,
}: {
  draggableId: string
  instance: ShipInstance
  master: ShipMasterEntry
  boxId: string
  selected: boolean
  onClick: () => void
  tagName?: string | null
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: draggableId,
    data: { shipInstanceId: instance.id, sourceBoxId: boxId },
  })

  return (
    <ShipCardView
      refCallback={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 50 : undefined }}
      listeners={listeners}
      attributes={attributes}
      isDragging={isDragging}
      selected={selected}
      onClick={onClick}
      master={master}
      instance={instance}
      tagName={tagName}
    />
  )
}
