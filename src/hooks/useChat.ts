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

    const connect = useCallback(() => {
        if (wsRef.current?.readyState === WebSocket.OPEN || wsRef.current?.readyState === WebSocket.CONNECTING) return

        const ws = new WebSocket("ws://localhost:8000/ws/chat")
        wsRef.current = ws

        ws.onopen = () => {
            setConnected(true)
        }

        ws.onclose = () => {
            setConnected(false)
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

    const sendMessage = (input: string, language: "en" | "kn") => {
        if (!input.trim() || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return

        setMessages(prev => [...prev, {
            id: "user-" + Date.now().toString(),
            type: "user",
            text: input
        }])

        setIsTyping(true)

        wsRef.current.send(JSON.stringify({
            message: input,
            language: language
        }))
    }

    return { messages, isTyping, connected, connect, sendMessage }
}
