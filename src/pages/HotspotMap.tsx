
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState, useMemo } from "react"
import { ChevronLeft, MapPin, Filter, Calendar, AlertTriangle } from "lucide-react"

const ALL_CRIME_DATA = [
  { lat: 12.9716, lng: 77.5946, area: "Bengaluru Central", count: 142, type: "Theft", district: "Bengaluru Urban" },
  { lat: 12.9352, lng: 77.6245, area: "BTM Layout", count: 68, type: "Chain Snatching", district: "Bengaluru Urban" },
  { lat: 12.9279, lng: 77.6271, area: "Jayanagar", count: 55, type: "Robbery", district: "Bengaluru Urban" },
  { lat: 13.0358, lng: 77.5970, area: "Hebbal", count: 42, type: "Vehicle Theft", district: "Bengaluru Urban" },
  { lat: 12.9698, lng: 77.7500, area: "Whitefield", count: 88, type: "Cybercrime", district: "Bengaluru Urban" },
  { lat: 12.8456, lng: 77.6603, area: "Electronic City", count: 35, type: "Fraud", district: "Bengaluru Urban" },
  { lat: 13.0000, lng: 77.5800, area: "Rajajinagar", count: 95, type: "Assault", district: "Bengaluru Urban" },
  { lat: 12.9165, lng: 77.6101, area: "HSR Layout", count: 52, type: "Burglary", district: "Bengaluru Urban" },
  { lat: 12.9784, lng: 77.6408, area: "Indiranagar", count: 78, type: "Theft", district: "Bengaluru Urban" },
  { lat: 12.9121, lng: 77.6446, area: "Koramangala", count: 63, type: "Robbery", district: "Bengaluru Urban" },
  { lat: 12.2958, lng: 76.6394, area: "Mysuru Central", count: 58, type: "Theft", district: "Mysuru" },
  { lat: 15.3647, lng: 75.1240, area: "Dharwad", count: 31, type: "Assault", district: "Dharwad" },
  { lat: 15.8497, lng: 74.4977, area: "Belagavi", count: 44, type: "Vehicle Theft", district: "Belagavi" },
  { lat: 13.3379, lng: 77.1173, area: "Tumakuru", count: 27, type: "Robbery", district: "Tumakuru" },
  { lat: 14.4663, lng: 76.9842, area: "Chitradurga", count: 19, type: "Fraud", district: "Chitradurga" },
  { lat: 12.3051, lng: 76.6553, area: "Majestic Mysuru", count: 82, type: "Chain Snatching", district: "Mysuru" },
]

const DISTRICTS = ["All Districts", "Bengaluru Urban", "Mysuru", "Dharwad", "Belagavi", "Tumakuru", "Chitradurga"]
const CRIME_TYPES = ["All Types", "Theft", "Chain Snatching", "Robbery", "Vehicle Theft", "Cybercrime", "Fraud", "Assault", "Burglary"]
const MONTHS = ["Jan 2024", "Feb 2024", "Mar 2024", "Apr 2024", "May 2024", "Jun 2024", "Jul 2024", "Aug 2024", "Sep 2024", "Oct 2024", "Nov 2024", "Dec 2024"]

export default function HotspotMap() {
  const router = useRouter()
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])
  const [district, setDistrict] = useState("All Districts")
  const [crimeType, setCrimeType] = useState("All Types")
  const [timelineIdx, setTimelineIdx] = useState(0)
  const [mapReady, setMapReady] = useState(false)
  const [selectedCrime, setSelectedCrime] = useState<typeof ALL_CRIME_DATA[0] | null>(null)

  const filtered = useMemo(() => ALL_CRIME_DATA.filter(d =>
    (district === "All Districts" || d.district === district) &&
    (crimeType === "All Types" || d.type === crimeType)
  ), [district, crimeType])

  const totalCrimes = filtered.reduce((s, d) => s + d.count, 0)
  const highest = filtered.reduce((m, d) => d.count > (m?.count ?? 0) ? d : m, filtered[0])
  const getColor = (count: number) => count >= 75 ? "#dc2626" : count >= 50 ? "#f97316" : "#22c55e"

  useEffect(() => {
    const loadMap = async () => {
      if (!mapRef.current) return
      if ((mapRef.current as any)._leaflet_id) return
      const L = await import("leaflet")
      const cssLink = document.createElement("link")
      cssLink.rel = "stylesheet"
      cssLink.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
      document.head.appendChild(cssLink)
      await new Promise(r => setTimeout(r, 100))
      if ((mapRef.current as any)._leaflet_id) return
      const map = L.map(mapRef.current, { center: [12.9716, 77.5946], zoom: 10, zoomControl: true })
      mapInstanceRef.current = map
      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", { attribution: "CartoDB", maxZoom: 19 }).addTo(map)
      setMapReady(true)
    }
    loadMap()
    return () => {
      if (mapInstanceRef.current) { mapInstanceRef.current.remove(); mapInstanceRef.current = null }
    }
  }, [])

  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current) return
    markersRef.current.forEach(m => m.remove())
    markersRef.current = []
    import("leaflet").then(L => {
      filtered.forEach(crime => {
        const color = getColor(crime.count)
        const marker = L.circleMarker([crime.lat, crime.lng], {
          radius: Math.max(10, crime.count / 6),
          fillColor: color, color, weight: 2, opacity: 0.9, fillOpacity: 0.45,
        }).addTo(mapInstanceRef.current)
        marker.on("click", () => setSelectedCrime(crime))
        marker.bindTooltip(
          `<div style="background:#0f172a;color:white;padding:8px 12px;border-radius:8px;border:1px solid rgba(255,255,255,0.1);font-family:Inter,sans-serif">` +
          `<strong style="color:${color}">${crime.area}</strong><br/>` +
          `<span style="color:#94a3b8;font-size:11px">${crime.type} · ${crime.count} cases</span></div>`,
          { className: "dark-tip" }
        )
        markersRef.current.push(marker)
      })
    })
  }, [mapReady, filtered])

  const sel: React.CSSProperties = { width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", padding: "10px 12px", color: "white", fontSize: "13px", cursor: "pointer", outline: "none" }

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: "#0a0f1e", color: "white", fontFamily: "Inter,sans-serif" }}>

      {/* Topbar */}
      <div style={{ height: "48px", minHeight: "48px", display: "flex", alignItems: "center", padding: "0 16px", background: "rgba(10,15,30,0.98)", borderBottom: "1px solid rgba(255,255,255,0.06)", zIndex: 1001, gap: "12px" }}>
        <button onClick={() => router.push("/dashboard")}
          style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", fontSize: "13px" }}>
          <ChevronLeft size={16} /> Back
        </button>
        <MapPin size={15} color="#06B6D4" />
        <span style={{ fontWeight: 700, fontSize: "14px" }}>Crime Hotspot Map</span>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", color: "#64748b" }}>
          <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#22c55e" }} />
          Live Data
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

        {/* Sidebar */}
        <div style={{ width: "280px", minWidth: "280px", background: "rgba(10,15,30,0.97)", borderRight: "1px solid rgba(255,255,255,0.07)", display: "flex", flexDirection: "column", overflow: "auto", zIndex: 1000 }}>

          {/* Filters */}
          <div style={{ padding: "16px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "14px" }}>
              <Filter size={12} color="#06B6D4" />
              <span style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.08em", color: "#64748b", textTransform: "uppercase" as const }}>Filters</span>
            </div>

            <label style={{ fontSize: "11px", color: "#64748b", fontWeight: 600, display: "block", marginBottom: "6px" }}>DISTRICT</label>
            <select value={district} onChange={e => setDistrict(e.target.value)} style={{ ...sel, marginBottom: "12px" }}>
              {DISTRICTS.map(d => <option key={d}>{d}</option>)}
            </select>

            <label style={{ fontSize: "11px", color: "#64748b", fontWeight: 600, display: "block", marginBottom: "6px" }}>CRIME TYPE</label>
            <select value={crimeType} onChange={e => setCrimeType(e.target.value)} style={{ ...sel, marginBottom: "14px" }}>
              {CRIME_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>

            <div style={{ display: "flex", alignItems: "center", gap: "4px", marginBottom: "6px" }}>
              <Calendar size={11} color="#06B6D4" />
              <label style={{ fontSize: "11px", color: "#64748b", fontWeight: 600 }}>DATE RANGE</label>
            </div>
            <input type="range" min={0} max={11} value={timelineIdx} onChange={e => setTimelineIdx(Number(e.target.value))}
              style={{ width: "100%", accentColor: "#06B6D4", cursor: "pointer" }} />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "#475569", marginTop: "4px" }}>
              <span>Jan</span>
              <span style={{ color: "#06B6D4", fontWeight: 700 }}>{MONTHS[timelineIdx]}</span>
              <span>Dec</span>
            </div>
          </div>

          {/* Legend */}
          <div style={{ padding: "14px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <p style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.08em", color: "#64748b", textTransform: "uppercase" as const, marginBottom: "10px" }}>Legend</p>
            {([["#dc2626", "High Crime (75+)"], ["#f97316", "Medium Crime (50-75)"], ["#22c55e", "Low Crime (<50)"]] as [string, string][]).map(([color, label]) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: color, flexShrink: 0 }} />
                <span style={{ fontSize: "12px", color: "#94a3b8" }}>{label}</span>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div style={{ padding: "14px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <p style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.08em", color: "#64748b", textTransform: "uppercase" as const, marginBottom: "10px" }}>Summary</p>
            {([
              ["Total Hotspots", String(filtered.length)],
              ["Total Crimes", totalCrimes.toLocaleString()],
              ["Highest", highest ? `${highest.area} (${highest.count})` : "—"],
            ] as [string, string][]).map(([label, val]) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px", gap: "8px" }}>
                <span style={{ fontSize: "12px", color: "#64748b" }}>{label}</span>
                <span style={{ fontSize: "12px", fontWeight: 700, color: "white", textAlign: "right" }}>{val}</span>
              </div>
            ))}
          </div>

          {/* Selected */}
          <div style={{ padding: "14px 16px", flex: 1 }}>
            {selectedCrime ? (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                  <p style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.08em", color: "#64748b", textTransform: "uppercase" as const }}>Selected Area</p>
                  <button onClick={() => setSelectedCrime(null)} style={{ background: "none", border: "none", color: "#475569", cursor: "pointer", fontSize: "18px", lineHeight: 1 }}>×</button>
                </div>
                <div style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${getColor(selectedCrime.count)}40`, borderRadius: "10px", padding: "12px" }}>
                  <p style={{ fontSize: "14px", fontWeight: 700, marginBottom: "4px" }}>{selectedCrime.area}</p>
                  <p style={{ fontSize: "11px", color: "#64748b", marginBottom: "10px" }}>{selectedCrime.district}</p>
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" as const }}>
                    <span style={{ fontSize: "11px", padding: "3px 8px", borderRadius: "20px", background: `${getColor(selectedCrime.count)}20`, color: getColor(selectedCrime.count), fontWeight: 600 }}>{selectedCrime.count} cases</span>
                    <span style={{ fontSize: "11px", padding: "3px 8px", borderRadius: "20px", background: "rgba(6,182,212,0.1)", color: "#06B6D4" }}>{selectedCrime.type}</span>
                  </div>
                  <div style={{ marginTop: "10px", height: "4px", borderRadius: "2px", background: "rgba(255,255,255,0.06)" }}>
                    <div style={{ height: "100%", width: `${Math.min(100, (selectedCrime.count / 142) * 100)}%`, background: getColor(selectedCrime.count), borderRadius: "2px" }} />
                  </div>
                  <p style={{ fontSize: "10px", color: "#475569", marginTop: "4px" }}>Risk intensity</p>
                </div>
              </>
            ) : (
              <div style={{ display: "flex", flexDirection: "column" as const, alignItems: "center", justifyContent: "center", height: "100%", gap: "8px" }}>
                <AlertTriangle size={24} color="#334155" />
                <p style={{ fontSize: "12px", color: "#475569", textAlign: "center" as const }}>Click a marker to see area details</p>
              </div>
            )}
          </div>
        </div>

        {/* Map */}
        <div style={{ flex: 1, position: "relative" as const }}>
          <div ref={mapRef} style={{ position: "absolute" as const, inset: 0, width: "100%", height: "100%" }} />
          {!mapReady && (
            <div style={{ position: "absolute" as const, inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "#0a0f1e", zIndex: 500 }}>
              <div style={{ textAlign: "center" as const }}>
                <div style={{ width: "36px", height: "36px", border: "3px solid rgba(6,182,212,0.2)", borderTop: "3px solid #06B6D4", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 12px" }} />
                <p style={{ color: "#64748b", fontSize: "13px" }}>Loading map...</p>
              </div>
            </div>
          )}
          {/* Timeline overlay */}
          <div style={{ position: "absolute" as const, bottom: "20px", left: "50%", transform: "translateX(-50%)", background: "rgba(10,15,30,0.92)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", padding: "10px 20px", zIndex: 999, backdropFilter: "blur(12px)", minWidth: "260px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
              <Calendar size={12} color="#06B6D4" />
              <span style={{ fontSize: "11px", color: "#64748b", fontWeight: 600 }}>TIMELINE</span>
              <span style={{ marginLeft: "auto", fontSize: "12px", fontWeight: 700, color: "#06B6D4" }}>{MONTHS[timelineIdx]}</span>
            </div>
            <input type="range" min={0} max={11} value={timelineIdx} onChange={e => setTimelineIdx(Number(e.target.value))}
              style={{ width: "100%", accentColor: "#06B6D4", cursor: "pointer" }} />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "#334155", marginTop: "2px" }}>
              <span>Jan</span><span>Dec</span>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .leaflet-tooltip { background: transparent !important; border: none !important; box-shadow: none !important; padding: 0 !important; }
        .dark-tip.leaflet-tooltip { background: transparent !important; }
        select option { background: #0f172a; color: white; }
      `}</style>
    </div>
  )
}
