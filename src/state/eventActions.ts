import { arrayMove } from '@dnd-kit/sortable'
import type { AppData } from '../lib/appData'
import { generateId } from '../lib/id'
import type { Box, FleetType, KanColleEvent, Tag } from '../types/models'

function mapEvent(data: AppData, eventId: string, fn: (e: KanColleEvent) => KanColleEvent): AppData {
  return { ...data, events: data.events.map((e) => (e.id === eventId ? fn(e) : e)) }
}

export function addTag(data: AppData, eventId: string, name: string): AppData {
  const newTag: Tag = { id: generateId(), name }
  return mapEvent(data, eventId, (e) => ({ ...e, tags: [...e.tags, newTag] }))
}

export function updateTag(data: AppData, eventId: string, tagId: string, name: string): AppData {
  return mapEvent(data, eventId, (e) => ({
    ...e,
    tags: e.tags.map((t) => (t.id === tagId ? { ...t, name } : t)),
  }))
}

export function isTagInUse(data: AppData, eventId: string, tagId: string): boolean {
  const event = data.events.find((e) => e.id === eventId)
  if (!event) return false
  return event.boxes.some((b) => b.tagId === tagId)
}

export function removeTag(data: AppData, eventId: string, tagId: string): AppData {
  return mapEvent(data, eventId, (e) => ({ ...e, tags: e.tags.filter((t) => t.id !== tagId) }))
}

export interface NewBoxInput {
  fleetType: FleetType
  tagId: string
  purpose: string
}

export function addBox(data: AppData, eventId: string, input: NewBoxInput): AppData {
  const newBox: Box = {
    id: generateId(),
    fleetType: input.fleetType,
    tagId: input.tagId,
    purpose: input.purpose,
    shipInstanceIds: [],
  }
  return mapEvent(data, eventId, (e) => ({ ...e, boxes: [...e.boxes, newBox] }))
}

/**
 * 艦隊を更新する。札(tagId)を変更した場合、その艦隊に入っている艦娘のうち
 * 新しい札を保持していない艦娘は自動的に艦隊から除外する
 * (そうしないと「艦隊の札」と「艦娘が実際に保持する札」が食い違う艦娘が
 *  艦隊に残ってしまう)。除外された結果どの艦隊にも属さなくなった艦娘は未タグに戻す。
 */
export function updateBox(
  data: AppData,
  eventId: string,
  boxId: string,
  patch: Partial<Pick<Box, 'fleetType' | 'tagId' | 'purpose'>>,
): AppData {
  const event = data.events.find((e) => e.id === eventId)
  const box = event?.boxes.find((b) => b.id === boxId)
  if (!event || !box) return data

  const newTagId = patch.tagId ?? box.tagId
  const tagChanged = newTagId !== box.tagId
  const shipById = new Map(data.shipInstances.map((s) => [s.id, s]))
  const removedShipIds: string[] = []

  const updatedEvents = data.events.map((e) => {
    if (e.id !== eventId) return e
    return {
      ...e,
      boxes: e.boxes.map((b) => {
        if (b.id !== boxId) return b
        let shipInstanceIds = b.shipInstanceIds
        if (tagChanged) {
          shipInstanceIds = b.shipInstanceIds.filter((shipId) => {
            const matches = shipById.get(shipId)?.currentTagId === newTagId
            if (!matches) removedShipIds.push(shipId)
            return matches
          })
        }
        return { ...b, ...patch, shipInstanceIds }
      }),
    }
  })

  if (removedShipIds.length === 0) {
    return { ...data, events: updatedEvents }
  }

  return {
    ...data,
    events: updatedEvents,
    shipInstances: data.shipInstances.map((s) => {
      if (!removedShipIds.includes(s.id)) return s
      const stillInAnyBox = updatedEvents.some((e) => e.boxes.some((b) => b.shipInstanceIds.includes(s.id)))
      return stillInAnyBox ? s : { ...s, currentTagId: null }
    }),
  }
}

export function removeBox(data: AppData, eventId: string, boxId: string): AppData {
  return mapEvent(data, eventId, (e) => ({ ...e, boxes: e.boxes.filter((b) => b.id !== boxId) }))
}

/** 同一艦隊内で艦娘の並び順を入れ替える */
export function reorderBoxShips(
  data: AppData,
  eventId: string,
  boxId: string,
  activeShipId: string,
  overShipId: string,
): AppData {
  return mapEvent(data, eventId, (e) => ({
    ...e,
    boxes: e.boxes.map((b) => {
      if (b.id !== boxId) return b
      const oldIndex = b.shipInstanceIds.indexOf(activeShipId)
      const newIndex = b.shipInstanceIds.indexOf(overShipId)
      if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return b
      return { ...b, shipInstanceIds: arrayMove(b.shipInstanceIds, oldIndex, newIndex) }
    }),
  }))
}

/**
 * イベントの札をすべて削除する。艦隊は札への参照が必須のため、
 * 一緒にすべて削除する(=艦隊への艦娘の割り当ても消える)。
 * 削除された札を保持していた艦娘は未タグに戻す。
 */
export function clearAllTags(data: AppData, eventId: string): AppData {
  const event = data.events.find((e) => e.id === eventId)
  if (!event) return data
  const clearedTagIds = new Set(event.tags.map((t) => t.id))

  return {
    ...data,
    events: data.events.map((e) => (e.id === eventId ? { ...e, tags: [], boxes: [] } : e)),
    shipInstances: data.shipInstances.map((s) =>
      s.currentTagId && clearedTagIds.has(s.currentTagId) ? { ...s, currentTagId: null } : s,
    ),
  }
}

/**
 * イベント内のすべての艦隊から艦娘の割り当てを解除する。
 * 札・艦隊自体の設定(艦隊種別・札・用途)は維持する。
 */
export function clearAllBoxAssignments(data: AppData, eventId: string): AppData {
  const event = data.events.find((e) => e.id === eventId)
  if (!event) return data
  const affectedShipIds = new Set(event.boxes.flatMap((b) => b.shipInstanceIds))

  const updatedEvents = data.events.map((e) =>
    e.id === eventId ? { ...e, boxes: e.boxes.map((b) => ({ ...b, shipInstanceIds: [] })) } : e,
  )

  return {
    ...data,
    events: updatedEvents,
    shipInstances: data.shipInstances.map((s) => {
      if (!affectedShipIds.has(s.id)) return s
      const stillInAnyBox = updatedEvents.some((e) => e.boxes.some((b) => b.shipInstanceIds.includes(s.id)))
      return stillInAnyBox ? s : { ...s, currentTagId: null }
    }),
  }
}
