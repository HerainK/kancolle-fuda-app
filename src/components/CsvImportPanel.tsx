import { useRef, useState } from 'react'
import { buildCsvImportPreview, readCsvFileAsText, type CsvImportPreview } from '../lib/csvImport'
import { useAppData } from '../state/AppDataContext'
import { addShipInstancesBulk } from '../state/shipInstanceActions'

export function CsvImportPanel({ onDone }: { onDone: () => void }) {
  const { data, setData } = useAppData()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<CsvImportPreview | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    setFileName(file.name)
    try {
      const text = await readCsvFileAsText(file)
      const result = buildCsvImportPreview(text, data.shipMaster)
      if ('error' in result) {
        setError(result.error)
        setPreview(null)
      } else {
        setError(null)
        setPreview(result)
      }
    } catch {
      setError('ファイルの読み込みに失敗しました。')
      setPreview(null)
    }
  }

  function handleConfirm() {
    if (!preview || preview.toImport.length === 0) return
    setData((prev) => addShipInstancesBulk(prev, preview.toImport))
    onDone()
  }

  return (
    <div className="flex flex-col gap-3 border border-gray-200 dark:border-gray-800 rounded-md p-3">
      <p className="text-xs text-gray-500">
        「Poi」「七四式EN」「航海日誌拡張版」いずれかから出力した艦娘一覧CSVを読み込みます(形式は自動判定されます)。「保有ロック」がかかっている艦娘のみを取り込み対象とします。
      </p>
      <div>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="px-3 py-1.5 rounded border border-gray-300 dark:border-gray-700 text-sm"
        >
          CSVファイルを選択
        </button>
        <input ref={fileInputRef} type="file" accept=".csv,text/csv" onChange={handleFileChange} className="hidden" />
        {fileName && <span className="ml-2 text-xs text-gray-500">{fileName}</span>}
      </div>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400 border border-red-300 dark:border-red-800 rounded px-3 py-1.5">
          {error}
        </p>
      )}

      {preview && (
        <div className="flex flex-col gap-2 text-sm">
          <div className="flex flex-wrap gap-3 text-xs">
            <span>読み込み行数: {preview.totalRows}</span>
            <span className="text-blue-700 dark:text-blue-300">取り込み対象: {preview.toImport.length}隻</span>
            <span className="text-gray-500">除外(ロックなし): {preview.excludedByLock}件</span>
            <span className={preview.unmatched.length > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-500'}>
              マッチできなかった行: {preview.unmatched.length}件
            </span>
          </div>

          {preview.unmatched.length > 0 && (
            <div className="border border-red-200 dark:border-red-900 rounded p-2 max-h-40 overflow-y-auto">
              <p className="text-xs text-red-600 dark:text-red-400 mb-1">
                以下は艦娘マスタと照合できませんでした。マスタが未収録(新艦娘など)の可能性があります。艦娘マスタ管理画面から追加するか、個別に登録してください。
              </p>
              <ul className="text-xs text-gray-600 dark:text-gray-400 flex flex-col gap-0.5">
                {preview.unmatched.map((u, i) => (
                  <li key={i}>
                    {u.rawName} (Lv{u.level})
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleConfirm}
              disabled={preview.toImport.length === 0}
              className="px-3 py-1.5 rounded bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900 text-sm disabled:opacity-40"
            >
              {preview.toImport.length}隻を登録する
            </button>
            <button
              type="button"
              onClick={onDone}
              className="px-3 py-1.5 rounded border border-gray-300 dark:border-gray-700 text-sm"
            >
              キャンセル
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
