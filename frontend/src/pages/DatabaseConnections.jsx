import React, { useEffect, useState } from 'react'
import {
  connectConnection,
  createConnection,
  deleteConnection,
  disconnectConnection,
  getSchema,
  listConnections,
  previewTable,
  testConnection,
  testSavedConnection,
  updateConnection,
} from '../services/connectionService'
import '../styles/connections.css'

const blank = { name: '', host: 'localhost', port: 3306, username: '', password: '', database_name: '' }

const formFields = [
  ['name', 'Connection name', 'Enter connection name', '✦'],
  ['host', 'Host', 'e.g. localhost', '♟'],
  ['port', 'Port', '3306', '⌘'],
  ['username', 'Username', 'Enter username', '♙'],
  ['password', 'Password', 'Enter password', '▣'],
  ['database_name', 'Database name', 'Enter database name', '▤'],
]

export default function DatabaseConnections() {
  const [connections, setConnections] = useState([])
  const [form, setForm] = useState(blank)
  const [editing, setEditing] = useState(null)
  const [schema, setSchema] = useState(null)
  const [preview, setPreview] = useState(null)
  const [message, setMessage] = useState(null)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [busyAction, setBusyAction] = useState('')

  const notify = (type, text) => setMessage({ type, text })
  const loadConnections = async () => {
    try {
      const { data } = await listConnections()
      setConnections(data)
      const active = data.find((connection) => connection.is_active)
      let schemaError = false
      if (active) {
        try {
          const { data: schemaData } = await getSchema()
          setSchema(schemaData)
        } catch (error) {
          schemaError = true
          setSchema(null)
          setPreview(null)
          notify('error', error.response?.data?.detail || 'The active connection is unavailable.')
        }
      } else {
        setSchema(null)
        setPreview(null)
      }
      return { data, schemaError }
    } catch (error) {
      notify('error', error.response?.data?.detail || 'Unable to load connections.')
      return null
    }
  }
  const loadSchema = async () => {
    if (!connections.some((connection) => connection.is_active)) {
      setSchema(null)
      setPreview(null)
      notify('error', 'Connect to a saved database before refreshing the schema.')
      return
    }
    setBusyAction('schema')
    try {
      const { data } = await getSchema()
      setSchema(data)
      setPreview(null)
      notify('success', 'Schema refreshed.')
    } catch (error) {
      setSchema(null)
      notify('error', error.response?.data?.detail || 'Unable to load schema.')
    } finally {
      setBusyAction('')
    }
  }

  useEffect(() => { loadConnections() }, [])

  const refreshConnections = async () => {
    setBusyAction('refresh')
    try {
      const result = await loadConnections()
      if (result && !result.schemaError) notify('success', 'Connections refreshed.')
    } finally {
      setBusyAction('')
    }
  }

  const updateField = (event) => {
    setForm((value) => ({ ...value, [event.target.name]: event.target.value }))
    if (message?.type === 'error') setMessage(null)
  }
  const normalizedForm = () => ({
    ...form,
    name: form.name.trim(),
    host: form.host.trim(),
    port: Number(form.port),
    username: form.username.trim(),
    password: form.password,
    database_name: form.database_name.trim(),
  })
  const validateForm = ({ passwordRequired = !editing } = {}) => {
    const values = normalizedForm()
    const required = ['name', 'host', 'username', 'database_name']
    if (passwordRequired) required.push('password')
    const missing = required.find((key) => !String(values[key] ?? '').trim())
    if (missing) {
      const labels = { name: 'Connection name', host: 'Host', username: 'Username', password: 'Password', database_name: 'Database name' }
      notify('error', `${labels[missing]} is required.`)
      return false
    }
    if (!Number.isInteger(values.port) || values.port < 1 || values.port > 65535) {
      notify('error', 'Port must be a whole number between 1 and 65535.')
      return false
    }
    return values
  }
  const submit = async (event) => {
    event.preventDefault()
    const values = validateForm()
    if (!values) return
    setLoading(true)
    try {
      if (editing) {
        const payload = Object.fromEntries(Object.entries(values).filter(([key, value]) => key !== 'password' || Boolean(value)))
        await updateConnection(editing, payload)
      } else {
        await createConnection(values)
      }
      notify('success', editing ? 'Connection updated.' : 'Connection saved.')
      setForm(blank)
      setEditing(null)
      setShowPassword(false)
      await loadConnections()
    } catch (error) {
      notify('error', error.response?.data?.detail || 'Unable to save connection.')
    } finally {
      setLoading(false)
    }
  }
  const edit = (connection) => {
    setEditing(connection.id)
    setForm({ ...connection, password: '' })
    setShowPassword(false)
    setPreview(null)
    document.querySelector('#new-connection')?.scrollIntoView({ behavior: 'smooth' })
  }
  const test = async () => {
    const saved = editing && connections.find((connection) => connection.id === editing)
    if (saved && !form.password) {
      const changed = ['host', 'port', 'username', 'database_name'].some((key) => String(form[key]) !== String(saved[key]))
      if (changed) {
        notify('error', 'Enter the password to test your edited connection details.')
        return
      }
      setBusyAction('test-form')
      try {
        await testSavedConnection(editing)
        notify('success', 'Saved connection credentials are valid.')
      } catch (error) {
        notify('error', error.response?.data?.detail || 'Connection test failed.')
      } finally {
        setBusyAction('')
      }
      return
    }
    const values = validateForm({ passwordRequired: true })
    if (!values) return
    setBusyAction('test-form')
    try {
      await testConnection(values)
      notify('success', 'Connection successful.')
    } catch (error) {
      notify('error', error.response?.data?.detail || 'Connection test failed.')
    } finally {
      setBusyAction('')
    }
  }
  const useConnection = async (id) => {
    setBusyAction(`connect-${id}`)
    try {
      await connectConnection(id)
      const result = await loadConnections()
      if (result && !result.schemaError) notify('success', 'Connected and schema loaded.')
    } catch (error) {
      notify('error', error.response?.data?.detail || 'Unable to connect.')
    } finally {
      setBusyAction('')
    }
  }
  const disconnect = async (id) => {
    setBusyAction(`connect-${id}`)
    try {
      await disconnectConnection(id)
      setSchema(null)
      setPreview(null)
      await loadConnections()
      notify('success', 'Disconnected.')
    } catch (error) {
      notify('error', error.response?.data?.detail || 'Unable to disconnect.')
    } finally {
      setBusyAction('')
    }
  }
  const remove = async (id) => {
    if (!window.confirm('Delete this saved connection?')) return
    setBusyAction(`delete-${id}`)
    try {
      await deleteConnection(id)
      if (editing === id) {
        setEditing(null)
        setForm(blank)
      }
      setSchema(null)
      setPreview(null)
      await loadConnections()
      notify('success', 'Connection deleted.')
    } catch (error) {
      notify('error', error.response?.data?.detail || 'Unable to delete connection.')
    } finally {
      setBusyAction('')
    }
  }
  const testSaved = async (connection) => {
    setBusyAction(`test-${connection.id}`)
    try {
      await testSavedConnection(connection.id)
      notify('success', `${connection.name} connected successfully.`)
    } catch (error) {
      notify('error', error.response?.data?.detail || 'Connection test failed.')
    } finally {
      setBusyAction('')
    }
  }
  const showTable = async (name) => {
    setBusyAction(`table-${name}`)
    try {
      const { data } = await previewTable(name)
      setPreview(data)
      setTimeout(() => document.querySelector('.db-preview-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0)
    } catch (error) {
      notify('error', error.response?.data?.detail || 'Unable to preview table.')
    } finally {
      setBusyAction('')
    }
  }

  return (
    <div className="db-connections-page">
      <section className="db-banner">
        <img src="/database-connections-banner.png" alt="Database management — Connections" />
        <a className="db-banner-action" href="#new-connection" aria-label="Create a new database connection" />
      </section>

      {message && (
        <div className={`db-notice ${message.type}`} role="status">
          <span>{message.type === 'success' ? '✓' : '!'}</span>
          <p>{message.text}</p>
          <button type="button" onClick={() => setMessage(null)} aria-label="Dismiss notification">×</button>
        </div>
      )}

      <section id="new-connection" className="db-section db-new-section">
        <h2 className="db-section-title"><span>✚</span>{editing ? 'EDIT CONNECTION' : 'NEW CONNECTION'}</h2>
        <form onSubmit={submit}>
          <div className="db-form-grid">
            {formFields.map(([name, label, placeholder, icon]) => (
              <label className="db-field" key={name}>
                <span><i>{icon}</i>{name === 'password' && editing ? 'New password (leave blank to keep)' : label}</span>
                <span className="db-input-wrap">
                  <input
                    required={name !== 'password' || !editing}
                    name={name}
                    type={name === 'password' && !showPassword ? 'password' : name === 'port' ? 'number' : 'text'}
                    value={form[name]}
                    onChange={updateField}
                    placeholder={placeholder}
                    min={name === 'port' ? 1 : undefined}
                    max={name === 'port' ? 65535 : undefined}
                    maxLength={name === 'name' ? 100 : name === 'password' ? 512 : 255}
                    autoComplete={name === 'password' ? 'new-password' : 'off'}
                  />
                  {name === 'password' && (
                    <button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? 'Hide password' : 'Show password'}>
                      {showPassword ? '◉' : '◎'}
                    </button>
                  )}
                </span>
              </label>
            ))}
          </div>
          <div className="db-form-actions">
            <button type="submit" disabled={loading || Boolean(busyAction)} className="db-primary-button">
              <span>▣</span>{loading ? 'Saving...' : editing ? 'Save Changes' : 'Save Connection'}
            </button>
            <button type="button" onClick={test} disabled={loading || Boolean(busyAction)} className="db-outline-button">
              <span>ϟ</span>{busyAction === 'test-form' ? 'Testing...' : 'Test Connection'}
            </button>
            {editing && <button type="button" disabled={loading || Boolean(busyAction)} onClick={() => { setEditing(null); setForm(blank); setShowPassword(false) }} className="db-cancel-button">Cancel</button>}
          </div>
        </form>
      </section>

      <section className="db-section db-saved-section">
        <div className="db-section-heading">
          <h2 className="db-section-title"><span>▣</span>SAVED CONNECTIONS</h2>
          <button type="button" onClick={refreshConnections} disabled={Boolean(busyAction)} className="db-refresh-button">
            <span>⟳</span>{busyAction === 'refresh' ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        <div className="db-table-shell">
          <div className="db-table-head">
            <span>NAME</span><span>HOST</span><span>USER</span><span>DATABASE</span><span>STATUS</span><span>ACTIONS</span>
          </div>
          {connections.length ? connections.map((connection, index) => (
            <article className="db-connection-row" key={connection.id}>
              <div className="db-name-cell">
                <span className={`db-engine-icon db-engine-${index % 3}`}>{index % 3 === 0 ? '⌁' : index % 3 === 1 ? '♣' : '◩'}</span>
                <div>
                  <strong>{connection.name}{index === 0 && <i>★</i>}</strong>
                  {index === 0 && <small>Default connection</small>}
                </div>
              </div>
              <span className="db-host-cell">{connection.host}<small>{connection.port}</small></span>
              <span>{connection.username || '—'}</span>
              <span>{connection.database_name || '—'}</span>
              <span><b className={`db-status ${connection.is_active ? 'active' : 'inactive'}`}>● {connection.is_active ? 'Active' : 'Inactive'}</b></span>
              <div className="db-row-actions">
                <button type="button" disabled={Boolean(busyAction)} className="connect" onClick={() => connection.is_active ? disconnect(connection.id) : useConnection(connection.id)}>
                  {busyAction === `connect-${connection.id}` ? '… Working' : connection.is_active ? '■ Disconnect' : '▶ Connect'}
                </button>
                <button type="button" disabled={Boolean(busyAction)} onClick={() => testSaved(connection)}>
                  {busyAction === `test-${connection.id}` ? '… Testing' : 'ϟ Test'}
                </button>
                <button type="button" disabled={Boolean(busyAction)} onClick={() => edit(connection)}>✎ Edit</button>
                <button type="button" disabled={Boolean(busyAction)} className="delete" onClick={() => remove(connection.id)} aria-label={`Delete ${connection.name}`}>
                  {busyAction === `delete-${connection.id}` ? '…' : '♙'}
                </button>
              </div>
            </article>
          )) : (
            <div className="db-empty-state">
              <span>⌁</span>
              <strong>No saved connections yet</strong>
              <p>Add your first connection using the form above.</p>
            </div>
          )}
        </div>
        <footer className="db-saved-footer">
          <span>💡 Tip: Click <b>Test</b> to verify your connection before saving.</span>
          <span>Showing {connections.length} {connections.length === 1 ? 'connection' : 'connections'}</span>
        </footer>
      </section>

      <section className="db-section db-schema-section">
        <div className="db-section-heading">
          <div><p className="db-eyebrow">SCHEMA EXPLORER</p><h2>{schema?.database_name || 'No active connection'}</h2></div>
          <button type="button" onClick={loadSchema} disabled={Boolean(busyAction)} className="db-refresh-button">
            <span>⟳</span>{busyAction === 'schema' ? 'Refreshing...' : 'Refresh schema'}
          </button>
        </div>
        {schema ? (
          <div className="db-schema-grid">
            {schema.tables.map((table) => (
              <button type="button" disabled={Boolean(busyAction)} key={table.name} onClick={() => showTable(table.name)}>
                <strong>{table.name}</strong><span>{busyAction === `table-${table.name}` ? 'Loading...' : `${table.columns.length} columns`}</span>
              </button>
            ))}
          </div>
        ) : <p className="db-schema-empty">Connect to a saved database to browse its tables.</p>}
      </section>

      {preview && (
        <section className="db-section db-preview-section">
          <p className="db-eyebrow">READ-ONLY BROWSER</p>
          <h2>{preview.table} <small>(up to 100 rows)</small></h2>
          <div className="db-preview-table">
            <table>
              <thead><tr>{preview.columns.map((column) => <th key={column}>{column}</th>)}</tr></thead>
              <tbody>{preview.rows.map((row, index) => <tr key={index}>{preview.columns.map((column) => <td key={column}>{String(row[column] ?? '')}</td>)}</tr>)}</tbody>
            </table>
            {!preview.rows.length && <p>No rows found.</p>}
          </div>
        </section>
      )}
    </div>
  )
}
