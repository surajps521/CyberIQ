"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { ArrowLeft, Camera, RotateCcw, Upload, X, MapPin, ShieldCheck } from "lucide-react"
import AnimatedGrid from "@/components/AnimatedGrid"

type ToastKind = "success" | "error" | "info"

export default function EvidencePage() {
  const router = useRouter()

  const [mode, setMode] = useState<"idle" | "preview" | "captured" | "uploading">("idle")
  const [error, setError] = useState<string>("")
  const [success, setSuccess] = useState<string>("")
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null)

  const [streamError, setStreamError] = useState<string>("")
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null)
  const [capturedUrl, setCapturedUrl] = useState<string>("")

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const [isCameraStarting, setIsCameraStarting] = useState(false)
  const [uploadProgressText, setUploadProgressText] = useState<string>("")

  const backendUrl = useMemo(() => {
    return process.env.NEXT_PUBLIC_BACKEND_HTTP_URL || "http://localhost:8000"
  }, [])

  const [jwtToken, setJwtToken] = useState("")
  const MAX_BYTES = 10_000_000

  useEffect(() => {
    try {
      setJwtToken(localStorage.getItem("ksp_jwt") || "")
    } catch {
      setJwtToken("")
    }
  }, [])


  useEffect(() => {
    return () => {
      stopCamera()
      if (capturedUrl) URL.revokeObjectURL(capturedUrl)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const stopCamera = () => {
    try {
      streamRef.current?.getTracks().forEach((t) => t.stop())
    } catch {
      // ignore
    }
    streamRef.current = null
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
  }

  const startCamera = async () => {
    setError("")
    setSuccess("")
    setStreamError("")
    setUploadProgressText("")

    setIsCameraStarting(true)
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Camera API not available in this browser")
      }

      stopCamera()

      // Open device camera directly (no gallery picker)
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
        },
        audio: false,
      })

      streamRef.current = stream

      // Switch UI first so <video> is mounted, then bind the stream.
      // This prevents `videoRef.current` from being null due to React rendering order.
      setMode("preview")

      await new Promise((r) => setTimeout(r, 0))
      // If React hasn't mounted the <video> yet (render order), retry briefly.
      let videoEl = videoRef.current
      for (let i = 0; i < 10 && !videoEl; i++) {
        await new Promise((r) => setTimeout(r, 20))
        videoEl = videoRef.current
      }

      if (!videoEl) {
        throw new Error("Video element not found (not mounted yet)")
      }

      // Ensure correct playback flags (prevents black preview on some browsers)
      videoEl.playsInline = true
      videoEl.muted = true
      videoEl.srcObject = stream

      // Attempt to start playback (best-effort).
      try {
        await videoEl.play()
      } catch {
        // If autoplay is blocked, user can still capture once stream is visible.
      }

      await new Promise((r) => setTimeout(r, 50))




    } catch (e: any) {
      setStreamError(e?.message || "Unable to access camera")
      setMode("idle")
    } finally {
      setIsCameraStarting(false)
    }
  }




  const capturePhoto = () => {

    setError("")
    setSuccess("")
    setUploadProgressText("")

    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) {
      setError("Camera not ready")
      return
    }

    // Ensure we have valid frame dimensions before capture
    const w = video.videoWidth || 1280
    const h = video.videoHeight || 720
    if (!w || !h) {
      setError("Camera is not ready for capture yet. Try again.")
      return
    }
    canvas.width = w
    canvas.height = h


    const ctx = canvas.getContext("2d")
    if (!ctx) {
      setError("Unable to capture image")
      return
    }

    ctx.drawImage(video, 0, 0, w, h)

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setError("Unable to capture image")
          return
        }

        if (blob.size > MAX_BYTES) {
          setError(`Captured image is too large. Max allowed is ${MAX_BYTES} bytes.`)
          return
        }

        // Keep image only in memory until upload
        setCapturedBlob(blob)
        const url = URL.createObjectURL(blob)
        setCapturedUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev)
          return url
        })

        stopCamera()
        setMode("captured")
      },
      "image/jpeg",
      0.92,
    )
  }

  const retake = async () => {
    setError("")
    setSuccess("")
    setUploadProgressText("")

    // Clear captured image from memory for retake
    if (capturedUrl) URL.revokeObjectURL(capturedUrl)
    setCapturedUrl("")
    setCapturedBlob(null)
    setLocation(null)

    await startCamera()
  }

  const cancel = () => {
    setError("")
    setSuccess("")
    setUploadProgressText("")

    if (capturedUrl) URL.revokeObjectURL(capturedUrl)
    setCapturedUrl("")
    setCapturedBlob(null)
    setLocation(null)

    stopCamera()
    setMode("idle")
  }

  const requestLocation = async () => {
    setError("")
    setSuccess("")

    if (!navigator.geolocation) {
      throw new Error("Geolocation not available")
    }

    const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      })
    })

    if (pos.coords.latitude == null || pos.coords.longitude == null) {
      throw new Error("Unable to get location")
    }

    return { latitude: pos.coords.latitude, longitude: pos.coords.longitude }
  }

  const upload = async () => {
    if (!capturedBlob) {
      setError("No captured image to upload")
      return
    }

    setError("")
    setSuccess("")
    setUploadProgressText("Requesting location...")

    // Token comes from Login.tsx. If it is missing (user opened this page directly),
    // fall back to backend-based token issuance using demo user stored in localStorage.
    if (!jwtToken) {
      try {
        const userRaw = localStorage.getItem("ksp_user")
        const user = userRaw ? JSON.parse(userRaw) : null
        if (user?.badgeId && user?.role) {
          const backendUrl = process.env.NEXT_PUBLIC_BACKEND_HTTP_URL || "http://localhost:8000"
          const resTok = await fetch(`${backendUrl}/auth/token`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            // Demo app: password isn't stored in localStorage; backend token issuance expects it.
            // So we cannot mint a token here. We display a clearer error.
            body: JSON.stringify({ badge_id: user.badgeId, password: "", role: user.role }),
          })
          if (resTok.ok) {
            const d = await resTok.json()
            if (d?.accessToken) {
              setJwtToken(d.accessToken)
              localStorage.setItem("ksp_jwt", d.accessToken)
            }
          }
        }
      } catch {
        // ignore
      }
    }

    const finalToken = localStorage.getItem("ksp_jwt") || jwtToken
    if (!finalToken) {
      setError("Authentication token missing. Please login again from the main login page.")
      return
    }


    try {
      const loc = await requestLocation()
      setLocation(loc)

      setUploadProgressText("Uploading evidence...")
      setMode("uploading")

      const form = new FormData()
      form.append("file", capturedBlob, `evidence.jpg`)
      form.append("latitude", String(loc.latitude))
      form.append("longitude", String(loc.longitude))

      const res = await fetch(`${backendUrl}/evidence/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${finalToken}`,
        },

        body: form,
      })

      if (!res.ok) {
        let detail = "Upload failed"
        try {
          const payload = await res.json()
          if (payload?.detail) detail = payload.detail
        } catch {
          // ignore
        }
        throw new Error(detail)
      }

      const payload = await res.json()
      setSuccess(`Evidence uploaded successfully. Evidence ID: ${payload?.evidenceId || ""}`)

      // Immediately clear image from memory and remove temp files created by the application.
      if (capturedUrl) URL.revokeObjectURL(capturedUrl)
      setCapturedUrl("")
      setCapturedBlob(null)
      setLocation(null)

      // Return to idle (camera stays stopped)
      setMode("idle")
      setUploadProgressText("")
      // Clear captured image immediately after a successful upload
      if (capturedUrl) URL.revokeObjectURL(capturedUrl)
      setCapturedUrl("")
      setCapturedBlob(null)
    } catch (e: any) {

      setMode("captured")
      setError(e?.message || "Upload failed")
      setUploadProgressText("")
    }
  }

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
        style={{ position: "relative", zIndex: 10, width: "100%", maxWidth: "760px" }}
      >
        <div
          style={{
            background: "rgba(15, 23, 42, 0.9)",
            backdropFilter: "blur(24px)",
            border: "1px solid rgba(6, 182, 212, 0.15)",
            borderRadius: "20px",
            padding: "26px 22px",
            boxShadow: "0 25px 60px rgba(0,0,0,0.5), 0 0 40px rgba(6,182,212,0.05)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <img src="/favicon.svg" alt="CRIMEIQ icon" width={48} height={48} style={{ display: "block" }} />
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Camera size={20} color="#06b6d4" />
                  <h1 style={{ color: "white", fontSize: 26, margin: 0 }}>Evidence Capture</h1>
                </div>
                <p style={{ textAlign: "left", color: "hsl(215,20%,55%)", fontSize: 13, marginTop: 6, marginBottom: 0 }}>
                  Capture evidence using the device camera. Stored securely for upload.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => router.push("/dashboard")}
              style={{
                border: "1px solid rgba(6, 182, 212, 0.25)",
                background: "linear-gradient(135deg, #1E3A8A, #06B6D4)",
                color: "white",
                borderRadius: "999px",
                padding: "10px 14px",
                cursor: "pointer",
                fontSize: "12px",
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                whiteSpace: "nowrap",
              }}
            >
              <ArrowLeft size={16} /> Back
            </button>
          </div>

          <div style={{ height: 16 }} />

          {(error || success) && (
            <div
              style={{
                borderRadius: 14,
                padding: "10px 14px",
                border: `1px solid ${error ? "rgba(248,113,113,0.35)" : "rgba(34,197,94,0.35)"}`,
                background: error ? "rgba(220,38,38,0.10)" : "rgba(34,197,94,0.10)",
                color: error ? "#fecaca" : "#bbf7d0",
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 12,
                fontSize: 12,
              }}
            >
              {error ? <X size={14} /> : <ShieldCheck size={14} />}
              <span>{error || success}</span>
            </div>
          )}

          {streamError && (
            <div
              style={{
                borderRadius: 14,
                padding: "10px 14px",
                border: "1px solid rgba(248,113,113,0.35)",
                background: "rgba(220,38,38,0.10)",
                color: "#fecaca",
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 12,
                fontSize: 12,
              }}
            >
              <X size={14} />
              <span>{streamError}</span>
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 14 }}>
            <div
              style={{
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 16,
                overflow: "hidden",
                background: "rgba(255,255,255,0.03)",
              }}
            >
              <div style={{ position: "relative", aspectRatio: "16/10", minHeight: 280 }}>
                {mode === "preview" && (
                  <video
                    ref={videoRef}
                    playsInline
                    muted
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                )}

                {mode === "captured" && capturedUrl && (
                  <img src={capturedUrl} alt="Captured evidence" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                )}

                {mode === "idle" && (
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: 18,
                      gap: 10,
                      textAlign: "center",
                    }}
                  >
                    <div
                      style={{
                        width: 64,
                        height: 64,
                        borderRadius: 20,
                        background: "linear-gradient(135deg,#1E3A8A,#06B6D4)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "0 0 30px rgba(6,182,212,0.25)",
                      }}
                    >
                      <Camera size={26} color="white" />
                    </div>
                    <div style={{ color: "white", fontWeight: 800 }}>Capture evidence photo</div>
                    <div style={{ color: "hsl(215,20%,55%)", fontSize: 12 }}>
                      Photos stay in memory until you upload.
                    </div>
                  </div>
                )}

                {/* hidden canvas for capture */}
                <canvas ref={canvasRef} style={{ display: "none" }} />

                {mode === "uploading" && (
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      background: "rgba(0,0,0,0.45)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexDirection: "column",
                      gap: 10,
                      color: "white",
                      padding: 18,
                      textAlign: "center",
                    }}
                  >
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: "50%",
                        border: "2px solid rgba(255,255,255,0.25)",
                        borderTop: "2px solid white",
                        animation: "spin 0.8s linear infinite",
                      }}
                    />
                    <div style={{ fontSize: 12, color: "hsl(215,20%,75%)" }}>{uploadProgressText || "Uploading..."}</div>
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 10 }}>
              {location && (
                <div style={{ display: "flex", alignItems: "center", gap: 10, color: "#bbf7d0", fontSize: 12 }}>
                  <MapPin size={14} />
                  Location captured: {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                </div>
              )}

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {mode === "idle" && (
                  <button
                    type="button"
                    onClick={startCamera}
                    disabled={isCameraStarting}
                    style={{
                      border: "1px solid rgba(6, 182, 212, 0.25)",
                      background: isCameraStarting ? "rgba(6,182,212,0.18)" : "linear-gradient(135deg,#1E3A8A,#06B6D4)",
                      color: "white",
                      borderRadius: 14,
                      padding: "12px 14px",
                      cursor: isCameraStarting ? "not-allowed" : "pointer",
                      fontSize: 12,
                      fontWeight: 800,
                      letterSpacing: "0.06em",
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                    }}
                  >
                    <Camera size={16} /> {isCameraStarting ? "Starting camera..." : "Open Camera"}
                  </button>
                )}

                {mode === "preview" && (
                  <>
                    <button
                      type="button"
                      onClick={capturePhoto}
                      style={{
                        border: "1px solid rgba(6, 182, 212, 0.25)",
                        background: "linear-gradient(135deg,#06B6D4,#1E3A8A)",
                        color: "white",
                        borderRadius: 14,
                        padding: "12px 14px",
                        cursor: "pointer",
                        fontSize: 12,
                        fontWeight: 800,
                        letterSpacing: "0.06em",
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                      }}
                    >
                      <Camera size={16} /> Capture
                    </button>
                    <button
                      type="button"
                      onClick={cancel}
                      style={{
                        border: "1px solid rgba(248,113,113,0.35)",
                        background: "rgba(220,38,38,0.12)",
                        color: "#fecaca",
                        borderRadius: 14,
                        padding: "12px 14px",
                        cursor: "pointer",
                        fontSize: 12,
                        fontWeight: 800,
                        letterSpacing: "0.06em",
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                      }}
                    >
                      <X size={16} /> Cancel
                    </button>
                  </>
                )}

                {mode === "captured" && (
                  <>
                    <button
                      type="button"
                      onClick={retake}
                      style={{
                        border: "1px solid rgba(6, 182, 212, 0.25)",
                        background: "rgba(6,182,212,0.08)",
                        color: "white",
                        borderRadius: 14,
                        padding: "12px 14px",
                        cursor: "pointer",
                        fontSize: 12,
                        fontWeight: 800,
                        letterSpacing: "0.06em",
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                      }}
                    >
                      <RotateCcw size={16} /> Retake
                    </button>

                    <button
                      type="button"
                      onClick={upload}
                      style={{
                        border: "1px solid rgba(6, 182, 212, 0.25)",
                        background: "linear-gradient(135deg,#1E3A8A,#06B6D4)",
                        color: "white",
                        borderRadius: 14,
                        padding: "12px 14px",
                        cursor: "pointer",
                        fontSize: 12,
                        fontWeight: 800,
                        letterSpacing: "0.06em",
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                      }}
                    >
                      <Upload size={16} /> Upload
                    </button>

                    <button
                      type="button"
                      onClick={cancel}
                      style={{
                        border: "1px solid rgba(248,113,113,0.35)",
                        background: "rgba(220,38,38,0.12)",
                        color: "#fecaca",
                        borderRadius: 14,
                        padding: "12px 14px",
                        cursor: "pointer",
                        fontSize: 12,
                        fontWeight: 800,
                        letterSpacing: "0.06em",
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                      }}
                    >
                      <X size={16} /> Cancel
                    </button>
                  </>
                )}
              </div>

              <div style={{ color: "hsl(215,20%,55%)", fontSize: 12, lineHeight: 1.6 }}>
                <div>✓ Capture uses device camera (no gallery/file picker).</div>
                <div>✓ Captured image is kept only in memory until upload.</div>
                <div>✓ Upload requests location permission and logs latitude/longitude + timestamp.</div>
              </div>
            </div>
          </div>

          <style>{`
            @keyframes spin { to { transform: rotate(360deg); } }
          `}</style>
        </div>
      </motion.div>
    </div>
  )
}

