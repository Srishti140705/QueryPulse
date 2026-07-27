import React, { useEffect, useState } from 'react'
import {
  connectConnection, createConnection, deleteConnection, disconnectConnection,
  getSchema, listConnections, previewTable, testConnection, testSavedConnection, updateConnection,
} from '../services/connectionService'

const blank = { name: '', host: 'localhost', port: 3306, username: '', password: '', database_name: '' }

export default function DatabaseConnections() {
  const [connections, setConnections] = useState([])
  const [form, setForm] = useState(blank)
  const [editing, setEditing] = useState(null)
  const [schema, setSchema] = useState(null)
  const [preview, setPreview] = useState(null)
  const [message, setMessage] = useState(null)
  const [loading, setLoading] = useState(false)

  const notify = (type, text) => setMessage({ type, text })
  const loadConnections = async () => {
    try { const { data } = await listConnections(); setConnections(data) }
    catch (error) { notify('error', error.response?.data?.detail || 'Unable to load connections.') }
  }
  const loadSchema = async () => {
    try { const { data } = await getSchema(); setSchema(data); setPreview(null) }
    catch (error) { setSchema(null); notify('error', error.response?.data?.detail || 'Unable to load schema.') }
  }
  useEffect(() => { loadConnections() }, [])

  const updateField = (event) => setForm((value) => ({ ...value, [event.target.name]: event.target.value }))
  const submit = async (event) => {
    event.preventDefault(); setLoading(true)
    try {
      if (editing) await updateConnection(editing, Object.fromEntries(Object.entries(form).filter(([key, value]) => key === 'password' ? Boolean(value) : true)))
      else await createConnection({ ...form, port: Number(form.port) })
      notify('success', editing ? 'Connection updated.' : 'Connection saved.')
      setForm(blank); setEditing(null); await loadConnections()
    } catch (error) { notify('error', error.response?.data?.detail || 'Unable to save connection.') }
    finally { setLoading(false) }
  }
  const edit = (connection) => { setEditing(connection.id); setForm({ ...connection, password: '' }); setPreview(null) }
  const test = async () => { try { await testConnection({ ...form, port: Number(form.port) }); notify('success', 'Connection successful.') } catch (error) { notify('error', error.response?.data?.detail || 'Connection test failed.') } }
  const useConnection = async (id) => { try { await connectConnection(id); await loadConnections(); await loadSchema(); notify('success', 'Active connection updated.') } catch (error) { notify('error', error.response?.data?.detail || 'Unable to connect.') } }
  const disconnect = async (id) => { try { await disconnectConnection(id); setSchema(null); setPreview(null); await loadConnections(); notify('success', 'Disconnected.') } catch (error) { notify('error', error.response?.data?.detail || 'Unable to disconnect.') } }
  const remove = async (id) => { if (!window.confirm('Delete this saved connection?')) return; try { await deleteConnection(id); if (editing === id) { setEditing(null); setForm(blank) }; setSchema(null); setPreview(null); await loadConnections() } catch (error) { notify('error', error.response?.data?.detail || 'Unable to delete connection.') } }
  const showTable = async (name) => { try { const { data } = await previewTable(name); setPreview(data) } catch (error) { notify('error', error.response?.data?.detail || 'Unable to preview table.') } }

  return <div className="mx-auto max-w-7xl space-y-6">
    <section className="ide-card p-5 sm:p-6"><p className="font-code text-xs uppercase tracking-[0.28em] text-[var(--accent-soft)]">Database management</p><h1 className="font-heading mt-2 text-2xl font-semibold">MySQL connections</h1><p className="mt-2 text-sm text-[var(--muted)]">Credentials are encrypted on the server and never returned to this browser.</p>{message && <div className={`mt-4 rounded-xl border px-4 py-3 text-sm ${message.type === 'success' ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-200' : 'border-rose-400/20 bg-rose-400/10 text-rose-200'}`}>{message.text}</div>}</section>
    <div className="grid gap-6 xl:grid-cols-[390px_1fr]"><section className="ide-card p-5 sm:p-6"><h2 className="font-heading text-lg font-semibold">{editing ? 'Edit connection' : 'New connection'}</h2><form onSubmit={submit} className="mt-5 space-y-4">{[['name','Name'],['host','Host'],['port','Port'],['username','Username'],['password', editing ? 'New password (leave blank to keep)' : 'Password'],['database_name','Database name']].map(([name,label]) => <label key={name} className="block text-sm font-medium">{label}<input required={name !== 'password' || !editing} name={name} type={name === 'password' ? 'password' : name === 'port' ? 'number' : 'text'} value={form[name]} onChange={updateField} className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 outline-none focus:border-[var(--accent)]" /></label>)}<div className="flex flex-wrap gap-3"><button type="submit" disabled={loading} className="ide-button-primary">{loading ? 'Saving...' : editing ? 'Save changes' : 'Save connection'}</button><button type="button" onClick={test} className="ide-button">Test</button>{editing && <button type="button" onClick={() => { setEditing(null); setForm(blank) }} className="ide-button">Cancel</button>}</div></form></section>
    <section className="ide-card p-5 sm:p-6"><div className="flex items-center justify-between"><h2 className="font-heading text-lg font-semibold">Saved connections</h2><button onClick={loadConnections} className="ide-button">Refresh</button></div><div className="mt-5 space-y-3">{connections.length ? connections.map((connection) => <div key={connection.id} className="ide-surface flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-medium">{connection.name} {connection.is_active && <span className="ml-2 rounded-full bg-emerald-400/10 px-2 py-1 text-xs text-emerald-200">Active</span>}</p><p className="mt-1 font-code text-xs text-[var(--muted)]">{connection.username}@{connection.host}:{connection.port}/{connection.database_name}</p></div><div className="flex flex-wrap gap-2"><button onClick={() => connection.is_active ? disconnect(connection.id) : useConnection(connection.id)} className="ide-button">{connection.is_active ? 'Disconnect' : 'Connect'}</button><button onClick={() => testSavedConnection(connection.id).then(() => notify('success', 'Connection successful.')).catch((e) => notify('error', e.response?.data?.detail || 'Connection test failed.'))} className="ide-button">Test</button><button onClick={() => edit(connection)} className="ide-button">Edit</button><button onClick={() => remove(connection.id)} className="ide-button">Delete</button></div></div>) : <p className="text-sm text-[var(--muted)]">No saved connections yet.</p>}</div></section></div>
    <section className="ide-card p-5 sm:p-6"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="font-code text-xs uppercase tracking-[0.28em] text-[var(--accent-soft)]">Schema explorer</p><h2 className="font-heading mt-2 text-xl font-semibold">{schema?.database_name || 'No active connection'}</h2></div><button onClick={loadSchema} className="ide-button">Refresh schema</button></div>{schema && <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{schema.tables.map((table) => <button key={table.name} onClick={() => showTable(table.name)} className="ide-surface p-4 text-left transition hover:border-[var(--accent)]"><p className="font-code text-sm font-semibold">{table.name}</p><div className="mt-3 space-y-1 text-xs text-[var(--muted)]">{table.columns.map((column) => <p key={column.name}>{column.primary_key ? 'PK ' : ''}{column.name} <span className="text-[var(--accent-soft)]">{column.data_type}</span> {column.nullable ? 'nullable' : 'required'}</p>)}</div></button>)}</div>}</section>
    {preview && <section className="ide-card overflow-hidden p-5 sm:p-6"><p className="font-code text-xs uppercase tracking-[0.28em] text-[var(--accent-soft)]">Read-only browser</p><h2 className="font-heading mt-2 text-xl font-semibold">{preview.table} <span className="text-sm font-normal text-[var(--muted)]">(up to 100 rows)</span></h2><div className="mt-5 overflow-auto rounded-xl border border-[var(--border)]"><table className="ide-table"><thead><tr>{preview.columns.map((column) => <th key={column}>{column}</th>)}</tr></thead><tbody>{preview.rows.map((row, index) => <tr key={index}>{preview.columns.map((column) => <td key={column}>{String(row[column] ?? '')}</td>)}</tr>)}</tbody></table>{!preview.rows.length && <p className="p-4 text-sm text-[var(--muted)]">No rows found.</p>}</div></section>}
  </div>
}
