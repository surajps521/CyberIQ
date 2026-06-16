"use client"

import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { ArrowLeft, FileSearch } from "lucide-react"
import AnimatedGrid from "@/components/AnimatedGrid"

export default function EvidencePage() {
  const router = useRouter()

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
        style={{ position: "relative", zIndex: 10, width: "100%", maxWidth: "520px" }}
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

          <div style={{ display: "flex", alignItems: "center", gap: "10px", justifyContent: "center" }}>
            <FileSearch size={20} color="#06b6d4" />
            <h1 style={{ color: "white", fontSize: "28px", margin: 0 }}>Evidence</h1>
          </div>
          <p style={{ textAlign: "center", color: "hsl(215,20%,55%)", fontSize: "13px", marginTop: "10px", marginBottom: "24px" }}>
            Open evidence tools and case files.
          </p>

          <div style={{ display: "flex", justifyContent: "center" }}>
            <button
              type="button"
              onClick={() => router.push("/dashboard")}
              style={{
                border: "1px solid rgba(6, 182, 212, 0.25)",
                background: "linear-gradient(135deg, #1E3A8A, #06B6D4)",
                color: "white",
                borderRadius: "999px",
                padding: "12px 18px",
                cursor: "pointer",
                fontSize: "12px",
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <ArrowLeft size={16} /> Back to dashboard
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}