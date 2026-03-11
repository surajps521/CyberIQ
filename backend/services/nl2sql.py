# backend/services/nl2sql.py

from anthropic import Anthropic
import sqlalchemy  # For running SQL on PostgreSQL

client = Anthropic()

# Tell Claude exactly what tables and columns exist
# This is called the "schema" — Claude needs this to write correct SQL
SCHEMA = """
Database Tables (PostgreSQL):

cases(
  case_id VARCHAR PRIMARY KEY,     -- e.g. "KSP-2024-1001"
  type VARCHAR,                    -- "Theft", "Murder", "Robbery" etc
  district VARCHAR,                -- Karnataka district name
  status VARCHAR,                  -- "Open", "Closed", "Under Investigation"
  date DATE,                       -- When the case was filed
  description TEXT,                -- Full case description
  officer_assigned VARCHAR,        -- Name of assigned officer
  lat FLOAT,                       -- GPS latitude
  lng FLOAT                        -- GPS longitude
)

criminals(
  id SERIAL PRIMARY KEY,
  name VARCHAR,
  aliases TEXT,                    -- Nicknames, comma separated
  district VARCHAR,
  active BOOLEAN                   -- Still active criminal?
)

firs(
  id SERIAL PRIMARY KEY,
  case_id VARCHAR REFERENCES cases(case_id),
  content TEXT,                    -- Full FIR text
  filed_date DATE
)
"""

async def nl_to_sql(query: str) -> str:
    """Takes plain English, returns a SQL query string"""

    response = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=500,
        system=f"""You convert natural language questions into PostgreSQL queries.

Here is the exact database schema:
{SCHEMA}

Rules you MUST follow:
1. Return ONLY the SQL query — no explanation, no markdown
2. Always add LIMIT 100 unless user asks for specific count
3. NEVER write DROP, DELETE, UPDATE, INSERT — read-only queries only
4. Use ILIKE instead of = for text matching (case-insensitive)
5. For date ranges use: date >= NOW() - INTERVAL '30 days'
""",
        messages=[{"role": "user", "content": query}]
    )

    sql = response.content[0].text.strip()

    # Remove markdown code blocks if Claude adds them
    # (sometimes it returns ```sql ... ```)
    sql = sql.replace("```sql", "").replace("```", "").strip()
    return sql

async def execute_query(sql: str, db_url: str) -> list:
    """Runs the SQL and returns results as a list of dicts"""
    from sqlalchemy import create_engine, text

    engine = create_engine(db_url)
    with engine.connect() as conn:
        result = conn.execute(text(sql))
        # Convert each row to a dictionary
        columns = result.keys()
        rows = [dict(zip(columns, row)) for row in result.fetchall()]
    return rows

# ── TEST IT ──────────────────────────
if __name__ == "__main__":
    import asyncio

    queries = [
        "Show all murder cases in Bengaluru",
        "How many unsolved cases are there district wise?",
        "List top 5 most recent cybercrime cases"
    ]

    for q in queries:
        sql = asyncio.run(nl_to_sql(q))
        print(f"English: {q}")
        print(f"SQL: {sql}")
        print()
