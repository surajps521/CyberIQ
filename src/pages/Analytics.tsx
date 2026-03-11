
import { useRouter } from "next/navigation"
import { useState } from "react"
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, AreaChart, Area
} from "recharts"
import {
  ChevronLeft, TrendingUp, TrendingDown, Users, FileText,
  AlertTriangle, MapPin, Download, Filter, BarChart3, CheckCircle
} from "lucide-react"

const districtData = [
  { district: "BLR South", cases: 342, solved: 198, active: 144 },
  { district: "BLR North", cases: 287, solved: 201, active: 86 },
  { district: "BLR East", cases: 198, solved: 134, active: 64 },
  { district: "BLR West", cases: 256, solved: 167, active: 89 },
  { district: "Mysuru", cases: 156, solved: 112, active: 44 },
  { district: "Hubli", cases: 124, solved: 89, active: 35 },
  { district: "Mangalore", cases: 118, solved: 76, active: 42 },
]

const monthlyData = [
  { month: "Jan", cases: 118, solved: 89, arrests: 34 },
  { month: "Feb", cases: 142, solved: 98, arrests: 41 },
  { month: "Mar", cases: 128, solved: 102, arrests: 38 },
  { month: "Apr", cases: 155, solved: 118, arrests: 52 },
  { month: "May", cases: 168, solved: 121, arrests: 48 },
  { month: "Jun", cases: 152, solved: 109, arrests: 44 },
  { month: "Jul", cases: 178, solved: 134, arrests: 58 },
  { month: "Aug", cases: 192, solved: 145, arrests: 62 },
  { month: "Sep", cases: 165, solved: 128, arrests: 51 },
  { month: "Oct", cases: 183, solved: 142, arrests: 67 },
  { month: "Nov", cases: 198, solved: 156, arrests: 71 },
  { month: "Dec", cases: 172, solved: 138, arrests: 55 },
]

const crimeTypeData = [
  { name: "Theft", value: 28, color: "#06B6D4" },
  { name: "Robbery", value: 19, color: "#dc2626" },
  { name: "Chain Snatching", value: 16, color: "#f97316" },
  { name: "Cybercrime", value: 14, color: "#8b5cf6" },
  { name: "Vehicle Theft", value: 12, color: "#eab308" },
  { name: "Assault", value: 7, color: "#ec4899" },
  { name: "Other", value: 4, color: "#64748b" },
]

const ALL_CASES = [
  { id: "KSP/BLR/2024/4521", type: "Chain Snatching", area: "Jayanagar", date: "12 Jan 2024", priority: "High", days: 58 },
  { id: "KSP/BLR/2024/4498", type: "Robbery", area: "Koramangala", date: "8 Feb 2024", priority: "High", days: 30 },
  { id: "KSP/MYS/2024/1102", type: "Vehicle Theft", area: "Mysuru Central", date: "15 Feb 2024", priority: "Medium", days: 23 },
  { id: "KSP/BLR/2024/4612", type: "Cybercrime", area: "Whitefield", date: "2 Mar 2024", priority: "Medium", days: 8 },
  { id: "KSP/HBL/2024/0892", type: "Assault", area: "Hubli West", date: "5 Mar 2024", priority: "Low", days: 5 },
  { id: "KSP/BLR/2024/4701", type: "Theft", area: "BTM Layout", date: "1 Mar 2024", priority: "High", days: 9 },
  { id: "KSP/MNG/2024/0341", type: "Robbery", area: "Mangalore Port", date: "28 Feb 2024", priority: "Low", days: 10 },
]

const PRIORITY_COLORS: Record<string, string> = { High: "#dc2626", Medium: "#f97316", Low: "#22c55e" }

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: "rgba(10,15,30,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", padding: "12px 16px", fontFamily: "Inter,sans-serif" }}>
      <p style={{ color: "#94a3b8", fontSize: "11px", marginBottom: "8px", fontWeight: 600 }}>{label}</p>
      {payload.map((p: any) => (
        <div key={p.name} style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
          <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: p.color }} />
          <span style={{ fontSize: "12px", color: "#cbd5e1" }}>{p.name}:</span>
          <span style={{ fontSize: "12px", fontWeight: 700, color: "white" }}>{p.value}</span>
        </div>
      ))}
    </div>
  )
}

export default function Analytics() {
  const router = useRouter()
  const [period, setPeriod] = useState("2024")
  const [activeChart, setActiveChart] = useState("district")
  const [priorityFilter, setPriorityFilter] = useState("All")
  const [exporting, setExporting] = useState(false)
  const [exported, setExported] = useState(false)

  const filteredCases = ALL_CASES.filter(c =>
    priorityFilter === "All" || c.priority === priorityFilter
  )

  const handleExport = () => {
    setExporting(true)
    // Build CSV content
    const headers = ["Case ID", "Crime Type", "Area", "Filed Date", "Priority", "Days Open"]
    const rows = ALL_CASES.map(c => [c.id, c.type, c.area, c.date, c.priority, c.days])
    const csvContent = [headers, ...rows].map(r => r.join(",")).join("\n")

    // Also build summary text
    const summary = `KSP CrimeIQ Analytics Report - ${period}
Generated: ${new Date().toLocaleString()}

SUMMARY
=======
Total FIRs: 12,847 (+12%)
Solved Cases: 8,642 (67.3%)
Active Criminals: 3,421 (+5%)
High Risk Zones: 24

UNSOLVED CASES
==============
${csvContent}
    `
    // Download as text file (PDF requires library - this works without dependencies)
    const blob = new Blob([summary], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `KSP_CrimeIQ_Report_${period}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    setTimeout(() => {
      setExporting(false)
      setExported(true)
      setTimeout(() => setExported(false), 3000)
    }, 1200)
  }

  const kpis = [
    { label: "Total FIRs", value: "12,847", change: "+12%", up: true, icon: FileText, color: "#06B6D4", bg: "rgba(6,182,212,0.1)" },
    { label: "Solved Cases", value: "8,642", change: "67.3%", up: true, icon: Users, color: "#22c55e", bg: "rgba(34,197,94,0.1)" },
    { label: "Active Criminals", value: "3,421", change: "+5%", up: false, icon: AlertTriangle, color: "#dc2626", bg: "rgba(220,38,38,0.1)" },
    { label: "High Risk Zones", value: "24", change: "-3", up: true, icon: MapPin, color: "#f97316", bg: "rgba(249,115,22,0.1)" },
  ]

  return (
    <div style={{ minHeight: "100vh", background: "#070d1a", color: "white", fontFamily: "Inter,sans-serif", display: "flex", flexDirection: "column" }}>

      {/* Topbar */}
      <div style={{ height: "52px", minHeight: "52px", display: "flex", alignItems: "center", padding: "0 24px", background: "rgba(10,15,30,0.98)", borderBottom: "1px solid rgba(255,255,255,0.06)", gap: "12px", position: "sticky", top: 0, zIndex: 100 }}>
        <button onClick={() => router.push("/dashboard")}
          style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", fontSize: "13px" }}>
          <ChevronLeft size={16} /> Back
        </button>
        <div style={{ width: "1px", height: "20px", background: "rgba(255,255,255,0.08)" }} />
        <BarChart3 size={15} color="#06B6D4" />
        <span style={{ fontWeight: 700, fontSize: "15px" }}>Analytics Dashboard</span>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ display: "flex", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", overflow: "hidden" }}>
            {["2022", "2023", "2024"].map(y => (
              <button key={y} onClick={() => setPeriod(y)}
                style={{ padding: "5px 14px", border: "none", cursor: "pointer", fontSize: "12px", fontWeight: 600, background: period === y ? "#06B6D4" : "transparent", color: period === y ? "white" : "#64748b", transition: "all 0.15s" }}>
                {y}
              </button>
            ))}
          </div>
          <button onClick={handleExport} disabled={exporting}
            style={{ display: "flex", alignItems: "center", gap: "6px", padding: "6px 14px", background: exported ? "rgba(34,197,94,0.15)" : "rgba(6,182,212,0.1)", border: `1px solid ${exported ? "rgba(34,197,94,0.3)" : "rgba(6,182,212,0.2)"}`, borderRadius: "8px", color: exported ? "#22c55e" : "#06B6D4", cursor: exporting ? "wait" : "pointer", fontSize: "12px", fontWeight: 600, transition: "all 0.3s" }}>
            {exporting ? (
              <><div style={{ width: "12px", height: "12px", border: "2px solid rgba(6,182,212,0.3)", borderTop: "2px solid #06B6D4", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} /> Exporting...</>
            ) : exported ? (
              <><CheckCircle size={13} /> Downloaded!</>
            ) : (
              <><Download size={13} /> Export Report</>
            )}
          </button>
        </div>
      </div>

      <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>

        {/* KPI Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "16px" }}>
          {kpis.map(kpi => (
            <div key={kpi.label} style={{ background: "rgba(15,23,42,0.7)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "14px", padding: "20px", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: kpi.color, opacity: 0.7 }} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: kpi.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <kpi.icon size={18} color={kpi.color} />
                </div>
                <span style={{ fontSize: "12px", fontWeight: 700, color: kpi.up ? "#22c55e" : "#dc2626", display: "flex", alignItems: "center", gap: "3px" }}>
                  {kpi.up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                  {kpi.change}
                </span>
              </div>
              <p style={{ fontSize: "28px", fontWeight: 800, lineHeight: 1, marginBottom: "4px" }}>{kpi.value}</p>
              <p style={{ fontSize: "12px", color: "#64748b" }}>{kpi.label}</p>
            </div>
          ))}
        </div>

        {/* Charts row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "16px" }}>
          <div style={{ background: "rgba(15,23,42,0.7)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "14px", padding: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <div>
                <h3 style={{ fontSize: "14px", fontWeight: 700, marginBottom: "2px" }}>Crime Analysis</h3>
                <p style={{ fontSize: "11px", color: "#64748b" }}>District-wise breakdown for {period}</p>
              </div>
              <div style={{ display: "flex", gap: "4px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "8px", padding: "3px" }}>
                {[["district", "Bar"], ["monthly", "Line"], ["trend", "Area"]].map(([key, label]) => (
                  <button key={key} onClick={() => setActiveChart(key)}
                    style={{ padding: "4px 10px", borderRadius: "6px", border: "none", cursor: "pointer", fontSize: "11px", fontWeight: 600, background: activeChart === key ? "rgba(6,182,212,0.2)" : "transparent", color: activeChart === key ? "#06B6D4" : "#64748b" }}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              {activeChart === "district" ? (
                <BarChart data={districtData} barSize={26}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis dataKey="district" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: "11px", color: "#64748b" }} />
                  <Bar dataKey="cases" name="Total Cases" fill="#06B6D4" radius={[4, 4, 0, 0]} opacity={0.85} />
                  <Bar dataKey="solved" name="Solved" fill="#22c55e" radius={[4, 4, 0, 0]} opacity={0.85} />
                  <Bar dataKey="active" name="Active" fill="#dc2626" radius={[4, 4, 0, 0]} opacity={0.85} />
                </BarChart>
              ) : activeChart === "monthly" ? (
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis dataKey="month" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: "11px", color: "#64748b" }} />
                  <Line type="monotone" dataKey="cases" name="Cases" stroke="#06B6D4" strokeWidth={2} dot={{ fill: "#06B6D4", r: 3 }} />
                  <Line type="monotone" dataKey="solved" name="Solved" stroke="#22c55e" strokeWidth={2} dot={{ fill: "#22c55e", r: 3 }} />
                  <Line type="monotone" dataKey="arrests" name="Arrests" stroke="#f97316" strokeWidth={2} dot={{ fill: "#f97316", r: 3 }} />
                </LineChart>
              ) : (
                <AreaChart data={monthlyData}>
                  <defs>
                    <linearGradient id="gC" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#06B6D4" stopOpacity={0.3} /><stop offset="95%" stopColor="#06B6D4" stopOpacity={0} /></linearGradient>
                    <linearGradient id="gS" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} /><stop offset="95%" stopColor="#22c55e" stopOpacity={0} /></linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis dataKey="month" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: "11px", color: "#64748b" }} />
                  <Area type="monotone" dataKey="cases" name="Cases" stroke="#06B6D4" fill="url(#gC)" strokeWidth={2} />
                  <Area type="monotone" dataKey="solved" name="Solved" stroke="#22c55e" fill="url(#gS)" strokeWidth={2} />
                </AreaChart>
              )}
            </ResponsiveContainer>
          </div>

          <div style={{ background: "rgba(15,23,42,0.7)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "14px", padding: "20px" }}>
            <h3 style={{ fontSize: "14px", fontWeight: 700, marginBottom: "2px" }}>Crime Types</h3>
            <p style={{ fontSize: "11px", color: "#64748b", marginBottom: "16px" }}>Distribution by category</p>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={crimeTypeData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={3}>
                  {crimeTypeData.map((entry, i) => <Cell key={i} fill={entry.color} opacity={0.85} />)}
                </Pie>
                <Tooltip formatter={(v: any) => [`${v}%`, ""]} contentStyle={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", fontSize: "12px" }} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {crimeTypeData.map(item => (
                <div key={item.name} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div style={{ width: "8px", height: "8px", borderRadius: "2px", background: item.color, flexShrink: 0 }} />
                  <span style={{ fontSize: "11px", color: "#94a3b8", flex: 1 }}>{item.name}</span>
                  <div style={{ width: "60px", height: "4px", borderRadius: "2px", background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${item.value * 2.5}%`, background: item.color, borderRadius: "2px" }} />
                  </div>
                  <span style={{ fontSize: "11px", fontWeight: 700, width: "28px", textAlign: "right" as const }}>{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Cases table with working filter */}
        <div style={{ background: "rgba(15,23,42,0.7)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "14px", padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
            <div>
              <h3 style={{ fontSize: "14px", fontWeight: 700, marginBottom: "2px" }}>Unsolved High-Priority Cases</h3>
              <p style={{ fontSize: "11px", color: "#64748b" }}>
                Showing <strong style={{ color: "white" }}>{filteredCases.length}</strong> of {ALL_CASES.length} cases
              </p>
            </div>

            {/* ✅ Working priority filter */}
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <Filter size={12} color="#64748b" />
              <span style={{ fontSize: "11px", color: "#64748b", marginRight: "4px" }}>Priority:</span>
              {["All", "High", "Medium", "Low"].map(p => (
                <button key={p} onClick={() => setPriorityFilter(p)}
                  style={{
                    padding: "4px 12px", borderRadius: "20px", border: "none", cursor: "pointer", fontSize: "12px", fontWeight: 600, transition: "all 0.15s",
                    background: priorityFilter === p
                      ? p === "All" ? "#06B6D4" : PRIORITY_COLORS[p]
                      : "rgba(255,255,255,0.06)",
                    color: priorityFilter === p ? "white" : "#64748b",
                  }}>
                  {p}
                  {p !== "All" && (
                    <span style={{ marginLeft: "4px", fontSize: "10px", opacity: 0.8 }}>
                      ({ALL_CASES.filter(c => c.priority === p).length})
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Table header */}
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1.2fr 1.2fr 1fr 0.8fr 0.7fr", gap: "12px", padding: "8px 14px", marginBottom: "6px" }}>
            {["Case ID", "Crime Type", "Area", "Filed Date", "Priority", "Days Open"].map(h => (
              <span key={h} style={{ fontSize: "10px", fontWeight: 700, color: "#475569", letterSpacing: "0.06em", textTransform: "uppercase" as const }}>{h}</span>
            ))}
          </div>

          {filteredCases.length === 0 ? (
            <div style={{ padding: "40px", textAlign: "center" as const, color: "#475569", fontSize: "13px" }}>
              No cases found for <strong style={{ color: "#64748b" }}>{priorityFilter}</strong> priority
            </div>
          ) : (
            filteredCases.map((c, i) => (
              <div key={c.id} style={{ display: "grid", gridTemplateColumns: "2fr 1.2fr 1.2fr 1fr 0.8fr 0.7fr", gap: "12px", padding: "12px 14px", background: i % 2 === 0 ? "rgba(255,255,255,0.02)" : "transparent", borderRadius: "8px", alignItems: "center", marginBottom: "2px", cursor: "pointer", border: "1px solid transparent", transition: "all 0.15s" }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(6,182,212,0.15)"; (e.currentTarget as HTMLElement).style.background = "rgba(6,182,212,0.04)" }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "transparent"; (e.currentTarget as HTMLElement).style.background = i % 2 === 0 ? "rgba(255,255,255,0.02)" : "transparent" }}>
                <span style={{ fontSize: "12px", color: "#06B6D4", fontWeight: 600, fontFamily: "monospace" }}>{c.id}</span>
                <span style={{ fontSize: "12px", color: "#cbd5e1" }}>{c.type}</span>
                <span style={{ fontSize: "12px", color: "#94a3b8" }}>{c.area}</span>
                <span style={{ fontSize: "12px", color: "#64748b" }}>{c.date}</span>
                <span style={{ fontSize: "11px", fontWeight: 700, color: PRIORITY_COLORS[c.priority], padding: "2px 8px", borderRadius: "20px", background: `${PRIORITY_COLORS[c.priority]}15`, display: "inline-block" }}>{c.priority}</span>
                <span style={{ fontSize: "13px", fontWeight: 800, color: c.days > 30 ? "#dc2626" : c.days > 14 ? "#f97316" : "#22c55e" }}>{c.days}d</span>
              </div>
            ))
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
