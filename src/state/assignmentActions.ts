import type { AppData } from '../lib/appData'
import { FLEET_CAPACITY } from '../types/models'

export type DropCheckResult = { ok: true } | { ok: false; reason: string }

export function canDropShip(
  data: AppData,
  eventId: string,
  boxId: string,
  shipInstanceId: string,
): DropCheckResult {
  const event = data.events.find((e) => e.id === eventId)
  if (!event) return { ok: false, reason: 'イベントが見つかりません' }
  const box = event.boxes.find((b) => b.id === boxId)
  if (!box) return { ok: false, reason: '艦隊が見つかりません' }
  const ship = data.shipInstances.find((s) => s.id === shipInstanceId)
  if (!ship) return { ok: false, reason: '艦娘が見つかりません' }

  if (box.shipInstanceIds.includes(shipInstanceId)) {
    return { ok: false, reason: 'すでにこの艦隊に入っています' }
  }
  if (box.shipInstanceIds.length >= FLEET_CAPACITY[box.fleetType]) {
    return { ok: false, reason: 'この艦隊は満杯です' }
  }
  if (ship.currentTagId !== null && ship.currentTagId !== box.tagId) {
    return { ok: false, reason: '札が一致しないため配置できません' }
  }
  return { ok: true }
}

/** 未タグの艦娘、または対象艦隊と同じ札を持つ艦娘を艦隊に配置する。判定NGの場合は何もしない */
export function assignShipToBox(data: AppData, eventId: string, boxId: string, shipInstanceId: string): AppData {
  const check = canDropShip(data, eventId, boxId, shipInstanceId)
  if (!check.ok) return data

  const event = data.events.find((e) => e.id === eventId)!
  const box = event.boxes.find((b) => b.id === boxId)!

  return {
    ...data,
    shipInstances: data.shipInstances.map((s) =>
      s.id === shipInstanceId ? { ...s, currentTagId: box.tagId } : s,
    ),
    events: data.events.map((e) =>
      e.id !== eventId
        ? e
        : {
            ...e,
            boxes: e.boxes.map((b) =>
              b.id !== boxId ? b : { ...b, shipInstanceIds: [...b.shipInstanceIds, shipInstanceId] },
            ),
          },
    ),
  }
}

/** 艦娘を指定の艦隊から取り除く。どの艦隊にも属さなくなった場合は未タグに戻す */
export function removeShipFromBox(
  data: AppData,
  eventId: string,
  boxId: string,
  shipInstanceId: string,
): AppData {
  const updatedEvents = data.events.map((e) =>
    e.id !== eventId
      ? e
      : {
          ...e,
          boxes: e.boxes.map((b) =>
            b.id !== boxId
              ? b
              : { ...b, shipInstanceIds: b.shipInstanceIds.filter((id) => id !== shipInstanceId) },
          ),
        },
  )
  const stillInAnyBox = updatedEvents.some((e) => e.boxes.some((b) => b.shipInstanceIds.includes(shipInstanceId)))

  return {
    ...data,
    events: updatedEvents,
    shipInstances: stillInAnyBox
      ? data.shipInstances
      : data.shipInstances.map((s) => (s.id === shipInstanceId ? { ...s, currentTagId: null } : s)),
  }
}
