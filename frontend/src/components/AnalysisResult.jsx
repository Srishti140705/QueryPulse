import React from 'react'

function Badge({ children, color = 'bg-[var(--panel)]' }) {
  return (
    <span className={`inline-block px-2 py-0.5 text-xs rounded ${color} text-[var(--text)]`}>{children}</span>
  )
}

function Card({ title, children }) {
  return (
    <div className="bg-[var(--surface)] rounded-lg p-4 shadow">
      <h4 className="text-sm font-semibold mb-2 text-[var(--text)]">{title}</h4>
      <div className="text-sm text-[var(--muted)]">{children}</div>
    </div>
  )
}

export default function AnalysisResult({ data }) {
  if (!data) return null

  // Support both /analyze response ({ parsed, analysis }) and raw parsed/analysis objects
  const parsed = data.parsed || data
  const analysis = data.analysis || data

  const qtype = parsed?.query_type || '—'
  const tables = parsed?.tables || []
  const columns = parsed?.columns || []
  const where = parsed?.where_conditions || []
  const joins = parsed?.joins || []
  const groupBy = parsed?.group_by || []
  const orderBy = parsed?.order_by || []
  const limit = parsed?.limit ?? null

  const perf = analysis?.performance_score ?? null
  const complexity = analysis?.complexity ?? null
  const warnings = analysis?.warnings || []
  const recomendations = analysis?.recommendations || []
  const estimated_cost = analysis?.estimated_cost || null

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card title="Overview">
          <div className="flex items-center gap-2 mb-2">
            <Badge color="bg-[var(--accent)] text-[var(--accent-text)]">{qtype}</Badge>
            {perf !== null && <Badge color={perf >= 75 ? 'bg-[var(--accent-soft)]' : perf >= 50 ? 'bg-[var(--panel)]' : 'bg-[var(--surface)]'}>Score: {perf}</Badge>}
            {complexity && <Badge color="bg-[var(--panel)]">{complexity}</Badge>}
            {estimated_cost && <Badge color="bg-[var(--panel)]">Cost: {estimated_cost}</Badge>}
          </div>

          <div className="text-xs text-[var(--muted)]">
            <div><strong>Tables:</strong> {tables.length ? tables.join(', ') : '—'}</div>
            <div><strong>Limit:</strong> {limit ?? '—'}</div>
          </div>
        </Card>

        <Card title="Columns & Filters">
          <div className="mb-2">
            <strong>Columns</strong>
            <div className="mt-1 text-xs text-[var(--muted)]">
              {columns.length ? (
                <div className="flex flex-wrap gap-2">{columns.map((c, i) => <Badge key={i} color="bg-[var(--panel)]">{c}</Badge>)}</div>
              ) : (
                <span className="text-[var(--muted)]">—</span>
              )}
            </div>
          </div>

          <div>
            <strong>WHERE</strong>
            <div className="mt-1 text-xs text-slate-300">
              {where.length ? where.map((w, i) => <div key={i} className="py-1">{w}</div>) : <span className="text-slate-500">—</span>}
            </div>
          </div>
        </Card>

        <Card title="Grouping & Ordering">
          <div className="mb-2">
            <strong>GROUP BY</strong>
            <div className="mt-1 text-xs text-slate-300">{groupBy.length ? groupBy.join(', ') : '—'}</div>
          </div>

          <div>
            <strong>ORDER BY</strong>
            <div className="mt-1 text-xs text-slate-300">{orderBy.length ? orderBy.join(', ') : '—'}</div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card title={`JOINS (${joins.length})`}>
          {joins.length ? (
            <div className="space-y-2 text-xs text-[var(--muted)]">
              {joins.map((j, i) => (
                <div key={i} className="p-2 bg-[var(--panel)] rounded">{j}</div>
              ))}
            </div>
          ) : (
            <span className="text-[var(--muted)]">No joins detected</span>
          )}
        </Card>

        <Card title="Aliases">
          <div className="text-xs text-[var(--muted)]">
            {parsed?.aliases && parsed.aliases.length ? (
              <div className="flex flex-wrap gap-2">
                {parsed.aliases.map((a, i) => (
                  <Badge key={i} color="bg-[var(--panel)]">{a.table} → {a.alias}</Badge>
                ))}
              </div>
            ) : (
              <span className="text-[var(--muted)]">—</span>
            )}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card title="Warnings">
          {warnings.length ? (
            <ul className="list-disc list-inside text-[var(--muted)] text-sm space-y-1">
              {warnings.map((w, i) => <li key={i}>{w}</li>)}
            </ul>
          ) : (
            <div className="text-[var(--muted)]">No warnings</div>
          )}
        </Card>

        <Card title="Recommendations">
          {recomendations.length ? (
            <ul className="list-disc list-inside text-[var(--muted)] text-sm space-y-1">
              {recomendations.map((r, i) => <li key={i}>{r}</li>)}
            </ul>
          ) : (
            <div className="text-[var(--muted)]">No recommendations</div>
          )}
        </Card>
      </div>
    </div>
  )
}
