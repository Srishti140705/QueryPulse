import { executeQuery } from "../services/queryService";
import React, { useEffect, useState } from "react";

export default function QueryEditor() {
  const [sql, setSql] = useState('SELECT id, name, email FROM users WHERE active = 1 ORDER BY last_login DESC;')
  const [message, setMessage] = useState(null)
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState([])
  const [favorites, setFavorites] = useState([])
  const [executionTime, setExecutionTime] = useState(0)
  const [searchTerm, setSearchTerm] = useState("")
  useEffect(() => {

  const savedHistory = localStorage.getItem("queryHistory")

  if (savedHistory) {
    setHistory(JSON.parse(savedHistory))
  }

}, [])

useEffect(() => {

  const savedFavorites = localStorage.getItem("favoriteQueries")

  if (savedFavorites) {
    setFavorites(JSON.parse(savedFavorites))
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

setExecutionTime(
  elapsed < 1 ? "< 1" : Math.round(elapsed)
)

    

console.log("History Updated")
    setLoading(false)

    console.log("Backend Response:", response)

    setMessage({
      type: "success",
      text: "Query executed successfully."
    })

    window.setTimeout(() => setMessage(null), 3000)

  } catch (error) {

    setLoading(false)

    console.error(error)

    setMessage({
      type: "error",
      text:
      error.response?.data?.error ||
      error.message ||
      "Failed to execute query."
    })

    window.setTimeout(() => setMessage(null), 3000)

  }
}

  function handleFormat() {
    setMessage({ type: 'success', text: 'Formatted query successfully.' })
    window.setTimeout(() => setMessage(null), 3000)
  }
  function exportToCSV() {

  if (filteredResults.length === 0) return

  const headers = Object.keys(results[0]).join(",")

  const rows = results.map(row =>
    Object.values(row).join(",")
  )

  const csvContent = [headers, ...rows].join("\n")

  const blob = new Blob([csvContent], {
    type: "text/csv;charset=utf-8;"
  })

  const url = URL.createObjectURL(blob)

  const link = document.createElement("a")

  link.href = url

  link.download = "query_results.csv"

  link.click()

  URL.revokeObjectURL(url)

}
const filteredResults = results.filter((row) =>
  Object.values(row)
    .join(" ")
    .toLowerCase()
    .includes(searchTerm.toLowerCase())
)

  return (
    <div className="max-w-7xl mx-auto grid gap-6 xl:grid-cols-[1.7fr_0.9fr]">
      <div className="space-y-6">
        <section className="rounded-[2rem] border border-[var(--border)] bg-[var(--panel)] p-6 shadow-glow">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-[var(--accent)]">Query editor</p>
              <h1 className="mt-3 text-3xl font-semibold">Write and preview SQL with confidence</h1>
              <p className="mt-2 max-w-2xl text-[var(--muted)]">Compose SQL, run analysis, and inspect results in a polished, developer-friendly interface.</p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button onClick={handleFormat} className="rounded-3xl bg-[var(--surface)] px-4 py-2 text-sm font-medium text-[var(--text)] hover:bg-[var(--panel)]">Format</button>
              <button onClick={handleRun} 
              disabled={loading}
              className="rounded-3xl btn-accent px-4 py-2 text-sm font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
              >
              {loading ? "Running..." : "Run query"}
              </button>
              <button
  onClick={exportToCSV}
  disabled={results.length === 0}
  className="rounded-3xl bg-[var(--surface)] px-4 py-2 text-sm font-medium text-[var(--text)] hover:bg-[var(--panel)] disabled:opacity-50 disabled:cursor-not-allowed"
>
  Export CSV
</button>
              <button onClick={() => setSql('')} className="rounded-3xl bg-[var(--surface)] px-4 py-2 text-sm font-medium text-[var(--text)] hover:bg-[var(--panel)]">Clear</button>
            </div>
          </div>

          <textarea
            value={sql}
            onChange={(event) => setSql(event.target.value)}
            placeholder="Write your SQL here..."
            rows={14}
            className="mt-6 w-full rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface)] px-5 py-4 font-mono text-sm text-[var(--text)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20"
          />

          <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="rounded-3xl bg-[var(--surface)]/75 p-4 text-sm text-[var(--muted)]">SQL dialect: MySQL • Safety mode: enabled • Timeout: 30s</div>
            {message && (
              <div className={`rounded-3xl px-4 py-3 text-sm ${message.type === 'success' ? 'bg-[var(--success)]/15 text-[var(--success)]' : 'bg-[var(--surface)] text-[var(--text)]'}`}>
                {message.text}
              </div>
            )}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <PanelCard title="Execution plan" description="A preview of the query plan, warnings, and optimization suggestions." />
          <PanelCard title="Static analysis" description="Score, unused columns, missing indexes, and style recommendations." />
        </section>
      </div>

      <aside className="space-y-6">
        <section className="rounded-[2rem] border border-[var(--border)] bg-[var(--panel)] p-6 shadow-glow">

  <div className="flex items-center justify-between">

  <p className="text-sm uppercase tracking-[0.3em] text-[var(--accent)]">
    Query Results
  </p>

  <span className="rounded-full bg-[var(--surface)] px-3 py-1 text-xs text-[var(--muted)]">
  {results.length} {results.length === 1 ? "row" : "rows"} • {executionTime || "--"} ms
</span>
</div>
<div className="mt-4">
  <input
    type="text"
    placeholder="Search results..."
    value={searchTerm}
    onChange={(e) => setSearchTerm(e.target.value)}
    className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm outline-none focus:border-[var(--accent)]"
  />
</div>

  <div className="mt-6 overflow-x-auto rounded-[1.5rem] border border-[var(--border)]">

    {results.length === 0 ? (

      <div className="p-8 text-center text-[var(--muted)]">
        No records found. Execute a SELECT query to display results.
      </div>

    ) : (

      <table className="min-w-full border-collapse">

        <thead className="sticky top-0bg-[var(--surface)] z-10">

          <tr>

            {Object.keys(results[0]).map((column) => (

              <th
                key={column}
                className="px-5 py-3 text-left text-xs uppercase tracking-wider border-b border-[var(--border)] font-semibold"
              >
                {column}
              </th>

            ))}

          </tr>

        </thead>

        <tbody>

          {filteredResults.map((row, index) => (

            <tr
              key={index}
              className={`${index % 2 ===0 ? "bg-[var(--panel)]" : "bg-var(--surface)"} hover: bg-[var(--accent)]/10 transition-colors`}
            >

              {Object.values(row).map((value, i) => (

                <td
                  key={i}
                  className="px-5 py-3 border-b border-[var(--border)] text-sm whitespace-nowrap"
                >
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

        <section className="rounded-[2rem] border border-[var(--border)] bg-[var(--panel)] p-6 shadow-glow">

  <p className="text-sm uppercase tracking-[0.3em] text-[var(--accent)]">
    Query History
  </p>

  <div className="mt-5 space-y-3">

    {history.length === 0 ? (

      <p className="text-sm text-[var(--muted)]">
        No queries executed yet.
      </p>

    ) : (

      history.map((item, index) => (

        <div
  key={index}
  className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3"
>

  <code
    onClick={() => setSql(item)}
    className="block flex-1 truncate text-sm cursor-pointer"
  >
    {item}
  </code>

  <button
    onClick={() => {

    const updatedFavorites = favorites.includes(item)
  ? favorites.filter(query => query !== item)
  : [...favorites, item]

setFavorites(updatedFavorites)

localStorage.setItem(
  "favoriteQueries",
  JSON.stringify(updatedFavorites)
)

    }}
    className="ml-3 text-xl hover:scale-110 transition"
  >

    {favorites.includes(item) ? "⭐" : "☆"}

  </button>

</div>

      ))

    )}

  </div>

</section>
<section className="rounded-[2rem] border border-[var(--border)] bg-[var(--panel)] p-6 shadow-glow">

  <p className="text-sm uppercase tracking-[0.3em] text-[var(--accent)]">
    ⭐ Favorite Queries
  </p>

  <div className="mt-5 space-y-3">

    {favorites.length === 0 ? (

      <p className="text-sm text-[var(--muted)]">
        No favorite queries yet.
      </p>

    ) : (

      favorites.map((item, index) => (

        <div
          key={index}
          onClick={() => setSql(item)}
          className="cursor-pointer rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 hover:border-[var(--accent)] hover:bg-[var(--accent)]/5 transition-all"
        >

          <code className="block truncate text-sm">
            {item}
          </code>

        </div>

      ))

    )}

  </div>

</section>
      </aside>
    </div>
  )
}

function PanelCard({ title, description }) {
  return (
    <div className="rounded-[1.8rem] border border-[var(--border)] bg-[var(--surface)] p-6">
      <h3 className="text-lg font-semibold text-[var(--text)]">{title}</h3>
      <p className="mt-3 text-[var(--muted)] text-sm leading-6">{description}</p>
      <div className="mt-5 rounded-3xl bg-[var(--surface)]/90 p-4 text-sm text-[var(--muted)]">No connected database. Connect your data source to see live results.</div>
    </div>
  )
}



function ReferenceItem({ label, value }) {
  return (
    <div className="flex items-center justify-between rounded-3xl border border-[var(--border)] bg-[var(--surface)]/90 px-4 py-3">
      <span>{label}</span>
      <span className="rounded-full bg-[var(--surface)] px-3 py-1 text-xs text-[var(--muted)]">{value}</span>
    </div>
  )
}
