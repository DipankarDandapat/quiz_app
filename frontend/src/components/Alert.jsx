import { useEffect } from 'react'

const icons = { success: 'fa-circle-check', error: 'fa-circle-xmark', info: 'fa-circle-info', warning: 'fa-triangle-exclamation' }

export default function Alert({ message, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 5000)
    return () => clearTimeout(t)
  }, [onClose])

  return (
    <div className={`alert-toast alert-${type}`}>
      <i className={`fas ${icons[type] || icons.info}`}></i>
      <span style={{ flex: 1 }}>{message}</span>
      <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.6, fontSize: 14, padding: '0 0 0 8px', color: 'inherit' }}>
        <i className="fas fa-xmark"></i>
      </button>
    </div>
  )
}
