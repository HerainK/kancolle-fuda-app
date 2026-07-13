import builtinShipMaster from '../data/shipMaster.json'
import { generateId } from './id'
import type { KanColleEvent, ShipInstance, ShipMasterEntry } from '../types/models'
import { loadJson, saveJson } from './storage'

const STORAGE_KEY = 'kancolle-fuda-app:data:v1'
const DATA_VERSION = 1

export interface AppData {
  version: number
  shipMaster: ShipMasterEntry[]
  shipInstances: ShipInstance[]
  events: KanColleEvent[]
  activeEventId: string | null
}

function createEmptyEvent(): KanColleEvent {
  return { id: generateId(), tags: [], boxes: [] }
}

function createInitialAppData(): AppData {
  const event = createEmptyEvent()
  return {
    version: DATA_VERSION,
    shipMaster: builtinShipMaster as ShipMasterEntry[],
    shipInstances: [],
    events: [event],
    activeEventId: event.id,
  }
}

/**
 * 札・艦隊管理は常に「イベント」が1件存在する前提で動く(イベントの作成操作はUIから廃止済み)。
 * 何らかの理由でイベントが0件の保存データを読み込んだ場合に備え、自動的に1件補う。
 */
function ensureEvent(data: AppData): AppData {
  if (data.events.length > 0 && data.activeEventId) return data
  const event = createEmptyEvent()
  return { ...data, events: [...data.events, event], activeEventId: event.id }
}

/**
 * 保存済みデータに存在しない艦娘マスタIDが同梱データ側に増えていた場合、
 * 追加分のみをマージする(ユーザーがメンテナンス画面で編集した既存エントリには触れない)。
 * これにより、艦娘マスタの生成スクリプトを再実行して新艦娘を追加した際も、
 * 既存ユーザーのlocalStorageに自動的に反映される。
 */
function mergeBuiltinShipMaster(shipMaster: ShipMasterEntry[]): ShipMasterEntry[] {
  const existingIds = new Set(shipMaster.map((s) => s.id))
  const missing = (builtinShipMaster as ShipMasterEntry[]).filter((s) => !existingIds.has(s.id))
  return missing.length > 0 ? [...shipMaster, ...missing] : shipMaster
}

export function loadAppData(): AppData {
  const loaded = loadJson<AppData>(STORAGE_KEY)
  if (loaded === null) {
    const initial = createInitialAppData()
    saveAppData(initial)
    return initial
  }
  const merged: AppData = ensureEvent({ ...loaded, shipMaster: mergeBuiltinShipMaster(loaded.shipMaster) })
  if (merged.shipMaster !== loaded.shipMaster || merged.events !== loaded.events) {
    saveAppData(merged)
  }
  return merged
}

export function saveAppData(data: AppData): void {
  saveJson(STORAGE_KEY, data)
}

export function exportAppDataJson(data: AppData): string {
  return JSON.stringify(data, null, 2)
}

/** JSONをAppDataとして読み込む(保存は行わない)。形式が不正な場合は例外を投げる */
export function parseAppDataJson(json: string): AppData {
  let parsed: unknown
  try {
    parsed = JSON.parse(json)
  } catch {
    throw new Error('JSONとして読み込めませんでした。ファイルの内容を確認してください。')
  }
  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    !Array.isArray((parsed as AppData).shipMaster) ||
    !Array.isArray((parsed as AppData).shipInstances) ||
    !Array.isArray((parsed as AppData).events)
  ) {
    throw new Error('データの形式が正しくありません(艦娘マスタ・保有艦娘・イベントの形式を確認してください)。')
  }
  return parsed as AppData
}

/** 初期状態のAppDataを返す(保存は行わない) */
export function createResetAppData(): AppData {
  return createInitialAppData()
}
