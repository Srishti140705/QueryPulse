import React from 'react'

function Badge({ children, color = 'bg-[var(--surface)]' }) {
  return (
    <span className={`inline-flex rounded-lg px-2.5 py-1 font-code text-xs ${color} text-[var(--text)]`}>
      {children}
    </span>
  )
}

function Card({ title, children }) {
  return (
    <div className="ide-surface h-full p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--accent)]/60">
      <h4 className="font-heading mb-3 text-sm font-semibold text-[var(--text)]">{title}</h4>
      <div className="text-sm text-[var(--muted)]">{children}</div>
    </div>
  )
}

export default function AnalysisResult({ data }) {
  if (!data) return null

  const parsed = data.parsed || data
  const analysis = data.analysis || data

  const qtype = parsed?.query_type || '--'
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
  const recommendations = analysis?.recommendations || []
  const estimatedCost = analysis?.estimated_cost || null

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 items-stretch gap-4 md:grid-cols-3">
        <Card title="Overview">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Badge color="bg-[var(--accent)] text-[var(--accent-text)]">{qtype}</Badge>
            {perf !== null && <Badge color={perf >= 75 ? 'bg-emerald-400/15 text-emerald-200' : perf >= 50 ? 'bg-[var(--surface)]' : 'bg-rose-400/15 text-rose-200'}>Score: {perf}</Badge>}
            {complexity && <Badge>{complexity}</Badge>}
            {estimatedCost && <Badge>Cost: {estimatedCost}</Badge>}
          </div>

          <div className="font-code space-y-2 text-xs text-[var(--muted)]">
            <div><strong className="text-[var(--text)]">Tables:</strong> {tables.length ? tables.join(', ') : '--'}</div>
            <div><strong className="text-[var(--text)]">Limit:</strong> {limit ?? '--'}</div>
          </div>
        </Card>

        <Card title="Columns & Filters">
          <div className="mb-3">
            <strong className="text-[var(--text)]">Columns</strong>
            <div className="mt-2 text-xs text-[var(--muted)]">
              {columns.length ? (
                <div className="flex flex-wrap gap-2">{columns.map((column, index) => <Badge key={index}>{column}</Badge>)}</div>
              ) : (
                <span>--</span>
              )}
            </div>
          </div>

          <div>
            <strong className="text-[var(--text)]">WHERE</strong>
            <div className="font-code mt-2 text-xs text-[var(--muted)]">
              {where.length ? where.map((condition, index) => <div key={index} className="py-1">{condition}</div>) : <span>--</span>}
            </div>
          </div>
        </Card>

        <Card title="Grouping & Ordering">
          <div className="mb-3">
            <strong className="text-[var(--text)]">GROUP BY</strong>
            <div className="font-code mt-2 text-xs text-[var(--muted)]">{groupBy.length ? groupBy.join(', ') : '--'}</div>
          </div>

          <div>
            <strong className="text-[var(--text)]">ORDER BY</strong>
            <div className="font-code mt-2 text-xs text-[var(--muted)]">{orderBy.length ? orderBy.join(', ') : '--'}</div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-2">
        <Card title={`JOINS (${joins.length})`}>
          {joins.length ? (
            <div className="space-y-2 font-code text-xs text-[var(--muted)]">
              {joins.map((join, index) => (
                <div key={index} className="rounded-lg bg-[var(--panel)] p-2">{join}</div>
              ))}
            </div>
          ) : (
            <span>No joins detected</span>
          )}
        </Card>

        <Card title="Aliases">
          <div className="text-xs text-[var(--muted)]">
            {parsed?.aliases && parsed.aliases.length ? (
              <div className="flex flex-wrap gap-2">
                {parsed.aliases.map((alias, index) => (
                  <Badge key={index}>{alias.table} -> {alias.alias}</Badge>
                ))}
              </div>
            ) : (
              <span>--</span>
            )}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 items-stretch gap-4 md:grid-cols-2">
        <Card title="Warnings">
          {warnings.length ? (
            <ul className="list-inside list-disc space-y-1 text-sm text-[var(--muted)]">
              {warnings.map((warning, index) => <li key={index}>{warning}</li>)}
            </ul>
          ) : (
            <div>No warnings</div>
          )}
        </Card>

        <Card title="Recommendations">
          {recommendations.length ? (
            <ul className="list-inside list-disc space-y-1 text-sm text-[var(--muted)]">
              {recommendations.map((recommendation, index) => <li key={index}>{recommendation}</li>)}
            </ul>
          ) : (
            <div>No recommendations</div>
          )}
        </Card>
      </div>
    </div>
  )
}
