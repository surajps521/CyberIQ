// frontend/src/components/ui/VoiceButton.tsx

"use client"

import { useState } from "react"

// ✅ Add these props so the parent can pass them in
interface VoiceButtonProps {
  selectedLanguage: string          // 'kn' or 'en'
  onTranscript: (text: string) => void  // replaces setChatInput
}

const VoiceButton = ({ selectedLanguage, onTranscript }: VoiceButtonProps) => {
  const [isRecording, setIsRecording] = useState(false)

  const startRecording = async () => {
    setIsRecording(true)

    // Ask browser for microphone access
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    const recorder = new MediaRecorder(stream)
    const chunks: BlobPart[] = []

    recorder.ondataavailable = (e) => chunks.push(e.data)

    recorder.onstop = async () => {
      // Convert recorded chunks to a WAV blob
      const audioBlob = new Blob(chunks, { type: 'audio/wav' })

      // Send to backend for transcription
      const formData = new FormData()
      formData.append('audio', audioBlob)
      formData.append('language', selectedLanguage) // ✅ now defined via props

      const res = await fetch('/api/voice/transcribe', {
        method: 'POST',
        body: formData
      })
      const { transcript } = await res.json()

      // ✅ Use the prop callback instead of setChatInput
      onTranscript(transcript)
      setIsRecording(false)
    }

    recorder.start()
    setTimeout(() => recorder.stop(), 5000) // Record for 5 seconds
  }

  return (
    <button
      onClick={startRecording}
      disabled={isRecording}
      className={`p-2 rounded-full transition-all ${isRecording
          ? 'bg-red-500 animate-pulse'   // glowing red when recording
          : 'bg-blue-600 hover:bg-blue-700'
        }`}
    >
      🎙️
    </button>
  )
}

export default VoiceButton