"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import {
  Room,
  type Participant,
  type RemoteParticipant,
  RoomEvent,
  type RoomOptions,
  type RemoteTrack,
  type RemoteTrackPublication,
  Track,
} from "livekit-client"

interface UseCallParams {
  roomName: string
  participantName: string
  accessToken: string
  liveKitUrl: string
}

export interface CallState {
  participants: Participant[]
  isConnected: boolean
  isAudioMuted: boolean
  isVideoOn: boolean
  error: string | null
  room: Room | null
}

export function useCall({ roomName, participantName, accessToken, liveKitUrl }: UseCallParams) {
  const roomRef = useRef<Room | null>(null)
  const audioElementsRef = useRef<Map<string, HTMLAudioElement>>(new Map())
  const [state, setState] = useState<CallState>({
    participants: [],
    isConnected: false,
    isAudioMuted: false,
    isVideoOn: false,
    error: null,
    room: null,
  })

  const connect_ = useCallback(async () => {
    if (!roomName || !accessToken || !liveKitUrl) {
      console.error("[v0] Missing connection parameters")
      setState((prev) => ({ ...prev, error: "Missing connection parameters" }))
      return
    }

    try {
      console.log("[v0] Connecting to LiveKit room:", roomName)

      const room = new Room({
        autoSubscribe: true,
        dynacast: true,
      } as RoomOptions)

      await room.connect(liveKitUrl, accessToken, {
        name: participantName,
      })

      roomRef.current = room

      // Enable microphone by default
      try {
        await room.localParticipant.setMicrophoneEnabled(true)
        console.log("[v0] Microphone enabled")
      } catch (error) {
        console.error("[v0] Failed to enable microphone:", error)
      }

      const onParticipantConnected = (participant: RemoteParticipant) => {
        console.log("[v0] Participant connected:", participant.name)
        setState((prev) => ({
          ...prev,
          participants: [...prev.participants, participant],
        }))
      }

      const onParticipantDisconnected = (participant: Participant) => {
        console.log("[v0] Participant disconnected:", participant.name)
        setState((prev) => ({
          ...prev,
          participants: prev.participants.filter((p) => p !== participant),
        }))
      }

      const onRoomMetadataChanged = (metadata: string) => {
        console.log("[v0] Room metadata changed:", metadata)
      }

      const onTrackSubscribed = (
        track: RemoteTrack,
        publication: RemoteTrackPublication,
        participant: RemoteParticipant,
      ) => {
        console.log("[v0] Track subscribed:", {
          trackSid: track.sid,
          kind: track.kind,
          participant: participant.identity,
        })

        // Handle audio tracks
        if (track.kind === Track.Kind.Audio) {
          const element = track.attach()
          audioElementsRef.current.set(track.sid, element)
          console.log("[v0] Audio track attached and playing")
        }
      }

      const onTrackUnsubscribed = (
        track: RemoteTrack,
        publication: RemoteTrackPublication,
        participant: RemoteParticipant,
      ) => {
        console.log("[v0] Track unsubscribed:", {
          trackSid: track.sid,
          kind: track.kind,
          participant: participant.identity,
        })

        // Clean up audio element
        if (track.kind === Track.Kind.Audio) {
          const element = audioElementsRef.current.get(track.sid)
          if (element) {
            track.detach(element)
            element.remove()
            audioElementsRef.current.delete(track.sid)
            console.log("[v0] Audio track detached")
          }
        }
      }

      room.on(RoomEvent.ParticipantConnected, onParticipantConnected)
      room.on(RoomEvent.ParticipantDisconnected, onParticipantDisconnected)
      room.on(RoomEvent.RoomMetadataChanged, onRoomMetadataChanged)
      room.on(RoomEvent.TrackSubscribed, onTrackSubscribed)
      room.on(RoomEvent.TrackUnsubscribed, onTrackUnsubscribed)

      setState((prev) => ({
        ...prev,
        isConnected: true,
        error: null,
        participants: Array.from(room.remoteParticipants.values()),
        room,
      }))

      console.log("[v0] Connected to LiveKit room successfully")
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Connection failed"
      console.error("[v0] Failed to connect to LiveKit:", error)
      setState((prev) => ({
        ...prev,
        error: errorMessage,
        isConnected: false,
      }))
    }
  }, [roomName, accessToken, liveKitUrl, participantName])

  const disconnect = useCallback(async () => {
    if (roomRef.current) {
      console.log("[v0] Disconnecting from LiveKit room")
      
      // Clean up all audio elements
      audioElementsRef.current.forEach((element, trackSid) => {
        element.remove()
        console.log("[v0] Cleaned up audio element:", trackSid)
      })
      audioElementsRef.current.clear()
      
      await roomRef.current.disconnect()
      roomRef.current = null
      setState((prev) => ({
        ...prev,
        isConnected: false,
        participants: [],
      }))
    }
  }, [])

  const toggleAudio = useCallback(async () => {
    if (roomRef.current?.localParticipant) {
      const isMuted = !state.isAudioMuted
      await roomRef.current.localParticipant.setMicrophoneEnabled(!isMuted)
      setState((prev) => ({
        ...prev,
        isAudioMuted: isMuted,
      }))
      console.log("[v0] Microphone", isMuted ? "muted" : "unmuted")
    }
  }, [state.isAudioMuted])

  const toggleVideo = useCallback(async () => {
    if (roomRef.current?.localParticipant) {
      const isVideoOn = !state.isVideoOn
      await roomRef.current.localParticipant.setCameraEnabled(isVideoOn)
      setState((prev) => ({
        ...prev,
        isVideoOn,
      }))
      console.log("[v0] Camera", isVideoOn ? "enabled" : "disabled")
    }
  }, [state.isVideoOn])

  useEffect(() => {
    connect_()

    return () => {
      disconnect()
    }
  }, [connect_, disconnect])

  return {
    ...state,
    disconnect,
    toggleAudio,
    toggleVideo,
  }
}
