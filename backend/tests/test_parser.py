import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.api.parser import SQLParser
from app.api.statement import operation_plan


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
        result = SQLParser().parse(query, "mysql")

        self.assertEqual(result["query_type"], "SELECT")
        self.assertEqual(result["tables"], ["users", "orders"])
        self.assertIn("u.id", result["columns"])
        self.assertIn("u.active = TRUE", result["where_conditions"])
        self.assertTrue(any("orders" in join for join in result["joins"]))
        self.assertIn("u.id", result["group_by"])
        self.assertIn("u.id DESC", result["order_by"])
        self.assertEqual(result["limit"], 10)
        self.assertEqual(result["aliases"]["u"], "users")

    def test_recognizes_mysql_statement_families(self):
        cases = {
            "SHOW TABLES;": ("SHOW", "read"),
            "DESCRIBE employees;": ("DESCRIBE", "read"),
            "EXPLAIN SELECT * FROM employees;": ("EXPLAIN", "read"),
            "INSERT INTO employees(id, name) VALUES (99, 'x');": ("INSERT", "data-write"),
            "UPDATE employees SET salary = 1 WHERE id = 99;": ("UPDATE", "data-write"),
            "DELETE FROM employees WHERE id = 99;": ("DELETE", "data-write"),
            "CREATE TABLE qp_tmp(id INT);": ("CREATE", "schema"),
            "ALTER TABLE qp_tmp ADD name VARCHAR(20);": ("ALTER", "schema"),
            "DROP TABLE qp_tmp;": ("DROP", "schema"),
            "TRUNCATE TABLE qp_tmp;": ("TRUNCATE", "schema"),
            "RENAME TABLE qp_tmp TO qp_tmp2;": ("RENAME", "schema"),
            "SET @querypulse_test = 1;": ("SET", "administration"),
        }
        for sql, expected in cases.items():
            with self.subTest(sql=sql):
                parsed = SQLParser().parse(sql, "mysql")
                self.assertEqual((parsed["query_type"], parsed["category"]), expected)

    def test_show_tables_has_useful_operation_plan(self):
        parsed = SQLParser().parse("SHOW TABLES;", "mysql")
        plan = operation_plan(parsed)
        self.assertEqual(plan["plan_kind"], "operation")
        self.assertEqual(plan["steps"][0]["operation"], "Read metadata")
        self.assertEqual(plan["steps"][0]["risk"], "read-only")


if __name__ == "__main__":
    unittest.main()
