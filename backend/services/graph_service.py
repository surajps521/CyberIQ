# backend/services/graph_service.py

from neo4j import GraphDatabase

# Connect to Neo4j Aura (your cloud database)
driver = GraphDatabase.driver(
    "neo4j+s://d45c1a83.databases.neo4j.io",
    auth=("neo4j", "tPwfuOD2ulIYtcSmOjcAj0aAO8V55YwwygSI0jVxJus")
)

# ── STEP A: Upload mock data to Neo4j ────────────────────
def seed_graph(cases: list):
    """
    Creates nodes and relationships from your mock case data.
    Run this ONCE to populate Neo4j.
    """
    with driver.session() as session:
        for case in cases:
            # MERGE = create if doesn't exist, skip if it does
            session.run("""
                MERGE (criminal:Criminal {name: $accused})
                MERGE (c:Case {
                    id: $case_id,
                    type: $type,
                    status: $status,
                    date: $date
                })
                MERGE (loc:Location {
                    district: $district,
                    lat: $lat,
                    lng: $lng
                })
                MERGE (criminal)-[:INVOLVED_IN]->(c)
                MERGE (c)-[:OCCURRED_IN]->(loc)
            """,
            accused=case["accused_name"],
            case_id=case["case_id"],
            type=case["type"],
            status=case["status"],
            date=case["date"],
            district=case["district"],
            lat=case["lat"],
            lng=case["lng"]
            )

            # Add associate relationships
            for associate in case.get("associates", []):
                session.run("""
                    MERGE (a:Criminal {name: $associate})
                    MERGE (b:Criminal {name: $accused})
                    MERGE (a)-[:ASSOCIATE_OF]->(b)
                """,
                associate=associate,
                accused=case["accused_name"]
                )

    print("✅ Neo4j graph seeded!")


# ── STEP B: Query criminal network ───────────────────────
def get_criminal_network(name: str) -> dict:
    """
    Returns all connections for a given criminal.
    Frontend uses this data to draw the graph visualization.
    """
    with driver.session() as session:
        result = session.run("""
            MATCH (c:Criminal {name: $name})-[r]-(connected)
            RETURN c, type(r) as relationship, connected, labels(connected) as types
            LIMIT 50
        """, name=name)

        nodes = {}
        edges = []

        for record in result:
            # Add the main criminal node
            main = record["c"]
            nodes[main["name"]] = {
                "id": main["name"],
                "label": main["name"],
                "type": "criminal",
                "color": "#DC2626"   # Red
            }

            # Add connected node
            connected = record["connected"]
            node_type = record["types"][0].lower()  # "criminal", "case", "location"

            # Pick color based on node type
            colors = {
                "criminal": "#DC2626",   # Red
                "case": "#1E3A8A",       # Blue
                "location": "#D97706"    # Orange
            }

            node_id = connected.get("name") or connected.get("id", "unknown")
            nodes[node_id] = {
                "id": node_id,
                "label": node_id,
                "type": node_type,
                "color": colors.get(node_type, "#6B7280")
            }

            # Add the edge between them
            edges.append({
                "source": main["name"],
                "target": node_id,
                "label": record["relationship"]
            })

        return {
            "nodes": list(nodes.values()),
            "edges": edges
        }