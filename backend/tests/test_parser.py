import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "backend"))

from app.api.parser import SQLParser


class SqlParserTests(unittest.TestCase):
    def test_parses_select_query(self):
        query = (
            "SELECT u.id, CONCAT(u.first_name, ' ', u.last_name) AS full_name "
            "FROM users AS u "
            "JOIN orders AS o ON u.id = o.user_id "
            "WHERE u.active = TRUE "
            "GROUP BY u.id "
            "ORDER BY u.id DESC "
            "LIMIT 10"
        )

        parser = SQLParser()
        result = parser.parse(query)

        self.assertEqual(result["query_type"], "SELECT")
        self.assertEqual(result["table_names"], ["users", "orders"])
        self.assertIn("u.id", result["selected_columns"])
        self.assertIn("CONCAT(u.first_name, ' ', u.last_name) AS full_name", result["selected_columns"])
        self.assertIn("u.active = TRUE", result["where_conditions"])
        self.assertTrue(any("orders" in join for join in result["join_clauses"]))
        self.assertIn("u.id", result["group_by_columns"])
        self.assertIn("u.id DESC", result["order_by_columns"])
        self.assertEqual(result["limit_clause"], "10")
        self.assertTrue(any(alias["alias"] == "u" for alias in result["aliases"]))


if __name__ == "__main__":
    unittest.main()
