import type { ShipMasterEntry } from '../types/models'

/**
 * CSVファイルをテキストとして読み込む。Poiが出力するCSVはUTF-8、
 * 七四式ENが出力するCSVはShift-JIS(CP932)のため、UTF-8として不正なバイト列があれば
 * Shift-JISとして読み直す。
 */
export async function readCsvFileAsText(file: File): Promise<string> {
  const buffer = await file.arrayBuffer()
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(buffer)
  } catch {
    return new TextDecoder('shift-jis').decode(buffer)
  }
}

/** シンプルなRFC4180風CSV/TSVパーサ(ダブルクォート囲み・エスケープに対応)。BOM・CRLFも吸収する */
export function parseCsvText(text: string, delimiter: string = ','): string[][] {
  const withoutBom = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text
  const s = withoutBom.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false

  for (let i = 0; i < s.length; i++) {
    const ch = s[i]
    if (inQuotes) {
      if (ch === '"') {
        if (s[i + 1] === '"') {
          field += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        field += ch
      }
      continue
    }
    if (ch === '"') {
      inQuotes = true
    } else if (ch === delimiter) {
      row.push(field)
      field = ''
    } else if (ch === '\n') {
      row.push(field)
      rows.push(row)
      row = []
      field = ''
    } else {
      field += ch
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field)
    rows.push(row)
  }
  return rows.filter((r) => !(r.length === 1 && r[0] === ''))
}

/** 1行目のタブ/カンマの出現数から区切り文字を推定する(航海日誌拡張版はタブ区切りで出力するため) */
function detectDelimiter(text: string): string {
  const firstLine = text.slice(0, text.indexOf('\n') === -1 ? text.length : text.indexOf('\n'))
  const tabCount = (firstLine.match(/\t/g) ?? []).length
  const commaCount = (firstLine.match(/,/g) ?? []).length
  return tabCount > commaCount ? '\t' : ','
}

interface OwnedShipCsvRow {
  name: string
  level: number
  locked: boolean
}

/** 「艦名」「レベル/Lv」「ロック」列を持つ表から所持艦娘の行を抽出する汎用処理 */
function extractRowsByColumns(
  table: string[][],
  nameIdx: number,
  levelIdx: number,
  lockIdx: number,
  isLocked: (rawLockValue: string) => boolean = (rawLockValue) => rawLockValue === '1',
): OwnedShipCsvRow[] {
  const rows: OwnedShipCsvRow[] = []
  for (let i = 1; i < table.length; i++) {
    const r = table[i]
    if (r.length <= Math.max(nameIdx, levelIdx, lockIdx)) continue
    const name = r[nameIdx]?.trim()
    if (!name) continue
    const level = Number(r[levelIdx])
    rows.push({
      name,
      level: Number.isFinite(level) && level > 0 ? Math.min(999, Math.round(level)) : 1,
      locked: isLocked(r[lockIdx]?.trim() ?? ''),
    })
  }
  return rows
}

/** Poi(艦これ専用ブラウザ)が出力するCSV: 「艦名」「レベル」「ロック」列を持つ */
function extractPoiRows(table: string[][]): { rows: OwnedShipCsvRow[] } | { error: string } {
  const header = table[0]
  const nameIdx = header.indexOf('艦名')
  const levelIdx = header.indexOf('レベル')
  const lockIdx = header.indexOf('ロック')
  if (nameIdx === -1 || levelIdx === -1 || lockIdx === -1) {
    return { error: '「艦名」「レベル」「ロック」の列が見つかりませんでした。' }
  }
  return { rows: extractRowsByColumns(table, nameIdx, levelIdx, lockIdx) }
}

/** 七四式ENが出力するCSV: 「艦名」「Lv」「ロック」列を持つ */
function extract74EnRows(table: string[][]): { rows: OwnedShipCsvRow[] } | { error: string } {
  const header = table[0]
  const nameIdx = header.indexOf('艦名')
  const levelIdx = header.indexOf('Lv')
  const lockIdx = header.indexOf('ロック')
  if (nameIdx === -1 || levelIdx === -1 || lockIdx === -1) {
    return { error: '「艦名」「Lv」「ロック」の列が見つかりませんでした。' }
  }
  return { rows: extractRowsByColumns(table, nameIdx, levelIdx, lockIdx) }
}

/** 航海日誌拡張版が出力するCSV(タブ区切り): 「名前」「Lv」「鍵」列を持つ。鍵列は♥が入っていればロック中 */
function extractKoukaiNisshiRows(table: string[][]): { rows: OwnedShipCsvRow[] } | { error: string } {
  const header = table[0]
  const nameIdx = header.indexOf('名前')
  const levelIdx = header.indexOf('Lv')
  const lockIdx = header.indexOf('鍵')
  if (nameIdx === -1 || levelIdx === -1 || lockIdx === -1) {
    return { error: '「名前」「Lv」「鍵」の列が見つかりませんでした。' }
  }
  return { rows: extractRowsByColumns(table, nameIdx, levelIdx, lockIdx, (raw) => raw !== '') }
}

/** CSVのヘッダー列からPoi/七四式EN/航海日誌拡張版いずれの形式かを判定して所持艦娘の行を抽出する */
function extractOwnedShipRows(table: string[][]): { rows: OwnedShipCsvRow[] } | { error: string } {
  if (table.length < 2) {
    return { error: 'CSVにデータ行がありません。' }
  }
  const header = table[0]
  if (header.includes('レベル')) {
    return extractPoiRows(table)
  }
  if (header.includes('鍵')) {
    return extractKoukaiNisshiRows(table)
  }
  if (header.includes('Lv')) {
    return extract74EnRows(table)
  }
  return {
    error:
      '対応していないCSV形式です。「Poi」「七四式EN」「航海日誌拡張版」から出力した艦娘一覧CSVを指定してください。',
  }
}

/**
 * 艦娘マスタから「現在の表示名(艦名列に入る形)」→ masterId/refitFormId のルックアップを作る。
 * 改装形態の名前が接尾辞(例: "改二")の場合は 艦娘名+接尾辞 で、
 * 史実の艦艇引き渡し等でその形態自体が別名(例: "丹陽")の場合はその名前そのもので引けるようにする。
 */
function buildDisplayNameLookup(shipMaster: ShipMasterEntry[]): Map<string, { masterId: string; refitFormId: string }> {
  const map = new Map<string, { masterId: string; refitFormId: string }>()
  for (const master of shipMaster) {
    for (const form of master.refitForms) {
      const full = form.name === '無印' ? master.name : master.name + form.name
      if (!map.has(full)) map.set(full, { masterId: master.id, refitFormId: form.id })
    }
  }
  for (const master of shipMaster) {
    for (const form of master.refitForms) {
      if (form.name === '無印') continue
      if (!map.has(form.name)) map.set(form.name, { masterId: master.id, refitFormId: form.id })
    }
  }
  return map
}

export interface CsvImportMatch {
  masterId: string
  refitFormId: string
  level: number
  rawName: string
}

export interface CsvImportUnmatched {
  rawName: string
  level: number
}

export interface CsvImportPreview {
  toImport: CsvImportMatch[]
  unmatched: CsvImportUnmatched[]
  excludedByLock: number
  totalRows: number
}

export function buildCsvImportPreview(
  text: string,
  shipMaster: ShipMasterEntry[],
): CsvImportPreview | { error: string } {
  const table = parseCsvText(text, detectDelimiter(text))
  const result = extractOwnedShipRows(table)
  if ('error' in result) return result

  const lookup = buildDisplayNameLookup(shipMaster)
  const toImport: CsvImportMatch[] = []
  const unmatched: CsvImportUnmatched[] = []
  let excludedByLock = 0

  for (const row of result.rows) {
    if (!row.locked) {
      excludedByLock++
      continue
    }
    const hit = lookup.get(row.name)
    if (!hit) {
      unmatched.push({ rawName: row.name, level: row.level })
      continue
    }
    toImport.push({ ...hit, level: row.level, rawName: row.name })
  }

  return { toImport, unmatched, excludedByLock, totalRows: result.rows.length }
}
