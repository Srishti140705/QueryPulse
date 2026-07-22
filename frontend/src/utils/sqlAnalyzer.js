export function analyzeSQL(sql) {
  const warnings = [];

  const query = sql.trim().toUpperCase();

  // Rule 1
  if (query.includes("SELECT *")) {
    warnings.push({
      type: "warning",
      title: "Avoid SELECT *",
      message: "Specify only the required columns instead of using SELECT *.",
    });
  }

  // Rule 2
  if (query.startsWith("DELETE") && !query.includes("WHERE")) {
    warnings.push({
      type: "error",
      title: "DELETE without WHERE",
      message: "This query will delete every row in the table.",
    });
  }

  // Rule 3
  if (query.startsWith("UPDATE") && !query.includes("WHERE")) {
    warnings.push({
      type: "error",
      title: "UPDATE without WHERE",
      message: "This query updates every row in the table.",
    });
  }

  // Rule 4
  if (
    query.includes(",") &&
    query.includes("FROM") &&
    !query.includes("JOIN")
  ) {
    warnings.push({
      type: "warning",
      title: "Possible Cartesian Join",
      message:
        "Multiple tables detected without an explicit JOIN condition.",
    });
  }

  return warnings;
}