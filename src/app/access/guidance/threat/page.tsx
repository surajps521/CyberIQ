"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import AnimatedGrid from "@/components/AnimatedGrid";

type ThreatKey = "being_followed" | "harassment" | "gun_point";

const THREAT_TITLES: Record<ThreatKey, string> = {
  being_followed: "Being followed",
  harassment: "Harassment",
  gun_point: "Gun point",
};

const THREAT_STEPS: Record<ThreatKey, string[]> = {
  being_followed: [
    "Go to a safer, public place (near shops, security, or people).",
    "If you feel unsafe, call local emergency services or the nearest police station.",
    "Do not go home or get into private vehicles; keep distance from the person.",
    "Share live location/details with a trusted person.",
    "Note descriptions (clothes, vehicle number, direction) and ask for help at nearby shops/buildings.",
  ],
  harassment: [
    "Increase distance and avoid interaction; move toward well-lit public areas.",
    "If safe, contact near the police station/security desk for immediate assistance.",
    "Preserve evidence: screenshots, call logs, messages, or any identifying details.",
    "If ongoing online harassment, report/block and keep records.",
    "Ask a bystander/neighbor to stay with you until help arrives.",
  ],
  gun_point: [
    "Stay calm; prioritize your safety—comply if necessary to avoid escalation.",
    "Move away when possible and get behind cover in a secure/public area.",
    "Call emergency services immediately once you are safe (or signal someone nearby to call).",
    "Do not confront the person; watch for escape routes and other threats.",
    "Provide responders with exact location and descriptions as soon as you can.",
  ],
};

export default function ThreatPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<ThreatKey | null>(null);

  const steps = useMemo(() => {
    if (!selected) return [];
    return THREAT_STEPS[selected];
  }, [selected]);

  const optionStyle = {
    width: "100%",
    textAlign: "left" as const,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between" as const,
    gap: "12px",
    border: "1px solid rgba(6, 182, 212, 0.18)",
    background: "rgba(15, 23, 42, 0.82)",
    color: "white",
    borderRadius: "16px",
    padding: "16px 18px",
    cursor: "pointer",
    boxShadow: "0 18px 40px rgba(0,0,0,0.35)",
    backdropFilter: "blur(18px)",
    transition: "transform 0.2s ease, border-color 0.2s ease, background 0.2s ease",
  } as const;

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "hsl(222, 47%, 7%)",
        position: "relative",
        overflow: "hidden",
        padding: "16px",
      }}
    >
      <AnimatedGrid />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        style={{
          position: "relative",
          zIndex: 10,
          width: "100%",
          maxWidth: "680px",
        }}
      >
        <div
          style={{
            background: "rgba(15, 23, 42, 0.9)",
            backdropFilter: "blur(24px)",
            border: "1px solid rgba(6, 182, 212, 0.15)",
            borderRadius: "20px",
            padding: "36px 32px",
            boxShadow: "0 25px 60px rgba(0,0,0,0.5), 0 0 40px rgba(6,182,212,0.05)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "16px" }}>
            <img
              src="/favicon.svg"
              alt="CRIMEIQ icon"
              width={56}
              height={56}
              style={{ display: "block" }}
            />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px", justifyContent: "center" }}>
            <AlertTriangle size={20} color="#06b6d4" />
            <h1 style={{ color: "white", fontSize: "28px", margin: 0 }}>Threat Guidance</h1>
          </div>

          <p
            style={{
              textAlign: "center",
              color: "hsl(215,20%,55%)",
              fontSize: "13px",
              marginTop: "10px",
              marginBottom: "22px",
            }}
          >
            Select the situation you are facing. We’ll show safe, practical steps.
          </p>

          {!selected ? (
            <>
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                {(Object.keys(THREAT_TITLES) as ThreatKey[]).map((key) => (
                  <button
                    key={key}
                    type="button"
                    style={optionStyle}
                    onClick={() => setSelected(key)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-1px)";
                      e.currentTarget.style.borderColor = "rgba(6, 182, 212, 0.55)";
                      e.currentTarget.style.background = "rgba(15, 23, 42, 0.92)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.borderColor = "rgba(6, 182, 212, 0.18)";
                      e.currentTarget.style.background = "rgba(15, 23, 42, 0.82)";
                    }}
                    aria-label={`Select threat type: ${THREAT_TITLES[key]}`}
                  >
                    <span style={{ fontSize: "14px", fontWeight: 800, letterSpacing: "0.01em" }}>
                      {THREAT_TITLES[key]}
                    </span>
                    <span style={{ color: "#06b6d4", fontWeight: 900 }}>›</span>
                  </button>
                ))}
              </div>

              <div style={{ display: "flex", justifyContent: "center", marginTop: "24px" }}>
                <button
                  type="button"
                  onClick={() => router.push("/access/guidance")}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "hsl(215,20%,55%)",
                    cursor: "pointer",
                    fontSize: "12px",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <ArrowLeft size={16} /> Back
                </button>
              </div>
            </>
          ) : (
            <>
              <div
                style={{
                  border: "1px solid rgba(6, 182, 212, 0.15)",
                  borderRadius: "16px",
                  padding: "18px 18px",
                  background: "rgba(2, 132, 199, 0.06)",
                  marginBottom: "18px",
                }}
              >
                <div
                  style={{
                    color: "white",
                    fontWeight: 900,
                    fontSize: "16px",
                    marginBottom: "6px",
                  }}
                >
                  Selected: {THREAT_TITLES[selected]}
                </div>
                <div style={{ color: "hsl(215,20%,65%)", fontSize: "12.5px" }}>
                  Prioritize your safety. If you are in immediate danger, contact emergency services right away.
                </div>
              </div>

              <div>
                <div style={{ color: "white", fontWeight: 900, fontSize: "14px", marginBottom: "10px" }}>
                  Possible steps to take
                </div>

                <ul style={{ margin: 0, paddingLeft: "18px", color: "hsl(215,20%,70%)", lineHeight: 1.55 }}>
                  {steps.map((s, idx) => (
                    <li key={idx} style={{ marginBottom: "8px" }}>
                      {s}
                    </li>
                  ))}
                </ul>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "22px", gap: "12px" }}>
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  style={{
                    border: "1px solid rgba(6, 182, 212, 0.25)",
                    background: "rgba(15, 23, 42, 0.4)",
                    color: "white",
                    borderRadius: "999px",
                    padding: "12px 18px",
                    cursor: "pointer",
                    fontSize: "12px",
                    fontWeight: 800,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                  }}
                >
                  Choose another
                </button>

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
                    fontWeight: 800,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                  }}
                >
                  Back to dashboard
                </button>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}

