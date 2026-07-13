import type { AppData } from '../lib/appData'
import { generateId } from '../lib/id'
import type { RefitForm, ShipMasterEntry } from '../types/models'

export interface NewShipMasterInput {
  name: string
  shipType: string
  shipClass?: string
  refitFormNames: string[]
}

export function addShipMasterEntry(data: AppData, input: NewShipMasterInput): AppData {
  const newEntry: ShipMasterEntry = {
    id: generateId(),
    name: input.name,
    shipType: input.shipType,
    shipClass: input.shipClass || undefined,
    refitForms: input.refitFormNames.map((name) => ({ id: generateId(), name, shipType: input.shipType })),
  }
  return { ...data, shipMaster: [...data.shipMaster, newEntry] }
}

export function updateShipMasterEntry(
  data: AppData,
  id: string,
  patch: Partial<Pick<ShipMasterEntry, 'name' | 'shipType' | 'shipClass'>>,
): AppData {
  return {
    ...data,
    shipMaster: data.shipMaster.map((s) => (s.id === id ? { ...s, ...patch } : s)),
  }
}

export interface NewRefitFormInput {
  name: string
  shipType: string
}

export function addRefitForm(data: AppData, shipId: string, input: NewRefitFormInput): AppData {
  return {
    ...data,
    shipMaster: data.shipMaster.map((s) =>
      s.id === shipId
        ? { ...s, refitForms: [...s.refitForms, { id: generateId(), name: input.name, shipType: input.shipType }] }
        : s,
    ),
  }
}

export function updateRefitForm(
  data: AppData,
  shipId: string,
  refitFormId: string,
  patch: Partial<Pick<RefitForm, 'name' | 'shipType'>>,
): AppData {
  return {
    ...data,
    shipMaster: data.shipMaster.map((s) =>
      s.id === shipId
        ? { ...s, refitForms: s.refitForms.map((f) => (f.id === refitFormId ? { ...f, ...patch } : f)) }
        : s,
    ),
  }
}

export function removeRefitForm(data: AppData, shipId: string, refitFormId: string): AppData {
  return {
    ...data,
    shipMaster: data.shipMaster.map((s) =>
      s.id === shipId ? { ...s, refitForms: s.refitForms.filter((f) => f.id !== refitFormId) } : s,
    ),
  }
}

export function isRefitFormInUse(data: AppData, refitFormId: string): boolean {
  return data.shipInstances.some((i) => i.refitFormId === refitFormId)
}
