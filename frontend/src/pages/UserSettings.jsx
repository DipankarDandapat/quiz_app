import { useEffect, useState, useRef } from 'react'
import api from '../api'
import Loading from '../components/Loading'

const fmtDate = d => new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })

export default function UserSettings({ showAlert }) {
  const [data, setData] = useState(null)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const searchRef = useRef('')

  async function load(p = page, s = searchRef.current) {
    setData(null)
    try {
      const r = await api.get(`/admin/users?page=${p}&per_page=10&search=${encodeURIComponent(s)}`)
      setData(r.data); setPage(p)
    } catch (err) {
      showAlert(err.response?.data?.error || 'Failed to load users', 'error')
    }
  }

  useEffect(() => { load(1) }, [])

  function handleSearch(val) {
    setSearch(val); searchRef.current = val
    load(1, val)
  }

  async function updateUser(userId, field, value) {
    try {
      await api.put(`/admin/users/${userId}`, { [field]: value })
      showAlert('User updated', 'success')
      load(page, searchRef.current)
    } catch (err) {
      showAlert(err.response?.data?.error || 'Update failed', 'error')
    }
  }

  if (!data) return <Loading />

  const { users, total, per_page, total_pages } = data
  const start = (page - 1) * per_page + 1
  const end = Math.min(page * per_page, total)

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div className="card-title"><i className="fas fa-users-gear"></i> User Management</div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <i className="fas fa-search" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: 12 }}></i>
            <input className="form-input" placeholder="Search users..." value={search} onChange={e => handleSearch(e.target.value)} style={{ paddingLeft: 30, width: 200, fontSize: 13 }} />
          </div>
          <span className="badge badge-secondary">{total} users</span>
        </div>
      </div>

      <div className="table-wrap usersettings-table-desktop" style={{ border: 'none', borderRadius: 0 }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>User</th>
              <th>Email</th>
              <th style={{ textAlign: 'center' }}>Tests</th>
              <th style={{ textAlign: 'center' }}>Global Extra</th>
              <th style={{ textAlign: 'center' }}>Role</th>
              <th style={{ textAlign: 'center' }}>Status</th>
              <th style={{ textAlign: 'right' }}>Joined</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => {
              const isActive = u.is_active === true || u.is_active === 1
              const initials = u.username.slice(0, 2).toUpperCase()
              return (
                <tr key={u.id}>
                  <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{u.id}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 11, flexShrink: 0 }}>
                        {initials}
                      </div>
                      <span style={{ fontWeight: 600, fontSize: 13 }}>{u.username}</span>
                    </div>
                  </td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{u.email}</td>
                  <td style={{ textAlign: 'center', fontWeight: 600, color: 'var(--text-secondary)', fontSize: 13 }}>{u.tests_taken ?? 0}</td>
                  <td style={{ textAlign: 'center' }}>
                    <input
                      type="number" min={0} max={999}
                      defaultValue={u.global_extra_attempts || 0}
                      id={`gea-${u.id}`}
                      style={{ width: 60, textAlign: 'center', padding: '4px 6px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: 13 }}
                    />
                    <button
                      className="btn btn-primary btn-sm"
                      style={{ marginLeft: 6, padding: '4px 8px' }}
                      onClick={() => {
                        const val = parseInt(document.getElementById(`gea-${u.id}`).value) || 0
                        updateUser(u.id, 'global_extra_attempts', val)
                      }}
                    >
                      <i className="fas fa-floppy-disk"></i>
                    </button>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <select value={u.user_type} onChange={e => updateUser(u.id, 'user_type', e.target.value)}
                      className="form-input" style={{ width: 'auto', padding: '5px 10px', fontSize: 12 }}>
                      <option value="member">Member</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button onClick={() => updateUser(u.id, 'is_active', !isActive)}
                      className={`badge ${isActive ? 'badge-success' : 'badge-danger'}`}
                      style={{ cursor: 'pointer', border: 'none', fontFamily: 'inherit' }}>
                      <i className={`fas ${isActive ? 'fa-circle-check' : 'fa-circle-xmark'}`}></i>
                      {isActive ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td style={{ textAlign: 'right', fontSize: 12, color: 'var(--text-muted)' }}>
                    {u.created_at ? fmtDate(u.created_at) : '—'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile card list */}
      <div className="usersettings-cards-mobile" style={{ padding: '0 16px' }}>
        {users.map(u => {
          const isActive = u.is_active === true || u.is_active === 1
          const initials = u.username.slice(0, 2).toUpperCase()
          return (
            <div key={u.id} style={{ padding: '14px 0', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
                  {initials}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{u.username}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</div>
                </div>
                <button onClick={() => updateUser(u.id, 'is_active', !isActive)}
                  className={`badge ${isActive ? 'badge-success' : 'badge-danger'}`}
                  style={{ cursor: 'pointer', border: 'none', fontFamily: 'inherit', flexShrink: 0 }}>
                  {isActive ? 'Active' : 'Inactive'}
                </button>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <select value={u.user_type} onChange={e => updateUser(u.id, 'user_type', e.target.value)}
                  className="form-input" style={{ flex: 1, padding: '7px 10px', fontSize: 13 }}>
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0 }}>
                  {u.created_at ? fmtDate(u.created_at) : '—'}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)', flexShrink: 0 }}>Global Extra:</span>
                <input
                  type="number" min={0} max={999}
                  defaultValue={u.global_extra_attempts || 0}
                  id={`gea-mob-${u.id}`}
                  style={{ width: 60, textAlign: 'center', padding: '4px 6px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: 13 }}
                />
                <button className="btn btn-primary btn-sm" style={{ padding: '4px 10px' }}
                  onClick={() => {
                    const val = parseInt(document.getElementById(`gea-mob-${u.id}`).value) || 0
                    updateUser(u.id, 'global_extra_attempts', val)
                  }}>
                  <i className="fas fa-floppy-disk"></i> Save
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {total_pages > 1 && (
        <div style={{ padding: '14px 24px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
            Showing <strong>{start}–{end}</strong> of <strong>{total}</strong> users
          </span>
          <div className="pagination">
            <button className="page-btn" onClick={() => load(page - 1, searchRef.current)} disabled={page <= 1}>
              <i className="fas fa-chevron-left"></i>
            </button>
            {Array.from({ length: total_pages }, (_, i) => i + 1).map(p => (
              <button key={p} className={`page-btn ${p === page ? 'active' : ''}`} onClick={() => load(p, searchRef.current)}>{p}</button>
            ))}
            <button className="page-btn" onClick={() => load(page + 1, searchRef.current)} disabled={page >= total_pages}>
              <i className="fas fa-chevron-right"></i>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
