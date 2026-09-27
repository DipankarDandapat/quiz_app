export default function Loading() {
  return (
    <div className="loading-wrap">
      <div className="spinner"></div>
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>Loading...</p>
    </div>
  )
}
