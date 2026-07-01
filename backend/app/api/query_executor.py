from __future__ import annotations

from typing import Any, Dict, List, Optional

import mysql.connector

from app.database import get_connection, close_connection


class QueryExecutor:
    """Execute SQL queries against the configured MySQL database.

    This class provides two convenience methods:
      - execute_select: for read-only SELECT queries (returns rows)
      - execute_write: for INSERT/UPDATE/DELETE (commits changes)

    Both methods return JSON-friendly dictionaries and ensure connections
    and cursors are closed correctly. SQL errors are caught and returned
    as an "error" string in the result.
    """

    def __init__(self) -> None:
        pass

    def execute_select(self, query: str, params: Optional[tuple] = None) -> Dict[str, Any]:
        """Execute a SELECT query and return rows as a list of dictionaries.

        Args:
            query: The SQL SELECT statement to execute.
            params: Optional tuple of parameters for parameterized queries.

        Returns:
            A dictionary with keys:
              - "rows": List[Dict[str, Any]] (result rows)
              - "row_count": int
              - "error": str (only present on failure)
        """
        conn = None
        cursor = None
        try:
            conn = get_connection()
            cursor = conn.cursor(dictionary=True)
            cursor.execute(query, params or ())
            rows = cursor.fetchall()
            # Ensure all values are JSON-serializable; mysql-connector returns native types
            return {"rows": rows, "row_count": len(rows)}

        except mysql.connector.Error as exc:
            # Return a JSON-friendly error description
            return {"error": str(exc)}

        finally:
            if cursor is not None:
                try:
                    cursor.close()
                except Exception:
                    pass
            if conn is not None:
                try:
                    close_connection(conn)
                except Exception:
                    pass

    def execute_write(self, query: str, params: Optional[tuple] = None) -> Dict[str, Any]:
        """Execute a write query (INSERT/UPDATE/DELETE) and commit the transaction.

        Args:
            query: The SQL statement to execute.
            params: Optional tuple of parameters for parameterized queries.

        Returns:
            A dictionary with keys:
              - "row_count": int (number of affected rows)
              - "last_row_id": Optional[int] (for inserts; may be None)
              - "error": str (only present on failure)
        """
        conn = None
        cursor = None
        try:
            conn = get_connection()
            cursor = conn.cursor()
            cursor.execute(query, params or ())
            affected = cursor.rowcount
            last_id = getattr(cursor, "lastrowid", None)
            # Commit the transaction
            conn.commit()
            return {"row_count": affected, "last_row_id": last_id}

        except mysql.connector.Error as exc:
            # Attempt to rollback on error if possible
            try:
                if conn is not None:
                    conn.rollback()
            except Exception:
                pass
            return {"error": str(exc)}

        finally:
            if cursor is not None:
                try:
                    cursor.close()
                except Exception:
                    pass
            if conn is not None:
                try:
                    close_connection(conn)
                except Exception:
                    pass
