"use client"

import "@livekit/components-styles"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { PhoneOff, Mic, MicOff, Volume2, VolumeX, AlertCircle, Bot, User } from "lucide-react"
import {
  LiveKitRoom,
  RoomAudioRenderer,
  useVoiceAssistant,
  useRoomContext,
  useTracks,
} from "@livekit/components-react"
import { Track } from "livekit-client"

interface CallInterfaceProps {
  config: {
    roomName: string
    callType: "web" | "phone"
    phoneNumber?: string
    accessToken: string
    liveKitUrl: string
    participantName: string
    metadata?: {
      first_name?: string
      last_name?: string
      street_address?: string
      city?: string
      postal_code?: string
      phone_type?: string
      request_type?: string
      call_direction?: string
      company_name?: string
      electricity_recommended_supplier?: string
      electricity_quote_annual_cost?: string
      gas_recommended_supplier?: string
      gas_quote_annual_cost?: string
    }
  }
  onEndCall: () => void
}

// Inner component that uses LiveKit hooks (must be inside LiveKitRoom)
function CallControls({ config, onEndCall }: CallInterfaceProps) {
  const [duration, setDuration] = useState(0)
  const [isMicMuted, setIsMicMuted] = useState(false)
  const [isUserSpeaking, setIsUserSpeaking] = useState(false)
  const [isAgentSpeaking, setIsAgentSpeaking] = useState(false)
  const room = useRoomContext()
  const { state: agentState } = useVoiceAssistant()

  // Get participant connection status
  const isConnected = room?.state === "connected"

  // Track when user is speaking (based on mic activity)
  useEffect(() => {
    if (!room?.localParticipant) return

    const handleSpeakingChanged = (speaking: boolean) => {
      setIsUserSpeaking(speaking)
      console.log("[v0] User speaking:", speaking)
    }

    room.localParticipant.on("isSpeakingChanged", handleSpeakingChanged)

    return () => {
      room.localParticipant?.off("isSpeakingChanged", handleSpeakingChanged)
    }
  }, [room])

  // Track when agent is speaking
  useEffect(() => {
    if (!room) return

    const handleTrackSubscribed = (track: any, publication: any, participant: any) => {
      // Check if this is the agent participant
      if (participant.identity.includes("agent") || participant.metadata?.includes("agent")) {
        console.log("[v0] Agent track subscribed")
      }
    }

    const handleSpeakingChanged = (participant: any) => {
      // Check if the speaking participant is the agent
      const isAgent = participant.identity.includes("agent") || participant.metadata?.includes("agent")
      if (isAgent) {
        setIsAgentSpeaking(participant.isSpeaking)
        console.log("[v0] Agent speaking:", participant.isSpeaking)
      }
    }

    room.on("trackSubscribed", handleTrackSubscribed)
    
    // Listen to all remote participants for speaking changes
    room.remoteParticipants.forEach((participant) => {
      participant.on("isSpeakingChanged", (speaking: boolean) => {
        const isAgent = participant.identity.includes("agent") || participant.metadata?.includes("agent")
        if (isAgent) {
          setIsAgentSpeaking(speaking)
          console.log("[v0] Agent speaking:", speaking)
        }
      })
    })

    // Listen for new participants joining
    room.on("participantConnected", (participant: any) => {
      participant.on("isSpeakingChanged", (speaking: boolean) => {
        const isAgent = participant.identity.includes("agent") || participant.metadata?.includes("agent")
        if (isAgent) {
          setIsAgentSpeaking(speaking)
        }
      })
    })

    return () => {
      room.off("trackSubscribed", handleTrackSubscribed)
    }
  }, [room])

  // Also track agent state changes
  useEffect(() => {
    if (agentState === "speaking") {
      setIsAgentSpeaking(true)
    } else if (agentState === "listening") {
      setIsAgentSpeaking(false)
    }
  }, [agentState])

  useEffect(() => {
    const interval = setInterval(() => {
      setDuration((d) => d + 1)
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  // Monitor room state and disconnection
  useEffect(() => {
    if (!room) return

    const handleDisconnected = () => {
      console.log("[v0] Room disconnected - ending call")
      onEndCall()
    }

    const handleConnectionStateChanged = (state: any) => {
      console.log("[v0] Connection state changed:", state)
      if (state === "disconnected") {
        console.log("[v0] Connection state is disconnected - ending call")
        onEndCall()
      }
    }

    room.on("disconnected", handleDisconnected)
    room.on("connectionStateChanged", handleConnectionStateChanged)

    return () => {
      room.off("disconnected", handleDisconnected)
      room.off("connectionStateChanged", handleConnectionStateChanged)
    }
  }, [room, onEndCall])

  // Poll backend to check if room still exists
  useEffect(() => {
    const checkRoomStatus = async () => {
      try {
        const response = await fetch(`/api/calls/${config.roomName}`)
        const data = await response.json()
        
        if (response.status === 404 || data.status === "ended") {
          console.log("[v0] Room no longer exists on backend - ending call")
          onEndCall()
        }
      } catch (error) {
        console.error("[v0] Error checking room status:", error)
      }
    }

    // Check every 5 seconds
    const interval = setInterval(checkRoomStatus, 5000)

    return () => clearInterval(interval)
  }, [config.roomName, onEndCall])

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const toggleMicrophone = async () => {
    if (room?.localParticipant) {
      const newMutedState = !isMicMuted
      await room.localParticipant.setMicrophoneEnabled(!newMutedState)
      setIsMicMuted(newMutedState)
      console.log("[v0] Microphone", newMutedState ? "muted" : "unmuted")
    }
  }

  const handleEndCall = async () => {
    try {
      await room?.disconnect()
      await fetch(`/api/calls/${config.roomName}`, { method: "DELETE" })
      console.log("[v0] Call ended successfully")
      onEndCall()
    } catch (error) {
      console.error("[v0] Error ending call:", error)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-background flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/4 right-1/4 w-72 h-72 bg-accent/5 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 w-full max-w-7xl flex gap-6 items-start">
        {/* Customer Information - Left Side */}
        <div className="flex-1 min-w-[280px]">
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-2 border-primary/30 shadow-xl rounded-2xl overflow-hidden">
            <div className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <User className="w-5 h-5 text-primary" />
                <h3 className="text-base font-bold text-primary uppercase tracking-wider">
                  Customer Information
                </h3>
              </div>
              <div className="space-y-4">
                <div className="bg-background/50 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground mb-2">Name</p>
                  <p className="text-lg font-bold text-foreground">
                    {config.metadata?.first_name && config.metadata?.last_name 
                      ? `${config.metadata.first_name} ${config.metadata.last_name}`
                      : config.metadata?.first_name || "N/A"}
                  </p>
                </div>
                <div className="bg-background/50 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground mb-2">Address</p>
                  <div className="text-base font-semibold text-foreground space-y-1">
                    {config.metadata?.street_address && (
                      <p>{config.metadata.street_address}</p>
                    )}
                    {config.metadata?.city && (
                      <p>{config.metadata.city}</p>
                    )}
                    {config.metadata?.postal_code && (
                      <p className="uppercase">{config.metadata.postal_code}</p>
                    )}
                    {!config.metadata?.street_address && !config.metadata?.city && !config.metadata?.postal_code && (
                      <p>N/A</p>
                    )}
                  </div>
                </div>
                <div className="bg-background/50 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground mb-2">Call Type</p>
                  <p className="text-base font-semibold text-foreground">
                    {config.callType === "phone" ? `📞 Phone: ${config.phoneNumber}` : "💻 Web Call"}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Main Call Interface - Center */}
        <div className="flex-1 min-w-[400px] max-w-2xl">
          <Card className="bg-card backdrop-blur-xl border border-border shadow-2xl rounded-3xl overflow-hidden">
            <div className="p-8">
                {/* Connection Status */}
                <div className="flex items-center justify-center mb-8">
                  <div className="text-center">
                    <div
                      className={`inline-block mb-3 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                        isConnected ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <span className="inline-block w-2 h-2 rounded-full mr-2 bg-current"></span>
                      {isConnected ? "Connected" : "Connecting..."}
                    </div>
                    {agentState && (
                      <p className="text-xs text-muted-foreground">Agent: {agentState}</p>
                    )}
                  </div>
                </div>

                {/* Speaking Indicators */}
                <div className="flex justify-center gap-8 mb-8">
                  {/* User Speaking Indicator */}
                  <div className="flex flex-col items-center gap-2">
                    <div
                      className={`relative w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 ${
                        isUserSpeaking
                          ? "bg-primary shadow-lg shadow-primary/50 scale-110"
                          : "bg-muted/50"
                      }`}
                    >
                      <User
                        className={`w-8 h-8 transition-all duration-300 ${
                          isUserSpeaking ? "text-primary-foreground" : "text-muted-foreground"
                        }`}
                      />
                      {isUserSpeaking && (
                        <div className="absolute inset-0 rounded-full border-2 border-primary animate-ping"></div>
                      )}
                    </div>
                    <p
                      className={`text-xs font-medium transition-colors ${
                        isUserSpeaking ? "text-primary" : "text-muted-foreground"
                      }`}
                    >
                      You
                    </p>
                  </div>

                  {/* Agent Speaking Indicator */}
                  <div className="flex flex-col items-center gap-2">
                    <div
                      className={`relative w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 ${
                        isAgentSpeaking
                          ? "bg-accent shadow-lg shadow-accent/50 scale-110"
                          : "bg-muted/50"
                      }`}
                    >
                      <Bot
                        className={`w-8 h-8 transition-all duration-300 ${
                          isAgentSpeaking ? "text-accent-foreground" : "text-muted-foreground"
                        }`}
                      />
                      {isAgentSpeaking && (
                        <div className="absolute inset-0 rounded-full border-2 border-accent animate-ping"></div>
                      )}
                    </div>
                    <p
                      className={`text-xs font-medium transition-colors ${
                        isAgentSpeaking ? "text-accent" : "text-muted-foreground"
                      }`}
                    >
                      AI Assistant
                    </p>
                  </div>
                </div>

                {/* Duration */}
                <div className="text-center mb-12">
                  <div className="inline-block">
                    <div className="text-5xl font-mono font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                      {formatDuration(duration)}
                    </div>
                  </div>
                </div>

                {/* Controls */}
                <div className="flex justify-center gap-4 mb-8">
                  {/* Mic Toggle */}
                  <Button
                    onClick={toggleMicrophone}
                    variant="outline"
                    size="lg"
                    className={`rounded-full w-16 h-16 transition-all ${
                      isMicMuted
                        ? "bg-destructive/20 border-destructive/30 text-destructive hover:bg-destructive/30"
                        : "bg-muted border-border text-foreground hover:bg-muted/80"
                    }`}
                  >
                    {isMicMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                  </Button>
                </div>

              {/* End Call Button */}
              <Button
                onClick={handleEndCall}
                className="w-full h-14 bg-gradient-to-r from-destructive to-destructive/90 hover:from-destructive/90 hover:to-destructive/80 text-destructive-foreground font-semibold rounded-xl flex items-center justify-center gap-2 text-lg"
              >
                <PhoneOff className="w-5 h-5" />
                End Call
              </Button>
            </div>
          </Card>
        </div>

        {/* Company Information - Right Side */}
        <div className="flex-1 min-w-[280px]">
          <Card className="bg-gradient-to-br from-accent/10 to-accent/5 border-2 border-accent/30 shadow-xl rounded-2xl overflow-hidden">
            <div className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <Bot className="w-5 h-5 text-accent" />
                <h3 className="text-base font-bold text-accent uppercase tracking-wider">
                  Company Information
                </h3>
              </div>
              <div className="space-y-4">
                <div className="bg-background/50 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground mb-2">Company Name</p>
                  <p className="text-lg font-bold text-foreground">
                    {config.metadata?.company_name || "Energy Switch Ltd"}
                  </p>
                </div>
                
                {/* Electricity */}
                <div className="bg-accent/20 border border-accent/40 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-lg">⚡</span>
                    <p className="text-sm font-semibold text-accent">Electricity</p>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs text-muted-foreground">Recommended Supplier</p>
                      <p className="text-base font-bold text-foreground">
                        {config.metadata?.electricity_recommended_supplier || "Octopus Energy"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Annual Cost</p>
                      <p className="text-xl font-bold text-accent">
                        £{config.metadata?.electricity_quote_annual_cost || "850"}/year
                      </p>
                    </div>
                  </div>
                </div>

                {/* Gas */}
                <div className="bg-primary/20 border border-primary/40 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-lg">🔥</span>
                    <p className="text-sm font-semibold text-primary">Gas</p>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs text-muted-foreground">Recommended Supplier</p>
                      <p className="text-base font-bold text-foreground">
                        {config.metadata?.gas_recommended_supplier || "British Gas"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Annual Cost</p>
                      <p className="text-xl font-bold text-primary">
                        £{config.metadata?.gas_quote_annual_cost || "650"}/year
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

// Main component that wraps everything in LiveKitRoom
export default function CallInterface({ config, onEndCall }: CallInterfaceProps) {
  const [shouldConnect, setShouldConnect] = useState(config.callType === "web")

  // For phone calls, show a prompt before connecting
  if (config.callType === "phone" && !shouldConnect) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-background flex items-center justify-center p-4">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
        </div>

        <div className="relative z-10 w-full max-w-7xl flex gap-6 items-start">
          {/* Customer Information - Left Side */}
          <div className="flex-1 min-w-[280px]">
            <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-2 border-primary/30 shadow-xl rounded-2xl overflow-hidden">
              <div className="p-6">
                <div className="flex items-center gap-2 mb-6">
                  <User className="w-5 h-5 text-primary" />
                  <h3 className="text-base font-bold text-primary uppercase tracking-wider">
                    Customer Information
                  </h3>
                </div>
                <div className="space-y-4">
                  <div className="bg-background/50 rounded-lg p-4">
                    <p className="text-sm text-muted-foreground mb-2">Name</p>
                    <p className="text-lg font-bold text-foreground">
                      {config.metadata?.first_name && config.metadata?.last_name 
                        ? `${config.metadata.first_name} ${config.metadata.last_name}`
                        : config.metadata?.first_name || "N/A"}
                    </p>
                  </div>
                  <div className="bg-background/50 rounded-lg p-4">
                    <p className="text-sm text-muted-foreground mb-2">Address</p>
                    <div className="text-base font-semibold text-foreground space-y-1">
                      {config.metadata?.street_address && (
                        <p>{config.metadata.street_address}</p>
                      )}
                      {config.metadata?.city && (
                        <p>{config.metadata.city}</p>
                      )}
                      {config.metadata?.postal_code && (
                        <p className="uppercase">{config.metadata.postal_code}</p>
                      )}
                      {!config.metadata?.street_address && !config.metadata?.city && !config.metadata?.postal_code && (
                        <p>N/A</p>
                      )}
                    </div>
                  </div>
                  <div className="bg-background/50 rounded-lg p-4">
                    <p className="text-sm text-muted-foreground mb-2">Call Type</p>
                    <p className="text-base font-semibold text-foreground">
                      {config.callType === "phone" ? `📞 Phone: ${config.phoneNumber}` : "💻 Web Call"}
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Main Content - Center */}
          <div className="flex-1 min-w-[400px] max-w-2xl">
            <Card className="bg-card backdrop-blur-xl border border-border shadow-2xl rounded-3xl overflow-hidden">
            <div className="p-8 text-center space-y-6">
              {/* Phone Icon */}
              <div className="flex justify-center">
                <div className="w-20 h-20 rounded-full bg-accent/20 flex items-center justify-center">
                  <PhoneOff className="w-10 h-10 text-accent animate-pulse" />
                </div>
              </div>

              {/* Title */}
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-2">Phone Call in Progress</h2>
                <p className="text-muted-foreground">
                  Your call is being connected to {config.phoneNumber}
                </p>
              </div>

              {/* Info Box */}
              <div className="bg-accent/10 border border-accent/20 rounded-lg p-4">
                <p className="text-sm text-foreground mb-3">
                  🎧 <strong>Curious to know what's happening on the call?</strong>
                </p>
                <p className="text-xs text-muted-foreground mb-4">
                  Connect to listen in and monitor the conversation with the AI assistant
                </p>
                <Button
                  onClick={() => setShouldConnect(true)}
                  className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-semibold"
                >
                  Click Here to Connect & Listen
                </Button>
              </div>

              {/* End Call Option */}
              <Button
                onClick={async () => {
                  try {
                    // Call backend API to close the LiveKit room
                    await fetch(`/api/calls/${config.roomName}`, { method: "DELETE" })
                    console.log("[v0] Call ended via pre-connection screen")
                    onEndCall()
                  } catch (error) {
                    console.error("[v0] Error ending call:", error)
                    // Still call onEndCall to return to setup screen
                    onEndCall()
                  }
                }}
                variant="outline"
                className="w-full border-destructive/30 text-destructive hover:bg-destructive/10"
              >
                End Call
              </Button>

              {/* Room Info */}
              <div className="pt-4 border-t border-border">
                <p className="text-xs text-muted-foreground">Room: {config.roomName}</p>
              </div>
            </div>
            </Card>
          </div>

          {/* Company Information - Right Side */}
          <div className="flex-1 min-w-[280px]">
            <Card className="bg-gradient-to-br from-accent/10 to-accent/5 border-2 border-accent/30 shadow-xl rounded-2xl overflow-hidden">
              <div className="p-6">
                <div className="flex items-center gap-2 mb-6">
                  <Bot className="w-5 h-5 text-accent" />
                  <h3 className="text-base font-bold text-accent uppercase tracking-wider">
                    Company Information
                  </h3>
                </div>
                <div className="space-y-4">
                  <div className="bg-background/50 rounded-lg p-4">
                    <p className="text-sm text-muted-foreground mb-2">Company Name</p>
                    <p className="text-lg font-bold text-foreground">
                      {config.metadata?.company_name || "Energy Switch Ltd"}
                    </p>
                  </div>
                  
                  {/* Electricity */}
                  <div className="bg-accent/20 border border-accent/40 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-lg">⚡</span>
                      <p className="text-sm font-semibold text-accent">Electricity</p>
                    </div>
                    <div className="space-y-2">
                      <div>
                        <p className="text-xs text-muted-foreground">Recommended Supplier</p>
                        <p className="text-base font-bold text-foreground">
                          {config.metadata?.electricity_recommended_supplier || "Octopus Energy"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Annual Cost</p>
                        <p className="text-xl font-bold text-accent">
                          £{config.metadata?.electricity_quote_annual_cost || "850"}/year
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Gas */}
                  <div className="bg-primary/20 border border-primary/40 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-lg">🔥</span>
                      <p className="text-sm font-semibold text-primary">Gas</p>
                    </div>
                    <div className="space-y-2">
                      <div>
                        <p className="text-xs text-muted-foreground">Recommended Supplier</p>
                        <p className="text-base font-bold text-foreground">
                          {config.metadata?.gas_recommended_supplier || "British Gas"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Annual Cost</p>
                        <p className="text-xl font-bold text-primary">
                          £{config.metadata?.gas_quote_annual_cost || "650"}/year
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  return (
    <LiveKitRoom
      token={config.accessToken}
      serverUrl={config.liveKitUrl}
      connect={shouldConnect}
      audio={true}
      video={false}
      onDisconnected={() => {
        console.log("[v0] Disconnected from LiveKit room")
      }}
      onError={(error) => {
        console.error("[v0] LiveKit error:", error)
      }}
    >
      {/* RoomAudioRenderer handles all audio playback automatically */}
      <RoomAudioRenderer />
      
      {/* Our custom UI */}
      <CallControls config={config} onEndCall={onEndCall} />
    </LiveKitRoom>
  )
}
