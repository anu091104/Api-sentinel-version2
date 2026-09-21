import ApiCard from './ApiCard.jsx'
import SkeletonCard from './SkeletonCard.jsx'

export default function Dashboard({
  endpoints, allCount, loading, search, onSearchChange, sortBy, onSortChange, onSelect, onCheckNow, onAddClick,
}) {
  if (loading) {
    return (
      <>
        <div className="summary-bar">
          {[0, 1, 2, 3].map((i) => <div key={i} className="skeleton-card" style={{ height: 84 }} />)}
        </div>
        <div className="card-grid">
          {[0, 1, 2].map((i) => <SkeletonCard key={i} />)}
        </div>
      </>
    )
  }

  if (allCount === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">📡</div>
        No APIs being monitored yet.<br />
        <button className="btn" style={{ marginTop: 16 }} onClick={onAddClick}>+ Add your first API</button>
      </div>
    )
  }

  const upCount = endpoints.filter((e) => e.current_status === 'up').length
  const downCount = endpoints.filter((e) => e.current_status === 'down').length
  const avgUptime = allCount
    ? endpoints.reduce((sum, e) => sum + e.uptime_percent_24h, 0) / (endpoints.length || 1)
    : 0

  return (
    <>
      <div className="summary-bar">
        <div className="summary-card">
          <div className="label">Monitored APIs</div>
          <div className="value">{allCount}</div>
        </div>
        <div className="summary-card">
          <div className="label">Operational</div>
          <div className="value" style={{ color: 'var(--up)' }}>{upCount}</div>
        </div>
        <div className="summary-card">
          <div className="label">Down</div>
          <div className="value" style={{ color: downCount ? 'var(--down)' : 'var(--text)' }}>{downCount}</div>
        </div>
        <div className="summary-card">
          <div className="label">Avg Uptime (24h)</div>
          <div className="value">{avgUptime.toFixed(1)}%</div>
        </div>
      </div>

      <div className="controls-row">
        <input
          className="search-input"
          placeholder="Search by name or URL…"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        <select className="sort-select" value={sortBy} onChange={(e) => onSortChange(e.target.value)}>
          <option value="name">Sort: Name</option>
          <option value="status">Sort: Status (down first)</option>
          <option value="uptime">Sort: Uptime (lowest first)</option>
          <option value="latency">Sort: Latency (highest first)</option>
        </select>
      </div>

      {endpoints.length === 0 ? (
        <div className="empty-state">No APIs match "{search}"</div>
      ) : (
        <div className="card-grid">
          {endpoints.map((ep) => (
            <ApiCard key={ep.id} endpoint={ep} onClick={() => onSelect(ep.id)} onCheckNow={onCheckNow} />
          ))}
        </div>
      )}
    </>
  )
}
