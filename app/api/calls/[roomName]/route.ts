import { RoomServiceClient } from "livekit-server-sdk"

const LIVEKIT_URL = process.env.LIVEKIT_URL
const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET

let roomService: RoomServiceClient | null = null

if (LIVEKIT_API_KEY && LIVEKIT_API_SECRET && LIVEKIT_URL) {
  roomService = new RoomServiceClient(LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET)
}

export async function GET(request: Request, { params }: { params: Promise<{ roomName: string }> }) {
  try {
    const { roomName } = await params

    if (!roomService) {
      return Response.json({ error: "LiveKit not configured", roomName, status: "not_available" }, { status: 503 })
    }

    // Get all rooms and filter by name
    const allRooms = await roomService.listRooms()
    const room = allRooms.find((r) => r.name === roomName)

    if (!room) {
      // Room might be newly created and not yet have participants
      // Return a pending status instead of 404
      console.log(`[v0] Room not found in list (might be newly created): ${roomName}`)
      return Response.json(
        {
          roomName,
          participantCount: 0,
          metadata: null,
          creationTime: null,
          status: "pending",
          message: "Room is being initialized",
        },
        { status: 200 },
      )
    }

    console.log(`[v0] Room info retrieved: ${roomName}`, {
      participants: room.numParticipants,
    })

    // Convert BigInt creationTime to number for JSON serialization
    const creationTime = room.creationTime 
      ? typeof room.creationTime === 'bigint' 
        ? Number(room.creationTime) 
        : room.creationTime
      : null

    return Response.json(
      {
        roomName,
        participantCount: room.numParticipants,
        metadata: room.metadata,
        creationTime: creationTime,
        status: "active",
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("[v0] Error fetching room info:", error)
    return Response.json(
      {
        error: "Failed to fetch room info",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ roomName: string }> }) {
  try {
    const { roomName } = await params

    if (!roomService) {
      console.error("[v0] LiveKit not configured for room deletion")
      return Response.json({ error: "LiveKit not configured", roomName, status: "cleanup_failed" }, { status: 503 })
    }

    console.log(`[v0] Attempting to delete room: ${roomName}`)

    // Delete the room - this will:
    // 1. Disconnect all participants (including the agent)
    // 2. Close the room
    // 3. Clean up all resources
    await roomService.deleteRoom(roomName)

    console.log(`[v0] ✅ Room successfully deleted: ${roomName}`)
    console.log(`[v0] - All participants disconnected`)
    console.log(`[v0] - Room closed and resources cleaned up`)

    return Response.json(
      {
        roomName,
        status: "ended",
        message: "Room deleted successfully. All participants disconnected.",
        timestamp: new Date().toISOString(),
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("[v0] Error ending call:", error)

    const awaitedParams = await params
    
    // If room doesn't exist, that's fine - it's already cleaned up
    if (error instanceof Error && (error.message.includes("not found") || error.message.includes("RoomNotFound"))) {
      console.log(`[v0] ℹ️  Room ${awaitedParams.roomName} was already deleted or doesn't exist`)
      return Response.json(
        {
          roomName: awaitedParams.roomName,
          status: "ended",
          message: "Room was already cleaned up or doesn't exist",
        },
        { status: 200 },
      )
    }

    return Response.json(
      {
        error: "Failed to end call",
        details: error instanceof Error ? error.message : "Unknown error",
        roomName: awaitedParams.roomName,
      },
      { status: 500 },
    )
  }
}
