import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)

// Helper function to convert BigInt to number for JSON serialization
function convertBigIntToNumber(obj: any): any {
  if (obj === null || obj === undefined) return obj
  
  if (typeof obj === 'bigint') {
    return Number(obj)
  }
  
  // Preserve Date objects
  if (obj instanceof Date) {
    return obj
  }
  
  if (Array.isArray(obj)) {
    return obj.map(convertBigIntToNumber)
  }
  
  if (typeof obj === 'object') {
    const converted: any = {}
    for (const key in obj) {
      converted[key] = convertBigIntToNumber(obj[key])
    }
    return converted
  }
  
  return obj
}

export interface CallRecord {
  call_id: string
  input_data: Record<string, any>
  output_data: Record<string, any> | null
  created_at: Date
  updated_at: Date
}

/**
 * Create a new call record
 */
export async function createCallRecord(callId: string, inputData: Record<string, any>) {
  try {
    const inputDataJson = JSON.stringify(inputData)
    const result = await sql`
      INSERT INTO calls (call_id, input_data, output_data, created_at, updated_at)
      VALUES (${callId}, ${inputDataJson}::jsonb, NULL, NOW(), NOW())
      RETURNING *
    `
    return convertBigIntToNumber(result[0]) as CallRecord
  } catch (error) {
    console.error('[DB] Error creating call record:', error)
    throw error
  }
}

/**
 * Update call record with output data
 */
export async function updateCallOutput(callId: string, outputData: Record<string, any>) {
  try {
    const outputDataJson = JSON.stringify(outputData)
    const result = await sql`
      UPDATE calls
      SET output_data = ${outputDataJson}::jsonb, updated_at = NOW()
      WHERE call_id = ${callId}
      RETURNING *
    `
    return convertBigIntToNumber(result[0]) as CallRecord
  } catch (error) {
    console.error('[DB] Error updating call output:', error)
    throw error
  }
}

/**
 * Get call record by ID
 */
export async function getCallRecord(callId: string) {
  try {
    const result = await sql`
      SELECT * FROM calls WHERE call_id = ${callId}
    `
    return result[0] ? convertBigIntToNumber(result[0]) as CallRecord : undefined
  } catch (error) {
    console.error('[DB] Error fetching call record:', error)
    throw error
  }
}

/**
 * Get all call records (with optional pagination)
 */
export async function getAllCallRecords(limit: number = 100, offset: number = 0) {
  try {
    const result = await sql`
      SELECT * FROM calls ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}
    `
    return convertBigIntToNumber(result) as CallRecord[]
  } catch (error) {
    console.error('[DB] Error fetching all call records:', error)
    throw error
  }
}

/**
 * Delete call record by ID
 */
export async function deleteCallRecord(callId: string) {
  try {
    await sql`
      DELETE FROM calls WHERE call_id = ${callId}
    `
    return true
  } catch (error) {
    console.error('[DB] Error deleting call record:', error)
    throw error
  }
}

