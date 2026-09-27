import { useEffect, useState, useRef } from 'react'
import api from '../api'
import Loading from '../components/Loading'

const PER_PAGE = 10
const SUBJ_PER_PAGE = 10

const fmtDate = d => new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })

function TestDetailsModal({ resultId, onClose }) {
  const [data, setData] = useState(null)
  const [openExpl, setOpenExpl] = useState({})
  const fetchedRef = useRef(false)
  useEffect(() => {
    if (fetchedRef.current) return
    fetchedRef.current = true
    api.get(`/test-results/${resultId}/details`).then(r => setData(r.data))
  }, [resultId])

  function toggleExpl(id) { setOpenExpl(prev => ({ ...prev, [id]: !prev[id] })) }

  return (
    <div className="modal-overlay">
      {!data ? <Loading /> : (
        <div className="modal-box modal-box-lg" style={{ display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
          <div className="modal-header" style={{ flexShrink: 0 }}>
            <div className="modal-title"><i className="fas fa-clipboard-list" style={{ color: 'var(--primary)', marginRight: 8 }}></i>{data.quiz_test.name}</div>
            <button className="modal-close" onClick={onClose}><i className="fas fa-xmark"></i></button>
          </div>
          <div className="modal-body" style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12, marginBottom: 20 }}>
              {[
                [`${data.score}/${data.total_questions}`, 'Score', '#6366f1', '#e0e7ff'],
                [`${data.percentage}%`, 'Percentage', '#0ea5e9', '#e0f2fe'],
                [`${Math.floor(data.time_taken_seconds / 60)}:${String(data.time_taken_seconds % 60).padStart(2, '0')}`, 'Time', '#10b981', '#d1fae5'],
                [fmtDate(data.completed_at), 'Date', '#f59e0b', '#fef3c7'],
              ].map(([val, label, color, bg]) => (
                <div key={label} style={{ background: bg, borderRadius: 10, padding: '14px', textAlign: 'center' }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color }}>{val}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600, marginTop: 2 }}>{label}</div>
                </div>
              ))}
            </div>
            <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)', marginBottom: 12 }}>
              <i className="fas fa-circle-question" style={{ color: 'var(--primary)', marginRight: 6 }}></i>Question Analysis
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {data.questions_with_answers.map((qa, i) => {
                const isFlagged = qa.is_flagged
                return (
                  <div key={i} style={{ border: `1px solid ${isFlagged ? '#f59e0b' : 'var(--border)'}`, borderRadius: 10, padding: '14px 16px', borderLeft: `4px solid ${qa.is_correct ? '#10b981' : '#ef4444'}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, gap: 10, flexWrap: 'wrap' }}>
                      <div style={{ flex: 1, fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>Q{i + 1}: {qa.question.question_text}</div>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
                        {isFlagged && (
                          <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, background: '#fef3c7', color: '#92400e', fontWeight: 700 }}>
                            <i className="fas fa-flag" style={{ marginRight: 3 }}></i>Flagged
                          </span>
                        )}
                        <span className={`badge ${qa.is_correct ? 'badge-success' : 'badge-danger'}`}>
                          {qa.is_correct ? '✓ Correct' : '✗ Wrong'}
                        </span>
                      </div>
                    </div>
                    <div style={{ display: 'grid', gap: 4 }}>
                      {['A', 'B', 'C', 'D'].filter(opt => (qa.question[`option_${opt.toLowerCase()}`] || '').trim()).map(opt => {
                        const optText = qa.question[`option_${opt.toLowerCase()}`]
                        const isCorrect = qa.question.correct_answer?.trim().toLowerCase() === optText?.trim().toLowerCase()
                        const isSelected = qa.selected_answer?.trim().toLowerCase() === optText?.trim().toLowerCase()
                        return (
                          <div key={opt} style={{ fontSize: 12, padding: '5px 10px', borderRadius: 6, background: isCorrect ? '#d1fae5' : isSelected && !isCorrect ? '#fee2e2' : 'var(--surface2)', color: isCorrect ? '#065f46' : isSelected && !isCorrect ? '#991b1b' : 'var(--text-secondary)', fontWeight: isCorrect || isSelected ? 600 : 400 }}>
                            <strong>{opt}:</strong> {optText}
                            {isCorrect && <span style={{ marginLeft: 6 }}>✓</span>}
                            {isSelected && !isCorrect && <span style={{ marginLeft: 6 }}>← Your answer</span>}
                          </div>
                        )
                      })}
                    </div>
                    {qa.question.explanation && (
                      <div style={{ marginTop: 8 }}>
                        <button
                          onClick={() => toggleExpl(qa.question.id)}
                          style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, border: '1px solid #0ea5e9', background: openExpl[qa.question.id] ? '#e0f2fe' : 'var(--surface)', color: '#0284c7', cursor: 'pointer', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 5 }}
                        >
                          <i className="fas fa-circle-info"></i> {openExpl[qa.question.id] ? 'Hide Explanation' : 'Explanation'}
                        </button>
                        {openExpl[qa.question.id] && (
                          <div style={{ marginTop: 6, padding: '10px 12px', borderRadius: 8, background: '#e0f2fe', border: '1px solid #0ea5e944', fontSize: 12, color: '#0c4a6e', lineHeight: 1.6 }}>
                            <i className="fas fa-lightbulb" style={{ marginRight: 6, color: '#0284c7' }}></i>{qa.question.explanation}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
          <div className="modal-footer" style={{ flexShrink: 0 }}>
            <button className="btn btn-secondary" onClick={onClose}><i className="fas fa-xmark"></i> Close</button>
          </div>
        </div>
      )}
    </div>
  )
}

function scoreBadgeClass(pct) {
  return pct >= 70 ? 'badge-success' : pct >= 50 ? 'badge-warning' : 'badge-danger'
}

const statConfig = [
  { key: 'total_tests', label: 'Total Tests', icon: 'fa-clipboard-list', color: '#6366f1', bg: '#e0e7ff' },
  { key: 'average_score', label: 'Avg Score', icon: 'fa-chart-line', color: '#0ea5e9', bg: '#e0f2fe', fmt: v => `${v.toFixed(1)}%` },
  { key: 'total_time_minutes', label: 'Time Studied', icon: 'fa-clock', color: '#10b981', bg: '#d1fae5', fmt: v => v >= 60 ? `${Math.floor(v / 60)}h ${Math.round(v % 60)}m` : `${Math.round(v)}m` },
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

function Pagination({ page, totalPages, total, perPage, onPageChange }) {
  if (totalPages <= 1) return null
  const start = (page - 1) * perPage + 1
  const end = Math.min(page * perPage, total)
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, flexWrap: 'wrap', gap: 10 }}>
      <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
        Showing <strong>{start}–{end}</strong> of <strong>{total}</strong>
      </span>
      <div className="pagination">
        <button className="page-btn" onClick={() => onPageChange(page - 1)} disabled={page <= 1}>
          <i className="fas fa-chevron-left"></i>
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
          <button key={p} className={`page-btn ${p === page ? 'active' : ''}`} onClick={() => onPageChange(p)}>{p}</button>
        ))}
        <button className="page-btn" onClick={() => onPageChange(page + 1)} disabled={page >= totalPages}>
          <i className="fas fa-chevron-right"></i>
        </button>
      </div>
    </div>
  )
}

export default function Activity({ showAlert }) {
  const [data, setData] = useState(null)
  const [page, setPage] = useState(1)
  const [subjPage, setSubjPage] = useState(1)
  const [detailId, setDetailId] = useState(null)
  const [subjectFilter, setSubjectFilter] = useState('')

  useEffect(() => {
    setData(null)
    api.get(`/my-activity?page=${page}&per_page=${PER_PAGE}`)
      .then(r => setData(r.data))
      .catch(() => showAlert('Failed to load activity', 'error'))
  }, [page])

  function exportCSV() {
    const rows = data.recent_activity
    const header = 'Test,Subject,Exam,Score,Total,Percentage,Time(s),Date'
    const lines = rows.map(a =>
      `"${a.quiz_test.name}","${a.subject.name}","${a.exam.name}",${a.score},${a.total_questions},${a.percentage},${a.time_taken_seconds},${a.completed_at}`
    )
    const csv = [header, ...lines].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'quiz_activity.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  if (!data) return <Loading />

  const { summary, recent_activity, subject_performance, pagination } = data

  const subjectOptions = [...new Set(recent_activity.map(a => a.subject.name))].sort()
  const filteredActivity = subjectFilter ? recent_activity.filter(a => a.subject.name === subjectFilter) : recent_activity

  const subjTotalPages = Math.ceil(subject_performance.length / SUBJ_PER_PAGE)
  const subjPageData = subject_performance.slice((subjPage - 1) * SUBJ_PER_PAGE, subjPage * SUBJ_PER_PAGE)

  return (
    <div>
      {detailId && <TestDetailsModal resultId={detailId} onClose={() => setDetailId(null)} />}

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
      </div>

      {/* Test History */}
      <div className="card">
        <div className="card-header">
          <div className="card-title"><i className="fas fa-clock-rotate-left"></i> Test History</div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <select className="form-input" value={subjectFilter} onChange={e => setSubjectFilter(e.target.value)} style={{ padding: '5px 10px', fontSize: 12, width: 'auto' }}>
              <option value="">All Subjects</option>
              {subjectOptions.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <button className="btn btn-secondary btn-sm" onClick={exportCSV} title="Export CSV">
              <i className="fas fa-download"></i> CSV
            </button>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{summary.total_tests} total</span>
          </div>
        </div>
        {filteredActivity.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)' }}>
            <i className="fas fa-inbox" style={{ fontSize: 36, display: 'block', marginBottom: 12, color: 'var(--text-muted)' }}></i>
            No test history yet. Take your first quiz!
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="table-wrap activity-table-desktop">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Test</th>
                    <th>Subject</th>
                    <th style={{ textAlign: 'center' }}>Score</th>
                    <th style={{ textAlign: 'center' }}>Time</th>
                    <th style={{ textAlign: 'right' }}>Date</th>
                    <th style={{ textAlign: 'center' }}>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredActivity.map(a => (
                    <tr key={a.id}>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{a.quiz_test.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{a.exam.name}</div>
                      </td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{a.subject.name}</td>
                      <td style={{ textAlign: 'center' }}>
                        <span className={`badge ${scoreBadgeClass(a.percentage)}`}>
                          {a.score}/{a.total_questions} · {a.percentage}%
                        </span>
                      </td>
                      <td style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: 13 }}>
                        {Math.floor(a.time_taken_seconds / 60)}:{String(a.time_taken_seconds % 60).padStart(2, '0')}
                      </td>
                      <td style={{ textAlign: 'right', fontSize: 12, color: 'var(--text-muted)' }}>
                        {fmtDate(a.completed_at)}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => setDetailId(a.id)}>
                          <i className="fas fa-eye"></i> View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile card list */}
            <div className="activity-cards-mobile">
              {filteredActivity.map(a => (
                <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.quiz_test.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{a.subject.name} · {fmtDate(a.completed_at)}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, marginLeft: 10 }}>
                    <span className={`badge ${scoreBadgeClass(a.percentage)}`}>{a.percentage}%</span>
                    <button className="btn btn-ghost btn-sm" style={{ padding: '5px 8px' }} onClick={() => setDetailId(a.id)}>
                      <i className="fas fa-eye"></i>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <Pagination
              page={page}
              totalPages={pagination.total_pages}
              total={summary.total_tests}
              perPage={PER_PAGE}
              onPageChange={p => setPage(p)}
            />
          </>
        )}
      </div>

      {/* Performance by Subject */}
      {subject_performance.length > 0 && (() => {
        const best = [...subject_performance].sort((a, b) => b.average_percentage - a.average_percentage)[0]
        const worst = [...subject_performance].sort((a, b) => a.average_percentage - b.average_percentage)[0]
        return (
          <div className="card">
            <div className="card-header">
              <div className="card-title"><i className="fas fa-chart-bar"></i> Performance by Subject</div>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{subject_performance.length} subjects</span>
            </div>

            {subject_performance.length >= 2 && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                {[{ label: '🏆 Best Subject', s: best, color: '#10b981', bg: '#d1fae5' }, { label: '📈 Needs Work', s: worst, color: '#ef4444', bg: '#fee2e2' }].map(({ label, s, color, bg }) => (
                  <div key={label} style={{ borderRadius: 10, padding: '12px 14px', background: bg, borderLeft: `4px solid ${color}` }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>{label}</div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)' }}>{s.subject_name}</div>
                    <div style={{ fontSize: 12, color, fontWeight: 800, marginTop: 2 }}>{s.average_percentage.toFixed(1)}%</div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
              {subjPageData.map((s, i) => {
                const c = subjectColors[((subjPage - 1) * SUBJ_PER_PAGE + i) % subjectColors.length]
                const pct = s.average_percentage
                return (
                  <div key={s.subject_id} style={{ background: `linear-gradient(135deg, ${c.bg} 0%, var(--surface) 100%)`, border: `1px solid ${c.color}33`, borderLeft: `4px solid ${c.color}`, borderRadius: 10, padding: '16px 18px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                      <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)' }}>{s.subject_name}</span>
                      <span style={{ fontWeight: 800, color: c.color, fontSize: 14 }}>{pct.toFixed(1)}%</span>
                    </div>
                    <div className="perf-bar-wrap">
                      <div className="perf-bar" style={{ width: `${Math.min(pct, 100)}%`, background: c.color, transition: 'width 0.4s ease' }}></div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>
                      <span>{s.tests_taken} test{s.tests_taken !== 1 ? 's' : ''}</span>
                      <span>{s.correct_answers}/{s.total_questions} correct</span>
                    </div>
                  </div>
                )
              })}
            </div>
            <Pagination
              page={subjPage}
              totalPages={subjTotalPages}
              total={subject_performance.length}
              perPage={SUBJ_PER_PAGE}
              onPageChange={p => setSubjPage(p)}
            />
          </div>
        )
      })()}
    </div>
  )
}
