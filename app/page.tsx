"use client"

import { useState } from "react"
import CallInterface from "@/components/call-interface"
import CallSetup from "@/components/call-setup"
import PastCallsModal from "@/components/past-calls-modal"

export default function Home() {
  const [isInCall, setIsInCall] = useState(false)
  const [isPastCallsOpen, setIsPastCallsOpen] = useState(false)
  const [callConfig, setCallConfig] = useState<{
    roomName: string
    callType: "web" | "phone"
    phoneNumber?: string
    accessToken: string
    liveKitUrl: string
    participantName: string
  } | null>(null)

  const handleStartCall = (config: {
    roomName: string
    callType: "web" | "phone"
    phoneNumber?: string
    accessToken: string
    liveKitUrl: string
    participantName: string
  }) => {
    setCallConfig(config)
    setIsInCall(true)
  }

  const handleEndCall = () => {
    setIsInCall(false)
    setCallConfig(null)
  }

  return (
    <main className="min-h-screen bg-background">
      {!isInCall ? (
        <CallSetup 
          onStartCall={handleStartCall} 
          onViewPastCalls={() => setIsPastCallsOpen(true)}
        />
      ) : callConfig ? (
        <CallInterface config={callConfig} onEndCall={handleEndCall} />
      ) : null}
      
      <PastCallsModal 
        isOpen={isPastCallsOpen} 
        onClose={() => setIsPastCallsOpen(false)} 
      />
    </main>
  )
}
