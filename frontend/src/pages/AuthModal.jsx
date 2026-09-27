import { useState } from 'react'
import api from '../api'

export default function AuthModal({ defaultTab = 'login', onSuccess, onClose, showAlert }) {
  const [tab, setTab] = useState(defaultTab)
  const [loginData, setLoginData] = useState({ username: '', password: '' })
  const [regData, setRegData] = useState({ username: '', email: '', password: '' })
  const [loginMsg, setLoginMsg] = useState(null)
  const [loading, setLoading] = useState(false)

  async function handleLogin(e) {
    e.preventDefault()
    setLoginMsg(null)
    setLoading(true)
    try {
      const res = await api.post('/login', loginData)
      onSuccess(res.data.user)
      onClose()
    } catch (err) {
      const data = err.response?.data
      if (data?.message) setLoginMsg(data)
      else showAlert(data?.error || 'Login failed', 'error')
    }
    setLoading(false)
  }

  async function handleRegister(e) {
    e.preventDefault()
    setLoading(true)
    try {
      await api.post('/register', regData)
      showAlert('Registration successful! Please login.', 'success')
      setTab('login')
      setRegData({ username: '', email: '', password: '' })
    } catch (err) {
      showAlert(err.response?.data?.error || 'Registration failed', 'error')
    }
    setLoading(false)
  }

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <div className="modal-header">
          <div>
            <div className="modal-title">{tab === 'login' ? 'Welcome back' : 'Create account'}</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
              {tab === 'login' ? 'Sign in to your Quiz Portal account' : 'Join thousands of learners today'}
            </div>
          </div>
          <button className="modal-close" onClick={onClose}><i className="fas fa-xmark"></i></button>
        </div>

        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', background: 'var(--surface2)' }}>
          {['login', 'register'].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              flex: 1, padding: '12px 0', border: 'none', background: 'none', cursor: 'pointer',
              borderBottom: `2px solid ${tab === t ? 'var(--primary)' : 'transparent'}`,
              color: tab === t ? 'var(--primary)' : 'var(--text-secondary)',
              fontWeight: 600, fontSize: 13, fontFamily: 'inherit',
              transition: 'all 0.15s ease',
            }}>
              <i className={`fas ${t === 'login' ? 'fa-arrow-right-to-bracket' : 'fa-user-plus'}`} style={{ marginRight: 6 }}></i>
              {t === 'login' ? 'Sign In' : 'Register'}
            </button>
          ))}
        </div>

        <div className="modal-body">
          {tab === 'login' ? (
            <form onSubmit={handleLogin}>
              <div className="form-group">
                <label className="form-label">Username</label>
                <input className="form-input" type="text" required placeholder="Enter your username"
                  style={{ fontSize: 16 }}
                  value={loginData.username} onChange={e => setLoginData({ ...loginData, username: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Password</label>
                <input className="form-input" type="password" required placeholder="Enter your password"
                  style={{ fontSize: 16 }}
                  value={loginData.password} onChange={e => setLoginData({ ...loginData, password: e.target.value })} />
              </div>
              {loginMsg && (
                <div className="alert-warning" style={{ borderRadius: 'var(--radius-sm)', padding: '10px 14px', marginBottom: 16, fontSize: 13 }}
                  dangerouslySetInnerHTML={{ __html: `${loginMsg.error}. ${loginMsg.message}` }} />
              )}
              <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}>
                {loading ? <><i className="fas fa-spinner fa-spin"></i> Signing in...</> : <><i className="fas fa-arrow-right-to-bracket"></i> Sign In</>}
              </button>
              <p style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: 'var(--text-secondary)' }}>
                No account?{' '}
                <button type="button" onClick={() => setTab('register')} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontWeight: 600, fontSize: 13, fontFamily: 'inherit' }}>
                  Create one
                </button>
              </p>
            </form>
          ) : (
            <form onSubmit={handleRegister}>
              <div className="form-group">
                <label className="form-label">Username</label>
                <input className="form-input" type="text" required placeholder="Choose a username"
                  style={{ fontSize: 16 }}
                  value={regData.username} onChange={e => setRegData({ ...regData, username: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input className="form-input" type="email" required placeholder="your@email.com"
                  style={{ fontSize: 16 }}
                  value={regData.email} onChange={e => setRegData({ ...regData, email: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Password</label>
                <input className="form-input" type="password" required placeholder="Create a secure password"
                  style={{ fontSize: 16 }}
                  value={regData.password} onChange={e => setRegData({ ...regData, password: e.target.value })} />
              </div>
              <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}>
                {loading ? <><i className="fas fa-spinner fa-spin"></i> Creating...</> : <><i className="fas fa-user-plus"></i> Create Account</>}
              </button>
              <p style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: 'var(--text-secondary)' }}>
                Already have an account?{' '}
                <button type="button" onClick={() => setTab('login')} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontWeight: 600, fontSize: 13, fontFamily: 'inherit' }}>
                  Sign in
                </button>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
