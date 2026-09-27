import { useEffect, useState } from 'react'
import api from '../api'
import Loading from '../components/Loading'

const PER_PAGE = 10

const rankStyle = [
  { bg: 'linear-gradient(135deg,#fbbf24,#f59e0b)', color: '#fff', icon: 'fa-crown', cardBg: '#fef3c7', cardBorder: '#f59e0b' },
  { bg: 'linear-gradient(135deg,#94a3b8,#64748b)', color: '#fff', icon: 'fa-medal', cardBg: '#f1f5f9', cardBorder: '#64748b' },
  { bg: 'linear-gradient(135deg,#cd7f32,#a0522d)', color: '#fff', icon: 'fa-award', cardBg: '#fdf4ec', cardBorder: '#a0522d' },
]

const statConfig = [
  { icon: 'fa-trophy', color: '#f59e0b', bg: '#fef3c7' },
  { icon: 'fa-crown', color: '#10b981', bg: '#d1fae5' },
  { icon: 'fa-chart-line', color: '#6366f1', bg: '#e0e7ff' },
  { icon: 'fa-clipboard-list', color: '#0ea5e9', bg: '#e0f2fe' },
]

const TABS = [
  { key: 'alltime', label: 'All Time', icon: 'fa-infinity' },
  { key: 'monthly', label: 'This Month', icon: 'fa-calendar-day' },
  { key: 'weekly', label: 'This Week', icon: 'fa-calendar-week' },
]

function fmtTime(mins) {
  if (!mins) return '0m'
  return mins >= 60 ? `${Math.floor(mins / 60)}h ${Math.round(mins % 60)}m` : `${Math.round(mins)}m`
}

function scoreColor(pct) {
  return pct >= 80 ? '#10b981' : pct >= 60 ? '#0ea5e9' : pct >= 40 ? '#f59e0b' : '#ef4444'
}

function scoreBadgeClass(pct) {
  return pct >= 80 ? 'badge-success' : pct >= 60 ? 'badge-primary' : pct >= 40 ? 'badge-warning' : 'badge-danger'
}

export default function Leaderboard({ showAlert }) {
  const [allTime, setAllTime] = useState(null)
  const [monthly, setMonthly] = useState(null)
  const [weekly, setWeekly] = useState(null)
  const [tab, setTab] = useState('alltime')
  const [page, setPage] = useState(1)
  const [currentUser, setCurrentUser] = useState(null)

  useEffect(() => {
    Promise.all([
      api.get('/leaderboard'),
      api.get('/leaderboard/monthly'),
      api.get('/leaderboard/weekly'),
      api.get('/check-auth'),
    ]).then(([lb, mo, wk, auth]) => {
      setAllTime(lb.data)
      setMonthly(mo.data)
      setWeekly(wk.data)
      setCurrentUser(auth.data?.user?.username || null)
    }).catch(() => showAlert('Failed to load leaderboard', 'error'))
  }, [])

  if (!allTime) return <Loading />

  const data = tab === 'monthly' ? monthly : tab === 'weekly' ? weekly : allTime
  const top3 = data.slice(0, 3)
  const totalPages = Math.ceil(data.length / PER_PAGE)
  const pageData = data.slice((page - 1) * PER_PAGE, page * PER_PAGE)
  const myEntry = data.find(u => u.username === currentUser)
  const platformAvg = data.length
    ? (data.reduce((s, u) => s + u.average_percentage, 0) / data.length).toFixed(1)
    : 0
  const totalTests = data.reduce((s, u) => s + u.tests_taken, 0)

  const avgTestsPerUser = data.length ? (totalTests / data.length).toFixed(1) : 0
  const isMonthly = tab === 'monthly'
  const isWeekly = tab === 'weekly'

  function shareRank() {
    if (!myEntry) return
    const period = isWeekly ? 'this week' : isMonthly ? 'this month' : 'all time'
    const text = `I ranked #${myEntry.rank} on Quiz Portal ${period} with ${myEntry.average_percentage}% avg score! 🎯`
    navigator.clipboard.writeText(text).then(() => showAlert('Rank copied to clipboard!', 'success')).catch(() => showAlert('Could not copy', 'error'))
  }

  const stats = [
    { label: isWeekly ? 'Active This Week' : isMonthly ? 'Active This Month' : 'Total Participants', value: data.length, ...statConfig[0] },
    { label: isWeekly ? 'Avg Tests This Week' : isMonthly ? 'Avg Tests This Month' : 'Avg Tests / User', value: avgTestsPerUser, ...statConfig[1] },
    { label: isWeekly ? 'Top Score This Week' : isMonthly ? 'Top Score This Month' : 'Highest Avg Score', value: data[0] ? `${data[0].average_percentage}%` : '—', ...statConfig[2] },
    { label: isWeekly ? 'Tests This Week' : isMonthly ? 'Tests This Month' : 'Total Tests Taken', value: totalTests, ...statConfig[3] },
    { label: isWeekly ? 'Avg Score This Week' : isMonthly ? 'Avg Score This Month' : 'Platform Avg Score', value: `${platformAvg}%`, icon: 'fa-percent', color: '#8b5cf6', bg: '#ede9fe' },
    { label: isWeekly ? 'Your Rank This Week' : isMonthly ? 'Your Rank This Month' : 'Your Rank', value: myEntry ? `#${myEntry.rank}` : '—', icon: 'fa-user-check', color: '#ec4899', bg: '#fce7f3' },
  ]

  function switchTab(t) { setTab(t); setPage(1) }

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => switchTab(t.key)}
            className={`btn ${tab === t.key ? 'btn-primary' : 'btn-secondary'}`}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <i className={`fas ${t.icon}`}></i> {t.label}
          </button>
        ))}
        {myEntry && (
          <button className="btn btn-secondary btn-sm" onClick={shareRank} style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
            <i className="fas fa-share-nodes"></i> Share Rank
          </button>
        )}
        {(isMonthly || isWeekly) && (
          <span style={{ fontSize: 12, color: 'var(--text-secondary)', alignSelf: 'center' }}>
            <i className="fas fa-calendar" style={{ marginRight: 4 }}></i>
            {isWeekly ? 'Last 7 days' : new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
          </span>
        )}
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
        {stats.map(s => (
          <div key={s.label} className="stat-card" style={{ borderLeft: `4px solid ${s.color}`, background: `linear-gradient(135deg, ${s.bg}55 0%, var(--surface) 60%)` }}>
            <div className="stat-icon" style={{ background: s.bg, color: s.color }}>
              <i className={`fas ${s.icon}`}></i>
            </div>
            <div className="stat-number" style={{ color: s.color, fontSize: s.small ? 18 : undefined }}>{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {myEntry && (
        <div className="card" style={{ marginBottom: 24, borderLeft: '4px solid #ec4899', background: 'linear-gradient(135deg, #fce7f355 0%, var(--surface) 60%)' }}>
          <div className="card-header" style={{ marginBottom: 0 }}>
            <div className="card-title"><i className="fas fa-user-check" style={{ color: '#ec4899' }}></i> Your Standing {isMonthly ? '(This Month)' : '(All Time)'}</div>
            <span className="badge" style={{ background: '#fce7f3', color: '#ec4899', fontWeight: 700 }}>Rank #{myEntry.rank}</span>
          </div>
          <div style={{ display: 'flex', gap: 24, marginTop: 14, flexWrap: 'wrap' }}>
            {[
              { label: 'Avg Score', value: `${myEntry.average_percentage}%`, color: scoreColor(myEntry.average_percentage) },
              { label: 'Tests Taken', value: myEntry.tests_taken, color: '#0ea5e9' },
              { label: 'Time Studied', value: fmtTime(myEntry.total_time_minutes), color: '#10b981' },
              { label: 'vs Platform Avg', value: `${(myEntry.average_percentage - platformAvg).toFixed(1)}%`, color: myEntry.average_percentage >= platformAvg ? '#10b981' : '#ef4444' },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ textAlign: 'center', minWidth: 80 }}>
                <div style={{ fontSize: 20, fontWeight: 800, color }}>{value}</div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 500, marginTop: 2 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '56px 20px' }}>
          <i className={`fas ${tab === 'weekly' ? 'fa-calendar-week' : tab === 'monthly' ? 'fa-calendar-xmark' : 'fa-trophy'}`} style={{ fontSize: 48, color: '#fbbf24', display: 'block', marginBottom: 16 }}></i>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6, color: 'var(--text)' }}>
            {tab === 'weekly' ? 'No Activity This Week' : tab === 'monthly' ? 'No Activity This Month' : 'No Data Yet'}
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            {tab === 'weekly' ? 'No quizzes completed in the last 7 days.' : tab === 'monthly' ? 'No quizzes completed yet in ' + new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }) + '.' : 'Be the first to complete a quiz!'}
          </p>
        </div>
      ) : (
        <>
          {top3.length > 0 && (
            <div className="card">
              <div className="card-header">
                <div className="card-title"><i className="fas fa-crown"></i> Top 3 {tab === 'weekly' ? 'This Week' : tab === 'monthly' ? 'This Month' : 'All Time'}</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                {top3.map((user, i) => {
                  const rs = rankStyle[i]
                  const initials = user.username.slice(0, 2).toUpperCase()
                  const isMe = user.username === currentUser
                  return (
                    <div key={user.user_id} style={{ textAlign: 'center', padding: '24px 16px', borderRadius: 'var(--radius)', border: `2px solid ${rs.cardBorder}44`, background: `linear-gradient(160deg, ${rs.cardBg} 0%, var(--surface) 100%)`, position: 'relative', overflow: 'hidden' }}>
                      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: rs.bg }}></div>
                      {isMe && <div style={{ position: 'absolute', top: 10, right: 10, fontSize: 10, fontWeight: 700, color: '#ec4899', background: '#fce7f3', padding: '2px 7px', borderRadius: 20 }}>You</div>}
                      <div style={{ width: 52, height: 52, borderRadius: '50%', background: rs.bg, color: rs.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, margin: '0 auto 10px', boxShadow: '0 4px 14px rgba(0,0,0,0.15)' }}>
                        <i className={`fas ${rs.icon}`}></i>
                      </div>
                      <div style={{ width: 46, height: 46, borderRadius: '50%', background: rs.cardBg, border: `2px solid ${rs.cardBorder}66`, color: rs.cardBorder, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 16, margin: '0 auto 10px' }}>
                        {initials}
                      </div>
                      <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)', marginBottom: 4 }}>{user.username}</div>
                      <div style={{ fontSize: 26, fontWeight: 800, color: scoreColor(user.average_percentage), marginBottom: 8 }}>{user.average_percentage}%</div>
                      <div style={{ height: 4, borderRadius: 4, background: `${rs.cardBorder}22`, marginBottom: 10 }}>
                        <div style={{ height: '100%', borderRadius: 4, background: rs.bg, width: `${Math.min(user.average_percentage, 100)}%` }}></div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: 14, fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>
                        <span><i className="fas fa-clipboard-list" style={{ marginRight: 3 }}></i>{user.tests_taken} tests</span>
                        <span><i className="fas fa-clock" style={{ marginRight: 3 }}></i>{fmtTime(user.total_time_minutes)}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="card-header" style={{ padding: '18px 24px', borderBottom: '1px solid var(--border)', marginBottom: 0 }}>
              <div className="card-title"><i className="fas fa-list-ol"></i> {tab === 'weekly' ? 'Weekly Rankings' : tab === 'monthly' ? 'Monthly Rankings' : 'Full Rankings'}</div>
              <span className="badge badge-secondary">{data.length} users</span>
            </div>

            {pageData.map((user, i) => {
              const globalIdx = (page - 1) * PER_PAGE + i
              const rs = rankStyle[globalIdx] || null
              const initials = user.username.slice(0, 2).toUpperCase()
              const isMe = user.username === currentUser
              const barColor = scoreColor(user.average_percentage)
              return (
                <div key={user.user_id} className="lb-row" style={{
                  background: isMe ? 'linear-gradient(90deg,#fce7f344,var(--surface))' : globalIdx < 3 ? 'var(--surface2)' : 'var(--surface)',
                  borderLeft: isMe ? '4px solid #ec4899' : rs ? `4px solid ${rankStyle[globalIdx].cardBorder}` : '4px solid transparent',
                }}>
                  <div className="lb-rank" style={rs
                    ? { background: rs.bg, color: rs.color }
                    : { background: 'var(--surface2)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }
                  }>
                    {rs ? <i className={`fas ${rs.icon}`} style={{ fontSize: 12 }}></i> : globalIdx + 1}
                  </div>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: isMe ? '#fce7f3' : 'var(--primary-light)', color: isMe ? '#ec4899' : 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12, marginRight: 12, flexShrink: 0 }}>
                    {initials}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.username}</span>
                      {isMe && <span style={{ fontSize: 10, fontWeight: 700, color: '#ec4899', background: '#fce7f3', padding: '1px 6px', borderRadius: 20, flexShrink: 0 }}>You</span>}
                    </div>
                    <div style={{ display: 'flex', gap: 12, marginTop: 3, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>
                        <i className="fas fa-clipboard-list" style={{ marginRight: 4 }}></i>{user.tests_taken} tests
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>
                        <i className="fas fa-clock" style={{ marginRight: 4 }}></i>{fmtTime(user.total_time_minutes)}
                      </span>
                    </div>
                    <div style={{ marginTop: 5, height: 3, borderRadius: 3, background: `${barColor}22` }}>
                      <div style={{ height: '100%', borderRadius: 3, background: barColor, width: `${Math.min(user.average_percentage, 100)}%`, transition: 'width 0.4s ease' }}></div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 12 }}>
                    <span className={`badge ${scoreBadgeClass(user.average_percentage)}`} style={{ fontSize: 12, padding: '4px 12px' }}>
                      {user.average_percentage}%
                    </span>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 500, marginTop: 4 }}>avg score</div>
                  </div>
                </div>
              )
            })}

            {totalPages > 1 && (
              <div style={{ padding: '14px 24px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                  Showing <strong>{(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, data.length)}</strong> of <strong>{data.length}</strong> users
                </span>
                <div className="pagination">
                  <button className="page-btn" onClick={() => setPage(p => p - 1)} disabled={page <= 1}>
                    <i className="fas fa-chevron-left"></i>
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                    <button key={p} className={`page-btn ${p === page ? 'active' : ''}`} onClick={() => setPage(p)}>{p}</button>
                  ))}
                  <button className="page-btn" onClick={() => setPage(p => p + 1)} disabled={page >= totalPages}>
                    <i className="fas fa-chevron-right"></i>
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
