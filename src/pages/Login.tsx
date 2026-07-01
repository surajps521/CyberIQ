"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Shield, Eye, EyeOff, AlertCircle } from "lucide-react"
import { motion } from "framer-motion"
import AnimatedGrid from "@/components/AnimatedGrid"
import KSPLogo from "@/components/KSPLogo"

// ✅ Hardcoded credentials (replace with Supabase later)
const VALID_USERS = [
  { badgeId: "KSP001", password: "inspector123", role: "inspector", name: "Inspector Sharma" },
  { badgeId: "KSP002", password: "constable123", role: "constable", name: "Constable Ravi" },
  { badgeId: "KSP003", password: "commissioner123", role: "commissioner", name: "Commissioner Patil" },
  { badgeId: "admin", password: "admin123", role: "inspector", name: "Admin User" },
]

export default function Login() {
  const router = useRouter()
  const [badgeId, setBadgeId] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleLogin = async (e: React.FormEvent) => {

    e.preventDefault()
    setError("")

    if (!badgeId || !password || !role) {
      setError("Please fill in all fields")
      return
    }

    const user = VALID_USERS.find(
      u => u.badgeId === badgeId && u.password === password && u.role === role
    )

    if (!user) {
      setError("Invalid credentials. Check Badge ID, password and role.")
      return
    }

    setIsLoading(true)

    try {
      // Save user to localStorage for dashboard
      localStorage.setItem("ksp_user", JSON.stringify(user))

      // Request JWT from backend so Evidence uploads are protected
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_HTTP_URL || "https://cyberiq-3hwj.onrender.com"
      const res = await fetch(`${backendUrl}/auth/token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          badge_id: user.badgeId,
          password: password,
          role: user.role,
        }),
      })

      if (!res.ok) {
        const detail = await res.text().catch(() => "")
        throw new Error(detail || "Failed to obtain authentication token")
      }

      const data = await res.json()
      if (data?.accessToken) {
        localStorage.setItem("ksp_jwt", data.accessToken)
        // Also expose the current user id for later use (Evidence upload)
        localStorage.setItem("ksp_user_id", user.badgeId)
      } else {
        throw new Error("Backend did not return accessToken")
      }
    } catch (e: any) {
      // Keep UI working, but show a visible message for debugging.
      setError(e?.message ? `Auth token error: ${e.message}` : "Auth token error")
    }

    setTimeout(() => router.push("/dashboard"), 1000)


  }

  return (
    <div style={{
      minHeight: "100vh",
      width: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "hsl(222, 47%, 7%)",
      position: "relative",
      overflow: "hidden",
      padding: "16px",
    }}>
      <AnimatedGrid />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        style={{
          position: "relative",
          zIndex: 10,
          width: "100%",
          maxWidth: "420px",
        }}
      >
        <div style={{
          background: "rgba(15, 23, 42, 0.9)",
          backdropFilter: "blur(24px)",
          border: "1px solid rgba(6, 182, 212, 0.15)",
          borderRadius: "20px",
          padding: "40px 32px",
          boxShadow: "0 25px 60px rgba(0,0,0,0.5), 0 0 40px rgba(6,182,212,0.05)",
        }}>

          {/* Logo */}
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "24px" }}>
            <KSPLogo size="lg" />
          </div>

          <p style={{ textAlign: "center", color: "hsl(215,20%,55%)", fontSize: "13px", marginBottom: "28px" }}>
            Secure Intelligence Access Portal
          </p>

          {/* Demo credentials hint */}
          <div style={{
            background: "rgba(6,182,212,0.08)",
            border: "1px solid rgba(6,182,212,0.2)",
            borderRadius: "8px",
            padding: "10px 14px",
            marginBottom: "20px",
            fontSize: "11px",
            color: "#06B6D4",
            lineHeight: 1.6,
          }}>
            🔑 Demo: Badge <strong>KSP001</strong> · Pass <strong>inspector123</strong> · Role <strong>Inspector</strong>
          </div>

          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

            {/* Error */}
            {error && (
              <motion.div initial={{ opacity:0, y:-8 }} animate={{ opacity:1, y:0 }}
                style={{ display:"flex", alignItems:"center", gap:"8px", background:"rgba(220,38,38,0.1)", border:"1px solid rgba(220,38,38,0.3)", borderRadius:"8px", padding:"10px 14px", color:"#f87171", fontSize:"12px" }}>
                <AlertCircle size={14} />
                {error}
              </motion.div>
            )}

            {/* Badge ID */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "12px", color: "hsl(215,20%,55%)", fontWeight: 600, letterSpacing: "0.05em" }}>
                BADGE ID
              </label>
              <input
                value={badgeId}
                onChange={e => { setBadgeId(e.target.value); setError("") }}
                placeholder="e.g. KSP001"
                style={{
                  background: "rgba(30,41,59,0.6)",
                  border: "1px solid hsl(222,30%,25%)",
                  borderRadius: "10px",
                  padding: "11px 14px",
                  color: "white",
                  fontSize: "14px",
                  outline: "none",
                  width: "100%",
                  transition: "border-color 0.2s",
                }}
                onFocus={e => e.target.style.borderColor = "#06B6D4"}
                onBlur={e => e.target.style.borderColor = "hsl(222,30%,25%)"}
              />
            </div>

            {/* Password */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "12px", color: "hsl(215,20%,55%)", fontWeight: 600, letterSpacing: "0.05em" }}>
                PASSWORD
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError("") }}
                  placeholder="Enter password"
                  style={{
                    background: "rgba(30,41,59,0.6)",
                    border: "1px solid hsl(222,30%,25%)",
                    borderRadius: "10px",
                    padding: "11px 44px 11px 14px",
                    color: "white",
                    fontSize: "14px",
                    outline: "none",
                    width: "100%",
                    transition: "border-color 0.2s",
                  }}
                  onFocus={e => e.target.style.borderColor = "#06B6D4"}
                  onBlur={e => e.target.style.borderColor = "hsl(222,30%,25%)"}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{
                  position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)",
                  background: "none", border: "none", cursor: "pointer", color: "hsl(215,20%,55%)", padding: "2px",
                }}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Role */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "12px", color: "hsl(215,20%,55%)", fontWeight: 600, letterSpacing: "0.05em" }}>
                ROLE
              </label>
              <select value={role} onChange={e => { setRole(e.target.value); setError("") }} style={{
                background: "rgba(30,41,59,0.6)",
                border: "1px solid hsl(222,30%,25%)",
                borderRadius: "10px",
                padding: "11px 14px",
                color: role ? "white" : "hsl(215,20%,40%)",
                fontSize: "14px",
                outline: "none",
                width: "100%",
                cursor: "pointer",
                transition: "border-color 0.2s",
              }}
              onFocus={e => e.target.style.borderColor = "#06B6D4"}
              onBlur={e => e.target.style.borderColor = "hsl(222,30%,25%)"}>
                <option value="" disabled>Select your role</option>
                <option value="constable">Constable</option>
                <option value="inspector">Inspector</option>
                <option value="commissioner">Commissioner</option>
              </select>
            </div>

            {/* Submit */}
            <button type="submit" disabled={isLoading} style={{
              background: isLoading ? "rgba(30,58,138,0.5)" : "linear-gradient(135deg, #1E3A8A, #06B6D4)",
              border: "none",
              borderRadius: "10px",
              padding: "13px",
              color: "white",
              fontSize: "14px",
              fontWeight: 700,
              cursor: isLoading ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              marginTop: "4px",
              boxShadow: isLoading ? "none" : "0 0 24px rgba(6,182,212,0.3)",
              transition: "all 0.2s",
              letterSpacing: "0.05em",
            }}>
              {isLoading ? (
                <>
                  <div style={{ width:"16px", height:"16px", border:"2px solid rgba(255,255,255,0.3)", borderTop:"2px solid white", borderRadius:"50%", animation:"spin 0.8s linear infinite" }} />
                  Authenticating...
                </>
              ) : (
                <><Shield size={16} /> SECURE LOGIN</>
              )}
            </button>
          </form>

          <p style={{ textAlign:"center", fontSize:"11px", color:"hsl(215,20%,35%)", marginTop:"20px" }}>
            Authorized personnel only. All access is monitored and logged.
          </p>
        </div>

        <div style={{ display: "flex", justifyContent: "center", marginTop: "18px" }}>
          <button
            type="button"
            onClick={() => router.push("/access")}
            aria-label="Open CRIMEIQ options"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
              border: "1px solid rgba(6, 182, 212, 0.25)",
              background: "rgba(15, 23, 42, 0.8)",
              color: "white",
              borderRadius: "999px",
              padding: "10px 16px 10px 12px",
              cursor: "pointer",
              boxShadow: "0 12px 30px rgba(0,0,0,0.35)",
              backdropFilter: "blur(18px)",
              transition: "transform 0.2s ease, border-color 0.2s ease",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = "translateY(-1px)"
              e.currentTarget.style.borderColor = "rgba(6, 182, 212, 0.6)"
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = "translateY(0)"
              e.currentTarget.style.borderColor = "rgba(6, 182, 212, 0.25)"
            }}
          >
            <img
              src="/favicon.svg"
              alt="CRIMEIQ icon"
              width={22}
              height={22}
              style={{ display: "block" }}
            />
            <span style={{ fontSize: "12px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>
              Open CRIMEIQ Options
            </span>
          </button>
        </div>
      </motion.div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        input::placeholder, select option:first-child { color: hsl(215,20%,40%) !important; }
        select option { background: #0f172a; color: white; }
        * { box-sizing: border-box; }
      `}</style>
    </div>
  )
}
