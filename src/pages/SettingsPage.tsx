import { useRef, useState } from 'react'
import { exportAppDataJson, parseAppDataJson, createResetAppData } from '../lib/appData'
import { useAppData } from '../state/AppDataContext'

function downloadJson(filename: string, content: string) {
  const blob = new Blob([content], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function todayString() {
  return new Date().toISOString().slice(0, 10)
}

export function SettingsPage() {
  const { data, setData } = useAppData()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  function handleExport() {
    downloadJson(`kancolle-fuda-backup-${todayString()}.json`, exportAppDataJson(data))
    setMessage({ type: 'success', text: 'JSONファイルをダウンロードしました。' })
  }

  function handleImportClick() {
    fileInputRef.current?.click()
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      try {
        const imported = parseAppDataJson(String(reader.result))
        if (
          !confirm(
            '現在のデータをすべて上書きしてインポートします。この操作は取り消せません。よろしいですか？',
          )
        ) {
          return
        }
        setData(imported)
        setMessage({ type: 'success', text: 'データをインポートしました。' })
      } catch (err) {
        setMessage({ type: 'error', text: err instanceof Error ? err.message : 'インポートに失敗しました。' })
      }
    }
    reader.onerror = () => {
      setMessage({ type: 'error', text: 'ファイルの読み込みに失敗しました。' })
    }
    reader.readAsText(file)
  }

  function handleReset() {
    if (
      !confirm(
        '艦娘マスタ・保有艦娘・イベント・札・艦隊などすべてのデータを削除し、初期状態に戻します。この操作は取り消せません。よろしいですか？',
      )
    ) {
      return
    }
    if (!confirm('本当によろしいですか？この操作は元に戻せません。')) {
      return
    }
    setData(createResetAppData())
    setMessage({ type: 'success', text: 'データを初期状態にリセットしました。' })
  }

  return (
    <div className="flex flex-col gap-6 max-w-xl">
      <h1 className="text-xl font-bold">設定</h1>

      {message && (
        <p
          className={`text-sm rounded px-3 py-1.5 border ${
            message.type === 'success'
              ? 'text-green-700 border-green-300 dark:text-green-400 dark:border-green-800'
              : 'text-red-600 border-red-300 dark:text-red-400 dark:border-red-800'
          }`}
        >
          {message.text}
        </p>
      )}

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold text-gray-500">データのバックアップ</h2>
        <p className="text-xs text-gray-500">
          艦娘マスタ・保有艦娘・イベント・札・艦隊・所属状況をすべて含んだJSONファイルとして書き出せます。
          機種変更やブラウザの入れ替え時は、エクスポートしたファイルを新しい環境でインポートしてください。
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleExport}
            className="px-3 py-1.5 rounded bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900 text-sm"
          >
            JSONをエクスポート
          </button>
          <button
            type="button"
            onClick={handleImportClick}
            className="px-3 py-1.5 rounded border border-gray-300 dark:border-gray-700 text-sm"
          >
            JSONをインポート
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold text-gray-500">データのリセット</h2>
        <p className="text-xs text-gray-500">
          すべてのデータを削除し、艦娘マスタのみが入った初期状態に戻します。事前にエクスポートしておくことをおすすめします。
        </p>
        <button
          type="button"
          onClick={handleReset}
          className="self-start px-3 py-1.5 rounded border border-red-300 text-red-600 dark:border-red-800 dark:text-red-400 text-sm"
        >
          すべてのデータをリセット
        </button>
      </section>
    </div>
  )
}
