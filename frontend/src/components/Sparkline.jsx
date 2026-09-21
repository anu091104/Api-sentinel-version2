import { AreaChart, Area, ResponsiveContainer, YAxis } from 'recharts'

export default function Sparkline({ data, isDown }) {
  if (!data || data.length < 2) {
    return <div style={{ height: 36, display: 'flex', alignItems: 'center', color: 'var(--text-faint)', fontSize: 11 }}>Not enough data yet</div>
  }

  const points = data.map((v, i) => ({ i, v }))
  const color = isDown ? '#ff5c72' : '#6b7cff'

  return (
    <ResponsiveContainer width="100%" height={36}>
      <AreaChart data={points} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id={`spark-${color}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.35} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <YAxis hide domain={['dataMin - 10', 'dataMax + 10']} />
        <Area type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} fill={`url(#spark-${color})`} isAnimationActive={false} />
      </AreaChart>
    </ResponsiveContainer>
  )
}
