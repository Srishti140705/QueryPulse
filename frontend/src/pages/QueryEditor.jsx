import Editor from "@monaco-editor/react";
import * as monaco from "monaco-editor";
import React, { useEffect, useRef, useState } from 'react'
import { format } from "sql-formatter";
import { executeQuery } from "../services/queryService";
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
  const editorRef = useRef(null);
  const runButtonRef = useRef(null);
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

  async function handleRun() {
    setLoading(true)
    const startTime = performance.now()
    try {
      const response = await executeQuery(sql)
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
      setHistory((prev) => [
        sql,
        ...prev.filter((item) => item !== sql),
      ])

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

  function handleFormat() {
    try {
      const formattedSql = format(sql, { language: "mysql" })
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

  return (
    <div className="mx-auto grid max-w-[1500px] gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(380px,0.85fr)]">
      <div className="space-y-6">
        <section className="ide-card ide-fade-in p-5 sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <p className="font-code text-xs uppercase tracking-[0.28em] text-[var(--accent-soft)]">Query editor</p>
              <h1 className="font-heading mt-3 text-3xl font-semibold tracking-normal text-[var(--text)]">SQL workbench</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">Compose, execute, inspect, and reuse SQL in a focused developer workspace.</p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button onClick={handleFormat} className="ide-button">Format</button>
              <button ref={runButtonRef} onClick={handleRun} disabled={loading} className="ide-button-primary min-w-28">
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

          <div className="mt-6 overflow-hidden rounded-2xl border border-[var(--border)] bg-[#0A0716] shadow-inner">
            <div className="flex h-10 items-center justify-between border-b border-[var(--border)] bg-[var(--surface)]/80 px-4 font-code text-xs text-[var(--muted)]">
              <span>console.sql</span>
              <span>MySQL</span>
            </div>
            <Editor
  height="360px"
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

          <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="ide-surface font-code px-4 py-3 text-xs text-[var(--muted)]">Dialect: MySQL / Safety: enabled / Timeout: 30s</div>
            {message && (
              <div className={`rounded-xl px-4 py-3 text-sm transition-all duration-200 ${message.type === 'success' ? 'border border-emerald-400/20 bg-emerald-400/10 text-emerald-200' : 'border border-rose-400/20 bg-rose-400/10 text-rose-200'}`}>
                {message.text}
              </div>
            )}
          </div>
        </section>

        <section className="grid items-stretch gap-6 lg:grid-cols-2">
          <PanelCard title="Execution plan" description="A preview of the query plan, warnings, and optimization suggestions." />
          <PanelCard title="Static analysis" description="Score, unused columns, missing indexes, and style recommendations." />
        </section>

        <section className="ide-card p-5 sm:p-6">
          <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="font-code text-xs uppercase tracking-[0.28em] text-[var(--accent-soft)]">Analytics</p>
              <h2 className="font-heading mt-2 text-xl font-semibold text-[var(--text)]">Query performance charts</h2>
            </div>
            <span className="font-code text-xs text-[var(--muted)]">{analytics.length} samples</span>
          </div>

          <div className="grid gap-6 2xl:grid-cols-2">
            <ChartCard title="Execution Time Trend">
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={analytics} margin={{ top: 12, right: 24, bottom: 28, left: 0 }}>
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
                  <Pie data={queryTypeData} dataKey="value" nameKey="name" cx="50%" cy="48%" innerRadius={58} outerRadius={108} paddingAngle={3}>
                    {queryTypeData.map((entry, index) => (
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
        <section className="ide-card ide-fade-in p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-code text-xs uppercase tracking-[0.28em] text-[var(--accent-soft)]">Query results</p>
              <h2 className="font-heading mt-2 text-xl font-semibold">Result set</h2>
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
            className="mt-5 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 font-code text-sm text-[var(--text)] outline-none transition duration-200 placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20"
          />

      


  

          <div className="mt-6 max-h-[420px] overflow-auto rounded-2xl border border-[var(--border)]">
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
                    <tr key={index}>
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
            <div key={index} className="group flex items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)]/80 p-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--accent)]/60">
              <code onClick={() => setSql(item)} className="font-code block min-w-0 flex-1 cursor-pointer truncate text-sm text-[var(--text)]">
                {item}
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
              key={index}
              onClick={() => setSql(item)}
              className="cursor-pointer rounded-xl border border-[var(--border)] bg-[var(--surface)]/80 p-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--accent)]/60 hover:bg-[var(--accent)]/10"
            >
              <code className="font-code block truncate text-sm text-[var(--text)]">
                {item}
              </code>
            </div>
          ))}
        </QueryList>
      </aside>
    </div>
  )
}

function PanelCard({ title, description }) {
  return (
    <div className="ide-card flex h-full flex-col p-6 transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--accent)]/60">
      <h3 className="font-heading text-lg font-semibold text-[var(--text)]">{title}</h3>
      <p className="mt-3 flex-1 text-sm leading-6 text-[var(--muted)]">{description}</p>
      <div className="ide-surface mt-5 p-4 text-sm text-[var(--muted)]">No connected database. Connect your data source to see live results.</div>
    </div>
  )
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
    <section className="ide-card p-5 sm:p-6">
      <p className="font-code text-xs uppercase tracking-[0.28em] text-[var(--accent-soft)]">{title}</p>
      <div className="mt-5 space-y-3">
        {hasItems ? children : (
          <p className="rounded-xl border border-dashed border-[var(--border)] p-4 text-sm text-[var(--muted)]">{empty}</p>
        )}
      </div>
    </section>
  )
}
