import { useState } from 'react'
import { api } from '../App.jsx'

export default function AddApiModal({ onClose, onAdded }) {
  const [form, setForm] = useState({
    name: '', url: '', method: 'GET', expected_status: 200, check_interval_seconds: 120,
  })
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const update = (field) => (e) => {
    const value = field === 'expected_status' || field === 'check_interval_seconds'
      ? Number(e.target.value) : e.target.value
    setForm((f) => ({ ...f, [field]: value }))
  }

  const submit = async (e) => {
    e.preventDefault()
    if (!/^https?:\/\//i.test(form.url)) {
      setError('URL must start with http:// or https://')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      await api.post('/apis', form)
      onAdded(form.name)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to add API. Check the URL and try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Add API to monitor</h2>
        <div className="modal-subtitle">Checked immediately, then every sweep interval</div>
        <form onSubmit={submit}>
          <div className="form-row">
            <label>Name</label>
            <input placeholder="e.g. Payment API" value={form.name} onChange={update('name')} required autoFocus />
          </div>
          <div className="form-row">
            <label>URL</label>
            <input placeholder="https://api.example.com/health" value={form.url} onChange={update('url')} required />
          </div>
          <div className="form-grid-2">
            <div className="form-row">
              <label>Method</label>
              <select value={form.method} onChange={update('method')}>
                <option>GET</option>
                <option>POST</option>
                <option>HEAD</option>
              </select>
            </div>
            <div className="form-row">
              <label>Expected status</label>
              <input type="number" value={form.expected_status} onChange={update('expected_status')} />
            </div>
          </div>
          <div className="form-row">
            <label>Check interval (seconds)</label>
            <input type="number" value={form.check_interval_seconds} onChange={update('check_interval_seconds')} />
            <span className="form-hint">Informational for now — the backend sweeps all active APIs together every 60s.</span>
          </div>

          {error && <div className="error-msg">{error}</div>}

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn" disabled={submitting}>{submitting ? 'Adding…' : 'Add API'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
