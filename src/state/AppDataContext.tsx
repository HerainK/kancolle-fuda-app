import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { loadAppData, saveAppData, type AppData } from '../lib/appData'

type Updater = AppData | ((prev: AppData) => AppData)

interface AppDataContextValue {
  data: AppData
  setData: (updater: Updater) => void
}

const AppDataContext = createContext<AppDataContextValue | null>(null)

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [data, setDataState] = useState<AppData>(() => loadAppData())

  useEffect(() => {
    saveAppData(data)
  }, [data])

  function setData(updater: Updater) {
    setDataState((prev) => (typeof updater === 'function' ? (updater as (prev: AppData) => AppData)(prev) : updater))
  }

  return <AppDataContext.Provider value={{ data, setData }}>{children}</AppDataContext.Provider>
}

export function useAppData(): AppDataContextValue {
  const ctx = useContext(AppDataContext)
  if (!ctx) throw new Error('useAppData must be used within AppDataProvider')
  return ctx
}
