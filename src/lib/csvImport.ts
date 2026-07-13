import type { ShipMasterEntry } from '../types/models'

/** シンプルなRFC4180風CSVパーサ(ダブルクォート囲み・エスケープに対応)。BOM・CRLFも吸収する */
export function parseCsvText(text: string): string[][] {
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
    } else if (ch === ',') {
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

interface PoiCsvRow {
  name: string
  level: number
  locked: boolean
}

function extractPoiRows(text: string): { rows: PoiCsvRow[] } | { error: string } {
  const table = parseCsvText(text)
  if (table.length < 2) {
    return { error: 'CSVにデータ行がありません。' }
  }
  const header = table[0]
  const nameIdx = header.indexOf('艦名')
  const levelIdx = header.indexOf('レベル')
  const lockIdx = header.indexOf('ロック')
  if (nameIdx === -1 || levelIdx === -1 || lockIdx === -1) {
    return {
      error: '「艦名」「レベル」「ロック」の列が見つかりませんでした。Poiから出力したCSVか確認してください。',
    }
  }

  const rows: PoiCsvRow[] = []
  for (let i = 1; i < table.length; i++) {
    const r = table[i]
    if (r.length <= Math.max(nameIdx, levelIdx, lockIdx)) continue
    const name = r[nameIdx]?.trim()
    if (!name) continue
    const level = Number(r[levelIdx])
    rows.push({
      name,
      level: Number.isFinite(level) && level > 0 ? Math.min(999, Math.round(level)) : 1,
      locked: r[lockIdx]?.trim() === '1',
    })
  }
  return { rows }
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
  const result = extractPoiRows(text)
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
