import { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import axios from 'axios'
import Dashboard from './components/Dashboard.jsx'
import AddApiModal from './components/AddApiModal.jsx'
import DetailModal from './components/DetailModal.jsx'
import ConfirmDialog from './components/ConfirmDialog.jsx'
import { ToastProvider, useToast } from './context/ToastContext.jsx'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000'
export const api = axios.create({ baseURL: API_BASE, timeout: 8000 })

function AppInner() {
  const { showToast } = useToast()
  const [endpoints, setEndpoints] = useState([])
  const [loading, setLoading] = useState(true)
  const [connectionError, setConnectionError] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedId, setSelectedId] = useState(null)
  const [pendingDelete, setPendingDelete] = useState(null)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('name')
  const [lastSync, setLastSync] = useState(null)
  const pollRef = useRef(null)

  const fetchEndpoints = useCallback(async (silent = false) => {
    try {
      const res = await api.get('/apis')
      setEndpoints(res.data)
      setConnectionError(false)
      setLastSync(new Date())
    } catch (err) {
      setConnectionError(true)
      if (!silent) showToast('Could not reach the backend. Check it\u2019s running.', 'error')
    } finally {
      setLoading(false)
    }
  }, [showToast])

  useEffect(() => {
    fetchEndpoints()
    pollRef.current = setInterval(() => fetchEndpoints(true), 15000)
    return () => clearInterval(pollRef.current)
  }, [fetchEndpoints])

  const handleAdded = (name) => {
    setShowAddModal(false)
    fetchEndpoints()
    showToast(`${name} added \u2014 monitoring started`, 'success')
  }

  const requestDelete = (endpoint) => setPendingDelete(endpoint)

  const confirmDelete = async () => {
    const ep = pendingDelete
    setPendingDelete(null)
    setSelectedId(null)
    try {
      await api.delete(`/apis/${ep.id}`)
      fetchEndpoints()
      showToast(`${ep.name} removed`, 'default')
    } catch {
      showToast('Failed to remove — try again', 'error')
    }
  }

  const handleCheckNow = async (endpoint) => {
    try {
      await api.post(`/apis/${endpoint.id}/check-now`)
      fetchEndpoints()
      showToast(`Checked ${endpoint.name}`, 'default')
    } catch {
      showToast('Check failed — try again', 'error')
    }
  }

  const filteredSorted = useMemo(() => {
    let list = endpoints.filter((e) =>
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.url.toLowerCase().includes(search.toLowerCase())
    )
    switch (sortBy) {
      case 'status':
        list = [...list].sort((a, b) => {
          const order = { down: 0, unknown: 1, up: 2 }
          return order[a.current_status] - order[b.current_status]
        })
        break
      case 'uptime':
        list = [...list].sort((a, b) => a.uptime_percent_24h - b.uptime_percent_24h)
        break
      case 'latency':
        list = [...list].sort((a, b) => (b.last_response_time_ms || 0) - (a.last_response_time_ms || 0))
        break
      default:
        list = [...list].sort((a, b) => a.name.localeCompare(b.name))
    }
    return list
  }, [endpoints, search, sortBy])

  return (
    <div className="app-shell">
      <div className="header">
        <div className="header-title">
          <div className="logo-mark">🛰️</div>
          <div>
            <h1>API SENTINEL</h1>
            <div className="subtitle">Real-time API reliability monitoring</div>
          </div>
        </div>
        <div className="header-actions">
          <div className="live-indicator">
            <span className="live-dot" />
            {lastSync ? `Synced ${lastSync.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}` : 'Connecting…'}
          </div>
          <button className="btn" onClick={() => setShowAddModal(true)}>+ Add API</button>
        </div>
      </div>

      {connectionError && (
        <div className="banner-error">
          <span>Can't reach the backend at <code>{API_BASE}</code>. Make sure it's running.</span>
          <button className="btn-icon" onClick={() => fetchEndpoints()} title="Retry">↻</button>
        </div>
      )}

      <Dashboard
        endpoints={filteredSorted}
        allCount={endpoints.length}
        loading={loading}
        search={search}
        onSearchChange={setSearch}
        sortBy={sortBy}
        onSortChange={setSortBy}
        onSelect={setSelectedId}
        onCheckNow={handleCheckNow}
        onAddClick={() => setShowAddModal(true)}
      />

      {showAddModal && (
        <AddApiModal onClose={() => setShowAddModal(false)} onAdded={handleAdded} />
      )}

      {selectedId && (
        <DetailModal
          endpointId={selectedId}
          onClose={() => setSelectedId(null)}
          onDelete={requestDelete}
          onCheckNow={handleCheckNow}
        />
      )}

      {pendingDelete && (
        <ConfirmDialog
          title="Remove this API?"
          message={`This stops monitoring "${pendingDelete.name}" and deletes its check history. This can't be undone.`}
          confirmLabel="Remove"
          onConfirm={confirmDelete}
          onCancel={() => setPendingDelete(null)}
        />
      )}
    </div>
  )
}

export default function App() {
  return (
    <ToastProvider>
      <AppInner />
    </ToastProvider>
  )
}
