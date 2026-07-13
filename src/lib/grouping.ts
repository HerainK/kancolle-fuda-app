import { compareJapaneseFirst } from './japaneseText'
import { compareShipTypeGroups, getShipTypeGroupLabel } from './shipTypeGroups'
import type { ShipInstance, ShipMasterEntry } from '../types/models'

export interface ShipInstanceGroupEntry {
  master: ShipMasterEntry
  instances: ShipInstance[]
}

export interface ShipTypeGroup {
  shipType: string
  classes: {
    shipClass: string
    ships: ShipInstanceGroupEntry[]
  }[]
}

function sortGroups(
  byGroupLabel: Map<string, Map<string, ShipInstanceGroupEntry[]>>,
  masterOrder: Map<string, number>,
): ShipTypeGroup[] {
  const result: ShipTypeGroup[] = []
  for (const [shipType, classMap] of byGroupLabel) {
    const classes = Array.from(classMap.entries())
      .map(([shipClass, ships]) => ({
        shipClass,
        ships: ships.sort((a, b) => (masterOrder.get(a.master.id) ?? 0) - (masterOrder.get(b.master.id) ?? 0)),
      }))
      .sort((a, b) => compareJapaneseFirst(a.shipClass, b.shipClass))
    result.push({ shipType, classes })
  }
  return result.sort((a, b) => compareShipTypeGroups(a.shipType, b.shipType))
}

/**
 * 艦種グループ → 艦級(姉妹艦) → 艦娘マスタ、の順で保有艦娘インスタンスをグルーピングする。
 * 艦種は各インスタンスの「現在の改装形態」が属する艦種グループで判定する
 * (改装で艦種が変わる艦は、現在の形態に応じたグループにのみ現れる)。
 */
export function groupShipInstances(
  shipMaster: ShipMasterEntry[],
  shipInstances: ShipInstance[],
): ShipTypeGroup[] {
  const masterById = new Map(shipMaster.map((m) => [m.id, m]))
  const masterOrder = new Map(shipMaster.map((m, idx) => [m.id, idx]))

  const byGroupLabel = new Map<string, Map<string, ShipInstanceGroupEntry[]>>()

  for (const inst of shipInstances) {
    const master = masterById.get(inst.masterId)
    if (!master) continue

    const form = master.refitForms.find((f) => f.id === inst.refitFormId)
    const groupLabel = getShipTypeGroupLabel(form?.shipType ?? master.shipType)
    const classKey = master.shipClass ?? master.name

    if (!byGroupLabel.has(groupLabel)) byGroupLabel.set(groupLabel, new Map())
    const classMap = byGroupLabel.get(groupLabel)!

    if (!classMap.has(classKey)) classMap.set(classKey, [])
    const list = classMap.get(classKey)!

    let entry = list.find((e) => e.master.id === master.id)
    if (!entry) {
      entry = { master, instances: [] }
      list.push(entry)
    }
    entry.instances.push(inst)
  }

  return sortGroups(byGroupLabel, masterOrder)
}

/**
 * 艦種グループ → 艦級(姉妹艦) → 艦娘マスタ、の順で「艦娘マスタの全艦娘」をグルーピングする。
 * 未保有の艦娘も instances: [] として含まれる(保有艦娘登録画面のクリック登録一覧用)。
 *
 * 改装により艦種が変わる艦(例: 千歳 水上機母艦→軽空母)は、該当する艦種グループそれぞれに
 * 1エントリずつ現れる。各エントリの instances は、そのグループに属する改装形態を
 * 現在選んでいるインスタンスのみに絞り込まれる。
 */
export function groupAllShipMaster(
  shipMaster: ShipMasterEntry[],
  shipInstances: ShipInstance[],
): ShipTypeGroup[] {
  const instancesByMaster = new Map<string, ShipInstance[]>()
  for (const inst of shipInstances) {
    if (!instancesByMaster.has(inst.masterId)) instancesByMaster.set(inst.masterId, [])
    instancesByMaster.get(inst.masterId)!.push(inst)
  }
  const masterOrder = new Map(shipMaster.map((m, idx) => [m.id, idx]))

  const byGroupLabel = new Map<string, Map<string, ShipInstanceGroupEntry[]>>()

  for (const master of shipMaster) {
    const classKey = master.shipClass ?? master.name
    const allInstances = instancesByMaster.get(master.id) ?? []

    const groupLabels = new Set(master.refitForms.map((f) => getShipTypeGroupLabel(f.shipType)))

    for (const groupLabel of groupLabels) {
      const instancesInGroup = allInstances.filter((inst) => {
        const form = master.refitForms.find((f) => f.id === inst.refitFormId)
        return form !== undefined && getShipTypeGroupLabel(form.shipType) === groupLabel
      })

      if (!byGroupLabel.has(groupLabel)) byGroupLabel.set(groupLabel, new Map())
      const classMap = byGroupLabel.get(groupLabel)!

      if (!classMap.has(classKey)) classMap.set(classKey, [])
      classMap.get(classKey)!.push({ master, instances: instancesInGroup })
    }
  }

  return sortGroups(byGroupLabel, masterOrder)
}

/** 指定した艦種グループに属する改装形態のみを返す(未保有艦への新規登録フォーム用) */
export function refitFormsInGroup(master: ShipMasterEntry, groupLabel: string) {
  return master.refitForms.filter((f) => getShipTypeGroupLabel(f.shipType) === groupLabel)
}
