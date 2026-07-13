import type { AppData } from '../lib/appData'
import { generateId } from '../lib/id'
import type { ShipInstance } from '../types/models'

export interface NewShipInstanceInput {
  masterId: string
  level: number
  refitFormId: string
  memo?: string
}

export function addShipInstance(data: AppData, input: NewShipInstanceInput): AppData {
  const newInstance: ShipInstance = {
    id: generateId(),
    masterId: input.masterId,
    level: input.level,
    refitFormId: input.refitFormId,
    currentTagId: null,
    memo: input.memo || undefined,
  }
  return { ...data, shipInstances: [...data.shipInstances, newInstance] }
}

export function updateShipInstance(
  data: AppData,
  id: string,
  patch: Partial<Pick<ShipInstance, 'level' | 'refitFormId' | 'memo'>>,
): AppData {
  return {
    ...data,
    shipInstances: data.shipInstances.map((s) => (s.id === id ? { ...s, ...patch } : s)),
  }
}

export function removeShipInstance(data: AppData, id: string): AppData {
  return {
    ...data,
    shipInstances: data.shipInstances.filter((s) => s.id !== id),
    events: data.events.map((e) => ({
      ...e,
      boxes: e.boxes.map((b) => ({
        ...b,
        shipInstanceIds: b.shipInstanceIds.filter((sid) => sid !== id),
      })),
    })),
  }
}
