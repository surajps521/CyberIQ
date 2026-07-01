import { useState, useCallback, useRef } from "react"

export interface ChatMessage {
    id: string | number
    type: "user" | "ai"
    text: string
    source?: string
    confidence?: number
}

export function useChat() {
    const [messages, setMessages] = useState<ChatMessage[]>([{
        id: "init",
        type: "ai",
        text: "Welcome to KSP CrimeIQ. How can I assist with your investigation today?",
        source: "System",
    }])
    const [isTyping, setIsTyping] = useState(false)
    const [connected, setConnected] = useState(false)
    const wsRef = useRef<WebSocket | null>(null)
    const reconnectTimerRef = useRef<number | null>(null)

    const getWebSocketUrl = () => {
        if (typeof window === "undefined") {
            return "wss://cyberiq-3hwj.onrender.com/ws/chat"
        }

        const envUrl = process.env.NEXT_PUBLIC_BACKEND_WS_URL
        if (envUrl) {
            return envUrl.replace(/^http/, "ws")
        }

        const protocol = window.location.protocol === "https:" ? "wss:" : "ws:"
        return `${protocol}//${window.location.hostname}:8000/ws/chat`
    }

    const buildLocalResponse = (input: string) => {
        const q = input.toLowerCase().trim()

        const criminalRecords = [
            "- Rajesh Yadav (Raja) | Wanted | BTM Layout | 5 cases | Crimes: Robbery, Chain Snatching",
            "- Deepak Nair (Deep) | Wanted | Hebbal | 6 cases | Crimes: Vehicle Theft, Robbery",
            "- Vikram Singh (Vikki) | Arrested | Jayanagar | 8 cases | Crimes: Assault, Murder",
        ]

        const caseRecords = [
            "- KSP/BLR/2024/4521 | Chain Snatching | Bengaluru South | Jayanagar 4th Block | Investigating",
            "- KSP/BLR/2024/4522 | Two-wheeler Theft | Bengaluru South | BTM Layout | Open",
            "- KSP/BLR/2024/4523 | Robbery | Bengaluru East | Whitefield Main Road | Chargesheeted",
            "- KSP/MYS/2024/1182 | Burglary | Mysuru | VV Mohalla | Open",
        ]

        if (q.match(/^(hi|hello|hey|good morning|good afternoon|good evening)[!. ]*$/)) {
            return {
                text: "Hello. Ask me about criminal records, case status, locations, FIR numbers, or specific suspects.",
            }
        }

        if (q.includes("wanted suspects in bengaluru") || q.includes("wanted suspects") || q.includes("criminal record") || q.includes("criminal records") || q.includes("criminal") || q.includes("suspect") || q.includes("wanted")) {
            return {
                text: [
                    "I found these Karnataka suspects matching your request:",
                    ...criminalRecords,
                    "- Suggested follow-up: ask for one name, like 'Raja' or 'Deep', for the full dossier with age, area, crimes, and case count."
                ].join("\n")
            }
        }

        if (q.includes("case") || q.includes("fir") || q.includes("list") || q.includes("show") || q.includes("count")) {
            return {
                text: [
                    "I found these Karnataka case records:",
                    ...caseRecords,
                    "- Suggested follow-up: ask for one FIR number or district to get a case summary with officer, status, victims, accused, and recommended action."
                ].join("\n")
            }
        }

        if (q.includes("location") || q.includes("locations") || q.includes("area") || q.includes("district") || q.includes("hotspot")) {
            return {
                text: [
                    "Current Karnataka hotspots from the dummy data:",
                    "- Bengaluru South: Jayanagar 4th Block, BTM Layout",
                    "- Bengaluru East: Whitefield Main Road",
                    "- Mysuru: VV Mohalla",
                    "- Belagavi: Tilakwadi",
                    "- Suggested follow-up: ask 'hotspots in Bengaluru South' or 'cases in Mysuru'."
                ].join("\n")
            }
        }

        return {
            text: [
                "I can help with criminal records, cases, locations, hotspots, and FIR details.",
                "Try: 'wanted suspects in Bengaluru', 'show Bengaluru South robbery cases', or 'case summary for KSP/BLR/2024/4521'."
            ].join("\n")
        }
    }

    const connect = useCallback(() => {
        if (wsRef.current?.readyState === WebSocket.OPEN || wsRef.current?.readyState === WebSocket.CONNECTING) return

        if (reconnectTimerRef.current) {
            window.clearTimeout(reconnectTimerRef.current)
            reconnectTimerRef.current = null
        }

        const ws = new WebSocket(getWebSocketUrl())
        wsRef.current = ws

        ws.onopen = () => {
            setConnected(true)
        }

        ws.onclose = () => {
            setConnected(false)
            scheduleReconnect()
        }

        ws.onerror = () => {
            setConnected(false)
            scheduleReconnect()
        }

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data)

                if (data.type === "typing") {
                    setIsTyping(data.status)
                } else if (data.type === "message") {
                    setIsTyping(false)
                    setMessages(prev => [...prev, {
                        id: Date.now().toString(),
                        type: "ai",
                        text: data.text,
                        source: data.source,
                        confidence: data.confidence
                    }])
                } else if (data.type === "error") {
                    setIsTyping(false)
                    setMessages(prev => [...prev, {
                        id: Date.now().toString(),
                        type: "ai",
                        text: "Error: " + data.text,
                        source: "System Error"
                    }])
                }
            } catch (e) {
                console.error("Failed to parse websocket message", e)
            }
        }
    }, [])

    const scheduleReconnect = useCallback(() => {
        if (typeof window === "undefined") return
        if (reconnectTimerRef.current) return

        reconnectTimerRef.current = window.setTimeout(() => {
            reconnectTimerRef.current = null
            connect()
        }, 1500)
    }, [connect])

    const sendMessage = (input: string, language: "en" | "kn") => {
        if (!input.trim()) return

        setMessages(prev => [...prev, {
            id: "user-" + Date.now().toString(),
            type: "user",
            text: input
        }])

        const socket = wsRef.current
        if (!socket || socket.readyState !== WebSocket.OPEN) {
            const fallback = buildLocalResponse(input)
            setIsTyping(false)
            setMessages(prev => [...prev, {
                id: "ai-" + Date.now().toString(),
                type: "ai",
                text: fallback.text,
            }])
            connect()
            return
        }

        setIsTyping(true)

        socket.send(JSON.stringify({
            message: input,
            language: language
        }))
    }

    return { messages, isTyping, connected, connect, sendMessage }
}
