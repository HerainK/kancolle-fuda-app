import { Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { AssignmentPage } from './pages/AssignmentPage'
import { DashboardPage } from './pages/DashboardPage'
import { EventSettingsPage } from './pages/EventSettingsPage'
import { SettingsPage } from './pages/SettingsPage'
import { ShipInstancesPage } from './pages/ShipInstancesPage'
import { ShipMasterPage } from './pages/ShipMasterPage'

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/assign" replace />} />
        <Route path="/assign" element={<AssignmentPage />} />
        <Route path="/ships" element={<ShipInstancesPage />} />
        <Route path="/master" element={<ShipMasterPage />} />
        <Route path="/event-settings" element={<EventSettingsPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
    </Layout>
  )
}

export default App
