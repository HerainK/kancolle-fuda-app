export type FleetType = 'normal' | 'strike' | 'combined'

export const FLEET_TYPE_LABELS: Record<FleetType, string> = {
  normal: '通常',
  strike: '遊撃',
  combined: '連合',
}

export const FLEET_CAPACITY: Record<FleetType, number> = {
  normal: 6,
  strike: 7,
  combined: 12,
}

export interface RefitForm {
  id: string
  name: string
  /** この改装形態時点での艦種。改装により艦種が変わる艦がいるため形態ごとに持つ(例: 千歳 水上機母艦→軽空母) */
  shipType: string
}

export interface ShipMasterEntry {
  id: string
  name: string
  shipType: string
  shipClass?: string
  refitForms: RefitForm[]
}

export interface ShipInstance {
  id: string
  masterId: string
  level: number
  refitFormId: string
  /** 現在保持している札。未タグならnull */
  currentTagId: string | null
  memo?: string
}

export interface Tag {
  id: string
  name: string
}

export interface Box {
  id: string
  fleetType: FleetType
  /** Tag.id への参照 */
  tagId: string
  purpose: string
  shipInstanceIds: string[]
}

export interface KanColleEvent {
  id: string
  tags: Tag[]
  boxes: Box[]
}
