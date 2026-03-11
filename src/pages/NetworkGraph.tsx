
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { ChevronLeft, Network, Search, ZoomIn, ZoomOut, Maximize2, X, User, FileText, MapPin, Car, AlertTriangle, Filter } from "lucide-react"

const NODES = [
  { id: "c1", label: "Rajesh Yadav", type: "criminal", x: 400, y: 300, risk: "high", age: 34, cases: 5, alias: "Raja", area: "BTM Layout" },
  { id: "c2", label: "Vikram Singh", type: "criminal", x: 620, y: 280, risk: "high", age: 41, cases: 8, alias: "Vikki", area: "Jayanagar" },
  { id: "c3", label: "Suresh Kumar", type: "criminal", x: 220, y: 320, risk: "medium", age: 28, cases: 3, alias: "Suri", area: "Koramangala" },
  { id: "c4", label: "Deepak Nair", type: "criminal", x: 750, y: 420, risk: "high", age: 38, cases: 6, alias: "Deep", area: "Hebbal" },
  { id: "c5", label: "Mohan Das", type: "criminal", x: 300, y: 500, risk: "low", age: 25, cases: 1, alias: "Monu", area: "Electronic City" },
  { id: "f1", label: "FIR-4521", type: "case", x: 420, y: 480, risk: "high", crimeType: "Chain Snatching", date: "12 Jan 2024", status: "Open" },
  { id: "f2", label: "FIR-4102", type: "case", x: 520, y: 420, risk: "medium", crimeType: "Robbery", date: "8 Feb 2024", status: "Investigating" },
  { id: "f3", label: "FIR-4498", type: "case", x: 680, y: 500, risk: "high", crimeType: "Assault", date: "3 Mar 2024", status: "Open" },
  { id: "l1", label: "BTM Layout", type: "location", x: 580, y: 180, risk: "medium" },
  { id: "l2", label: "Jayanagar", type: "location", x: 200, y: 180, risk: "high" },
  { id: "l3", label: "Koramangala", type: "location", x: 750, y: 200, risk: "medium" },
  { id: "v1", label: "KA-01-AB-1234", type: "vehicle", x: 400, y: 650, risk: "medium", vehicleType: "Motorcycle", color: "Black" },
  { id: "v2", label: "KA-05-CD-5678", type: "vehicle", x: 180, y: 420, risk: "low", vehicleType: "Car", color: "White" },
]

const EDGES = [
  { from: "c1", to: "c2" }, { from: "c1", to: "c3" }, { from: "c1", to: "f1" },
  { from: "c1", to: "f2" }, { from: "c2", to: "c4" }, { from: "c2", to: "f3" },
  { from: "c2", to: "l1" }, { from: "c3", to: "l2" }, { from: "c3", to: "v2" },
  { from: "c4", to: "f3" }, { from: "c4", to: "l3" }, { from: "c1", to: "v1" },
  { from: "c5", to: "f1" }, { from: "c5", to: "v1" }, { from: "f1", to: "l2" },
  { from: "f2", to: "l1" }, { from: "f3", to: "l3" },
]

const NODE_COLORS: Record<string, { bg: string; border: string; icon: string }> = {
  criminal: { bg: "#dc2626", border: "#f87171", icon: "👤" },
  case: { bg: "#2563eb", border: "#60a5fa", icon: "📋" },
  location: { bg: "#d97706", border: "#fbbf24", icon: "📍" },
  vehicle: { bg: "#16a34a", border: "#4ade80", icon: "🚗" },
}

const RISK_COLORS: Record<string, string> = { high: "#dc2626", medium: "#f97316", low: "#22c55e" }

export default function NetworkGraph() {
  const router = useRouter()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [selected, setSelected] = useState<typeof NODES[0] | null>(null)
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState("All")
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [hoveredNode, setHoveredNode] = useState<string | null>(null)
  const animRef = useRef<number>(0)
  const nodesRef = useRef(NODES.map(n => ({ ...n, vx: 0, vy: 0 })))

  const filteredNodes = nodesRef.current.filter(n =>
    (filter === "All" || n.type === filter.toLowerCase()) &&
    (search === "" || n.label.toLowerCase().includes(search.toLowerCase()))
  )
  const visibleIds = new Set(filteredNodes.map(n => n.id))
  const visibleEdges = EDGES.filter(e => visibleIds.has(e.from) && visibleIds.has(e.to))

  const getNodeAt = (mx: number, my: number) => {
    const canvas = canvasRef.current
    if (!canvas) return null
    const rect = canvas.getBoundingClientRect()
    const cx = (mx - rect.left - pan.x) / zoom
    const cy = (my - rect.top - pan.y) / zoom
    return filteredNodes.find(n => Math.hypot(n.x - cx, n.y - cy) < 22) || null
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const draw = () => {
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.save()
      ctx.translate(pan.x, pan.y)
      ctx.scale(zoom, zoom)

      // Draw edges
      visibleEdges.forEach(edge => {
        const from = filteredNodes.find(n => n.id === edge.from)
        const to = filteredNodes.find(n => n.id === edge.to)
        if (!from || !to) return
        ctx.beginPath()
        ctx.moveTo(from.x, from.y)
        ctx.lineTo(to.x, to.y)
        ctx.strokeStyle = "rgba(100,116,139,0.25)"
        ctx.lineWidth = 1.5
        ctx.stroke()
      })

      // Draw nodes
      filteredNodes.forEach(node => {
        const colors = NODE_COLORS[node.type]
        const isSelected = selected?.id === node.id
        const isHovered = hoveredNode === node.id
        const r = isSelected ? 24 : isHovered ? 22 : 18

        // Glow
        if (isSelected || isHovered) {
          ctx.beginPath()
          ctx.arc(node.x, node.y, r + 10, 0, Math.PI * 2)
          const grad = ctx.createRadialGradient(node.x, node.y, r, node.x, node.y, r + 10)
          grad.addColorStop(0, colors.bg + "40")
          grad.addColorStop(1, "transparent")
          ctx.fillStyle = grad
          ctx.fill()
        }

        // Circle
        ctx.beginPath()
        ctx.arc(node.x, node.y, r, 0, Math.PI * 2)
        ctx.fillStyle = colors.bg
        ctx.fill()
        ctx.strokeStyle = isSelected ? "white" : colors.border
        ctx.lineWidth = isSelected ? 3 : 1.5
        ctx.stroke()

        // Risk ring
        ctx.beginPath()
        ctx.arc(node.x, node.y, r + 4, 0, Math.PI * 2)
        ctx.strokeStyle = RISK_COLORS[(node as any).risk || "low"] + "60"
        ctx.lineWidth = 2
        ctx.stroke()

        // Label
        ctx.fillStyle = isSelected ? "white" : "#cbd5e1"
        ctx.font = `${isSelected ? "bold " : ""}11px Inter,sans-serif`
        ctx.textAlign = "center"
        ctx.fillText(node.label, node.x, node.y + r + 14)
      })

      ctx.restore()
      animRef.current = requestAnimationFrame(draw)
    }

    animRef.current = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(animRef.current)
  }, [selected, hoveredNode, zoom, pan, filter, search])

  const handleMouseMove = (e: React.MouseEvent) => {
    if (dragging) {
      setPan(p => ({ x: p.x + e.movementX, y: p.y + e.movementY }))
      return
    }
    const node = getNodeAt(e.clientX, e.clientY)
    setHoveredNode(node?.id || null)
    if (canvasRef.current) canvasRef.current.style.cursor = node ? "pointer" : "grab"
  }

  const handleClick = (e: React.MouseEvent) => {
    const node = getNodeAt(e.clientX, e.clientY)
    setSelected(node || null)
  }

  const stats = {
    criminals: NODES.filter(n => n.type === "criminal").length,
    cases: NODES.filter(n => n.type === "case").length,
    locations: NODES.filter(n => n.type === "location").length,
    vehicles: NODES.filter(n => n.type === "vehicle").length,
  }

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: "#070d1a", color: "white", fontFamily: "Inter,sans-serif" }}>

      {/* Topbar */}
      <div style={{ height: "52px", minHeight: "52px", display: "flex", alignItems: "center", padding: "0 16px", background: "rgba(10,15,30,0.98)", borderBottom: "1px solid rgba(255,255,255,0.06)", gap: "12px", zIndex: 100 }}>
        <button onClick={() => router.push("/dashboard")}
          style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", fontSize: "13px" }}>
          <ChevronLeft size={16} /> Back
        </button>
        <div style={{ width: "1px", height: "20px", background: "rgba(255,255,255,0.08)" }} />
        <Network size={15} color="#06B6D4" />
        <span style={{ fontWeight: 700, fontSize: "14px" }}>Criminal Network Graph</span>

        {/* Search */}
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "8px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", padding: "6px 12px", width: "220px" }}>
          <Search size={13} color="#64748b" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search nodes..."
            style={{ background: "none", border: "none", outline: "none", color: "white", fontSize: "12px", width: "100%" }} />
        </div>

        {/* Zoom controls */}
        <div style={{ display: "flex", gap: "4px" }}>
          {[
            { icon: ZoomIn, action: () => setZoom(z => Math.min(z + 0.2, 3)) },
            { icon: ZoomOut, action: () => setZoom(z => Math.max(z - 0.2, 0.3)) },
            { icon: Maximize2, action: () => { setZoom(1); setPan({ x: 0, y: 0 }) } },
          ].map(({ icon: Icon, action }, i) => (
            <button key={i} onClick={action}
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "6px", padding: "6px", cursor: "pointer", color: "#64748b", display: "flex" }}>
              <Icon size={14} />
            </button>
          ))}
        </div>
      </div>

      {/* Filter tabs */}
      <div style={{ display: "flex", alignItems: "center", gap: "4px", padding: "8px 16px", background: "rgba(10,15,30,0.9)", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
        <Filter size={12} color="#64748b" style={{ marginRight: "4px" }} />
        {["All", "Criminal", "Case", "Location", "Vehicle"].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            style={{
              padding: "4px 12px", borderRadius: "20px", border: "none", cursor: "pointer", fontSize: "12px", fontWeight: 600, transition: "all 0.15s",
              background: filter === f ? NODE_COLORS[f.toLowerCase()]?.bg || "#06B6D4" : "rgba(255,255,255,0.04)",
              color: filter === f ? "white" : "#64748b",
            }}>
            {f}
          </button>
        ))}
        <div style={{ marginLeft: "auto", display: "flex", gap: "16px" }}>
          {[
            { label: "Criminals", val: stats.criminals, color: "#dc2626" },
            { label: "Cases", val: stats.cases, color: "#2563eb" },
            { label: "Locations", val: stats.locations, color: "#d97706" },
            { label: "Vehicles", val: stats.vehicles, color: "#16a34a" },
          ].map(s => (
            <div key={s.label} style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "11px", color: "#64748b" }}>
              <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: s.color }} />
              {s.label}: <strong style={{ color: "white" }}>{s.val}</strong>
            </div>
          ))}
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

        {/* Canvas */}
        <div style={{ flex: 1, position: "relative" }}>
          <canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block" }}
            onClick={handleClick}
            onMouseMove={handleMouseMove}
            onMouseDown={e => { setDragging(true); setDragStart({ x: e.clientX, y: e.clientY }) }}
            onMouseUp={() => setDragging(false)}
            onMouseLeave={() => setDragging(false)}
            onWheel={e => setZoom(z => Math.max(0.3, Math.min(3, z - e.deltaY * 0.001)))}
          />

          {/* Hint overlay */}
          {!selected && (
            <div style={{ position: "absolute", bottom: "16px", left: "50%", transform: "translateX(-50%)", background: "rgba(10,15,30,0.8)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "8px", padding: "8px 16px", fontSize: "11px", color: "#475569", backdropFilter: "blur(8px)", whiteSpace: "nowrap" }}>
              Click a node to explore · Drag to pan · Scroll to zoom
            </div>
          )}
        </div>

        {/* Detail Panel */}
        {selected && (
          <div style={{ width: "300px", minWidth: "300px", background: "rgba(10,15,30,0.97)", borderLeft: "1px solid rgba(255,255,255,0.07)", display: "flex", flexDirection: "column", overflow: "auto" }}>
            <div style={{ padding: "16px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: NODE_COLORS[selected.type].bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px" }}>
                  {NODE_COLORS[selected.type].icon}
                </div>
                <div>
                  <p style={{ fontSize: "13px", fontWeight: 700 }}>{selected.label}</p>
                  <p style={{ fontSize: "11px", color: "#64748b", textTransform: "capitalize" }}>{selected.type}</p>
                </div>
              </div>
              <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", color: "#475569", cursor: "pointer", display: "flex" }}>
                <X size={16} />
              </button>
            </div>

            <div style={{ padding: "14px 16px", flex: 1, display: "flex", flexDirection: "column", gap: "12px" }}>

              {/* Risk badge */}
              {(selected as any).risk && (
                <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 12px", background: "rgba(255,255,255,0.03)", borderRadius: "8px", border: `1px solid ${RISK_COLORS[(selected as any).risk]}30` }}>
                  <AlertTriangle size={14} color={RISK_COLORS[(selected as any).risk]} />
                  <span style={{ fontSize: "12px", color: RISK_COLORS[(selected as any).risk], fontWeight: 700, textTransform: "capitalize" }}>
                    {(selected as any).risk} Risk
                  </span>
                </div>
              )}

              {/* Criminal details */}
              {selected.type === "criminal" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {[
                    ["Alias", (selected as any).alias],
                    ["Age", (selected as any).age + " years"],
                    ["Known Cases", (selected as any).cases],
                    ["Last Known Area", (selected as any).area],
                  ].map(([label, val]) => (
                    <div key={label as string} style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", background: "rgba(255,255,255,0.03)", borderRadius: "7px" }}>
                      <span style={{ fontSize: "12px", color: "#64748b" }}>{label}</span>
                      <span style={{ fontSize: "12px", fontWeight: 600 }}>{val}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Case details */}
              {selected.type === "case" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {[
                    ["Crime Type", (selected as any).crimeType],
                    ["Date", (selected as any).date],
                    ["Status", (selected as any).status],
                  ].map(([label, val]) => (
                    <div key={label as string} style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", background: "rgba(255,255,255,0.03)", borderRadius: "7px" }}>
                      <span style={{ fontSize: "12px", color: "#64748b" }}>{label}</span>
                      <span style={{ fontSize: "12px", fontWeight: 600, color: val === "Open" ? "#dc2626" : val === "Investigating" ? "#f97316" : "#22c55e" }}>{val}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Vehicle details */}
              {selected.type === "vehicle" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {[
                    ["Type", (selected as any).vehicleType],
                    ["Color", (selected as any).color],
                    ["Plate", selected.label],
                  ].map(([label, val]) => (
                    <div key={label as string} style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", background: "rgba(255,255,255,0.03)", borderRadius: "7px" }}>
                      <span style={{ fontSize: "12px", color: "#64748b" }}>{label}</span>
                      <span style={{ fontSize: "12px", fontWeight: 600 }}>{val}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Connections */}
              <div>
                <p style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.08em", color: "#64748b", textTransform: "uppercase", marginBottom: "8px" }}>
                  Connections ({EDGES.filter(e => e.from === selected.id || e.to === selected.id).length})
                </p>
                {EDGES.filter(e => e.from === selected.id || e.to === selected.id).map((edge, i) => {
                  const connId = edge.from === selected.id ? edge.to : edge.from
                  const conn = NODES.find(n => n.id === connId)
                  if (!conn) return null
                  return (
                    <div key={i} onClick={() => setSelected(conn as any)}
                      style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 12px", background: "rgba(255,255,255,0.03)", borderRadius: "7px", cursor: "pointer", marginBottom: "4px", border: "1px solid rgba(255,255,255,0.04)" }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = "rgba(6,182,212,0.2)"}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.04)"}>
                      <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: NODE_COLORS[conn.type].bg, flexShrink: 0 }} />
                      <span style={{ fontSize: "12px" }}>{conn.label}</span>
                      <span style={{ marginLeft: "auto", fontSize: "10px", color: "#475569", textTransform: "capitalize" }}>{conn.type}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        canvas { cursor: grab; }
        canvas:active { cursor: grabbing; }
      `}</style>
    </div>
  )
}
