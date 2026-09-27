import { useEffect, useState } from 'react'
import api from '../api'
import Loading from '../components/Loading'

const PER_PAGE = 10
const SUB_PER_PAGE = 7
const MON_PER_PAGE = 3

function Paginator({ page, total, perPage, onChange }) {
  const totalPages = Math.ceil(total / perPage)
  if (totalPages <= 1) return null
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, flexWrap: 'wrap', gap: 8 }}>
      <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
        Showing <strong>{(page - 1) * perPage + 1}–{Math.min(page * perPage, total)}</strong> of <strong>{total}</strong>
      </span>
      <div className="pagination">
        <button className="page-btn" onClick={() => onChange(page - 1)} disabled={page <= 1}><i className="fas fa-chevron-left"></i></button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
          <button key={p} className={`page-btn ${p === page ? 'active' : ''}`} onClick={() => onChange(p)}>{p}</button>
        ))}
        <button className="page-btn" onClick={() => onChange(page + 1)} disabled={page >= totalPages}><i className="fas fa-chevron-right"></i></button>
      </div>
    </div>
  )
}

const fmtDate = d => new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
const fmtMonth = m => { const [y, mo] = m.split('-'); return new Date(y, mo - 1).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }) }

const statConfig = [
  { key: 'total_tests', label: 'Tests Taken', icon: 'fa-clipboard-list', color: '#6366f1', bg: '#e0e7ff' },
  { key: 'average_score', label: 'Avg Score', icon: 'fa-chart-line', color: '#0ea5e9', bg: '#e0f2fe', fmt: v => `${v.toFixed(1)}%` },
  { key: 'total_time_minutes', label: 'Minutes Studied', icon: 'fa-clock', color: '#10b981', bg: '#d1fae5' },
  { key: 'correct_answers', label: 'Correct Answers', icon: 'fa-circle-check', color: '#f59e0b', bg: '#fef3c7' },
]

const subjectColors = [
  { color: '#6366f1', bg: '#e0e7ff' },
  { color: '#0ea5e9', bg: '#e0f2fe' },
  { color: '#10b981', bg: '#d1fae5' },
  { color: '#f59e0b', bg: '#fef3c7' },
  { color: '#ec4899', bg: '#fce7f3' },
  { color: '#8b5cf6', bg: '#ede9fe' },
]

function scoreBadge(pct) {
  if (pct >= 70) return 'badge-success'
  if (pct >= 50) return 'badge-warning'
  return 'badge-danger'
}

export default function Dashboard({ showAlert }) {
  const [summary, setSummary] = useState(null)
  const [activity, setActivity] = useState([])
  const [subjectPerf, setSubjectPerf] = useState([])
  const [monthlyStats, setMonthlyStats] = useState([])
  const [subPage, setSubPage] = useState(1)
  const [monPage, setMonPage] = useState(1)
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState(null)
  const [loadingPage, setLoadingPage] = useState(true)

  async function loadPage(p) {
    setLoadingPage(true)
    try {
      const r = await api.get(`/my-activity?page=${p}&per_page=${PER_PAGE}`)
      setSummary(r.data.summary)
      setActivity(r.data.recent_activity)
      setPagination(r.data.pagination)
      if (p === 1) {
        setSubjectPerf(r.data.subject_performance || [])
        setMonthlyStats(r.data.monthly_activity || [])
      }
      setPage(p)
    } catch {
      showAlert('Failed to load dashboard', 'error')
    }
    setLoadingPage(false)
  }

  useEffect(() => { loadPage(1) }, [])

  if (!summary) return <Loading />

  const totalPages = pagination?.total_pages || 1
  const sortedMonthly = [...monthlyStats].reverse()
  const visibleSubjects = subjectPerf.slice((subPage - 1) * SUB_PER_PAGE, subPage * SUB_PER_PAGE)
  const visibleMonths = sortedMonthly.slice((monPage - 1) * MON_PER_PAGE, monPage * MON_PER_PAGE)

  // Streak: count consecutive days with at least one test (from activity)
  function calcStreak(acts) {
    if (!acts.length) return 0
    const days = [...new Set(acts.map(a => a.completed_at?.slice(0, 10)))].sort().reverse()
    const today = new Date().toISOString().slice(0, 10)
    if (days[0] !== today && days[0] !== new Date(Date.now() - 86400000).toISOString().slice(0, 10)) return 0
    let streak = 1
    for (let i = 1; i < days.length; i++) {
      const diff = (new Date(days[i - 1]) - new Date(days[i])) / 86400000
      if (diff === 1) streak++
      else break
    }
    return streak
  }
  const streak = calcStreak(activity)
  const worstSubject = subjectPerf.length ? [...subjectPerf].sort((a, b) => a.average_percentage - b.average_percentage)[0] : null

  return (
    <div>
      <div className="stats-grid">
        {statConfig.map(s => {
          const raw = summary[s.key] ?? 0
          return (
            <div key={s.key} className="stat-card" style={{ borderLeft: `4px solid ${s.color}`, background: `linear-gradient(135deg, ${s.bg}55 0%, var(--surface) 60%)` }}>
              <div className="stat-icon" style={{ background: s.bg, color: s.color }}>
                <i className={`fas ${s.icon}`}></i>
              </div>
              <div className="stat-number" style={{ color: s.color }}>{s.fmt ? s.fmt(raw) : raw}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          )
        })}
        <div className="stat-card" style={{ borderLeft: '4px solid #f97316', background: 'linear-gradient(135deg, #ffedd555 0%, var(--surface) 60%)' }}>
          <div className="stat-icon" style={{ background: '#ffedd5', color: '#f97316' }}>
            <i className="fas fa-fire"></i>
          </div>
          <div className="stat-number" style={{ color: '#f97316' }}>{streak}</div>
          <div className="stat-label">Day Streak</div>
        </div>
      </div>

      {worstSubject && (
        <div className="card" style={{ marginBottom: 24, borderLeft: '4px solid #ef4444', background: 'linear-gradient(135deg, #fee2e255 0%, var(--surface) 60%)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>📈 Needs Practice</div>
            <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>{worstSubject.subject_name}</div>
            <div style={{ fontSize: 12, color: '#ef4444', fontWeight: 600 }}>{worstSubject.average_percentage.toFixed(1)}% avg score</div>
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => showAlert('Go to Exams to practice ' + worstSubject.subject_name, 'info')} style={{ flexShrink: 0 }}>
            <i className="fas fa-play"></i> Practice Now
          </button>
        </div>
      )}

      {subjectPerf.length > 0 && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-header">
            <div className="card-title"><i className="fas fa-layer-group"></i> Subject Performance</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                {(subPage - 1) * SUB_PER_PAGE + 1}–{Math.min(subPage * SUB_PER_PAGE, subjectPerf.length)} of {subjectPerf.length}
              </span>
              <button
                onClick={() => setSubPage(p => p - 1)} disabled={subPage === 1}
                style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid var(--border)', background: subPage === 1 ? 'var(--surface2)' : 'var(--surface)', cursor: subPage === 1 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: subPage === 1 ? 'var(--text-muted)' : 'var(--text)' }}
              ><i className="fas fa-chevron-left" style={{ fontSize: 11 }}></i></button>
              <button
                onClick={() => setSubPage(p => p + 1)} disabled={subPage * SUB_PER_PAGE >= subjectPerf.length}
                style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid var(--border)', background: subPage * SUB_PER_PAGE >= subjectPerf.length ? 'var(--surface2)' : 'var(--surface)', cursor: subPage * SUB_PER_PAGE >= subjectPerf.length ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: subPage * SUB_PER_PAGE >= subjectPerf.length ? 'var(--text-muted)' : 'var(--text)' }}
              ><i className="fas fa-chevron-right" style={{ fontSize: 11 }}></i></button>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12, marginTop: 4 }}>
            {visibleSubjects.map((s, i) => {
              const c = subjectColors[((subPage - 1) * SUB_PER_PAGE + i) % subjectColors.length]
              const pct = s.average_percentage
              return (
                <div key={s.subject_id} style={{ borderRadius: 12, padding: '14px 16px', background: `linear-gradient(135deg, ${c.bg} 0%, var(--surface) 100%)`, border: `1px solid ${c.color}33`, borderLeft: `4px solid ${c.color}` }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)', marginBottom: 6, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.subject_name}</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: c.color, lineHeight: 1 }}>{pct.toFixed(1)}%</div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>
                    {s.tests_taken} test{s.tests_taken !== 1 ? 's' : ''} · {s.correct_answers}/{s.total_questions} correct
                  </div>
                  <div style={{ marginTop: 8, height: 4, borderRadius: 4, background: `${c.color}22` }}>
                    <div style={{ height: '100%', borderRadius: 4, background: c.color, width: `${Math.min(pct, 100)}%`, transition: 'width 0.4s ease' }}></div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {monthlyStats.length > 0 && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-header">
            <div className="card-title"><i className="fas fa-calendar-days"></i> Monthly Activity</div>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Last 6 months</span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)' }}>
                  {['Month', 'Tests Taken', 'Avg Score'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--text-secondary)', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visibleMonths.map((m, i) => {
                  const pct = m.average_score
                  const color = pct >= 70 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#ef4444'
                  return (
                    <tr key={m.month} style={{ borderBottom: i < visibleMonths.length - 1 ? '1px solid var(--border)' : 'none' }}>
                      <td style={{ padding: '10px 12px', fontWeight: 600, color: 'var(--text)' }}>{fmtMonth(m.month)}</td>
                      <td style={{ padding: '10px 12px', color: 'var(--text-secondary)' }}>{m.tests_count}</td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{ fontWeight: 700, color, background: `${color}18`, padding: '2px 10px', borderRadius: 20, fontSize: 12 }}>{pct.toFixed(1)}%</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <Paginator page={monPage} total={sortedMonthly.length} perPage={MON_PER_PAGE} onChange={setMonPage} />
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <div className="card-title"><i className="fas fa-clock-rotate-left"></i> Recent Activity</div>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{summary.total_tests} total</span>
        </div>

        {loadingPage ? (
          <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-secondary)' }}>
            <div className="spinner" style={{ margin: '0 auto' }}></div>
          </div>
        ) : activity.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-secondary)' }}>
            <i className="fas fa-inbox" style={{ fontSize: 36, marginBottom: 12, display: 'block', color: 'var(--text-muted)' }}></i>
            No activity yet. Start taking quizzes!
          </div>
        ) : (
          <>
            <div>
              {activity.map((a, i) => (
                <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: i < activity.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 38, height: 38, borderRadius: 10, background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', fontSize: 15, flexShrink: 0 }}>
                      <i className="fas fa-file-circle-check"></i>
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)' }}>{a.quiz_test.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{a.subject.name} · {a.exam.name}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span className={`badge ${scoreBadge(a.percentage)}`}>{a.percentage}%</span>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                      {fmtDate(a.completed_at)}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, flexWrap: 'wrap', gap: 10 }}>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                  Showing <strong>{(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, summary.total_tests)}</strong> of <strong>{summary.total_tests}</strong>
                </span>
                <div className="pagination">
                  <button className="page-btn" onClick={() => loadPage(page - 1)} disabled={page <= 1}>
                    <i className="fas fa-chevron-left"></i>
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                    <button key={p} className={`page-btn ${p === page ? 'active' : ''}`} onClick={() => loadPage(p)}>{p}</button>
                  ))}
                  <button className="page-btn" onClick={() => loadPage(page + 1)} disabled={page >= totalPages}>
                    <i className="fas fa-chevron-right"></i>
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
