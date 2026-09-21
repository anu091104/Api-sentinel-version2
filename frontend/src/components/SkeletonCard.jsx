export default function SkeletonCard() {
  return (
    <div className="skeleton-card">
      <div className="skeleton-line" style={{ width: '55%', height: 16, marginBottom: 10 }} />
      <div className="skeleton-line" style={{ width: '80%', height: 11, marginBottom: 22 }} />
      <div className="skeleton-line" style={{ width: '100%', height: 36, marginBottom: 14 }} />
      <div style={{ display: 'flex', gap: 16 }}>
        <div className="skeleton-line" style={{ width: 50, height: 26 }} />
        <div className="skeleton-line" style={{ width: 50, height: 26 }} />
        <div className="skeleton-line" style={{ width: 50, height: 26 }} />
      </div>
    </div>
  )
}
