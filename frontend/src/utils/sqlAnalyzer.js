export function analyzeSQL(sql) {
  const warnings = [];

  const query = sql
    .replace(/--[^\r\n]*/g, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .trim();

  // Rule 1
  if (/\bSELECT\s+(?:DISTINCT\s+)?\*/i.test(query)) {
    warnings.push({
      type: "warning",
      title: "Avoid SELECT *",
      message: "Specify only the required columns instead of using SELECT *.",
    });
  }

  // Rule 2
  if (/^DELETE\b/i.test(query) && !/\bWHERE\b/i.test(query)) {
    warnings.push({
      type: "warning",
      title: "DELETE without WHERE",
      message: "This query will delete every row in the table.",
    });
  }

  // Rule 3
  if (/^UPDATE\b/i.test(query) && !/\bWHERE\b/i.test(query)) {
    warnings.push({
      type: "warning",
      title: "UPDATE without WHERE",
      message: "This query updates every row in the table.",
    });
  }

  // Rule 4
  const joins = [...query.matchAll(/\b(?:INNER\s+|LEFT\s+(?:OUTER\s+)?|RIGHT\s+(?:OUTER\s+)?|FULL\s+(?:OUTER\s+)?|CROSS\s+)?JOIN\b/gi)];
  const hasJoinWithoutCondition = joins.some((join, index) => {
    const nextJoinStart = joins[index + 1]?.index ?? query.length;
    return !/\b(?:ON|USING)\b/i.test(query.slice(join.index + join[0].length, nextJoinStart));
  });

  if (hasJoinWithoutCondition) {
    warnings.push({
      type: "warning",
      title: "Possible Cartesian Join",
      message:
        "A JOIN is missing an ON or USING condition and may return a Cartesian product.",
    });
  }

  return warnings;
}