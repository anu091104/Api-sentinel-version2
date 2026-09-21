import Sparkline from './Sparkline.jsx'

const STATUS_LABEL = { up: 'OPERATIONAL', down: 'DOWN', unknown: 'PENDING' }

function timeAgo(iso) {
  if (!iso) return 'never'
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (diff < 10) return 'just now'
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  return `${Math.floor(diff / 3600)}h ago`
}

export default function ApiCard({ endpoint, onClick, onCheckNow }) {
  const status = endpoint.current_status
  const isDown = status === 'down'

  return (
    <div className={`api-card ${isDown ? 'is-down' : ''}`} onClick={onClick}>
      <div className="api-card-top">
        <div>
          <div className="api-name-row">
            <span className={`status-dot status-${status}`} />
            <span className="api-name">{endpoint.name}</span>
          </div>
          <div className="api-url">{endpoint.url}</div>
        </div>
        <span className={`badge badge-${status}`}>{STATUS_LABEL[status]}</span>
      </div>

      <div className="sparkline-wrap">
        <Sparkline data={endpoint.recent_latencies} isDown={isDown} />
      </div>

      <div className="api-stats">
        <div className="stat">
          <div className="label">Uptime</div>
          <div className="value">{endpoint.uptime_percent_24h}%</div>
        </div>
        <div className="stat">
          <div className="label">Failure</div>
          <div className="value">{endpoint.failure_rate_24h}%</div>
        </div>
        <div className="stat">
          <div className="label">Latency</div>
          <div className="value">
            {endpoint.last_response_time_ms != null ? `${Math.round(endpoint.last_response_time_ms)}ms` : '—'}
          </div>
        </div>
      </div>

      <div className="card-footer-row">
        <span className="last-checked">Checked {timeAgo(endpoint.last_checked_at)}</span>
        <button
          className="btn-icon"
          title="Check now"
          onClick={(e) => { e.stopPropagation(); onCheckNow(endpoint) }}
        >
          ↻
        </button>
      </div>
    </div>
  )
}
