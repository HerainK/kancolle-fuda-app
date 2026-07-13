/**
 * 艦種フィルタ・一覧表示で使う「艦種グループ」の並び順と統合ルール。
 * 艦娘マスタ上の生の艦種名(RefitForm.shipType / ShipMasterEntry.shipType)を
 * このグループ単位にまとめて表示する。
 */
export interface ShipTypeGroupDef {
  label: string
  rawTypes: string[]
}

export const SHIP_TYPE_GROUP_ORDER: ShipTypeGroupDef[] = [
  { label: '戦艦', rawTypes: ['戦艦', '航空戦艦'] },
  { label: '正規空母', rawTypes: ['正規空母', '装甲空母'] },
  { label: '軽空母', rawTypes: ['軽空母'] },
  { label: '重巡級', rawTypes: ['重巡洋艦', '航空巡洋艦'] },
  { label: '軽巡級', rawTypes: ['軽巡洋艦', '練習巡洋艦', '重雷装巡洋艦'] },
  { label: '駆逐艦', rawTypes: ['駆逐艦'] },
  { label: '海防艦', rawTypes: ['海防艦'] },
  { label: '潜水艦', rawTypes: ['潜水艦', '潜水空母'] },
  { label: '水上機母艦', rawTypes: ['水上機母艦'] },
  { label: '補給艦', rawTypes: ['補給艦'] },
  { label: '揚陸艦', rawTypes: ['揚陸艦'] },
  { label: '潜水母艦', rawTypes: ['潜水母艦'] },
]

const rawTypeToGroupLabel = new Map<string, string>()
for (const group of SHIP_TYPE_GROUP_ORDER) {
  for (const rawType of group.rawTypes) {
    rawTypeToGroupLabel.set(rawType, group.label)
  }
}

/** 生の艦種名から表示用グループラベルを求める。未定義の艦種はそのまま返す(末尾に表示される) */
export function getShipTypeGroupLabel(rawShipType: string): string {
  return rawTypeToGroupLabel.get(rawShipType) ?? rawShipType
}

const groupOrderIndex = new Map(SHIP_TYPE_GROUP_ORDER.map((g, i) => [g.label, i]))

/** グループラベル同士を指定順で比較する(未定義のグループは末尾・五十音順) */
export function compareShipTypeGroups(a: string, b: string): number {
  const ai = groupOrderIndex.get(a)
  const bi = groupOrderIndex.get(b)
  if (ai !== undefined && bi !== undefined) return ai - bi
  if (ai !== undefined) return -1
  if (bi !== undefined) return 1
  return a.localeCompare(b, 'ja')
}

export const SHIP_TYPE_GROUP_LABELS = SHIP_TYPE_GROUP_ORDER.map((g) => g.label)
