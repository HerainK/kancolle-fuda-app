import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'

const NAV_ITEMS = [
  { to: '/assign', label: '割り当て' },
  { to: '/dashboard', label: 'ダッシュボード' },
  { to: '/ships', label: '保有艦娘' },
  { to: '/master', label: '艦娘マスタ' },
  { to: '/event-settings', label: '札・艦隊管理' },
  { to: '/settings', label: '設定' },
]

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-svh flex flex-col">
      <header className="border-b border-gray-200 dark:border-gray-800">
        <div className="mx-auto max-w-6xl px-4 py-3 flex flex-wrap items-center gap-4">
          <span className="font-bold whitespace-nowrap">艦これ 出撃制限札管理</span>
          <nav className="flex gap-2 text-sm">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `px-3 py-1.5 rounded-md ${
                    isActive
                      ? 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main className="flex-1 mx-auto w-full max-w-6xl px-4 py-6">{children}</main>
    </div>
  )
}
