import React, { useRef, useState } from 'react'
import { Monaco } from '@monaco-editor/react'
import Editor, { loader } from '@monaco-editor/react'

// Ensure Monaco uses the correct CDN when needed (optional config)
loader.init().catch(() => {})

export default function QueryEditor() {
  const editorRef = useRef(null)
  const [value, setValue] = useState('-- Write SQL here\nSELECT * FROM users;')
  const [message, setMessage] = useState(null)

  function handleEditorMount(editor, monaco) {
    editorRef.current = editor
    monaco.editor.setTheme('vs-dark')
  }

  function runQuery() {
    setMessage({ type: 'info', text: 'Run Query is disabled (no backend connection).' })
    setTimeout(() => setMessage(null), 4000)
  }

  function analyzeQuery() {
    setMessage({ type: 'info', text: 'Analyze Query is disabled (no backend connection).' })
    setTimeout(() => setMessage(null), 4000)
  }

  function clearEditor() {
    setValue('')
    setMessage({ type: 'info', text: 'Editor cleared' })
    setTimeout(() => setMessage(null), 2000)
  }

  async function copyQuery() {
    try {
      await navigator.clipboard.writeText(value)
      setMessage({ type: 'success', text: 'Query copied to clipboard' })
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to copy query' })
    }
    setTimeout(() => setMessage(null), 2000)
  }

  return (
    <div className="w-full flex flex-col gap-4">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex gap-3">
          <button
            onClick={runQuery}
            className="px-3 py-1 bg-[var(--accent)] hover:bg-[var(--accent-strong)] rounded text-sm text-[var(--accent-text)]"
          >
            Run Query
          </button>

          <button
            onClick={analyzeQuery}
            className="px-3 py-1 bg-[var(--panel)] hover:bg-[var(--surface)] rounded text-sm text-[var(--text)]"
          >
            Analyze Query
          </button>

          <button
            onClick={clearEditor}
            className="px-3 py-1 bg-[var(--surface)]/80 hover:bg-[var(--surface)] rounded text-sm text-[var(--text)]"
          >
            Clear
          </button>

          <button
            onClick={copyQuery}
            className="px-3 py-1 bg-[var(--surface)]/80 hover:bg-[var(--surface)] rounded text-sm text-[var(--text)]"
          >
            Copy
          </button>
        </div>

        <div className="text-sm text-[var(--muted)]">Theme: Dark • SQL</div>
      </div>

      <div className="bg-[var(--panel)] rounded-lg overflow-hidden shadow">
        <Editor
          height="60vh"
          defaultLanguage="sql"
          defaultValue={value}
          value={value}
          onMount={handleEditorMount}
          onChange={(v) => setValue(v)}
          theme="vs-dark"
          options={{
            minimap: { enabled: false },
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, "Roboto Mono", "Courier New", monospace',
            fontSize: 13,
            wordWrap: 'on',
            automaticLayout: true,
          }}
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-[var(--muted)]">Rows: — • Time: —</div>
        <div>
          {message && (
            <div
              className={`px-3 py-1 rounded text-sm ${
                message.type === 'error' ? 'bg-[var(--accent)]/85 text-[var(--accent-text)]' : message.type === 'success' ? 'bg-[var(--accent-soft)] text-[var(--text)]' : 'bg-[var(--panel)] text-[var(--text)]'
              }`}
            >
              {message.text}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
