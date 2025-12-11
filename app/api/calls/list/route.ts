import { NextRequest } from "next/server"
import { getAllCallRecords } from "@/lib/db"

/**
 * Get paginated list of all calls
 * GET /api/calls/list?page=1&limit=10
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get("page") || "1", 10)
    const limit = parseInt(searchParams.get("limit") || "10", 10)

    // Validate pagination parameters
    if (page < 1 || limit < 1 || limit > 100) {
      return Response.json(
        { error: "Invalid pagination parameters. Page must be >= 1, limit must be 1-100" },
        { status: 400 },
      )
    }

    const offset = (page - 1) * limit

    console.log(`[v0] Fetching calls list: page=${page}, limit=${limit}, offset=${offset}`)

    // Get paginated records
    const records = await getAllCallRecords(limit + 1, offset) // Fetch one extra to check if there are more

    const hasMore = records.length > limit
    const calls = hasMore ? records.slice(0, limit) : records

    // Transform records for frontend
    const transformedCalls = calls.map((record) => {
      // Helper to safely convert to ISO string
      const toISOString = (dateValue: any): string => {
        if (!dateValue) return new Date().toISOString()
        
        if (dateValue instanceof Date) {
          return dateValue.toISOString()
        }
        
        if (typeof dateValue === 'string') {
          // Try to parse the string as a date
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
        
        // Fallback to current date if all else fails
        console.error('[v0] Invalid date value:', dateValue, 'type:', typeof dateValue)
        return new Date().toISOString()
      }

      return {
        call_id: record.call_id,
        customer_name: `${record.input_data?.first_name || ''} ${record.input_data?.last_name || ''}`.trim() || 'N/A',
        call_type: record.input_data?.call_type || record.input_data?.phone_type || 'N/A',
        phone_number: record.input_data?.phone_number || null,
        postal_code: record.input_data?.postal_code || 'N/A',
        created_at: toISOString(record.created_at),
        has_output: !!record.output_data,
        status: record.output_data?.outcome || (record.output_data ? 'completed' : 'pending'),
      }
    })

    return Response.json({
      calls: transformedCalls,
      pagination: {
        page,
        limit,
        hasMore,
        total: offset + calls.length,
      },
    })
  } catch (error) {
    console.error("[v0] Error fetching calls list:", error)
    return Response.json(
      {
        error: "Failed to fetch calls list",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

