import { AccessToken, AgentDispatchClient, RoomServiceClient } from "livekit-server-sdk"
import { nanoid } from "nanoid"
import { createCallRecord } from "@/lib/db"

interface CallRequestBody {
  callType: "web" | "phone"
  phoneNumber?: string
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

const LIVEKIT_URL = process.env.LIVEKIT_URL
const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET
const LIVEKIT_AGENT_NAME = process.env.LIVEKIT_AGENT_NAME || "voice-assistant"

if (!LIVEKIT_URL || !LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) {
  console.warn(
    "⚠️  LiveKit environment variables not configured. Calls will fail. Add LIVEKIT_URL, LIVEKIT_API_KEY, and LIVEKIT_API_SECRET to your environment.",
  )
}

export async function POST(request: Request) {
  try {
    const body: CallRequestBody = await request.json()

    // Validate input
    if (!body.callType || !["web", "phone"].includes(body.callType)) {
      return Response.json({ error: "Invalid call type" }, { status: 400 })
    }

    if (body.callType === "phone" && !body.phoneNumber) {
      return Response.json({ error: "Phone number required for phone calls" }, { status: 400 })
    }

    // Validate LiveKit configuration
    if (!LIVEKIT_URL || !LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) {
      return Response.json(
        { error: "LiveKit is not configured. Please set LIVEKIT_URL, LIVEKIT_API_KEY, and LIVEKIT_API_SECRET." },
        { status: 500 },
      )
    }

    // Generate unique identifiers
    const roomName = `call-${nanoid(8)}`
    const participantName = `user-${nanoid(6)}`

    // Step 1: Generate access token for the participant
    // Note: Room will be automatically created when first participant joins
    const token = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
      identity: participantName,
      name: body.metadata?.first_name || `${body.callType === "phone" ? "Phone" : "Web"} Caller`,
        metadata: JSON.stringify({
          call_type: body.callType,
          phone_number: body.phoneNumber || null,
          first_name: body.metadata?.first_name || null,
          last_name: body.metadata?.last_name || null,
          street_address: body.metadata?.street_address || null,
          city: body.metadata?.city || null,
          postal_code: body.metadata?.postal_code || null,
          phone_type: body.metadata?.phone_type || body.callType,
          request_type: body.metadata?.request_type || null,
          call_direction: body.metadata?.call_direction || null,
          company_name: body.metadata?.company_name || null,
          electricity_recommended_supplier: body.metadata?.electricity_recommended_supplier || null,
          electricity_quote_annual_cost: body.metadata?.electricity_quote_annual_cost || null,
          gas_recommended_supplier: body.metadata?.gas_recommended_supplier || null,
          gas_quote_annual_cost: body.metadata?.gas_quote_annual_cost || null,
          created_at: new Date().toISOString(),
        }),
    })

    // Grant permissions to publish and subscribe
    token.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish: true,
      canPublishData: true,
      canSubscribe: true,
    })

    const accessToken = await token.toJwt()

    // Step 2: Dispatch AI agent to the room
    const agentDispatchClient = new AgentDispatchClient(LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET)
    
    const dispatchMetadata = {
      call_type: body.callType,
      phone_number: body.phoneNumber || null,
      first_name: body.metadata?.first_name || null,
      last_name: body.metadata?.last_name || null,
      street_address: body.metadata?.street_address || null,
      city: body.metadata?.city || null,
      postal_code: body.metadata?.postal_code || null,
      phone_type: body.metadata?.phone_type || body.callType,
      request_type: body.metadata?.request_type || null,
      call_direction: body.metadata?.call_direction || null,
      company_name: body.metadata?.company_name || null,
      electricity_recommended_supplier: body.metadata?.electricity_recommended_supplier || null,
      electricity_quote_annual_cost: body.metadata?.electricity_quote_annual_cost || null,
      gas_recommended_supplier: body.metadata?.gas_recommended_supplier || null,
      gas_quote_annual_cost: body.metadata?.gas_quote_annual_cost || null,
      participant_name: participantName,
      created_at: new Date().toISOString(),
    }

    const dispatch = await agentDispatchClient.createDispatch(roomName, LIVEKIT_AGENT_NAME, {
      metadata: JSON.stringify(dispatchMetadata),
    })

    console.log(`[v0] Agent dispatched to room ${roomName}:`, dispatch)

    // Save call record to database
    try {
      await createCallRecord(roomName, dispatchMetadata)
      console.log(`[v0] ✅ Call record saved to database`)
    } catch (dbError) {
      console.error(`[v0] ⚠️  Failed to save call record to database:`, dbError)
      // Continue even if DB save fails - don't block the call
    }

    const response = {
      roomName,
      participantName,
      callType: body.callType,
      phoneNumber: body.phoneNumber || null,
      accessToken,
      liveKitUrl: LIVEKIT_URL,
      agentName: LIVEKIT_AGENT_NAME,
      dispatchId: dispatch.id,
      metadata: dispatchMetadata,
      status: "created",
      timestamp: new Date().toISOString(),
    }

    console.log(`[v0] Call created: ${roomName} (${body.callType})`, {
      phoneNumber: body.phoneNumber,
      agentDispatched: true,
    })

    return Response.json(response, { status: 201 })
  } catch (error) {
    console.error("[v0] Error creating call:", error)
    return Response.json(
      {
        error: "Failed to create call",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
