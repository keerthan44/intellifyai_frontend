import { NextRequest } from "next/server"
import { updateCallOutput, getCallRecord } from "@/lib/db"

/**
 * Update call output data
 * PATCH /api/calls/[roomName]/output
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ roomName: string }> },
) {
  try {
    const { roomName } = await params
    const body = await request.json()

    console.log(`[v0] Updating output data for call: ${roomName}`)

    // Update the call record with output data
    const updatedRecord = await updateCallOutput(roomName, body.output_data || body)

    if (!updatedRecord) {
      return Response.json(
        { error: "Call record not found" },
        { status: 404 },
      )
    }

    console.log(`[v0] ✅ Output data updated for call: ${roomName}`)

    return Response.json({
      success: true,
      call_id: roomName,
      updated_at: updatedRecord.updated_at,
    })
  } catch (error) {
    console.error("[v0] Error updating call output:", error)
    return Response.json(
      {
        error: "Failed to update call output",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

/**
 * Get call output data
 * GET /api/calls/[roomName]/output
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ roomName: string }> },
) {
  try {
    const { roomName } = await params

    console.log(`[v0] Fetching output data for call: ${roomName}`)

    const record = await getCallRecord(roomName)

    if (!record) {
      return Response.json(
        { error: "Call record not found" },
        { status: 404 },
      )
    }

    return Response.json({
      call_id: roomName,
      output_data: record.output_data,
      updated_at: record.updated_at,
    })
  } catch (error) {
    console.error("[v0] Error fetching call output:", error)
    return Response.json(
      {
        error: "Failed to fetch call output",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

