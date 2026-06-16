"use client"

import { useRouter } from "next/navigation"
import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Search, FileText, Network, Map, BarChart3, Bell,
  Mic, Send, Languages, ChevronRight, User, Shield, AlertTriangle, Phone, Mail,
  Clock, X, Menu, MessageSquare, LogOut
} from "lucide-react"
import KSPLogo from "@/components/KSPLogo"
import ReactMarkdown from "react-markdown"
import { useChat } from "@/hooks/useChat"



const recentQueries = [
  "Chain snatching Bengaluru South",
  "Criminal network - Rajesh Yadav",
  "Murder cases Mysuru 2024",
  "Vehicle theft hotspots",
  "Drug trafficking routes",
]

const quickActions = [
  { icon: Search, label: "New Query", route: "/dashboard" },
  { icon: FileText, label: "Cases", route: "/dashboard" },
  { icon: Network, label: "Network", route: "/network" },
  { icon: Map, label: "Map", route: "/map" },
  { icon: BarChart3, label: "Analytics", route: "/analytics" },
]

const emergencyContact = {
  phone: "7204770326",
  email: "12bhavish@gmail.com",
}

export default function Dashboard() {
  const router = useRouter()
  const { messages, isTyping, connected, connect, sendMessage } = useChat()
  const [input, setInput] = useState("")

  useEffect(() => { connect() }, [connect])
  const [language, setLanguage] = useState<"en" | "kn">("en")
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [rightOpen, setRightOpen] = useState(true)
  const [checkingEmailHealth, setCheckingEmailHealth] = useState(false)
  const [user, setUser] = useState<any>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const stored = localStorage.getItem("ksp_user")
    if (stored) setUser(JSON.parse(stored))
    else setUser({ name: "Inspector Sharma", badgeId: "KSP-4521", role: "inspector" })
  }, [])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isTyping])

  const handleSend = () => {
    if (!input.trim()) return
    sendMessage(input, language)
    setInput("")
  }

  const handleSOS = async () => {
    const lastUserMessage = [...messages].reverse().find(message => message.type === "user")?.text
    const messageToResend = input.trim() || lastUserMessage || "Immediate assistance required."

    // Try to get a geolocation position (with short timeout)
    const getPosition = (): Promise<GeolocationPosition | null> => {
      return new Promise((resolve) => {
        if (!navigator.geolocation) return resolve(null)
        const onSuccess = (pos: GeolocationPosition) => resolve(pos)
        const onErr = () => resolve(null)
        navigator.geolocation.getCurrentPosition(onSuccess, onErr, { enableHighAccuracy: true, timeout: 7000, maximumAge: 5000 })
      })
    }

    const pos = await getPosition()
    const lat = pos?.coords.latitude
    const lon = pos?.coords.longitude
    const acc = pos?.coords.accuracy

    const summaryParts = [
      "SOS Alert from CrimeIQ",
      `Officer: ${user?.name || "Inspector Sharma"}`,
      `Badge: ${user?.badgeId || "KSP-4521"}`,
      `Contact: ${emergencyContact.phone} / ${emergencyContact.email}`,
      `Message: ${messageToResend}`,
    ]
    if (lat != null && lon != null) {
      summaryParts.push(`Location: https://maps.google.com/?q=${lat},${lon}`)
      summaryParts.push(`Coordinates: ${lat},${lon} (±${acc ?? "?"} m)`)
    }
    const summary = summaryParts.join("\n")

    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_HTTP_URL || "http://localhost:8000"

    try {
      const response = await fetch(`${backendUrl}/sos/alert`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          officer_name: user?.name || "Inspector Sharma",
          badge_id: user?.badgeId || "KSP-4521",
          message: messageToResend,
          emergency_phone: emergencyContact.phone,
          emergency_email: emergencyContact.email,
          latitude: lat,
          longitude: lon,
          location_accuracy_m: acc,
        }),
      })

      if (!response.ok) {
        let detail = "SOS backend request failed"
        try {
          const payload = await response.json()
          if (payload?.detail && typeof payload.detail === "string") {
            detail = payload.detail
          }
        } catch {
          // ignore
        }
        throw new Error(detail)
      }

      await response.json()
      window.alert("SOS alert sent to your emergency contact.")
    } catch (error: any) {
      const smsUrl = `sms:${emergencyContact.phone}?body=${encodeURIComponent(summary)}`
      const emailUrl = `mailto:${emergencyContact.email}?subject=${encodeURIComponent("SOS Alert - Immediate Assistance Required")}&body=${encodeURIComponent(summary)}`
      window.open(smsUrl, "_blank", "noopener,noreferrer")
      window.open(emailUrl, "_blank", "noopener,noreferrer")
      window.alert(`Backend alert could not be sent: ${error?.message || error}. Drafted SMS and email instead.`)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("ksp_user")
    router.push("/")
  }

  const handleCheckEmailHealth = async () => {
    if (checkingEmailHealth) return
    setCheckingEmailHealth(true)

    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_HTTP_URL || "http://localhost:8000"

    try {
      const response = await fetch(`${backendUrl}/sos/email/health`)
      if (!response.ok) {
        throw new Error("Could not reach backend email health endpoint")
      }
      const result = await response.json()
      const status = result?.status || "unknown"
      const detail = result?.detail || "No detail available"
      window.alert(`Email health: ${status}\n${detail}`)
    } catch (error) {
      const detail = error instanceof Error ? error.message : "Unknown error"
      window.alert(`Email health check failed: ${detail}`)
    } finally {
      setCheckingEmailHealth(false)
    }
  }

  const c = {
    page: { display: "flex", height: "100vh", overflow: "hidden", background: "#0a0f1e", color: "white", fontFamily: "Inter,-apple-system,sans-serif" } as React.CSSProperties,
    sidebar: { width: "260px", minWidth: "260px", height: "100%", background: "rgba(10,15,30,0.95)", borderRight: "1px solid rgba(255,255,255,0.06)", display: "flex", flexDirection: "column" as const, overflow: "hidden", flexShrink: 0 },
    center: { flex: 1, display: "flex", flexDirection: "column" as const, minWidth: 0, overflow: "hidden" },
    topbar: { height: "54px", minHeight: "54px", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px", background: "rgba(15,23,42,0.8)", borderBottom: "1px solid rgba(255,255,255,0.06)", backdropFilter: "blur(12px)" },
    messages: { flex: 1, overflowY: "auto" as const, padding: "20px", display: "flex", flexDirection: "column" as const, gap: "16px" },
    rightPanel: { width: "300px", minWidth: "300px", height: "100%", background: "rgba(10,15,30,0.95)", borderLeft: "1px solid rgba(255,255,255,0.06)", overflowY: "auto" as const, padding: "16px", display: "flex", flexDirection: "column" as const, gap: "14px", flexShrink: 0 },
  }

  return (
    <div style={c.page}>

      {/* Sidebar */}
      {sidebarOpen && (
        <div style={c.sidebar}>
          {/* Profile */}
          <div style={{ padding: "16px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "12px", background: "rgba(255,255,255,0.04)", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ width: "38px", height: "38px", borderRadius: "50%", background: "linear-gradient(135deg,#1E3A8A,#06B6D4)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <User size={18} color="white" />
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: "13px", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {user?.name || "Inspector Sharma"}
                </p>
                <p style={{ fontSize: "11px", color: "#64748b" }}>
                  Badge: {user?.badgeId || "KSP-4521"}
                </p>
              </div>
            </div>
          </div>

          {/* Nav */}
          <div style={{ padding: "8px" }}>
            {quickActions.map(a => (
              <button key={a.label} onClick={() => router.push(a.route)}
                style={{ width: "100%", display: "flex", alignItems: "center", gap: "10px", padding: "9px 12px", background: "none", border: "none", color: "#64748b", cursor: "pointer", borderRadius: "8px", fontSize: "13px", textAlign: "left", transition: "all 0.15s" }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(6,182,212,0.08)"; (e.currentTarget as HTMLElement).style.color = "white" }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "none"; (e.currentTarget as HTMLElement).style.color = "#64748b" }}>
                <a.icon size={15} color="#06B6D4" />
                {a.label}
              </button>
            ))}
          </div>

          {/* Recent queries */}
          <div style={{ flex: 1, overflow: "auto", padding: "8px 12px" }}>
            <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em", color: "#334155", marginBottom: "8px", textTransform: "uppercase" }}>
              Recent Queries
            </p>
            {recentQueries.map((q, i) => (
              <button key={i}
                style={{ width: "100%", display: "flex", alignItems: "center", gap: "8px", padding: "8px 8px", background: "none", border: "none", color: "#64748b", cursor: "pointer", borderRadius: "6px", fontSize: "12px", textAlign: "left", overflow: "hidden", marginBottom: "2px" }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)"; (e.currentTarget as HTMLElement).style.color = "white" }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "none"; (e.currentTarget as HTMLElement).style.color = "#64748b" }}>
                <Clock size={11} color="#06B6D4" style={{ flexShrink: 0 }} />
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{q}</span>
              </button>
            ))}
          </div>

          {/* Logout */}
          <div style={{ padding: "12px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <button onClick={handleLogout}
              style={{ width: "100%", display: "flex", alignItems: "center", gap: "8px", padding: "9px 12px", background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.15)", color: "#f87171", cursor: "pointer", borderRadius: "8px", fontSize: "12px" }}>
              <LogOut size={14} /> Sign Out
            </button>
          </div>
        </div>
      )}

      {/* Center */}
      <div style={c.center}>
        {/* Topbar */}
        <div style={c.topbar}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <button onClick={() => setSidebarOpen(!sidebarOpen)}
              style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b", display: "flex", padding: "4px" }}>
              <Menu size={18} />
            </button>
            <KSPLogo size="sm" />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#64748b" }}>
              <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: connected ? "#22c55e" : "#dc2626", animation: "pulse 2s infinite" }} />
              {connected ? "AI Connected" : "Connecting..."}
            </div>
            <button style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b", position: "relative", display: "flex" }}>
              <Bell size={17} />
              <span style={{ position: "absolute", top: "-2px", right: "-2px", width: "7px", height: "7px", borderRadius: "50%", background: "#dc2626" }} />
            </button>
            <button onClick={() => setRightOpen(!rightOpen)}
              style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b", display: "flex" }}>
              <MessageSquare size={17} />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div style={c.messages}>
          <AnimatePresence>
            {messages.map((msg: any) => (
              <motion.div key={msg.id}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                style={{ display: "flex", justifyContent: msg.type === "user" ? "flex-end" : "flex-start", alignItems: "flex-start", gap: "10px" }}>
                {msg.type === "ai" && (
                  <div style={{ width: "32px", height: "32px", borderRadius: "10px", background: "linear-gradient(135deg,#1E3A8A,#06B6D4)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: "2px" }}>
                    <Shield size={14} color="white" />
                  </div>
                )}
                <div style={{
                  maxWidth: "68%",
                  padding: "12px 16px",
                  borderRadius: msg.type === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                  background: msg.type === "user"
                    ? "linear-gradient(135deg,#1E3A8A,#0e7490)"
                    : "rgba(255,255,255,0.04)",
                  border: msg.type === "ai" ? "1px solid rgba(255,255,255,0.06)" : "none",
                  fontSize: "13px",
                  lineHeight: 1.6,
                }}>
                  <div style={{lineHeight:1.7}}>
                    <ReactMarkdown components={{
                      p: ({children}) => <p style={{margin:"0 0 8px",fontSize:"13px"}}>{children}</p>,
                      strong: ({children}) => <strong style={{color:"#e2e8f0",fontWeight:700}}>{children}</strong>,
                      ul: ({children}) => <ul style={{margin:"6px 0",paddingLeft:"16px"}}>{children}</ul>,
                      li: ({children}) => <li style={{margin:"3px 0",fontSize:"13px",color:"#cbd5e1"}}>{children}</li>,
                      code: ({children}) => <code style={{background:"rgba(6,182,212,0.1)",color:"#06B6D4",padding:"1px 6px",borderRadius:"4px",fontSize:"12px"}}>{children}</code>,
                    }}>{msg.text}</ReactMarkdown>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {isTyping && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{ width: "32px", height: "32px", borderRadius: "10px", background: "linear-gradient(135deg,#1E3A8A,#06B6D4)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Shield size={14} color="white" />
              </div>
              <div style={{ padding: "12px 16px", borderRadius: "18px 18px 18px 4px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", display: "flex", gap: "4px", alignItems: "center" }}>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#06B6D4", animation: "bounce 1s infinite", animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </motion.div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input */}
        <div style={{ padding: "16px 20px", borderTop: "1px solid rgba(255,255,255,0.06)", background: "rgba(15,23,42,0.6)", backdropFilter: "blur(12px)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "14px", padding: "8px 12px" }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSend()}
              placeholder={language === "en" ? "Ask about cases, criminals, locations..." : "ಪ್ರಕರಣಗಳ ಬಗ್ಗೆ ಕೇಳಿ..."}
              style={{ flex: 1, background: "none", border: "none", outline: "none", color: "white", fontSize: "13px" }}
            />
            <button style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b", display: "flex", padding: "2px" }}>
              <Mic size={17} />
            </button>
            <button onClick={() => setLanguage(l => l === "en" ? "kn" : "en")}
              style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b", fontSize: "11px", display: "flex", alignItems: "center", gap: "3px", padding: "2px" }}>
              <Languages size={13} />{language === "en" ? "EN" : "ಕನ್ನಡ"}
            </button>
            <button onClick={handleSOS}
              title="Send SOS to emergency contact"
              style={{ background: "linear-gradient(135deg,#dc2626,#b91c1c)", border: "1px solid rgba(248,113,113,0.35)", borderRadius: "8px", padding: "7px 10px", cursor: "pointer", color: "white", display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", fontWeight: 700, letterSpacing: "0.06em" }}>
              <AlertTriangle size={13} /> SOS
            </button>
            <button onClick={handleSend}
              style={{ background: "linear-gradient(135deg,#1E3A8A,#06B6D4)", border: "none", borderRadius: "8px", padding: "7px 12px", cursor: "pointer", color: "white", display: "flex", alignItems: "center" }}>
              <Send size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Right Panel */}
      {rightOpen && (
        <div style={c.rightPanel}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <p style={{ fontSize: "13px", fontWeight: 600 }}>Context Panel</p>
            <button onClick={() => setRightOpen(false)}
              style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b", display: "flex" }}>
              <X size={14} />
            </button>
          </div>

          <div style={{ padding: "14px", background: "linear-gradient(180deg, rgba(220,38,38,0.14), rgba(255,255,255,0.03))", border: "1px solid rgba(248,113,113,0.18)", borderRadius: "10px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
              <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#ef4444" }} />
              <span style={{ fontSize: "10px", fontWeight: 700, color: "#f87171", letterSpacing: "0.08em" }}>EMERGENCY CONTACT</span>
            </div>
            <p style={{ fontSize: "13px", fontWeight: 600, marginBottom: "4px" }}>Preloaded SOS routing</p>
            <div style={{ display: "grid", gap: "8px", fontSize: "11px", color: "#cbd5e1" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Phone size={13} color="#f87171" />
                <span>{emergencyContact.phone}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Mail size={13} color="#f87171" />
                <span>{emergencyContact.email}</span>
              </div>
            </div>
            <button
              onClick={handleCheckEmailHealth}
              disabled={checkingEmailHealth}
              style={{
                marginTop: "10px",
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                padding: "8px 10px",
                borderRadius: "8px",
                border: "1px solid rgba(248,113,113,0.25)",
                background: checkingEmailHealth ? "rgba(148,163,184,0.2)" : "rgba(220,38,38,0.15)",
                color: "#fecaca",
                cursor: checkingEmailHealth ? "not-allowed" : "pointer",
                fontSize: "11px",
                fontWeight: 700,
                letterSpacing: "0.04em",
              }}
              title="Test backend SMTP health"
            >
              <Mail size={12} />
              {checkingEmailHealth ? "Checking Email Setup..." : "Test Email Setup"}
            </button>
          </div>

          {/* Active case */}
          <div style={{ padding: "14px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "10px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
              <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#dc2626" }} />
              <span style={{ fontSize: "10px", fontWeight: 700, color: "#dc2626", letterSpacing: "0.08em" }}>ACTIVE CASE</span>
            </div>
            <p style={{ fontSize: "13px", fontWeight: 600, marginBottom: "4px" }}>Chain Snatching — BLR South</p>
            <p style={{ fontSize: "11px", color: "#64748b", marginBottom: "8px" }}>FIR: KSP/BLR/2024/4521 · 15 Mar 2024</p>
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "10px", padding: "2px 8px", borderRadius: "20px", background: "rgba(220,38,38,0.12)", color: "#f87171" }}>High Priority</span>
              <span style={{ fontSize: "10px", padding: "2px 8px", borderRadius: "20px", background: "rgba(6,182,212,0.12)", color: "#06B6D4" }}>Investigating</span>
            </div>
          </div>

          {/* Related cases */}
          <div>
            <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em", color: "#334155", marginBottom: "8px", textTransform: "uppercase" }}>Related Cases</p>
            {["Chain snatching — Jayanagar", "Two-wheeler theft — BTM", "Robbery — HSR Layout"].map((c2, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "8px", cursor: "pointer", marginBottom: "6px" }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = "rgba(6,182,212,0.2)"}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.05)"}>
                <div>
                  <p style={{ fontSize: "12px", fontWeight: 500 }}>{c2}</p>
                  <p style={{ fontSize: "10px", color: "#64748b" }}>KSP/BLR/2024/{4522 + i}</p>
                </div>
                <ChevronRight size={13} color="#64748b" />
              </div>
            ))}
          </div>

          {/* Stats */}
          <div>
            <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em", color: "#334155", marginBottom: "8px", textTransform: "uppercase" }}>Quick Stats</p>
            {[
              { label: "Total Cases", value: "1,247", color: "#06B6D4" },
              { label: "Solved %", value: "67.3%", color: "#22c55e" },
              { label: "Active Investigations", value: "89", color: "#eab308" },
            ].map(s => (
              <div key={s.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "8px", marginBottom: "6px" }}>
                <span style={{ fontSize: "12px", color: "#64748b" }}>{s.label}</span>
                <span style={{ fontSize: "14px", fontWeight: 700, color: s.color }}>{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`
        @keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        input::placeholder { color: #334155; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 2px; }
      `}</style>
    </div>
  )
}
