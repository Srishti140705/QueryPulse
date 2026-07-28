import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import Editor from '@monaco-editor/react'
import { BarChart, Bar, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { analyzeQuery, executeQuery, getExecutionPlan } from '../services/queryService'
import { convertSql, debugSql, explainSql, optimizeSql } from '../services/aiService'
import { listWorkspaceQueries } from '../services/workspaceService'

const starterSql = `SELECT
  department,
  AVG(salary) AS avg_salary
FROM employees
GROUP BY department
HAVING AVG(salary) > 50000
ORDER BY avg_salary DESC;`

const rows = [
  { department: 'IT', avg_salary: '79,666.67' },
  { department: 'Finance', avg_salary: '70,000.00' },
  { department: 'Marketing', avg_salary: '53,000.00' },
]

const historySeed = [
  ['SELECT department, AVG(salary) AS...', '3 rows', '2m ago', true, starterSql],
  ['SELECT * FROM employees LIMIT 10;', '10 rows', '10m ago', true, 'SELECT * FROM employees LIMIT 10;'],
  ['SELECT name FROM employees;', 'Error', '15m ago', false, 'SELECT name FROM employees;'],
  ['SHOW TABLES;', '5 rows', '1h ago', true, 'SHOW TABLES;'],
]

const thinkingMessages = [
  'Parsing the SQL and selected dialect...',
  'Checking syntax, schema objects, and query logic...',
  'Reviewing safety and performance trade-offs...',
  'Writing a grounded answer...',
]

const toItems = (value) => Array.isArray(value) ? value.filter(Boolean).map(String) : value ? [String(value)] : []
const formatDuration = (milliseconds) => milliseconds >= 1000 ? `${(milliseconds / 1000).toFixed(2)} s` : `${milliseconds} ms`
const speedTone = (milliseconds) => milliseconds > 1000 ? 'slow' : milliseconds >= 200 ? 'moderate' : 'fast'

function SlowQueryTooltip({ active, payload }) {
  const query = active && payload?.[0]?.payload
  if (!query) return null
  return (
    <div className="slow-query-tooltip">
      <strong>{formatDuration(query.execution_time_ms)}</strong>
      <code>{query.sql}</code>
      <span>{query.row_count ?? 0} rows • {query.status}</span>
      <span>{query.performance_reason || 'No performance signal recorded'}</span>
      <time>{new Date(query.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</time>
    </div>
  )
}

function formatAiAnswer(mode, data) {
  const providerNote = data.provider_available === false
    ? [`The local AI provider was unavailable, so this answer uses QueryPulse's deterministic SQL checks. ${data.provider_warning || ''}`.trim()]
    : []

  if (mode === 'debug') {
    const issues = toItems(data.issues?.map((issue) => `${String(issue.severity || 'issue').toUpperCase()}: ${issue.message}`))
    const recognized = data.statement_type ? [`Statement recognized as ${data.statement_type} (${data.category || 'SQL'})`] : []
    return {
      tone: data.has_issues ? 'warning' : 'success',
      title: data.has_issues ? 'Issues found' : 'No issues found',
      summary: [data.problem, data.explanation].filter(Boolean).join(' '),
      sections: [
        { title: 'What I checked', items: issues.length ? [...recognized, ...issues] : [...recognized, 'Syntax is valid', 'Referenced schema objects are available where applicable', 'No obvious logic or safety issue was detected'] },
        { title: 'Suggestions', items: toItems(data.suggestions) },
        { title: 'Provider note', items: providerNote },
      ],
      sql: data.corrected_sql && data.has_issues ? data.corrected_sql : '',
      sqlLabel: 'Suggested correction',
    }
  }

  if (mode === 'optimize') {
    const blockingIssues = toItems(data.deterministic_review?.issues?.filter((issue) => issue.severity === 'error').map((issue) => issue.message))
    return {
      tone: blockingIssues.length ? 'warning' : data.can_optimize ? 'info' : 'success',
      title: blockingIssues.length ? 'Fix query issues before optimizing' : data.can_optimize ? 'Optimization opportunities found' : 'Already in good shape',
      summary: [data.summary, data.note].filter(Boolean).join(' '),
      sections: [
        { title: 'Blocking issues', items: blockingIssues },
        { title: 'Recommended changes', items: toItems(data.changes) },
        { title: 'Safety notes', items: toItems(data.safety_warnings) },
        { title: 'Provider note', items: providerNote },
      ],
      sql: data.can_optimize && data.optimized_sql ? data.optimized_sql : '',
      sqlLabel: 'Optimized SQL',
    }
  }

  if (mode === 'convert') {
    return {
      tone: 'info',
      title: 'PostgreSQL conversion',
      summary: data.explanation || 'The query was converted from MySQL to PostgreSQL.',
      sections: [
        { title: 'Review before running', items: [...toItems(data.safety_warnings), ...providerNote] },
      ],
      sql: data.converted_sql || '',
      sqlLabel: 'Converted SQL',
    }
  }

  const issueItems = toItems(data.issues?.map((issue) => `${String(issue.severity || 'issue').toUpperCase()}: ${issue.message}`))
  return {
    tone: issueItems.length ? 'warning' : 'info',
    title: issueItems.length ? 'Query explained — review these issues' : 'Query explained',
    summary: data.explanation || 'The query was analyzed.',
    sections: [
      { title: 'Operation', items: data.statement_type ? [`${data.statement_type} (${data.category || 'SQL'})`] : [] },
      { title: 'Tables', items: toItems(data.tables) },
      { title: 'Joins', items: toItems(data.joins) },
      { title: 'Filters', items: toItems(data.filters) },
      { title: 'Result', items: toItems(data.likely_result) },
      { title: 'Issues', items: issueItems },
      { title: 'Provider note', items: providerNote },
    ],
    sql: '',
  }
}

function AiAnswer({ answer }) {
  return (
    <article className={`ai-answer ${answer.tone || 'info'}`}>
      <h3>{answer.title}</h3>
      <p>{answer.summary}</p>
      {answer.sections.filter((section) => section.items?.length).map((section) => (
        <section key={section.title}>
          <h4>{section.title}</h4>
          <ul>{section.items.map((item) => <li key={item}>{item}</li>)}</ul>
        </section>
      ))}
      {answer.sql && <section><h4>{answer.sqlLabel || 'Suggested SQL'}</h4><pre><code>{answer.sql}</code></pre></section>}
    </article>
  )
}

export default function QuestWorkspace() {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const [tabs, setTabs] = useState([{ id: 0, name: 'query.sql', sql: starterSql }])
  const [activeTabId, setActiveTabId] = useState(0)
  const [notice, setNotice] = useState('Query ready')
  const [resultRows, setResultRows] = useState(rows)
  const [resultSearch, setResultSearch] = useState('')
  const [history, setHistory] = useState(historySeed)
  const [queryInsights, setQueryInsights] = useState([])
  const [aiMode, setAiMode] = useState('overview')
  const [aiLoading, setAiLoading] = useState(false)
  const [thinkingStep, setThinkingStep] = useState(0)
  const [lastExecutionError, setLastExecutionError] = useState('')
  const [dialect, setDialect] = useState('mysql')
  const [aiAnswer, setAiAnswer] = useState({
    tone: 'info',
    title: 'Ask QueryPulse AI',
    summary: 'Choose Explain AI, Debug AI, or Optimize AI. I will analyze the SQL currently open in the editor and answer here.',
    sections: [],
    sql: '',
  })
  const [executionPlan, setExecutionPlan] = useState({ loading: false, data: null, error: '' })
  const [staticAnalysis, setStaticAnalysis] = useState({ loading: false, data: null, error: '' })
  const [historyTop, setHistoryTop] = useState(394)
  const [historyMinHeight, setHistoryMinHeight] = useState(385)
  const editorPanelRef = useRef(null)
  const companionPanelRef = useRef(null)
  const resultPanelRef = useRef(null)
  const resultTableRef = useRef(null)

  const activeTab = tabs.find((tab) => tab.id === activeTabId)
  const sql = activeTab?.sql || ''

  function handleRequestError(error, fallbackMessage) {
    const message = error?.response?.data?.detail || error?.message || fallbackMessage
    const sessionExpired = error?.response?.status === 401 || /invalid or expired token|authentication required/i.test(message)
    if (sessionExpired) {
      setNotice('Session expired. Redirecting to sign in...')
      logout()
      navigate('/login', { replace: true, state: { message: 'Your session expired. Please sign in again.' } })
      return { sessionExpired: true, message: 'Your session expired. Please sign in again.' }
    }
    return { sessionExpired: false, message }
  }

  function setSql(value) {
    if (!activeTab) return
    setTabs((current) => current.map((tab) => tab.id === activeTabId ? { ...tab, sql: value } : tab))
    setExecutionPlan({ loading: false, data: null, error: '' })
    setStaticAnalysis({ loading: false, data: null, error: '' })
    setLastExecutionError('')
  }

  function addTab() {
    let suffix = 1
    while (tabs.some((tab) => tab.name === `query.sql${suffix}`)) suffix += 1
    const nextTab = { id: Date.now(), name: `query.sql${suffix}`, sql: '' }
    setTabs((current) => [...current, nextTab])
    setActiveTabId(nextTab.id)
    setNotice(`${nextTab.name} opened`)
  }

  function closeTab(id) {
    const closingIndex = tabs.findIndex((tab) => tab.id === id)
    const remaining = tabs.filter((tab) => tab.id !== id)
    setTabs(remaining)
    if (id === activeTabId) setActiveTabId(remaining[Math.max(0, closingIndex - 1)]?.id ?? null)
  }

  const slowestQueries = useMemo(() => {
    const today = new Date().toDateString()
    return queryInsights
      .filter((item) => item.execution_time_ms != null && new Date(item.created_at).toDateString() === today)
      .sort((left, right) => right.execution_time_ms - left.execution_time_ms)
      .slice(0, 5)
      .map((item) => ({
        ...item,
        label: `${String(item.sql || '').replace(/\s+/g, ' ').slice(0, 42)}${String(item.sql || '').replace(/\s+/g, ' ').length > 42 ? '…' : ''}`,
        tone: speedTone(item.execution_time_ms),
      }))
  }, [queryInsights])
  const resultColumns = Object.keys(resultRows[0] || {})
  const filteredResultRows = useMemo(() => {
    const search = resultSearch.trim().toLowerCase()
    if (!search) return resultRows
    return resultRows.filter((row) => Object.values(row).some((value) => String(value).toLowerCase().includes(search)))
  }, [resultRows, resultSearch])

  useEffect(() => {
    let cancelled = false
    listWorkspaceQueries()
      .then((response) => {
        if (!cancelled) setQueryInsights(Array.isArray(response.data) ? response.data : [])
      })
      .catch((error) => {
        if (cancelled) return
        const failure = handleRequestError(error, 'Could not load query insights')
        if (!failure.sessionExpired) setQueryInsights([])
      })
    return () => { cancelled = true }
  }, [])

  function showSearchResult() {
    setNotice(resultSearch.trim() ? `${filteredResultRows.length} matching rows found` : `${resultRows.length} rows available`)
  }

  function viewLastResult() {
    if (!filteredResultRows.length || !resultTableRef.current) return
    resultTableRef.current.scrollTo({ top: resultTableRef.current.scrollHeight, behavior: 'smooth' })
    setNotice('Showing the last matching result')
  }

  async function generateExecutionPlan() {
    if (!sql.trim()) {
      setExecutionPlan({ loading: false, data: null, error: 'Enter a query before generating a plan.' })
      return
    }
    setExecutionPlan({ loading: true, data: null, error: '' })
    try {
      const response = await getExecutionPlan(sql, dialect)
      setExecutionPlan({ loading: false, data: response, error: '' })
      setNotice('Execution plan generated')
    } catch (error) {
      const failure = handleRequestError(error, 'Execution plan failed')
      if (failure.sessionExpired) return
      setExecutionPlan({ loading: false, data: null, error: failure.message })
      setNotice(failure.message)
    }
  }

  async function runStaticAnalysis() {
    if (!sql.trim()) {
      setStaticAnalysis({ loading: false, data: null, error: 'Enter a query before running static analysis.' })
      return
    }
    setStaticAnalysis({ loading: true, data: null, error: '' })
    try {
      const response = await analyzeQuery(sql, dialect)
      if (response.error) throw new Error(response.error)
      setStaticAnalysis({ loading: false, data: response, error: '' })
      setNotice('Static analysis complete')
    } catch (error) {
      const failure = handleRequestError(error, 'Static analysis failed')
      if (failure.sessionExpired) return
      setStaticAnalysis({ loading: false, data: null, error: failure.message })
      setNotice(failure.message)
    }
  }

  useEffect(() => {
    function alignHistory() {
      if (!resultPanelRef.current || !editorPanelRef.current || !companionPanelRef.current) return
      const nextHistoryTop = resultPanelRef.current.offsetTop + resultPanelRef.current.offsetHeight + 14
      const leftColumnBottom = companionPanelRef.current.offsetTop + companionPanelRef.current.offsetHeight
      setHistoryTop(nextHistoryTop)
      setHistoryMinHeight(Math.max(320, leftColumnBottom - nextHistoryTop))
    }
    alignHistory()
    window.addEventListener('resize', alignHistory)
    return () => window.removeEventListener('resize', alignHistory)
  }, [resultRows.length])

  useEffect(() => {
    if (!aiLoading) {
      setThinkingStep(0)
      return undefined
    }
    const interval = window.setInterval(() => {
      setThinkingStep((current) => (current + 1) % thinkingMessages.length)
    }, 1200)
    return () => window.clearInterval(interval)
  }, [aiLoading])

  async function runQuery() {
    if (!sql.trim()) {
      setNotice('Enter a query before running it')
      return
    }
    setNotice('Running query...')
    let historyInfo = 'Error'
    let historyOk = false
    let insightRecord = null
    try {
      const response = await executeQuery(sql, dialect)
      const result = response?.result || response
      insightRecord = result?.history_record || null
      if (result?.error) throw new Error(result.error)
      const liveRows = Array.isArray(result?.rows) ? result.rows : []
      setResultRows(liveRows)
      setLastExecutionError('')
      setNotice(result?.message || `Executed successfully - ${liveRows.length} rows returned`)
      historyInfo = liveRows.length
        ? `${liveRows.length} rows`
        : result?.affected_rows
          ? `${result.affected_rows} affected`
          : 'Success'
      historyOk = true
    } catch (error) {
      const failure = handleRequestError(error, 'Query execution failed')
      if (failure.sessionExpired) return
      const errorMessage = failure.message
      setResultRows([])
      setLastExecutionError(errorMessage)
      setNotice(errorMessage)
    }
    if (insightRecord) {
      setQueryInsights((current) => [
        insightRecord,
        ...current.filter((item) => item.id !== insightRecord.id),
      ].slice(0, 100))
    }
    const normalizedSql = sql.trim().replace(/\s+/g, ' ').toLowerCase()
    setHistory((current) => [
      [sql.replace(/\s+/g, ' ').slice(0, 35) + '...', historyInfo, 'now', historyOk, sql],
      ...current.filter((item) => item[4].trim().replace(/\s+/g, ' ').toLowerCase() !== normalizedSql),
    ])
  }

  function loadHistoryQuery(query) {
    setSql(query)
    setNotice('Loaded query from history')
  }

  async function action(label, queryOverride = null) {
    const normalized = label.toLowerCase()
    const queryToAnalyze = queryOverride || sql
    if (!queryToAnalyze.trim()) {
      setNotice('Enter a query before asking AI')
      setAiAnswer({ tone: 'warning', title: 'No SQL to analyze', summary: 'Write or load a query in the editor first.', sections: [], sql: '' })
      return
    }
    setAiMode(normalized)
    setAiLoading(true)
    setNotice(`${label} AI is thinking...`)
    try {
      const response = normalized === 'explain'
        ? await explainSql(queryToAnalyze, dialect)
        : normalized === 'debug'
          ? await debugSql(queryToAnalyze, lastExecutionError || null, dialect)
          : normalized === 'optimize'
            ? await optimizeSql(queryToAnalyze, dialect)
            : await convertSql(queryToAnalyze, dialect, dialect === 'postgresql' ? 'mysql' : 'postgresql')
      setAiAnswer(formatAiAnswer(normalized, response.data))
      setNotice(`${label} AI analysis is ready`)
    } catch (error) {
      const failure = handleRequestError(error, 'AI analysis failed')
      if (failure.sessionExpired) return
      const message = failure.message
      setAiAnswer({
        tone: 'warning',
        title: `${label} AI could not finish`,
        summary: message,
        sections: [{ title: 'What to check', items: ['Confirm the backend is running', 'Confirm Ollama is running with the configured model', 'Try the request again'] }],
        sql: '',
      })
      setNotice(message)
    } finally {
      setAiLoading(false)
    }
  }

  return (
    <div className="quest-workspace">
      <section className="workspace-grid" style={{ '--history-top': `${historyTop}px`, '--history-min-height': `${historyMinHeight}px` }}>
        <div ref={editorPanelRef} className="quest-panel editor-panel">
          <div className="editor-tabbar">
            {tabs.map((tab) => <div key={tab.id} className={`query-tab ${activeTabId === tab.id ? 'selected' : ''}`}><button type="button" className="tab-select" onClick={() => setActiveTabId(tab.id)}><i /> {tab.name}</button><button type="button" className="tab-close" onClick={() => closeTab(tab.id)} aria-label={`Close ${tab.name}`}>×</button></div>)}
            <button type="button" className="tab-add" onClick={addTab} aria-label="Open a new query tab">+</button>
          </div>
          <div className="quest-toolbar" aria-label="SQL actions">
            <button className="run" onClick={runQuery}>▶ Run</button>
            <button className="explain" disabled={aiLoading} onClick={() => action('Explain')}>✦ Explain AI</button>
            <button className="optimize" disabled={aiLoading} onClick={() => action('Optimize')}>↗ Optimize AI</button>
            <button className="debug" disabled={aiLoading} onClick={() => action('Debug')}>☼ Debug AI</button>
            <button className="convert" disabled={aiLoading} onClick={() => action('Convert')}>↔ Convert</button>
            <button className="clear" onClick={() => setSql('')}>▱ Clear</button>
          </div>
          <div className="editor-shell">
            <div className="editor-filebar"><span><b /> {activeTab?.name || 'No query open'}</span><select aria-label="Database dialect" value={dialect} onChange={(event) => { setDialect(event.target.value); setExecutionPlan({ loading: false, data: null, error: '' }); setStaticAnalysis({ loading: false, data: null, error: '' }) }}><option value="mysql">MySQL</option><option value="postgresql">PostgreSQL</option><option value="sqlite">SQLite</option></select></div>
            <Editor height="294px" defaultLanguage="sql" value={sql} onChange={(value) => setSql(value || '')} theme="vs-dark" options={{ readOnly: !activeTab, minimap: { enabled: false }, fontSize: 14, fontFamily: 'JetBrains Mono', lineNumbers: 'on', scrollBeyondLastLine: false, padding: { top: 14, bottom: 14 }, automaticLayout: true }} />
            <div className="editor-status"><span>Ln 11, Col 20</span><span>Spaces: 4</span><span>{dialect === 'postgresql' ? 'PostgreSQL' : dialect === 'sqlite' ? 'SQLite' : 'MySQL'}</span><b>✓ {notice}</b></div>
          </div>
        </div>

        <aside className="quest-side">
          <section ref={resultPanelRef} className="quest-panel result-panel">
            <header><h2>✦ Result Set</h2><span>{resultSearch.trim() ? `${filteredResultRows.length} / ${resultRows.length}` : resultRows.length} rows</span></header>
            <form className="result-search" onSubmit={(event) => { event.preventDefault(); showSearchResult() }}>
              <input aria-label="Search query results" placeholder="Search results..." value={resultSearch} onChange={(event) => setResultSearch(event.target.value)} />
              <button type="submit" aria-label="Search results" title="Search results">⌕</button>
              <button type="button" aria-label="View last matching result" title="View last matching result" onClick={viewLastResult} disabled={!filteredResultRows.length}>⇩</button>
            </form>
            <div ref={resultTableRef} className="result-table quest-scroll">{resultColumns.length > 0 && <div className="result-head" style={{ gridTemplateColumns: `repeat(${resultColumns.length}, minmax(110px, 1fr))` }}>{resultColumns.map((column) => <span key={column}>{column}</span>)}</div>}{filteredResultRows.length > 0 ? filteredResultRows.map((row, index) => <div className="result-row" style={{ gridTemplateColumns: `repeat(${resultColumns.length}, minmax(110px, 1fr))` }} key={index}>{resultColumns.map((column, columnIndex) => columnIndex === resultColumns.length - 1 ? <b key={column}>{String(row[column])}</b> : <span key={column}>{String(row[column])}</span>)}</div>) : <p className="result-empty">{resultRows.length ? 'No rows match your search.' : 'This statement returned no result rows.'}</p>}</div>
            <footer><span>‹</span><span>1</span><span>›</span><small>10 / page⌄</small></footer>
          </section>
          <section className="quest-panel history-panel">
            <header><h2>♟ Query History</h2><button type="button" onClick={() => navigate('/history')}>View all</button></header>
            <div className="history-list quest-scroll">{history.map(([query, info, time, ok, fullQuery], index) => <article key={`${fullQuery}-${index}`} onClick={() => loadHistoryQuery(fullQuery)} title="Load this query in the editor"><b className={ok ? 'ok' : 'bad'}>{ok ? '✓' : '×'}</b><div><strong>{query}</strong><small>MySQL &nbsp; <em className={ok ? '' : 'error'}>{info}</em></small></div><time>{time}</time><button onClick={(event) => event.stopPropagation()}>☆</button></article>)}</div>
            <button type="button" className="history-clear" onClick={() => { setHistory([]); setNotice('Query history cleared') }}>♜ Clear history</button>
          </section>
        </aside>

        <section ref={companionPanelRef} className="quest-panel companion-panel">
          <header><h2>♟ AI Companion</h2></header>
          <div className="companion-body">
            <div className={`robot-mini ${aiLoading ? 'thinking' : ''}`} aria-label="SQL assistant robot" />
            <div className="ai-conversation" aria-live="polite">
              {aiLoading ? (
                <div className="ai-thinking">
                  <div className="thinking-dots" aria-hidden="true"><i /><i /><i /></div>
                  <h3>{aiMode.charAt(0).toUpperCase() + aiMode.slice(1)} AI is thinking</h3>
                  <p>{thinkingMessages[thinkingStep]}</p>
                </div>
              ) : <AiAnswer answer={aiAnswer} />}
            </div>
          </div>
        </section>
      </section>

      <section className="quest-continuation">
        <article className="quest-panel compact-card analysis-card">
          <div className="analysis-card-title"><h3>Execution Plan</h3><button type="button" onClick={generateExecutionPlan} disabled={executionPlan.loading}>{executionPlan.loading ? 'Planning...' : 'Generate plan'}</button></div>
          {executionPlan.error && <p className="analysis-error">{executionPlan.error}</p>}
          {!executionPlan.loading && !executionPlan.error && !executionPlan.data && <p className="analysis-empty">Generate a real database EXPLAIN plan for the query currently in the editor.</p>}
          {executionPlan.loading && <div className="analysis-loading"><i /> Asking the database for its execution strategy...</div>}
          {executionPlan.data && <div className="plan-results">
            <div className="analysis-summary"><b>{executionPlan.data.parsed?.query_type}</b><span>{executionPlan.data.plan?.step_count || 0} plan step(s)</span></div>
            {executionPlan.data.plan?.strategy && <p className="analysis-plan-note">{executionPlan.data.plan.strategy}</p>}
            {executionPlan.data.plan?.steps?.map((step, index) => executionPlan.data.plan?.plan_kind === 'operation'
              ? <section key={`${step.operation}-${index}`} className="plan-step operation-step">
                <strong>{step.operation}</strong>
                <span>Object: {step.object || 'current database'}</span>
                <span>Risk: {step.risk || 'unknown'}</span>
                <small>{step.detail}</small>
              </section>
              : <section key={`${step.id}-${step.table}-${index}`} className="plan-step">
                <strong>{step.table || 'Derived result'}</strong>
                <span>Access: {step.access_type || 'n/a'}</span>
                <span>Index: {step.key || 'none'}</span>
                <span>Estimated rows: {step.estimated_rows ?? 'n/a'}</span>
                <span>Filtered: {step.filtered_percent ?? 'n/a'}%</span>
                {step.extra && <small>{step.extra}</small>}
              </section>)}
          </div>}
        </article>
        <article className="quest-panel compact-card analysis-card">
          <div className="analysis-card-title"><h3>Static Analysis</h3><button type="button" onClick={runStaticAnalysis} disabled={staticAnalysis.loading}>{staticAnalysis.loading ? 'Checking...' : 'Analyze query'}</button></div>
          {staticAnalysis.error && <p className="analysis-error">{staticAnalysis.error}</p>}
          {!staticAnalysis.loading && !staticAnalysis.error && !staticAnalysis.data && <p className="analysis-empty">Check syntax, schema objects, safety, style, and optimization signals without executing the query.</p>}
          {staticAnalysis.loading && <div className="analysis-loading"><i /> Parsing and validating the current SQL...</div>}
          {staticAnalysis.data && <div className="static-results">
            <div className="analysis-summary">
              <b className={staticAnalysis.data.static_analysis?.issues?.length ? 'has-issues' : ''}>{staticAnalysis.data.static_analysis?.issues?.length ? 'Issues found' : '✓ No blocking issues'}</b>
              <span>{staticAnalysis.data.parsed?.query_type || 'SQL'}</span>
              <span>Score: {staticAnalysis.data.analysis?.performance_score ?? 'n/a'} / 100</span>
              <span>Complexity: {staticAnalysis.data.analysis?.complexity || 'n/a'}</span>
            </div>
            {staticAnalysis.data.static_analysis?.issues?.map((issue, index) => <p key={`${issue.category}-${index}`} className={`analysis-finding ${issue.severity}`}><strong>{issue.category}</strong>{issue.message}</p>)}
            {staticAnalysis.data.static_analysis?.style_warnings?.map((warning) => <p key={warning} className="analysis-finding style"><strong>Style</strong>{warning}</p>)}
            {staticAnalysis.data.static_analysis?.optimizations?.map((suggestion) => <p key={suggestion} className="analysis-finding optimization"><strong>Optimization</strong>{suggestion}</p>)}
            {!staticAnalysis.data.static_analysis?.issues?.length && !staticAnalysis.data.static_analysis?.style_warnings?.length && !staticAnalysis.data.static_analysis?.optimizations?.length && <p className="analysis-clean">No syntax, schema, safety, style, or obvious optimization issue was detected.</p>}
          </div>}
        </article>
        <article className="quest-panel chart-card slow-insights-card">
          <div className="slow-insights-header">
            <div><h3>Slow Query Insights</h3><p>The five slowest real executions recorded today.</p></div>
            <span>Today</span>
          </div>
          {!slowestQueries.length ? (
            <div className="slow-insights-empty"><strong>No measured queries yet</strong><span>Run a query to start collecting real execution timings.</span></div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={230}>
                <BarChart data={slowestQueries} layout="vertical" margin={{ top: 8, right: 35, bottom: 8, left: 10 }}>
                  <CartesianGrid stroke="rgba(154,139,255,.2)" horizontal={false} />
                  <XAxis type="number" stroke="#aea5d8" fontSize={11} tickFormatter={formatDuration} />
                  <YAxis type="category" dataKey="label" width={245} stroke="#aea5d8" fontSize={11} />
                  <Tooltip content={<SlowQueryTooltip />} cursor={{ fill: 'rgba(154,139,255,.08)' }} />
                  <Bar dataKey="execution_time_ms" radius={[0, 6, 6, 0]}>
                    {slowestQueries.map((item) => <Cell key={item.id} fill={item.tone === 'slow' ? '#ff557c' : item.tone === 'moderate' ? '#ffc83d' : '#32e69a'} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="slow-query-list">
                {slowestQueries.map((item, index) => (
                  <section key={item.id} className="slow-query-item">
                    <div>
                      <strong>{index + 1}. {item.label}</strong>
                      <small>{item.row_count ?? 0} rows • {item.status} • {item.performance_reason || 'No performance signal recorded'} • {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small>
                    </div>
                    <span className={`speed-label ${item.tone}`}>{formatDuration(item.execution_time_ms)} {item.tone === 'slow' ? 'SLOW' : ''}</span>
                    <button type="button" onClick={() => loadHistoryQuery(item.sql)}>Load query</button>
                    <button type="button" onClick={() => { setSql(item.sql); action('Optimize', item.sql) }}>Optimize AI</button>
                  </section>
                ))}
              </div>
            </>
          )}
        </article>
      </section>
      <div className="quest-bottom-status"><span>● Connected to MySQL</span><span>✦ All systems operational</span><span>◉ Auto-saved 2m ago</span></div>
    </div>
  )
}
