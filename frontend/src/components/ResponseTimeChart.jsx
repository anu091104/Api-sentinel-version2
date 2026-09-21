import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

export default function ResponseTimeChart({ history }) {
  const data = [...history].reverse().map((h) => ({
    time: new Date(h.checked_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    ms: h.response_time_ms,
    up: h.is_up,
  }))

  if (data.length === 0) {
    return <div style={{ color: 'var(--text-faint)', fontSize: 13 }}>No history yet — check back after the next sweep.</div>
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data}>
        <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
        <XAxis dataKey="time" stroke="var(--text-faint)" fontSize={11} />
        <YAxis stroke="var(--text-faint)" fontSize={11} unit="ms" />
        <Tooltip
          contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
          labelStyle={{ color: 'var(--text-faint)' }}
        />
        <Line type="monotone" dataKey="ms" stroke="#6b7cff" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  )
}
