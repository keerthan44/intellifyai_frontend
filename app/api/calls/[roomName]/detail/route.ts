import { NextRequest } from "next/server"
import { getCallRecord } from "@/lib/db"

/**
 * Get full call details including input and output data
 * GET /api/calls/[roomName]/detail
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ roomName: string }> },
) {
  try {
    const { roomName } = await params

    console.log(`[v0] Fetching full details for call: ${roomName}`)

    const record = await getCallRecord(roomName)

    if (!record) {
      return Response.json(
        { error: "Call record not found" },
        { status: 404 },
      )
    }

    // Helper to safely convert to ISO string
    const toISOString = (dateValue: any): string => {
      if (!dateValue) return new Date().toISOString()
      
      if (dateValue instanceof Date) {
        return dateValue.toISOString()
      }
      
      if (typeof dateValue === 'string') {
        const parsed = new Date(dateValue)
        if (!isNaN(parsed.getTime())) {
          return parsed.toISOString()
        }
      }
      
      if (typeof dateValue === 'number') {
        const parsed = new Date(dateValue)
        if (!isNaN(parsed.getTime())) {
          return parsed.toISOString()
        }
      }
      
      console.error('[v0] Invalid date value:', dateValue, 'type:', typeof dateValue)
      return new Date().toISOString()
    }

    // Return complete record with all details
    return Response.json({
      call_id: record.call_id,
      input_data: record.input_data,
      output_data: record.output_data,
      created_at: toISOString(record.created_at),
      updated_at: toISOString(record.updated_at),
      status: record.output_data?.outcome || (record.output_data ? 'completed' : 'pending'),
    })
  } catch (error) {
    console.error("[v0] Error fetching call details:", error)
    return Response.json(
      {
        error: "Failed to fetch call details",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

