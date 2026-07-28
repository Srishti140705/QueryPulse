from __future__ import annotations

import re
from typing import Any, Optional

from sqlglot import exp


READ_TYPES = {"SELECT", "SHOW", "DESCRIBE", "EXPLAIN", "TABLE", "VALUES"}
DATA_WRITE_TYPES = {"INSERT", "UPDATE", "DELETE", "REPLACE", "LOAD"}
SCHEMA_TYPES = {"CREATE", "ALTER", "DROP", "TRUNCATE", "RENAME"}
TRANSACTION_TYPES = {
    "BEGIN",
    "START",
    "COMMIT",
    "ROLLBACK",
    "SAVEPOINT",
    "RELEASE",
    "LOCK",
    "UNLOCK",
}
ADMIN_TYPES = {
    "ANALYZE",
    "CHECK",
    "FLUSH",
    "GRANT",
    "KILL",
    "OPTIMIZE",
    "REPAIR",
    "REVOKE",
    "SET",
    "USE",
}
KNOWN_TYPES = READ_TYPES | DATA_WRITE_TYPES | SCHEMA_TYPES | TRANSACTION_TYPES | ADMIN_TYPES
NATIVE_EXPLAIN_TYPES = {"SELECT", "INSERT", "UPDATE", "DELETE", "REPLACE"}


def _first_keyword(sql: str) -> str:
    remaining = sql.lstrip()
    while remaining:
        if remaining.startswith("--") or remaining.startswith("#"):
            newline = remaining.find("\n")
            remaining = "" if newline < 0 else remaining[newline + 1 :].lstrip()
            continue
        if remaining.startswith("/*"):
            end = remaining.find("*/", 2)
            remaining = "" if end < 0 else remaining[end + 2 :].lstrip()
            continue
        break
    match = re.match(r"([A-Za-z]+)", remaining)
    return match.group(1).upper() if match else ""


def normalize_query_type(sql: str, expression: Optional[exp.Expression] = None) -> str:
    """Return the user-facing SQL operation, including MySQL command nodes."""
    first = _first_keyword(sql)
    expression_key = (getattr(expression, "key", "") or "").upper()

    if first in KNOWN_TYPES:
        return "BEGIN" if first == "START" and re.match(r"(?is)^\s*START\s+TRANSACTION\b", sql) else first
    if first == "WITH" and expression_key:
        return {
            "TRUNCATETABLE": "TRUNCATE",
            "COMMAND": "WITH",
        }.get(expression_key, expression_key)
    return {
        "TRUNCATETABLE": "TRUNCATE",
        "COMMAND": first or "COMMAND",
    }.get(expression_key, expression_key or first or "UNKNOWN")


def classify_statement(sql: str, expression: Optional[exp.Expression] = None) -> dict[str, Any]:
    query_type = normalize_query_type(sql, expression)
    if query_type in READ_TYPES:
        category = "read"
    elif query_type in DATA_WRITE_TYPES:
        category = "data-write"
    elif query_type in SCHEMA_TYPES:
        category = "schema"
    elif query_type in TRANSACTION_TYPES:
        category = "transaction"
    elif query_type in ADMIN_TYPES:
        category = "administration"
    else:
        category = "command"

    returns_rows = query_type in READ_TYPES
    changes_data = query_type in DATA_WRITE_TYPES
    changes_schema = query_type in SCHEMA_TYPES
    dangerous = query_type in {"DELETE", "DROP", "TRUNCATE"} or (
        query_type == "UPDATE" and not re.search(r"(?is)\bWHERE\b", sql)
    )

    return {
        "query_type": query_type,
        "category": category,
        "returns_rows": returns_rows,
        "changes_data": changes_data,
        "changes_schema": changes_schema,
        "supports_native_explain": query_type in NATIVE_EXPLAIN_TYPES,
        "risk": "high" if dangerous else ("write" if changes_data or changes_schema else "read-only"),
    }


def operation_plan(parsed: dict[str, Any]) -> dict[str, Any]:
    """Describe operations MySQL cannot expose through native EXPLAIN."""
    query_type = parsed.get("query_type") or "SQL"
    category = parsed.get("category") or "command"
    tables = parsed.get("tables") or []
    target = ", ".join(tables) if tables else "current database"

    details = {
        "SHOW": ("Read metadata", "MySQL reads its catalog and returns the requested metadata. No table data is changed."),
        "DESCRIBE": ("Inspect object definition", "MySQL returns column and index metadata for the requested object."),
        "EXPLAIN": ("Request database plan", "The statement itself asks MySQL to describe another statement's execution strategy."),
        "CREATE": ("Create schema object", "MySQL validates the definition and creates the requested schema object."),
        "ALTER": ("Change schema object", "MySQL changes the requested object definition; the operation may rebuild or lock it."),
        "DROP": ("Remove schema object", "MySQL removes the requested object and its stored data."),
        "TRUNCATE": ("Remove all rows", "MySQL quickly removes every row while retaining the table definition."),
        "RENAME": ("Rename schema object", "MySQL changes the object's catalog name without rewriting query results."),
        "SET": ("Change session setting", "MySQL applies the requested setting to this database session."),
        "USE": ("Select database", "MySQL selects a database for this request's connection."),
        "BEGIN": ("Start transaction", "MySQL starts a transaction on this request's database connection."),
        "COMMIT": ("Commit transaction", "MySQL commits pending work on this request's database connection."),
        "ROLLBACK": ("Rollback transaction", "MySQL rolls back pending work on this request's database connection."),
    }
    operation, detail = details.get(
        query_type,
        (f"Run {query_type}", f"MySQL executes this {category} statement using its command processor."),
    )
    return {
        "plan_kind": "operation",
        "strategy": f"MySQL does not provide a native EXPLAIN row plan for {query_type}; this is its operation flow.",
        "steps": [
            {
                "operation": operation,
                "object": target,
                "detail": detail,
                "risk": parsed.get("risk") or "unknown",
            }
        ],
        "step_count": 1,
        "database": "mysql",
    }
