import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Research from './pages/Research'
import Drafts from './pages/Drafts'
import DraftNew from './pages/DraftNew'
import DraftWorkspace from './pages/DraftWorkspace'
import Precedents from './pages/Precedents'
import PrecedentDetail from './pages/PrecedentDetail'
import Tracker from './pages/Tracker'
import OrderDetail from './pages/OrderDetail'
import Calendar from './pages/Calendar'
import OrderNew from './pages/OrderNew'

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/research" element={<Research />} />
        <Route path="/drafts" element={<Drafts />} />
        <Route path="/draft/new" element={<DraftNew />} />
        <Route path="/draft/:id" element={<DraftWorkspace />} />
        <Route path="/precedents" element={<Precedents />} />
        <Route path="/precedent/:id" element={<PrecedentDetail />} />
        <Route path="/tracker" element={<Tracker />} />
        <Route path="/tracker/order/new" element={<OrderNew />} />
        <Route path="/tracker/order/:id" element={<OrderDetail />} />
        <Route path="/calendar" element={<Calendar />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  )
}
