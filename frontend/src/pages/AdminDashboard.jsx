import { useEffect, useState } from 'react'
import api from '../api'
import Loading from '../components/Loading'

const fmtDay = d => new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })

function StatCard({ icon, label, value, color, bg }) {
  return (
    <div className="stat-card" style={{ borderLeft: `4px solid ${color}`, background: `linear-gradient(135deg, ${bg}55 0%, var(--surface) 60%)` }}>
      <div className="stat-icon" style={{ background: bg, color }}><i className={`fas ${icon}`}></i></div>
      <div className="stat-number" style={{ color }}>{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  )
}

function MiniBar({ value, max, color }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div style={{ flex: 1, height: 6, borderRadius: 99, background: `${color}22` }}>
      <div style={{ height: '100%', borderRadius: 99, background: color, width: `${pct}%`, transition: 'width 0.4s ease' }} />
    </div>
  )
}

export default function AdminDashboard({ showAlert }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/admin/stats')
      .then(r => setData(r.data))
      .catch(() => showAlert('Failed to load admin stats', 'error'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Loading />

  const { overview, most_attempted, lowest_scoring, daily_activity, recent_users, top_scorers_week } = data

  // Build last 14 days labels + counts
  const dayMap = Object.fromEntries(daily_activity.map(d => [d.day, d.count]))
  const days14 = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (13 - i))
    const key = d.toISOString().slice(0, 10)
    return { key, label: fmtDay(key), count: dayMap[key] || 0 }
  })
  const maxDay = Math.max(...days14.map(d => d.count), 1)

  const overviewCards = [
    { icon: 'fa-users', label: 'Total Users', value: overview.total_users, color: '#6366f1', bg: '#e0e7ff' },
    { icon: 'fa-user-check', label: 'Active Users', value: overview.active_users, color: '#10b981', bg: '#d1fae5' },
    { icon: 'fa-clipboard-list', label: 'Tests Today', value: overview.tests_today, color: '#f59e0b', bg: '#fef3c7' },
    { icon: 'fa-calendar-week', label: 'Tests This Week', value: overview.tests_this_week, color: '#0ea5e9', bg: '#e0f2fe' },
    { icon: 'fa-chart-bar', label: 'Total Tests Taken', value: overview.total_tests_taken, color: '#8b5cf6', bg: '#ede9fe' },
    { icon: 'fa-circle-question', label: 'Total Questions', value: overview.total_questions, color: '#ec4899', bg: '#fce7f3' },
  ]

  const maxAttempts = most_attempted[0]?.attempts || 1

  return (
    <div>
      {/* Overview */}
      <div className="stats-grid">
        {overviewCards.map(c => <StatCard key={c.label} {...c} />)}
      </div>

      {/* Activity chart + Top scorers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20, marginBottom: 20 }}>

        {/* 14-day bar chart */}
        <div className="card">
          <div className="card-header">
            <div className="card-title"><i className="fas fa-chart-column"></i> Tests Per Day (14 days)</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 110, marginTop: 8, overflowX: 'auto', paddingBottom: 24 }}>
            {days14.map(d => (
              <div key={d.key} style={{ flex: '0 0 auto', width: 'calc((100% - 39px) / 14)', minWidth: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                <div style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 600, lineHeight: 1 }}>{d.count > 0 ? d.count : ''}</div>
                <div
                  title={`${d.label}: ${d.count} tests`}
                  style={{
                    width: '100%', borderRadius: '3px 3px 0 0',
                    height: `${Math.max((d.count / maxDay) * 72, d.count > 0 ? 6 : 2)}px`,
                    background: d.count > 0 ? 'var(--primary)' : 'var(--border)',
                    transition: 'height 0.3s ease',
                  }}
                />
                <div style={{ fontSize: 8, color: 'var(--text-muted)', whiteSpace: 'nowrap', transform: 'rotate(-45deg)', transformOrigin: 'top left', marginTop: 2, marginLeft: 4 }}>{d.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Top scorers this week */}
        <div className="card">
          <div className="card-header">
            <div className="card-title"><i className="fas fa-medal"></i> Top Scorers This Week</div>
          </div>
          {top_scorers_week.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 0', fontSize: 13, color: 'var(--text-muted)' }}>No activity this week.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
              {top_scorers_week.map((u, i) => {
                const medals = ['🥇', '🥈', '🥉']
                const color = i === 0 ? '#f59e0b' : i === 1 ? '#94a3b8' : i === 2 ? '#b45309' : 'var(--primary)'
                return (
                  <div key={u.username} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 16, width: 22, textAlign: 'center' }}>{medals[i] || `${i + 1}.`}</span>
                    <span style={{ flex: 1, fontWeight: 600, fontSize: 13, color: 'var(--text)' }}>{u.username}</span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{u.tests} tests</span>
                    <span style={{ fontWeight: 700, fontSize: 13, color, minWidth: 44, textAlign: 'right' }}>{u.avg_pct}%</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Most attempted + Lowest scoring */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20, marginBottom: 20 }}>

        <div className="card">
          <div className="card-header">
            <div className="card-title"><i className="fas fa-fire"></i> Most Attempted Tests</div>
          </div>
          {most_attempted.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 0', fontSize: 13, color: 'var(--text-muted)' }}>No data yet.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
              {most_attempted.map((t, i) => (
                <div key={i}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{t.subject}</div>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#6366f1', marginLeft: 10, flexShrink: 0 }}>{t.attempts}</span>
                  </div>
                  <MiniBar value={t.attempts} max={maxAttempts} color="#6366f1" />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title"><i className="fas fa-triangle-exclamation"></i> Lowest Scoring Tests</div>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>min 5 attempts</span>
          </div>
          {lowest_scoring.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 0', fontSize: 13, color: 'var(--text-muted)' }}>Not enough data yet.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
              {lowest_scoring.map((t, i) => {
                const color = t.avg_pct >= 50 ? '#f59e0b' : '#ef4444'
                return (
                  <div key={i}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{t.subject} · {t.attempts} attempts</div>
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 700, color, marginLeft: 10, flexShrink: 0 }}>{t.avg_pct}%</span>
                    </div>
                    <MiniBar value={t.avg_pct} max={100} color={color} />
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Recent signups */}
      <div className="card">
        <div className="card-header">
          <div className="card-title"><i className="fas fa-user-plus"></i> Recent Signups</div>
        </div>
        {recent_users.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px 0', fontSize: 13, color: 'var(--text-muted)' }}>No users yet.</div>
        ) : (
          <div className="table-wrap">
            <table className="data-table" style={{ fontSize: 13 }}>
              <thead>
                <tr>
                  <th>Username</th>
                  <th className="admin-signup-email">Email</th>
                  <th style={{ textAlign: 'center' }}>Status</th>
                  <th style={{ textAlign: 'right' }}>Joined</th>
                </tr>
              </thead>
              <tbody>
                {recent_users.map(u => (
                  <tr key={u.username}>
                    <td style={{ fontWeight: 600 }}>{u.username}</td>
                    <td className="admin-signup-email" style={{ color: 'var(--text-secondary)' }}>{u.email}</td>
                    <td style={{ textAlign: 'center' }}>
                      <span className={`badge ${u.is_active ? 'badge-success' : 'badge-warning'}`}>
                        {u.is_active ? 'Active' : 'Pending'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right', color: 'var(--text-muted)', fontSize: 12 }}>
                      {u.created_at ? new Date(u.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
