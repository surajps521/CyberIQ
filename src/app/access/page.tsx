"use client"

import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { FileSearch, BookOpenText } from "lucide-react"
import AnimatedGrid from "@/components/AnimatedGrid"

export default function AccessPage() {
  const router = useRouter()

  const buttonStyle = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "12px",
    width: "100%",
    border: "1px solid rgba(6, 182, 212, 0.18)",
    background: "rgba(15, 23, 42, 0.82)",
    color: "white",
    borderRadius: "16px",
    padding: "16px 18px",
    cursor: "pointer",
    boxShadow: "0 18px 40px rgba(0,0,0,0.35)",
    backdropFilter: "blur(18px)",
    transition: "transform 0.2s ease, border-color 0.2s ease",
  } as const

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
          maxWidth: "520px",
        }}
      >
        <div style={{
          background: "rgba(15, 23, 42, 0.9)",
          backdropFilter: "blur(24px)",
          border: "1px solid rgba(6, 182, 212, 0.15)",
          borderRadius: "20px",
          padding: "36px 32px",
          boxShadow: "0 25px 60px rgba(0,0,0,0.5), 0 0 40px rgba(6,182,212,0.05)",
        }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "16px" }}>
            <img src="/favicon.svg" alt="CRIMEIQ icon" width={56} height={56} style={{ display: "block" }} />
          </div>

          <h1 style={{ textAlign: "center", color: "white", fontSize: "28px", margin: 0, letterSpacing: "0.02em" }}>
            CRIMEIQ Access
          </h1>
          <p style={{ textAlign: "center", color: "hsl(215,20%,55%)", fontSize: "13px", marginTop: "10px", marginBottom: "28px" }}>
            Choose how you want to continue.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <button
              type="button"
              onClick={() => router.push("/access/guidance")}
              style={buttonStyle}
              onMouseEnter={e => {
                e.currentTarget.style.transform = "translateY(-1px)"
                e.currentTarget.style.borderColor = "rgba(6, 182, 212, 0.55)"
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = "translateY(0)"
                e.currentTarget.style.borderColor = "rgba(6, 182, 212, 0.18)"
              }}
            >
              <BookOpenText size={18} />
              <span style={{ fontSize: "13px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                Guidance
              </span>
            </button>

            <button
              type="button"
              onClick={() => router.push("/access/evidence")}
              style={buttonStyle}
              onMouseEnter={e => {
                e.currentTarget.style.transform = "translateY(-1px)"
                e.currentTarget.style.borderColor = "rgba(6, 182, 212, 0.55)"
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = "translateY(0)"
                e.currentTarget.style.borderColor = "rgba(6, 182, 212, 0.18)"
              }}
            >
              <FileSearch size={18} />
              <span style={{ fontSize: "13px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                Evidence
              </span>
            </button>
          </div>

          <div style={{ display: "flex", justifyContent: "center", marginTop: "24px" }}>
            <button
              type="button"
              onClick={() => router.push("/")}
              style={{
                background: "transparent",
                border: "none",
                color: "hsl(215,20%,55%)",
                cursor: "pointer",
                fontSize: "12px",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              Back to login
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}