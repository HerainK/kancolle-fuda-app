import type { ShipInstance, ShipMasterEntry } from '../types/models'

/**
 * 艦隊編成の艦種内訳表示専用の略称マッピング。
 * 艦種フィルタ用のグループ分け(shipTypeGroups.ts)とは異なり、
 * 航空戦艦・航空巡洋艦・重雷装巡洋艦・練習巡洋艦はそれぞれ区別して表示する。
 * 潜水空母のみ潜水艦に統合する。
 */
const FLEET_TYPE_ABBR_ORDER: { label: string; rawTypes: string[] }[] = [
  { label: '戦艦', rawTypes: ['戦艦'] },
  { label: '航戦', rawTypes: ['航空戦艦'] },
  { label: '空母', rawTypes: ['正規空母', '装甲空母'] },
  { label: '軽空', rawTypes: ['軽空母'] },
  { label: '重巡', rawTypes: ['重巡洋艦'] },
  { label: '航巡', rawTypes: ['航空巡洋艦'] },
  { label: '軽巡', rawTypes: ['軽巡洋艦'] },
  { label: '雷巡', rawTypes: ['重雷装巡洋艦'] },
  { label: '練巡', rawTypes: ['練習巡洋艦'] },
  { label: '駆逐', rawTypes: ['駆逐艦'] },
  { label: '海防', rawTypes: ['海防艦'] },
  { label: '潜水', rawTypes: ['潜水艦', '潜水空母'] },
  { label: '水母', rawTypes: ['水上機母艦'] },
  { label: '補給', rawTypes: ['補給艦'] },
  { label: '揚陸', rawTypes: ['揚陸艦'] },
  { label: '潜母', rawTypes: ['潜水母艦'] },
  { label: '工作', rawTypes: ['工作艦'] },
]

const rawTypeToAbbr = new Map<string, string>()
for (const group of FLEET_TYPE_ABBR_ORDER) {
  for (const rawType of group.rawTypes) {
    rawTypeToAbbr.set(rawType, group.label)
  }
}

const abbrOrderIndex = new Map(FLEET_TYPE_ABBR_ORDER.map((g, i) => [g.label, i]))

export function getFleetTypeAbbr(rawShipType: string): string {
  return rawTypeToAbbr.get(rawShipType) ?? rawShipType
}

/** 艦隊に編成中の艦娘の艦種内訳を「戦艦1空母1重巡2」のような文字列にまとめる */
export function summarizeFleetComposition(ships: ShipInstance[], shipMaster: ShipMasterEntry[]): string {
  const masterById = new Map(shipMaster.map((m) => [m.id, m]))
  const counts = new Map<string, number>()

  for (const instance of ships) {
    const master = masterById.get(instance.masterId)
    if (!master) continue
    const form = master.refitForms.find((f) => f.id === instance.refitFormId)
    const rawType = form?.shipType ?? master.shipType
    const abbr = getFleetTypeAbbr(rawType)
    counts.set(abbr, (counts.get(abbr) ?? 0) + 1)
  }

  return Array.from(counts.entries())
    .sort((a, b) => (abbrOrderIndex.get(a[0]) ?? 999) - (abbrOrderIndex.get(b[0]) ?? 999))
    .map(([label, count]) => `${label}${count}`)
    .join('')
}
