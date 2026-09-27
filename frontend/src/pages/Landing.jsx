import { useEffect, useState } from 'react'
import api from '../api'

export default function Landing({ onLogin, onRegister }) {
  const [platformStats, setPlatformStats] = useState(null)
  const [recentActivity, setRecentActivity] = useState([])
  const [tickerIdx, setTickerIdx] = useState(0)

  useEffect(() => {
    api.get('/statistics').then(r => {
      setPlatformStats(r.data.platform_stats)
      setRecentActivity(r.data.recent_activity || [])
    }).catch(() => {})
  }, [])

  useEffect(() => {
    if (!recentActivity.length) return
    const t = setInterval(() => setTickerIdx(i => (i + 1) % recentActivity.length), 3000)
    return () => clearInterval(t)
  }, [recentActivity])

  const features = [
    { icon: 'fa-clipboard-list', color: '#6366f1', bg: '#e0e7ff', title: 'Take Quizzes', desc: 'Timed MCQ assessments across multiple subjects and exam categories.' },
    { icon: 'fa-chart-line', color: '#0ea5e9', bg: '#e0f2fe', title: 'Track Progress', desc: 'Detailed analytics, score history, and subject-wise performance insights.' },
    { icon: 'fa-trophy', color: '#f59e0b', bg: '#fef3c7', title: 'Leaderboard', desc: 'Compete with peers and climb the rankings to showcase your knowledge.' },
  ]

  const stats = platformStats ? [
    { num: platformStats.total_users.toLocaleString(), label: 'Active Users', icon: 'fa-users', color: '#6366f1', bg: '#e0e7ff' },
    { num: (platformStats.total_questions ?? 0).toLocaleString(), label: 'Questions', icon: 'fa-circle-question', color: '#0ea5e9', bg: '#e0f2fe' },
    { num: platformStats.total_subjects.toLocaleString(), label: 'Subjects', icon: 'fa-book', color: '#10b981', bg: '#d1fae5' },
    { num: platformStats.total_tests_taken.toLocaleString(), label: 'Tests Done', icon: 'fa-circle-check', color: '#f59e0b', bg: '#fef3c7' },
  ] : [
    { num: '1,250+', label: 'Active Users', icon: 'fa-users', color: '#6366f1', bg: '#e0e7ff' },
    { num: '25,000+', label: 'Questions', icon: 'fa-circle-question', color: '#0ea5e9', bg: '#e0f2fe' },
    { num: '150+', label: 'Subjects', icon: 'fa-book', color: '#10b981', bg: '#d1fae5' },
    { num: '10k+', label: 'Tests Done', icon: 'fa-circle-check', color: '#f59e0b', bg: '#fef3c7' },
  ]

  const ticker = recentActivity[tickerIdx]

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      <div className="landing-hero">
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.4)', borderRadius: 20, padding: '5px 14px', fontSize: 12, fontWeight: 600, color: '#a5b4fc', marginBottom: 20 }}>
          <i className="fas fa-graduation-cap"></i> Professional Quiz Platform
        </div>
        <h1>Master Any Subject<br /><span style={{ background: 'linear-gradient(135deg,#818cf8,#38bdf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>with Confidence</span></h1>
        <p>Test your knowledge, track your progress, and compete with learners worldwide through our comprehensive quiz platform.</p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap', padding: '0 8px' }}>
          <button className="btn btn-lg" onClick={onLogin} style={{ background: 'white', color: '#4f46e5', fontWeight: 700 }}>
            <i className="fas fa-arrow-right-to-bracket"></i> Sign In
          </button>
          <button className="btn btn-lg" onClick={onRegister} style={{ background: 'rgba(255,255,255,0.12)', color: 'white', border: '1.5px solid rgba(255,255,255,0.3)' }}>
            <i className="fas fa-user-plus"></i> Create Account
          </button>
        </div>
      </div>

      {ticker && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 16px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, overflow: 'hidden' }}>
          <span style={{ background: '#d1fae5', color: '#065f46', borderRadius: 20, padding: '2px 10px', fontWeight: 700, fontSize: 11, flexShrink: 0 }}>LIVE</span>
          <span style={{ color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            <strong style={{ color: 'var(--text)' }}>{ticker.username}</strong> scored{' '}
            <strong style={{ color: ticker.percentage >= 70 ? '#10b981' : ticker.percentage >= 50 ? '#f59e0b' : '#ef4444' }}>{ticker.percentage}%</strong>{' '}
            on <em>{ticker.quiz_name}</em>
          </span>
        </div>
      )}

      <div className="card-grid" style={{ marginBottom: 24 }}>
        {features.map(f => (
          <div key={f.title} className="feature-card">
            <div className="feature-icon" style={{ background: f.bg, color: f.color }}>
              <i className={`fas ${f.icon}`}></i>
            </div>
            <h3>{f.title}</h3>
            <p>{f.desc}</p>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title"><i className="fas fa-chart-bar"></i> Platform at a Glance</div>
        </div>
        <div className="stats-grid">
          {stats.map(s => (
            <div key={s.label} className="stat-card">
              <div className="stat-icon" style={{ background: s.bg, color: s.color }}>
                <i className={`fas ${s.icon}`}></i>
              </div>
              <div className="stat-number" style={{ color: s.color }}>{s.num}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
