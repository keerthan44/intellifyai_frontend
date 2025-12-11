export interface CallSession {
  roomName: string
  participantName: string
  accessToken: string
  liveKitUrl: string
}

export async function fetchCallSession(roomName: string): Promise<CallSession> {
  const response = await fetch(`/api/calls/${roomName}`)

  if (!response.ok) {
    throw new Error("Failed to fetch call session")
  }

  return response.json()
}

export function isLiveKitConfigured(session: CallSession): boolean {
  return (
    session.liveKitUrl !== "LIVEKIT_URL_NOT_SET" &&
    session.accessToken !== "MOCK_TOKEN" &&
    !!session.liveKitUrl &&
    !!session.accessToken
  )
}
