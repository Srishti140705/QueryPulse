from pydantic import BaseModel
from fastapi import FastAPI
from app.api.parser import SQLParser
from app.api.analyzer import QueryAnalyzer
from app.api.query_executor import QueryExecutor

app = FastAPI()

class QueryRequest(BaseModel):
    query: str

@app.post("/query")
def execute_query(request: QueryRequest):
    parser = SQLParser()
    executor = QueryExecutor()

    # Attempt to determine query type using the parser; fall back to first token
    try:
        parsed = parser.parse(request.query)
        qtype = (parsed.get("query_type") or "").upper()
    except Exception:
        qtype = request.query.strip().split()[0].upper() if request.query and request.query.strip() else ""

    try:
        if qtype == "SELECT":
            result = executor.execute_select(request.query)
        elif qtype in {"INSERT", "UPDATE", "DELETE"}:
            result = executor.execute_write(request.query)
        else:
            return {"error": f"Unsupported or unrecognized query type: {qtype}"}

        return {"query": request.query, "result": result}

    except Exception as e:
        return {"error": str(e)}

@app.get("/")
def home():
    return {
        "message": "Welcome to QueryPulse!"
    }

@app.get("/health")
def health():
    return {
        "status": "healthy",
        "project": "QueryPulse"
    }

@app.post("/analyze")
def analyze_query(request: QueryRequest):
    parser = SQLParser()
    analyzer = None

    try:
        parsed = parser.parse(request.query)
        analyzer = QueryAnalyzer(parsed)
        analysis = analyzer.analyze()

        return {
            "parsed": parsed,
            "analysis": analysis,
        }

    except Exception as e:
        return {"error": str(e)}