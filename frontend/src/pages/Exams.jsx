import { useEffect, useState } from 'react'
import api from '../api'
import Loading from '../components/Loading'

const bannerColors = [
  ['#e0e7ff', '#6366f1'], ['#e0f2fe', '#0ea5e9'], ['#d1fae5', '#10b981'],
  ['#fef3c7', '#f59e0b'], ['#fce7f3', '#ec4899'], ['#ede9fe', '#8b5cf6'],
]

function Breadcrumb({ items }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, marginBottom: 18, flexWrap: 'wrap' }}>
      {items.map((item, i) => (
        <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {i > 0 && <i className="fas fa-chevron-right" style={{ fontSize: 10, color: 'var(--text-muted)' }}></i>}
          {item.onClick ? (
            <button onClick={item.onClick} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', fontWeight: 600, fontSize: 13, fontFamily: 'inherit', padding: 0 }}>
              {item.label}
            </button>
          ) : (
            <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{item.label}</span>
          )}
        </span>
      ))}
    </div>
  )
}

const PAGE_SIZE = 2

function ContinueLearning({ recentSubjects, onResume }) {
  if (!recentSubjects.length) return null
  return (
    <div className="card" style={{ marginBottom: 24, padding: '18px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: '#e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <i className="fas fa-bolt" style={{ color: '#6366f1', fontSize: 13 }}></i>
        </div>
        <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>Continue Learning</span>
        <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 4 }}>Pick up where you left off</span>
      </div>
      <div className="continue-grid">
        {recentSubjects.map((s, i) => {
          const [bg, accent] = bannerColors[i % bannerColors.length]
          const pct = s.average_percentage
          const scoreColor = pct >= 70 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#ef4444'
          return (
            <div key={s.subject_id} style={{ background: bg, border: `1px solid ${accent}30`, borderRadius: 12, padding: '14px 16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)', marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.subject_name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                    {s.tests_taken} test{s.tests_taken !== 1 ? 's' : ''} · Last: {new Date(s.last_attempted).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                  </div>
                </div>
                <button
                  onClick={() => onResume(s.subject_id)}
                  style={{ background: accent, color: '#fff', border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', flexShrink: 0 }}
                >
                  <i className="fas fa-play" style={{ marginRight: 4, fontSize: 10 }}></i>Resume
                </button>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ flex: 1, height: 4, borderRadius: 4, background: `${accent}30` }}>
                  <div style={{ height: '100%', borderRadius: 4, background: scoreColor, width: `${Math.min(pct, 100)}%` }}></div>
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color: scoreColor, flexShrink: 0 }}>{pct.toFixed(0)}%</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function PracticeTestsSection({ subjects, onSelect, subjectPerf, practiceTestsMap }) {
  const available = subjects.filter(s => {
    const pt = practiceTestsMap?.[s.id]
    if (!pt) return true
    const limit = pt.retake_limit ?? 1
    const used = pt.user_attempts ?? 0
    return used < limit
  })
  if (!available.length) return null
  return (
    <div className="card" style={{ marginBottom: 24, padding: '18px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <i className="fas fa-dumbbell" style={{ color: '#8b5cf6', fontSize: 13 }}></i>
        </div>
        <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>Practice Tests</span>
        <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 4 }}>Self-paced practice — attempt anytime</span>
      </div>
      <div className="continue-grid">
        {available.map((s, i) => {
          const colors = [['#ede9fe', '#8b5cf6'], ['#fce7f3', '#ec4899'], ['#e0e7ff', '#6366f1'], ['#d1fae5', '#10b981']]
          const [bg, accent] = colors[i % colors.length]
          const perf = subjectPerf?.find(p => p.subject_id === s.id)
          const pct = perf?.average_percentage
          const scoreColor = pct >= 70 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#ef4444'
          return (
            <div key={s.id} style={{ background: bg, border: `1px solid ${accent}30`, borderRadius: 12, padding: '14px 16px' }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)', marginBottom: 6 }}>{s.name}</div>
              {pct != null ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                  <div style={{ flex: 1, height: 4, borderRadius: 4, background: `${accent}30` }}>
                    <div style={{ height: '100%', borderRadius: 4, background: scoreColor, width: `${Math.min(pct, 100)}%` }}></div>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: scoreColor, flexShrink: 0 }}>{pct.toFixed(0)}%</span>
                </div>
              ) : (
                <div style={{ height: 4, borderRadius: 4, background: `${accent}30`, marginBottom: 10 }} />
              )}
              <button
                onClick={() => onSelect(s.id)}
                style={{ width: '100%', background: accent, color: '#fff', border: 'none', borderRadius: 8, padding: '7px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
              >
                <i className="fas fa-play" style={{ marginRight: 4, fontSize: 10 }}></i>{perf ? 'Continue' : 'Start'}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function ItemCard({ item, onClick, icon, countKey, countLabel, extraInfo, colorIdx, subjectPerf }) {
  const [bg, accent] = bannerColors[colorIdx % bannerColors.length]
  const perf = subjectPerf?.find(s => s.subject_id === item.id)
  const scoreColor = perf ? (perf.average_percentage >= 70 ? '#10b981' : perf.average_percentage >= 50 ? '#f59e0b' : '#ef4444') : null
  return (
    <div className="item-card" onClick={() => onClick(item.id)}>
      <div className="item-card-banner" style={{ background: bg, position: 'relative' }}>
        <i className={`fas ${icon}`} style={{ color: accent, fontSize: 38 }}></i>
        {perf && (
          <div style={{ position: 'absolute', top: 8, right: 8, background: scoreColor, color: '#fff', borderRadius: 20, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>
            {perf.average_percentage.toFixed(0)}%
          </div>
        )}
      </div>
      <div className="item-card-body">
        <h3>{item.name}</h3>
        <p>{item.description || 'Comprehensive test series'}</p>
        <div className="item-card-meta">
          <span><i className={`fas ${countKey === 'subject_count' ? 'fa-layer-group' : 'fa-clipboard-list'}`} style={{ marginRight: 5 }}></i>{item[countKey]} {countLabel}</span>
          {extraInfo && <span>{extraInfo(item)}</span>}
        </div>
        {perf && (
          <div style={{ marginTop: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>
              <span>{perf.tests_taken} test{perf.tests_taken !== 1 ? 's' : ''} done</span>
              <span style={{ color: scoreColor, fontWeight: 600 }}>{perf.average_percentage.toFixed(0)}% avg</span>
            </div>
            <div style={{ height: 3, borderRadius: 3, background: 'var(--border)' }}>
              <div style={{ height: '100%', borderRadius: 3, background: scoreColor, width: `${Math.min(perf.average_percentage, 100)}%` }}></div>
            </div>
          </div>
        )}
      </div>
      <div className="item-card-footer">
        <span>{perf ? 'Continue' : 'View'} {countLabel === 'Subjects' ? 'Subjects' : 'Tests'}</span>
        <i className="fas fa-arrow-right"></i>
      </div>
    </div>
  )
}

export default function Exams({ showAlert, onStartQuiz }) {
  const [view, setView] = useState('exams')
  const [exams, setExams] = useState([])
  const [subjects, setSubjects] = useState([])
  const [tests, setTests] = useState([])
  const [loading, setLoading] = useState(true)
  const [subjectId, setSubjectId] = useState(null)
  const [selectedExam, setSelectedExam] = useState(null)
  const [selectedSubject, setSelectedSubject] = useState(null)
  const [search, setSearch] = useState('')
  const [subjectPerf, setSubjectPerf] = useState([])
  const [recentSubjects, setRecentSubjects] = useState([])
  const [practiceTestsMap, setPracticeTestsMap] = useState({})
  const [subjectTypeMap, setSubjectTypeMap] = useState({})

  useEffect(() => {
    Promise.all([
      api.get('/exams'),
      api.get('/my-activity?page=1&per_page=50')
    ]).then(([examsRes, actRes]) => {
      setExams(examsRes.data)
      const perf = actRes.data.subject_performance || []
      setSubjectPerf(perf)
      // build subject_type map from recent_activity
      const typeMap = {}
      for (const a of (actRes.data.recent_activity || [])) {
        if (a.subject?.id) typeMap[a.subject.id] = a.subject.subject_type || 'subject'
      }
      setSubjectTypeMap(typeMap)
      // build last_attempted per subject from recent_activity (already sorted newest first)
      const lastAttemptedMap = {}
      for (const a of (actRes.data.recent_activity || [])) {
        if (!lastAttemptedMap[a.subject.id]) {
          lastAttemptedMap[a.subject.id] = a.completed_at
        }
      }
      // merge last_attempted into perf, sort by date desc, take top 3
      // exclude practice/live subjects — they are shown in their own section
      const withDate = perf
        .filter(s => lastAttemptedMap[s.subject_id])
        .filter(s => !typeMap[s.subject_id] || typeMap[s.subject_id] === 'subject')
        .map(s => ({ ...s, last_attempted: lastAttemptedMap[s.subject_id] }))
        .sort((a, b) => new Date(b.last_attempted) - new Date(a.last_attempted))
        .slice(0, 3)
      setRecentSubjects(withDate)
      setLoading(false)
    }).catch(() => {
      showAlert('Failed to load exams', 'error')
      setLoading(false)
    })
  }, [])

  async function loadSubjects(examId) {
    setLoading(true); setSearch('')
    try {
      const exam = exams.find(e => e.id === examId)
      const r = await api.get(`/exams/${examId}/subjects`)
      setSubjects(r.data)
      setSelectedExam(exam)
      // fetch practice test details (retake_limit + user_attempts) for each practice subject
      const practiceMap = {}
      await Promise.all(
        r.data.filter(s => s.subject_type === 'practice').map(s =>
          api.get(`/subjects/${s.id}/quiz-tests`).then(qt => {
            if (qt.data[0]) practiceMap[s.id] = qt.data[0]
          }).catch(() => {})
        )
      )
      setPracticeTestsMap(practiceMap)
      setView('subjects')
    } catch { showAlert('Failed to load subjects', 'error') }
    setLoading(false)
  }

  async function loadTests(id) {
    setLoading(true); setSubjectId(id); setSearch('')
    try {
      const subject = subjects.find(s => s.id === id) || (await api.get(`/subjects/${id}`)).data
      if (subject.subject_type === 'practice') {
        const ptRes = await api.get(`/subjects/${id}/practice-test`)
        setLoading(false)
        onStartQuiz(ptRes.data.id, id, [ptRes.data])
        return
      }
      const r = await api.get(`/subjects/${id}/quiz-tests`)
      setTests(r.data)
      setSelectedSubject(subject)
      setView('tests')
    } catch { showAlert('Failed to load tests', 'error') }
    setLoading(false)
  }

  async function resumeSubject(subjectId) {
    setLoading(true); setSearch('')
    try {
      const subRes = await api.get(`/subjects/${subjectId}`)
      const sub = subRes.data
      if (sub.subject_type === 'practice') {
        const ptRes = await api.get(`/subjects/${subjectId}/practice-test`)
        setLoading(false)
        onStartQuiz(ptRes.data.id, subjectId, [ptRes.data])
        return
      }
      const examRes = await api.get(`/exams/${sub.exam_id}/subjects`)
      setSubjects(examRes.data)
      setSelectedExam(exams.find(e => e.id === sub.exam_id) || { name: 'Exam' })
      const testsRes = await api.get(`/subjects/${subjectId}/quiz-tests`)
      setTests(testsRes.data)
      setSubjectId(subjectId)
      setSelectedSubject(sub)
      setView('tests')
    } catch { showAlert('Failed to load subject', 'error') }
    setLoading(false)
  }

  if (loading) return <Loading />

  const searchBar = (placeholder, maxWidth = 320) => (
    <div style={{ position: 'relative', flex: 1, maxWidth }}>
      <i className="fas fa-search" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: 13 }}></i>
      <input className="form-input" placeholder={placeholder} value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 32 }} />
    </div>
  )

  if (view === 'exams') {
    const filtered = exams.filter(e => e.name.toLowerCase().includes(search.toLowerCase()))
    return (
      <div>
        <ContinueLearning recentSubjects={recentSubjects} onResume={resumeSubject} />
        <div style={{ marginBottom: 20, display: 'flex', gap: 10, alignItems: 'center' }}>
          {searchBar('Search exams...')}
          <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{filtered.length} exam{filtered.length !== 1 ? 's' : ''}</div>
        </div>
        <div className="card-grid">
          {filtered.map((item, i) => (
            <ItemCard key={item.id} item={item} onClick={loadSubjects} icon="fa-book" countKey="subject_count" countLabel="Subjects"
              extraInfo={it => <span><i className="fas fa-circle-question" style={{ marginRight: 4 }}></i>{it.total_questions} Qs</span>}
              colorIdx={i} />
          ))}
        </div>
      </div>
    )
  }

  if (view === 'subjects') {
    const filtered = subjects.filter(s => s.name.toLowerCase().includes(search.toLowerCase()))
    const practiceSubjects = filtered.filter(s => s.subject_type === 'practice')
    const liveSubjects = filtered.filter(s => s.subject_type === 'live')
    const regularSubjects = filtered.filter(s => !s.subject_type || s.subject_type === 'subject')
    return (
      <div>
        <Breadcrumb items={[
          { label: 'Exams', onClick: () => { setView('exams'); setSearch('') } },
          { label: selectedExam?.name || 'Subjects' }
        ]} />
        <div style={{ display: 'flex', gap: 10, marginBottom: 20, alignItems: 'center', flexWrap: 'wrap' }}>
          {searchBar('Search subjects...', 280)}
          <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{filtered.length} subject{filtered.length !== 1 ? 's' : ''}</div>
        </div>
        <PracticeTestsSection subjects={practiceSubjects} onSelect={loadTests} subjectPerf={subjectPerf} practiceTestsMap={practiceTestsMap} />
        {liveSubjects.length > 0 && (
          <div className="card" style={{ marginBottom: 24, padding: '18px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className="fas fa-circle-dot" style={{ color: '#ef4444', fontSize: 13 }}></i>
              </div>
              <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>Live Tests</span>
              <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 4 }}>Scheduled exams — join at the set time</span>
            </div>
            <div className="continue-grid">
              {liveSubjects.map((s, i) => {
                const colors = [['#fee2e2', '#ef4444'], ['#fef3c7', '#f59e0b']]
                const [bg, accent] = colors[i % colors.length]
                return (
                  <div key={s.id} style={{ background: bg, border: `1px solid ${accent}30`, borderRadius: 12, padding: '14px 16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                          <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</span>
                          <span style={{ fontSize: 10, background: '#ef444422', color: '#ef4444', borderRadius: 4, padding: '1px 6px', fontWeight: 700, flexShrink: 0 }}>
                            <i className="fas fa-circle-dot" style={{ marginRight: 3, fontSize: 8 }}></i>LIVE
                          </span>
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{s.quiz_test_count} test{s.quiz_test_count !== 1 ? 's' : ''} · Scheduling coming soon</div>
                      </div>
                      <button
                        onClick={() => loadTests(s.id)}
                        style={{ background: accent, color: '#fff', border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', flexShrink: 0 }}
                      >
                        <i className="fas fa-eye" style={{ marginRight: 4, fontSize: 10 }}></i>View
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
        {regularSubjects.length > 0 && (
          <div className="card-grid">
            {regularSubjects.map((item, i) => (
              <ItemCard key={item.id} item={item} onClick={loadTests} icon="fa-book-open" countKey="quiz_test_count" countLabel="Tests"
                extraInfo={it => <span><i className="fas fa-clock" style={{ marginRight: 4 }}></i>{it.total_time_minutes || 'N/A'} min</span>}
                colorIdx={i + 2} subjectPerf={subjectPerf} />
            ))}
          </div>
        )}
        {filtered.length === 0 && (
          <div className="card" style={{ textAlign: 'center', padding: 48 }}>
            <i className="fas fa-inbox" style={{ fontSize: 40, color: 'var(--text-muted)', marginBottom: 12, display: 'block' }}></i>
            <p style={{ color: 'var(--text-secondary)' }}>No subjects found.</p>
          </div>
        )}
      </div>
    )
  }

  const filteredTests = tests.filter(t => t.name.toLowerCase().includes(search.toLowerCase()))
  const subPerf = subjectPerf.find(s => s.subject_id === subjectId)

  return (
    <div>
      <Breadcrumb items={[
        { label: 'Exams', onClick: () => { setView('exams'); setSearch('') } },
        { label: selectedExam?.name || 'Exam', onClick: () => { setView('subjects'); setSearch('') } },
        { label: selectedSubject?.name || 'Tests' }
      ]} />

      {subPerf && (
        <div className="card" style={{ marginBottom: 20, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', borderLeft: '4px solid var(--primary)' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 2 }}>Your Progress — {selectedSubject?.name}</div>
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', fontSize: 13 }}>
              <span><strong style={{ color: 'var(--primary)' }}>{subPerf.tests_taken}</strong> <span style={{ color: 'var(--text-secondary)' }}>tests done</span></span>
              <span><strong style={{ color: subPerf.average_percentage >= 70 ? '#10b981' : subPerf.average_percentage >= 50 ? '#f59e0b' : '#ef4444' }}>{subPerf.average_percentage.toFixed(1)}%</strong> <span style={{ color: 'var(--text-secondary)' }}>avg score</span></span>
              <span><strong style={{ color: 'var(--text)' }}>{subPerf.correct_answers}/{subPerf.total_questions}</strong> <span style={{ color: 'var(--text-secondary)' }}>correct</span></span>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, marginBottom: 20, alignItems: 'center', flexWrap: 'wrap' }}>
        {searchBar('Search tests...', 280)}
        <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{filteredTests.length} test{filteredTests.length !== 1 ? 's' : ''}</div>
      </div>

      {filteredTests.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 48 }}>
          <i className="fas fa-inbox" style={{ fontSize: 40, color: 'var(--text-muted)', marginBottom: 12, display: 'block' }}></i>
          <p style={{ color: 'var(--text-secondary)' }}>No quiz tests available for this subject.</p>
        </div>
      ) : (
        <div className="card-grid">
          {filteredTests.map((t, i) => {
            const [bg, accent] = bannerColors[(i + 1) % bannerColors.length]
            const attemptsLeft = t.retake_limit != null ? t.retake_limit - (t.user_attempts || 0) : null
            const canStart = attemptsLeft === null || attemptsLeft > 0
            return (
              <div key={t.id} className="item-card" style={{ cursor: 'default' }}>
                <div className="item-card-banner" style={{ background: bg, position: 'relative' }}>
                  <i className="fas fa-laptop-code" style={{ color: accent, fontSize: 38 }}></i>
                  {t.user_best_percentage != null && (
                    <div style={{ position: 'absolute', top: 8, right: 8, background: t.user_best_percentage >= 70 ? '#10b981' : t.user_best_percentage >= 50 ? '#f59e0b' : '#ef4444', color: '#fff', borderRadius: 20, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>
                      Best {t.user_best_percentage}%
                    </div>
                  )}
                </div>
                <div className="item-card-body">
                  <h3>{t.name}</h3>
                  <p>{t.description || 'Test your knowledge with this quiz'}</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
                    {[['fa-circle-question', t.question_count, 'Questions'], ['fa-clock', `${t.time_limit_minutes} min`, 'Duration']].map(([ic, val, lbl]) => (
                      <div key={lbl} style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 10px', textAlign: 'center' }}>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.4px', fontWeight: 600 }}>{lbl}</div>
                        <div style={{ fontWeight: 700, color: 'var(--text)', fontSize: 14 }}>{val}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, fontSize: 12, flexWrap: 'wrap', gap: 4 }}>
                    {t.user_attempts > 0 ? (
                      <span style={{ color: 'var(--text-secondary)' }}>
                        <i className="fas fa-rotate-right" style={{ marginRight: 4 }}></i>{t.user_attempts} attempt{t.user_attempts !== 1 ? 's' : ''}
                      </span>
                    ) : <span style={{ color: 'var(--text-muted)' }}>Not attempted</span>}
                    {attemptsLeft !== null && (
                      <span style={{ color: attemptsLeft > 0 ? 'var(--text-secondary)' : '#ef4444', fontWeight: 600 }}>
                        {attemptsLeft > 0 ? `${attemptsLeft} left` : 'Limit reached'}
                      </span>
                    )}
                  </div>
                  <button className="btn btn-primary btn-block" onClick={() => canStart && onStartQuiz(t.id, subjectId, filteredTests)} disabled={!canStart} style={{ opacity: canStart ? 1 : 0.5, cursor: canStart ? 'pointer' : 'not-allowed' }}>
                    <i className={`fas ${t.user_attempts > 0 ? 'fa-rotate-right' : 'fa-play'}`}></i> {canStart ? (t.user_attempts > 0 ? 'Retake' : 'Start Quiz') : 'Limit Reached'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
