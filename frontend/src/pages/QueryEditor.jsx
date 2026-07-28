import Editor from "@monaco-editor/react";
import * as monaco from "monaco-editor";
import React, { useEffect, useRef, useState } from 'react'
import { format } from "sql-formatter";
import { analyzeQuery, executeQuery } from "../services/queryService";
import { analyzeSQL } from "../utils/sqlAnalyzer";
import { listWorkspaceQueries, saveWorkspaceQuery, updateWorkspaceQuery } from "../services/workspaceService";
import { explainSql, optimizeSql, generateSql, debugSql, convertSql } from "../services/aiService";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts"


export default function QueryEditor() {
  const [sql, setSql] = useState('SELECT id, name, email FROM users WHERE active = 1 ORDER BY last_login DESC;')
  const [database, setDatabase] = useState(() => localStorage.getItem('selectedDatabase') || 'mysql')
  const [message, setMessage] = useState(null)
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState([])
  const [favorites, setFavorites] = useState([])
  const [executionTime, setExecutionTime] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: 'asc',
  })
  const [analytics, setAnalytics] = useState([])
  const [staticWarnings, setStaticWarnings] = useState(() => analyzeSQL(sql))
  const [warningsDismissed, setWarningsDismissed] = useState(false)
  const [aiResult, setAiResult] = useState(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiPrompt, setAiPrompt] = useState('')
  const [aiError, setAiError] = useState('')
  const [targetDialect, setTargetDialect] = useState('postgresql')
  const [executionPlan, setExecutionPlan] = useState({
    queryType: '--',
    estimatedCost: '--',
    tables: [],
    suggestions: [],
  })
  const editorRef = useRef(null);
  const runButtonRef = useRef(null);
  useEffect(() => {
    localStorage.setItem('selectedDatabase', database)
  }, [database])

  useEffect(() => {
    listWorkspaceQueries().then(({ data }) => { setHistory(data.filter((item) => !item.is_favorite)); setFavorites(data.filter((item) => item.is_favorite)) }).catch(() => {})
  }, [])

  useEffect(() => {
    const savedHistory = localStorage.getItem('queryHistory')

    if (savedHistory) {
      setHistory(JSON.parse(savedHistory))
    }
  }, [])

  useEffect(() => {
    const savedFavorites = localStorage.getItem('favoriteQueries')

    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites))
    }
  }, [])

  useEffect(() => {
  const savedAnalytics = localStorage.getItem('queryAnalytics')

  if (savedAnalytics) {
    setAnalytics(JSON.parse(savedAnalytics))
  }
}, [])

  useEffect(() => {
    setStaticWarnings(analyzeSQL(sql))
    setWarningsDismissed(false)
  }, [sql])

  useEffect(() => {
    let isCurrent = true

    const timeout = window.setTimeout(async () => {
      if (!sql.trim()) {
        setExecutionPlan({ queryType: '--', estimatedCost: '--', tables: [], suggestions: [] })
        return
      }

      try {
        const response = await analyzeQuery(sql, database)
        if (!isCurrent || response.error) return

        const suggestions = [...(response.analysis?.recommendations || [])]
        if (/\bSELECT\s+\*/i.test(sql)) suggestions.push('Avoid SELECT *; select only the columns you need.')
        if (/^(SELECT|UPDATE|DELETE)\b/i.test(sql.trim()) && !/\bWHERE\b/i.test(sql)) suggestions.push('Add a WHERE clause to reduce scanned or affected rows.')
        if (/\bWHERE\b/i.test(sql)) suggestions.push('Consider indexing filtered columns.')
        if (/^SELECT\b/i.test(sql.trim()) && !/\bLIMIT\b/i.test(sql)) suggestions.push('LIMIT large result sets when appropriate.')

        setExecutionPlan({
          queryType: response.parsed?.query_type || '--',
          estimatedCost: response.analysis?.estimated_cost || '--',
          tables: response.parsed?.tables || [],
          suggestions: [...new Set(suggestions)],
        })
      } catch (error) {
        if (isCurrent) setExecutionPlan({ queryType: '--', estimatedCost: '--', tables: [], suggestions: [] })
      }
    }, 300)

    return () => {
      isCurrent = false
      window.clearTimeout(timeout)
    }
  }, [sql])
  async function handleRun() {
    setStaticWarnings(analyzeSQL(sql))
    setLoading(true)
    const startTime = performance.now()
    try {
      const response = await executeQuery(sql, database)
      if (response.result.error) {
        throw new Error(response.result.error)
      }

      setResults(response.result.rows || [])

      const endTime = performance.now()
      const elapsed = endTime - startTime

      let displayTime

      if (elapsed < 1) {
        displayTime = '< 1 ms'
      } else if (elapsed < 1000) {
        displayTime = `${Math.round(elapsed)} ms`
      } else {
        displayTime = `${(elapsed / 1000).toFixed(2)} s`
      }

      setExecutionTime(displayTime)

      const executionValue = elapsed

      setAnalytics((prev) => {
  const updated = [
    ...prev,
    {
      query: sql,
      executionTime: executionValue,
      rowsReturned: response.result.rows?.length || 0,
      queryType: sql.trim().split(" ")[0].toUpperCase(),
      timestamp: new Date().toLocaleTimeString(),
    },
  ]

  localStorage.setItem(
    "queryAnalytics",
    JSON.stringify(updated)
  )

  return updated
})
      saveWorkspaceQuery({ sql, query_type: sql.trim().split(/\\s+/)[0]?.toUpperCase() || 'SQL', execution_time_ms: Math.round(elapsed), status: 'success' }).then(({ data }) => setHistory((prev) => [data, ...prev.filter((item) => item.sql !== sql)])).catch(() => {})

      console.log('History Updated')
      setLoading(false)

      console.log('Backend Response:', response)

      setMessage({
        type: 'success',
        text: 'Query executed successfully.',
      })

      window.setTimeout(() => setMessage(null), 3000)
    } catch (error) {
      setLoading(false)

      console.error(error)

      setMessage({
        type: 'error',
        text:
          error.response?.data?.error ||
          error.message ||
          'Failed to execute query.',
      })

      window.setTimeout(() => setMessage(null), 3000)
    }
  }

  async function runAi(action) {
    if ((action !== 'generate' && !sql.trim()) || (action === 'generate' && !aiPrompt.trim())) {
      setMessage({ type: 'error', text: action === 'generate' ? 'Enter a request to generate SQL.' : 'Enter SQL before using AI.' })
      return
    }
    setAiLoading(true); setAiResult(null)
    try {
      let response
      if (action === 'explain') response = await explainSql(sql, database)
      if (action === 'optimize') response = await optimizeSql(sql, database)
      if (action === 'generate') response = await generateSql(aiPrompt, database)
      if (action === 'debug') response = await debugSql(sql, aiError, database)
      if (action === 'convert') response = await convertSql(sql, database, targetDialect)
      setAiResult({ action, data: response.data })
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.detail || 'AI request failed. Check the backend AI configuration.' })
    } finally { setAiLoading(false) }
  }

  async function copyAiResponse() {
    try {
      await navigator.clipboard.writeText(JSON.stringify(aiResult?.data || {}, null, 2))
      setMessage({ type: 'success', text: 'AI response copied.' })
    } catch {
      setMessage({ type: 'error', text: 'Unable to copy the AI response.' })
    }
  }
  function insertAiSql() {
    const data = aiResult?.data || {}
    const suggestion = data.optimized_sql || data.generated_sql || data.corrected_sql || data.converted_sql
    if (!suggestion) return
    setSql(suggestion)
    setMessage({ type: 'success', text: 'AI suggestion inserted. Review it before running.' })
  }
  function handleFormat() {
    try {
      const formattedSql = format(sql, { language: database === "mariadb" ? "mysql" : database })
      setSql(formattedSql)
      setMessage({ type: 'success', text: 'Formatted query successfully.' })
    } catch (error) {
      console.error(error)
      setMessage({ type: 'error', text: 'Failed to format query.' })
    }

    window.setTimeout(() => setMessage(null), 3000)
  }

  function exportToCSV() {
    if (filteredResults.length === 0) return

    const headers = Object.keys(results[0]).join(',')

    const rows = results.map((row) =>
      Object.values(row).join(','),
    )

    const csvContent = [headers, ...rows].join('\n')

    const blob = new Blob([csvContent], {
      type: 'text/csv;charset=utf-8;',
    })

    const url = URL.createObjectURL(blob)

    const link = document.createElement('a')

    link.href = url

    link.download = 'query_results.csv'

    link.click()

    URL.revokeObjectURL(url)
  }

  const filteredResults = [...results]
    .filter((row) =>
      Object.values(row)
        .join(' ')
        .toLowerCase()
        .includes(searchTerm.toLowerCase()),
    )
    .sort((a, b) => {
      if (!sortConfig.key) return 0

      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? -1 : 1
      }

      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? 1 : -1
      }

      return 0
    })

  const totalQueries = analytics.length

  const averageTime =
    analytics.length > 0
      ? Math.round(
        analytics.reduce((sum, item) => sum + item.executionTime, 0) /
        analytics.length,
      )
      : 0

  const fastestQuery =
    analytics.length > 0
      ? Math.round(
        Math.min(...analytics.map((item) => item.executionTime)),
      )
      : 0

  const slowestQuery =
    analytics.length > 0
      ? Math.round(
        Math.max(...analytics.map((item) => item.executionTime)),
      )
      : 0

  const totalRowsReturned = analytics.reduce(
    (sum, item) => sum + item.rowsReturned,
    0,
  )

  const queryTypeData = Object.values(
  analytics.reduce((acc, item) => {
    if (!acc[item.queryType]) {
      acc[item.queryType] = {
        name: item.queryType,
        value: 0,
      }
    }

    acc[item.queryType].value += 1

    return acc
  }, {})
)

const COLORS = [
  "#8B5CF6",
  "#A855F7",
  "#6366F1",
  "#7C3AED",
  "#C084FC",
]

  const displayAnalytics = analytics.length
    ? analytics
    : [
        { timestamp: '09:00', executionTime: 128, queryType: 'SELECT' },
        { timestamp: '10:30', executionTime: 84, queryType: 'SELECT' },
        { timestamp: '12:00', executionTime: 196, queryType: 'UPDATE' },
        { timestamp: '14:15', executionTime: 112, queryType: 'SELECT' },
        { timestamp: '16:00', executionTime: 73, queryType: 'INSERT' },
      ]
  const displayQueryTypes = analytics.length
    ? queryTypeData
    : [{ name: 'SELECT', value: 3 }, { name: 'UPDATE', value: 1 }, { name: 'INSERT', value: 1 }]

  return (
    <div className="mx-auto grid max-w-[1600px] gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(360px,.75fr)]">
      <div className="space-y-6">
        <section className="ide-card ide-fade-in overflow-hidden p-6 sm:p-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <p className="font-code text-xs uppercase tracking-[0.28em] text-[var(--accent-soft)]">Query editor</p>
              <h1 className="font-heading mt-3 text-3xl font-semibold tracking-normal text-[var(--text)]">SQL workbench</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">Compose, execute, inspect, and reuse SQL in a focused developer workspace.</p>
            </div>

            <div className="workspace-toolbar flex flex-wrap gap-2">
              <button onClick={handleFormat} className="ide-button">Format</button>
              <button onClick={() => runAi('explain')} disabled={aiLoading} className="ide-button border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100">ÃƒÆ’Ã‚Â¢Ãƒâ€¦Ã¢â‚¬Å“Ãƒâ€šÃ‚Â¦ Explain AI</button>
              <button onClick={() => runAi('optimize')} disabled={aiLoading} className="ide-button border-pink-200 bg-pink-50 text-pink-800 hover:bg-pink-100">ÃƒÆ’Ã‚Â¢Ãƒâ€¦Ã‚Â¡Ãƒâ€šÃ‚Â¡ Optimize AI</button>
              <button onClick={() => runAi('debug')} disabled={aiLoading} className="ide-button border-cyan-200 bg-cyan-50 text-cyan-800 hover:bg-cyan-100">ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬ÂÃƒâ€¦Ã¢â‚¬â„¢ Debug AI</button>
              <button ref={runButtonRef} onClick={handleRun} disabled={loading} className="ide-button-primary min-w-28 bg-emerald-500 hover:bg-emerald-600">
                {loading ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    Running
                  </span>
                ) : 'Run query'}
              </button>
              <button onClick={exportToCSV} disabled={results.length === 0} className="ide-button">Export CSV</button>
              <button onClick={() => setSql('')} className="ide-button">Clear</button>
            </div>
          </div>

          <div className="relative mt-6">
            <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[#0A0716] shadow-inner">
              <div className="flex h-10 items-center justify-between border-b border-[var(--border)] bg-[var(--surface)]/80 px-4 font-code text-xs text-[var(--muted)]">
              <span>console.sql</span>
              <select value={database} onChange={(event) => setDatabase(event.target.value)} className="bg-transparent font-code text-xs text-[var(--muted)] outline-none">
                <option value="mysql">MySQL</option>
                <option value="postgresql">PostgreSQL</option>
                <option value="sqlite">SQLite</option>
                <option value="mariadb">MariaDB</option>
              </select>
            </div>
            <Editor
  height="300px"
  defaultLanguage="sql"
  value={sql}
  onChange={(value) => setSql(value || "")}
  onMount={(editor, monacoInstance) => {
  console.log("Monaco mounted");

  editorRef.current = editor;

  console.log(editor);

  editor.addCommand(
    monacoInstance.KeyMod.CtrlCmd | monacoInstance.KeyCode.Enter,
    () => {
      runButtonRef.current?.click();
    },
  );

  editor.addCommand(
    monacoInstance.KeyMod.CtrlCmd | monacoInstance.KeyMod.Shift | monacoInstance.KeyCode.KeyF,
    () => {
      handleFormat();
    },
  );
}}
  theme="vs-dark"
  options={{
    minimap: { enabled: false },
    fontSize: 15,
    fontFamily: "JetBrains Mono",
    fontLigatures: true,
    automaticLayout: true,
    wordWrap: "on",
    scrollBeyondLastLine: false,
    lineNumbers: "on",
    tabSize: 2,
    insertSpaces: true,
    renderLineHighlight: "all",
    cursorBlinking: "smooth",
    cursorSmoothCaretAnimation: "on",
    smoothScrolling: true,
    padding: {
      top: 16,
      bottom: 16,
    },
    roundedSelection: true,
    scrollbar: {
      verticalScrollbarSize: 10,
      horizontalScrollbarSize: 10,
    },
  }}
/>
            </div>
            {staticWarnings.length > 0 && !warningsDismissed && (
              <div className="absolute inset-x-3 top-full z-20 mt-2 rounded-xl border border-amber-400/40 bg-[#241A2F] p-4 shadow-2xl shadow-black/30">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 text-amber-300" aria-hidden="true">&#9888;</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-amber-100">Static analysis warnings</p>
                    <ul className="mt-2 space-y-1.5 text-sm leading-5 text-amber-100/75">
                      {staticWarnings.map((warning) => (
                        <li key={warning.title}><span className="font-medium text-amber-100">{warning.title}:</span> {warning.message}</li>
                      ))}
                    </ul>
                  </div>
                  <button onClick={() => setWarningsDismissed(true)} className="-mr-1 -mt-1 rounded-lg p-1 text-amber-100/70 transition hover:bg-amber-400/10 hover:text-amber-100" aria-label="Dismiss static analysis warnings">&times;</button>
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="ide-surface font-code px-4 py-3 text-xs text-[var(--muted)]">Dialect: {database === "postgresql" ? "PostgreSQL" : database === "sqlite" ? "SQLite" : database === "mariadb" ? "MariaDB" : "MySQL"} / Safety: enabled / Timeout: 30s</div>
            {message && (
              <div className={`rounded-xl px-4 py-3 text-sm transition-all duration-200 ${message.type === 'success' ? 'border border-emerald-400/20 bg-emerald-400/10 text-emerald-200' : 'border border-rose-400/20 bg-rose-400/10 text-rose-200'}`}>
                {message.text}
              </div>
            )}
          </div>
        </section>

        <section className="ide-card p-6 sm:p-7">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end"><div className="flex-1"><p className="font-code text-xs uppercase tracking-[0.28em] text-[var(--accent-soft)]">AI assistant</p><input value={aiPrompt} onChange={(event) => setAiPrompt(event.target.value)} placeholder="Describe the SQL you want to generate..." className="mt-3 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm outline-none focus:border-[var(--accent)]" /></div><button onClick={() => runAi('generate')} disabled={aiLoading} className="ide-button-primary">Generate SQL</button><select value={targetDialect} onChange={(event) => setTargetDialect(event.target.value)} className="ide-button"><option value="mysql">MySQL</option><option value="postgresql">PostgreSQL</option><option value="sqlite">SQLite</option><option value="mariadb">MariaDB</option></select><button onClick={() => runAi('convert')} disabled={aiLoading} className="ide-button">Convert SQL</button></div>
          <input value={aiError} onChange={(event) => setAiError(event.target.value)} placeholder="Optional database error for Debug AI..." className="mt-4 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm outline-none focus:border-[var(--accent)]" />
          {aiLoading && <p className="mt-4 text-sm text-[var(--muted)]">QueryPulse AI is preparing a suggestion...</p>}
          {aiResult && <div className="ide-surface mt-4 p-4"><div className="flex items-center justify-between gap-3"><p className="font-code text-xs uppercase tracking-[0.18em] text-[var(--accent-soft)]">AI suggestion ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¾ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¦ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â review before execution</p><button onClick={insertAiSql} className="ide-button">Insert SQL</button></div><pre className="mt-3 max-h-72 overflow-auto whitespace-pre-wrap font-code text-sm text-[var(--text)]">{JSON.stringify(aiResult.data, null, 2)}</pre></div>}
        </section>
        <section className="grid items-stretch gap-7 md:grid-cols-2">
          <PanelCard title="Execution plan" description="A preview of the query plan, warnings, and optimization suggestions.">
            <div className="mt-5 space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <PlanMetric label="Query type" value={executionPlan.queryType} />
                <PlanMetric label="Estimated cost" value={executionPlan.estimatedCost} />
                <PlanMetric label="Rows returned" value={results.length} />
                <PlanMetric label="Tables used" value={executionPlan.tables.length} />
              </div>
              <div>
                <p className="font-code text-[11px] uppercase tracking-[0.08em] text-[var(--muted)]">Tables</p>
                <p className="mt-2 font-code text-xs text-[var(--text)]">{executionPlan.tables.length ? executionPlan.tables.join(', ') : '--'}</p>
              </div>
              <div>
                <p className="font-code text-[11px] uppercase tracking-[0.08em] text-[var(--muted)]">Optimization suggestions</p>
                {executionPlan.suggestions.length ? (
                  <ul className="mt-2 space-y-2 text-sm leading-5 text-[var(--muted)]">
                    {executionPlan.suggestions.map((suggestion) => <li key={suggestion}>&bull; {suggestion}</li>)}
                  </ul>
                ) : <p className="mt-2 text-sm text-[var(--muted)]">No suggestions available.</p>}
              </div>
            </div>
          </PanelCard>
          <PanelCard title="Static analysis" description="Live safety hints update as you write."><div className="mt-5 ide-empty"><div className="text-2xl">Ã¢Å’Ëœ</div><p className="mt-2 font-semibold text-[var(--text)]">Static checks are active</p><p className="mt-1">Warnings appear directly below the editor so your workspace stays focused.</p></div></PanelCard>
        </section>

        <section className="ide-card p-6 sm:p-7">
          <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="font-code text-xs uppercase tracking-[0.28em] text-[var(--accent-soft)]">Analytics</p>
              <h2 className="font-heading mt-2 text-xl font-semibold text-[var(--text)]">Query performance charts</h2>
            </div>
            <span className="font-code text-xs text-[var(--muted)]">{analytics.length ? `${analytics.length} live samples` : 'Preview data — run a query to personalise'}</span>
          </div>

          <div className="grid gap-6 2xl:grid-cols-2">
            <ChartCard title="Execution Time Trend">
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={displayAnalytics} margin={{ top: 12, right: 24, bottom: 28, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(169, 155, 200, 0.16)" />
                  <XAxis dataKey="timestamp" tick={{ fill: '#A99BC8', fontSize: 12 }} tickMargin={12} minTickGap={28} stroke="rgba(169, 155, 200, 0.45)" />
                  <YAxis tick={{ fill: '#A99BC8', fontSize: 12 }} tickMargin={10} stroke="rgba(169, 155, 200, 0.45)" width={44} />
                  <Tooltip contentStyle={{ background: '#15102A', border: '1px solid rgba(184, 152, 255, 0.22)', borderRadius: '12px', color: '#F7F2FF' }} />
                  <Line type="monotone" dataKey="executionTime" stroke="#A78BFA" strokeWidth={3} dot={{ r: 5, strokeWidth: 2, fill: '#8B5CF6' }} activeDot={{ r: 7 }} />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Query Type Distribution">
              <ResponsiveContainer width="100%" height={320}>
                <PieChart margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                  <Pie data={displayQueryTypes} dataKey="value" nameKey="name" cx="50%" cy="48%" innerRadius={58} outerRadius={108} paddingAngle={3}>
                    {displayQueryTypes.map((entry, index) => (
                      <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#15102A', border: '1px solid rgba(184, 152, 255, 0.22)', borderRadius: '12px', color: '#F7F2FF' }} />
                  <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{ color: '#A99BC8', fontFamily: 'JetBrains Mono, monospace', fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        </section>
      </div>

      <aside className="space-y-6">
        <section className="ide-card ide-fade-in overflow-hidden p-6 sm:p-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-code text-xs uppercase tracking-[0.28em] text-[var(--accent-soft)]">Result set</p>
              <h2 className="font-heading mt-2 text-2xl font-bold">Result set</h2>
            </div>
            <span className="ide-surface font-code px-3 py-2 text-xs text-[var(--muted)]">
              {results.length} {results.length === 1 ? 'row' : 'rows'} / {executionTime || '--'}
            </span>
          </div>

          <input
            type="text"
            placeholder="Search results..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="mt-5 w-full rounded-2xl border border-violet-100 bg-violet-50/50 px-4 py-3 font-code text-sm text-[var(--text)] outline-none transition duration-200 placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20"
          />

      


  

          <div className="mt-6 max-h-[540px] overflow-auto rounded-3xl border border-violet-100 bg-white shadow-inner">
            {results.length === 0 ? (
              <div className="p-8 text-center text-sm text-[var(--muted)]">
                No records found. Execute a SELECT query to display results.
              </div>
            ) : (
              <table className="ide-table">
                <thead>
                  <tr>
                    {Object.keys(results[0]).map((column) => (
                      <th
                        key={column}
                        onClick={() => {
                          setSortConfig((prev) => ({
                            key: column,
                            direction:
                              prev.key === column && prev.direction === 'asc'
                                ? 'desc'
                                : 'asc',
                          }))
                        }}
                        className="cursor-pointer select-none hover:text-[var(--accent-strong)]"
                      >
                        {column}
                        {sortConfig.key === column &&
                          (sortConfig.direction === 'asc' ? ' ASC' : ' DESC')}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {filteredResults.map((row, index) => (
                    <tr key={item.id || index}>
                      {Object.values(row).map((value, i) => (
                        <td key={i} className="whitespace-nowrap">
                          {String(value)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

        <QueryList title="Query history" empty="No queries executed yet.">
          {history.map((item, index) => (
            <div key={item.id || index} className="group flex items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)]/80 p-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--accent)]/60">
              <code onClick={() => setSql(item.sql || item)} className="font-code block min-w-0 flex-1 cursor-pointer truncate text-sm text-[var(--text)]">
                {item.sql || item}
              </code>

              <button
                onClick={() => {
                  const updatedFavorites = favorites.includes(item)
                    ? favorites.filter((query) => query !== item)
                    : [...favorites, item]

                  setFavorites(updatedFavorites)

                  localStorage.setItem(
                    'favoriteQueries',
                    JSON.stringify(updatedFavorites),
                  )
                }}
                className="ide-button h-9 w-9 px-0"
                aria-label={favorites.includes(item) ? 'Remove favorite' : 'Add favorite'}
              >
                {favorites.includes(item) ? '*' : '+'}
              </button>
            </div>
          ))}
        </QueryList>

        <QueryList title="Favorite queries" empty="No favorite queries yet.">
          {favorites.map((item, index) => (
            <div
              key={item.id || index}
              onClick={() => setSql(item.sql || item)}
              className="cursor-pointer rounded-xl border border-[var(--border)] bg-[var(--surface)]/80 p-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--accent)]/60 hover:bg-[var(--accent)]/10"
            >
              <code className="font-code block truncate text-sm text-[var(--text)]">
                {item.sql || item}
              </code>
            </div>
          ))}
        </QueryList>
      </aside>
    </div>
  )
}

function PanelCard({ title, description, children }) {
  return (
    <div className="ide-card flex h-full flex-col p-6 transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--accent)]/60">
      <h3 className="font-heading text-lg font-semibold text-[var(--text)]">{title}</h3>
      <p className="mt-3 flex-1 text-sm leading-6 text-[var(--muted)]">{description}</p>
      {children || <div className="ide-surface mt-5 p-4 text-sm text-[var(--muted)]">No connected database. Connect your data source to see live results.</div>}
    </div>
  )
}

function PlanMetric({ label, value }) {
  return <div className="ide-surface p-3"><p className="font-code text-[10px] uppercase tracking-[0.08em] text-[var(--muted)]">{label}</p><p className="mt-2 font-code text-sm text-[var(--text)]">{value}</p></div>
}
function ChartCard({ title, children }) {
  return (
    <div className="ide-surface p-5">
      <h3 className="mb-4 font-heading text-lg font-semibold text-[var(--text)]">
        {title}
      </h3>

      {children}
    </div>
  )
}

function AnalyticsTile({ label, value, wide = false }) {
  const parts = String(value).split(' ')

  return (
    <div className={`ide-surface flex min-h-[104px] flex-col justify-between p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--accent)]/60 ${wide ? 'col-span-2' : ''}`}>
      <p className="font-code truncate text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">{label}</p>
      <h3 className="font-code mt-4 flex items-baseline gap-2 text-2xl font-semibold leading-none text-[var(--text)]">
        <span>{parts[0]}</span>
        {parts[1] && <span className="text-sm font-semibold text-[var(--muted)]">{parts.slice(1).join(' ')}</span>}
      </h3>
    </div>
  )
}

function QueryList({ title, empty, children }) {
  const hasItems = React.Children.count(children) > 0

  return (
    <section className="ide-card p-6 sm:p-7">
      <p className="font-code text-xs uppercase tracking-[0.28em] text-[var(--accent-soft)]">{title}</p>
      <div className="mt-5 space-y-3">
        {hasItems ? children : (
          <div className="ide-empty"><div className="text-2xl">ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â</div><p className="mt-2 font-medium text-[var(--text)]">{empty}</p><p className="mt-1 text-xs">Your workspace items are saved here as you use QueryPulse.</p></div>
        )}
      </div>
    </section>
  )
}


function AIResponse({ result, onInsert }) {
  const sql = result.optimized_sql || result.generated_sql || result.corrected_sql || result.converted_sql
  const details = result.explanation || result.problem || result.note || result.likely_result
  return <div className="mt-5 rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 to-sky-50 p-5 shadow-sm">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="font-code text-[11px] font-semibold uppercase tracking-[.2em] text-violet-600">AI suggestion</p><p className="mt-1 text-sm text-[var(--muted)]">Review every suggestion before execution.</p></div><div className="flex gap-2"><button onClick={() => navigator.clipboard.writeText(sql || details || '')} className="ide-button">Copy</button>{sql && <button onClick={onInsert} className="ide-button-primary">Insert SQL</button>}</div></div>
    {sql && <pre className="mt-4 overflow-auto rounded-xl border border-violet-100 bg-slate-950 p-4 font-code text-sm text-violet-100">{sql}</pre>}
    {details && <p className="mt-4 text-sm leading-6 text-[var(--text)]">{details}</p>}
    {result.changes?.length > 0 && <AIList title="Changes" items={result.changes} />}
    {result.suggestions?.length > 0 && <AIList title="Suggestions" items={result.suggestions} />}
    {result.safety_warnings?.length > 0 && <AIList title="Warnings" items={result.safety_warnings} warning />}
    {result.validation && <p className={`mt-4 text-sm font-semibold ${result.validation.valid ? 'text-emerald-700' : 'text-amber-700'}`}>{result.validation.message}</p>}
  </div>
}
function AIList({ title, items, warning }) { return <div className="mt-4"><p className={`font-code text-[11px] uppercase tracking-[.16em] ${warning ? 'text-amber-700' : 'text-violet-600'}`}>{title}</p><ul className="mt-2 space-y-1 text-sm text-[var(--text)]">{items.map((item) => <li key={String(item)}>&bull; {typeof item === 'string' ? item : JSON.stringify(item)}</li>)}</ul></div> }
