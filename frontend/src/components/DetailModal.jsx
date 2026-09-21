import { useEffect, useState, useCallback } from 'react'
import { api } from '../App.jsx'
import ResponseTimeChart from './ResponseTimeChart.jsx'

export default function DetailModal({ endpointId, onClose, onDelete, onCheckNow }) {
  const [endpoint, setEndpoint] = useState(null)
  const [history, setHistory] = useState([])
  const [checking, setChecking] = useState(false)

  const load = useCallback(async () => {
    const [epRes, historyRes] = await Promise.all([
      api.get(`/apis/${endpointId}`),
      api.get(`/apis/${endpointId}/history?limit=50`),
    ])
    setEndpoint(epRes.data)
    setHistory(historyRes.data)
  }, [endpointId])

  useEffect(() => {
    let cancelled = false
    load().catch(() => {})
    return () => { cancelled = true }
  }, [load])

  const handleCheckNow = async () => {
    setChecking(true)
    try {
      await onCheckNow(endpoint)
      await load()
    } finally {
      setChecking(false)
    }
  }

  if (!endpoint) return null

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" style={{ width: 580 }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h2>{endpoint.name}</h2>
            <div className="modal-subtitle">{endpoint.url}</div>
          </div>
          <button className="close-x" onClick={onClose}>✕</button>
        </div>

        <div className="api-stats" style={{ marginTop: 10 }}>
          <div className="stat">
            <div className="label">Status</div>
            <div className="value" style={{
              color: endpoint.current_status === 'up' ? 'var(--up)'
                : endpoint.current_status === 'down' ? 'var(--down)' : 'var(--text)'
            }}>{endpoint.current_status.toUpperCase()}</div>
          </div>
          <div className="stat">
            <div className="label">Uptime (24h)</div>
            <div className="value">{endpoint.uptime_percent_24h}%</div>
          </div>
          <div className="stat">
            <div className="label">Failure Rate</div>
            <div className="value">{endpoint.failure_rate_24h}%</div>
          </div>
          <div className="stat">
            <div className="label">Checks (24h)</div>
            <div className="value">{endpoint.total_checks_24h}</div>
          </div>
        </div>

        <div className="chart-title">Response time trend</div>
        <ResponseTimeChart history={history} />

        <div className="chart-title">Recent checks</div>
        <div style={{ maxHeight: 170, overflowY: 'auto' }}>
          {history.slice(0, 15).map((h) => (
            <div key={h.id} className="history-row">
              <span className="history-time">
                <span className={`status-dot status-${h.is_up ? 'up' : 'down'}`} />
                {new Date(h.checked_at).toLocaleString()}
              </span>
              <span className="history-meta">
                {h.status_code ?? 'N/A'} · {h.response_time_ms ? `${Math.round(h.response_time_ms)}ms` : '—'}
              </span>
            </div>
          ))}
        </div>

        <div className="modal-actions">
          <button className="btn-danger" style={{ padding: '10px 16px', borderRadius: 8, cursor: 'pointer' }} onClick={() => onDelete(endpoint)}>
            Remove API
          </button>
          <button className="btn btn-secondary" onClick={handleCheckNow} disabled={checking}>
            {checking ? 'Checking…' : '↻ Check now'}
          </button>
          <button className="btn" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  )
}
