import { useState, useEffect, useCallback, useRef } from 'react'
import api from './api'
import Alert from './components/Alert'
import Landing from './pages/Landing'
import AuthModal from './pages/AuthModal'
import Dashboard from './pages/Dashboard'
import Exams from './pages/Exams'
import Quiz from './pages/Quiz'
import Activity from './pages/Activity'
import Leaderboard from './pages/Leaderboard'
import UserSettings from './pages/UserSettings'
import QuestionManagement from './pages/QuestionManagement'

const sectionTitles = {
  dashboard: 'Dashboard',
  exams: 'Exams',
  activity: 'My Activity',
  leaderboard: 'Leaderboard',
  userSettings: 'User Management',
  questionMgmt: 'Question Mgmt',
  quiz: 'Quiz',
}

export default function App() {
  const [user, setUser] = useState(null)
  const [authChecked, setAuthChecked] = useState(false)
  const [section, setSection] = useState('dashboard')
  const [authModal, setAuthModal] = useState(null)
  const [alert, setAlert] = useState(null)
  const [quizState, setQuizState] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const userMenuRef = useRef(null)

  // Close user menu on outside click
  useEffect(() => {
    function handleClick(e) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('touchstart', handleClick)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('touchstart', handleClick)
    }
  }, [])

  useEffect(() => {
    api.get('/check-auth', { timeout: 40000 }).then(r => {
      if (r.data.authenticated) setUser(r.data.user)
      setAuthChecked(true)
    }).catch(() => setAuthChecked(true))
  }, [])

  const showAlert = useCallback((message, type) => {
    setAlert({ message, type, id: Date.now() })
  }, [])

  async function logout() {
    try {
      await api.post('/logout')
    } catch {}
    setUser(null)
    setSection('dashboard')
    setSidebarOpen(false)
    setUserMenuOpen(false)
    showAlert('Logged out successfully!', 'success')
  }

  function handleStartQuiz(quizTestId, subjectId, subjectTests = []) {
    setQuizState({ quizTestId, subjectId, subjectTests })
    setSection('quiz')
  }

  function handleQuizFinish(dest) {
    setQuizState(null)
    setSection(dest || 'dashboard')
  }

  function navigate(key) {
    setSection(key)
    setSidebarOpen(false)
  }

  if (!authChecked) return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
      <div className="spinner"></div>
      <p style={{ fontSize: 14, color: 'var(--text-secondary)', fontWeight: 500 }}>Connecting to server…</p>
      <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Backend may be waking up, please wait a moment.</p>
    </div>
  )

  const navItems = [
    { key: 'dashboard', icon: 'fa-house', label: 'Dashboard' },
    { key: 'exams', icon: 'fa-book', label: 'Exams' },
    { key: 'activity', icon: 'fa-chart-line', label: 'Activity' },
    { key: 'leaderboard', icon: 'fa-trophy', label: 'Leaderboard' },
  ]

  const adminItems = user?.user_type === 'admin' ? [
    { key: 'userSettings', icon: 'fa-users-gear', label: 'Users' },
    { key: 'questionMgmt', icon: 'fa-book-open', label: 'Questions' },
  ] : []

  const initials = user?.username?.slice(0, 2).toUpperCase() || '?'

  // Bottom nav shows main 4 items (or 4+more for admin)
  const bottomNavItems = [...navItems.slice(0, 4)]

  return (
    <div className="app-shell">
      {alert && <Alert key={alert.id} message={alert.message} type={alert.type} onClose={() => setAlert(null)} />}

      {authModal && (
        <AuthModal
          defaultTab={authModal}
          onSuccess={u => { setUser(u); showAlert('Welcome back!', 'success') }}
          onClose={() => setAuthModal(null)}
          showAlert={showAlert}
        />
      )}

      {user && (
        <>
          {/* Sidebar overlay for mobile */}
          <div
            className={`sidebar-overlay ${sidebarOpen ? 'visible' : ''}`}
            onClick={() => setSidebarOpen(false)}
          />

          <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
            <div className="sidebar-logo">
              <div className="logo-text">
                <div className="logo-icon"><i className="fas fa-graduation-cap"></i></div>
                Quiz Portal
              </div>
            </div>

            <nav className="sidebar-nav">
              <div className="nav-section-label">Main</div>
              {navItems.map(n => (
                <button key={n.key} className={`nav-item ${section === n.key ? 'active' : ''}`}
                  onClick={() => navigate(n.key)}>
                  <i className={`fas ${n.icon}`}></i> {n.label}
                </button>
              ))}

              {adminItems.length > 0 && (
                <>
                  <div className="nav-section-label" style={{ marginTop: 12 }}>Admin</div>
                  {adminItems.map(n => (
                    <button key={n.key} className={`nav-item ${section === n.key ? 'active' : ''}`}
                      onClick={() => navigate(n.key)}>
                      <i className={`fas ${n.icon}`}></i> {n.label}
                    </button>
                  ))}
                </>
              )}
            </nav>


          </aside>

          {/* Mobile bottom nav */}
          {section !== 'quiz' && (
            <nav className="mobile-nav">
              <div className="mobile-nav-inner">
                {bottomNavItems.map(n => (
                  <button key={n.key} className={`mobile-nav-btn ${section === n.key ? 'active' : ''}`}
                    onClick={() => navigate(n.key)}>
                    <i className={`fas ${n.icon}`}></i>
                    <span>{n.label}</span>
                  </button>
                ))}
                {adminItems.length > 0 && (
                  <button className={`mobile-nav-btn ${['userSettings','questionMgmt'].includes(section) ? 'active' : ''}`}
                    onClick={() => setSidebarOpen(true)}>
                    <i className="fas fa-shield-halved"></i>
                    <span>Admin</span>
                  </button>
                )}
              </div>
            </nav>
          )}
        </>
      )}

      <div className="main-content">
        {user ? (
          <>
            <header className="topbar">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <button className="mobile-topbar-menu" onClick={() => setSidebarOpen(s => !s)}>
                  <i className="fas fa-bars"></i>
                </button>
                <div className="topbar-title">
                  {section === 'quiz'
                    ? <span>
                        <i className="fas fa-circle-play" style={{ color: 'var(--primary)', marginRight: 8 }}></i>
                        {quizState?.phase === 'result' ? 'Results' : 'Quiz in Progress'}
                        {quizState?.testName && (
                          <span style={{ fontWeight: 400, color: 'var(--text-secondary)', marginLeft: 8, fontSize: 13 }}>— {quizState.testName}</span>
                        )}
                      </span>
                    : sectionTitles[section] || 'Quiz Portal'
                  }
                </div>
              </div>
              <div className="topbar-actions">
                <div ref={userMenuRef} style={{ position: 'relative' }}>
                  <button
                    onClick={() => setUserMenuOpen(o => !o)}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: '1px solid var(--border)', borderRadius: 50, padding: '4px 10px 4px 4px', cursor: 'pointer', fontFamily: 'inherit' }}
                  >
                    <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 11, flexShrink: 0 }}>
                      {initials}
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', maxWidth: 90, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} className="topbar-username">
                      {user.username}
                    </span>
                    <i className="fas fa-chevron-down" style={{ fontSize: 10, color: 'var(--text-muted)' }}></i>
                  </button>

                  {userMenuOpen && (
                    <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-lg)', minWidth: 180, zIndex: 9999, overflow: 'hidden' }}>
                      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', background: 'var(--surface2)' }}>
                        <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)' }}>{user.username}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{user.user_type === 'admin' ? '⚡ Admin' : 'Member'}</div>
                      </div>
                      <button
                        onClick={logout}
                        style={{ width: '100%', padding: '12px 16px', border: 'none', background: 'none', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 600, color: '#ef4444', textAlign: 'left' }}
                      >
                        <i className="fas fa-arrow-right-from-bracket"></i>
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </header>

            <main className="page-content">
              {section === 'dashboard' && <Dashboard showAlert={showAlert} />}
              {section === 'exams' && <Exams showAlert={showAlert} onStartQuiz={handleStartQuiz} />}
              {section === 'quiz' && quizState && (
                <Quiz
                  quizTestId={quizState.quizTestId}
                  subjectId={quizState.subjectId}
                  subjectTests={quizState.subjectTests}
                  showAlert={showAlert}
                  onFinish={handleQuizFinish}
                  onPhaseChange={({ phase, testName }) => setQuizState(s => ({ ...s, phase, testName }))}
                  onBack={() => setSection('exams')}
                />
              )}
              {section === 'activity' && <Activity showAlert={showAlert} />}
              {section === 'leaderboard' && <Leaderboard showAlert={showAlert} />}
              {section === 'userSettings' && user?.user_type === 'admin' && <UserSettings showAlert={showAlert} />}
              {section === 'questionMgmt' && user?.user_type === 'admin' && <QuestionManagement showAlert={showAlert} />}
            </main>
          </>
        ) : (
          <main className="page-content" style={{ marginLeft: 0 }}>
            <Landing onLogin={() => setAuthModal('login')} onRegister={() => setAuthModal('register')} />
          </main>
        )}
      </div>
    </div>
  )
}
