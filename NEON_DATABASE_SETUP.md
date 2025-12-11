# Neon Database Setup Guide

This guide will help you set up Neon Database for storing call records with input and output data.

## Prerequisites

- Neon account (free tier available)
- Node.js project with Next.js

## Step 1: Install Dependencies

The `@neondatabase/serverless` package is already in your `package.json`. Install it:

```bash
npm install
```

## Step 2: Create Neon Database

### Via Neon Dashboard

1. Go to [Neon Console](https://console.neon.tech/)
2. Click **Create Project**
3. Choose a name (e.g., `intellifyai-calls`)
4. Select a region close to your users
5. Click **Create Project**

### Get Connection String

After creating the project:

1. Go to your project dashboard
2. Click on **Connection Details**
3. Copy the connection string (it looks like):
   ```
   postgresql://user:password@ep-xxx-xxx.region.aws.neon.tech/dbname?sslmode=require
   ```

## Step 3: Configure Environment Variables

Add to your `.env.local` file:

```bash
DATABASE_URL="postgresql://user:password@ep-xxx-xxx.region.aws.neon.tech/dbname?sslmode=require"
```

**Important:** Make sure this is in your `.gitignore` to keep credentials secure!

## Step 4: Run Database Migration

### Option A: Using Neon SQL Editor (Recommended)

1. Go to your Neon project dashboard
2. Click on **SQL Editor** in the left sidebar
3. Copy the contents of `scripts/init-db.sql`
4. Paste into the SQL Editor
5. Click **Run** or press `Ctrl+Enter`
6. Verify the table was created by running:
   ```sql
   SELECT * FROM information_schema.tables WHERE table_name = 'calls';
   ```

### Option B: Using psql

```bash
# Install psql if not already installed
# macOS: brew install postgresql
# Ubuntu: sudo apt-get install postgresql-client

# Connect to your database
psql "postgresql://user:password@ep-xxx-xxx.region.aws.neon.tech/dbname?sslmode=require"

# Run the migration
\i scripts/init-db.sql

# Verify
\dt
\d calls
```

### Option C: Using Node.js Script

Create and run a migration script:

```typescript
// scripts/migrate.ts
import { neon } from '@neondatabase/serverless'
import { readFileSync } from 'fs'
import { join } from 'path'

async function migrate() {
  const sql = neon(process.env.DATABASE_URL!)
  
  try {
    const migrationSQL = readFileSync(
      join(__dirname, 'init-db.sql'),
      'utf-8'
    )
    
    await sql(migrationSQL)
    console.log('✅ Migration completed successfully')
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  }
}

migrate()
```

Run it:
```bash
npx tsx scripts/migrate.ts
```

## Step 5: Test Database Connection

Create a test file:

```typescript
// test-db.ts
import { neon } from '@neondatabase/serverless'

async function testConnection() {
  const sql = neon(process.env.DATABASE_URL!)
  
  try {
    const result = await sql`SELECT NOW()`
    console.log('✅ Database connected:', result[0])
    
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `
    console.log('📋 Tables:', tables)
  } catch (error) {
    console.error('❌ Database connection failed:', error)
  }
}

testConnection()
```

Run the test:
```bash
npx tsx test-db.ts
```

## Database Schema

### `calls` Table

| Column | Type | Description |
|--------|------|-------------|
| `id` | SERIAL | Primary key (auto-increment) |
| `call_id` | VARCHAR(255) | Unique call identifier (room name) |
| `input_data` | JSONB | Input metadata from form submission |
| `output_data` | JSONB | Output data from AI agent (nullable) |
| `created_at` | TIMESTAMP | Record creation timestamp |
| `updated_at` | TIMESTAMP | Last update timestamp |

### Indexes

- `idx_calls_call_id` - Fast lookups by call_id (UNIQUE)
- `idx_calls_created_at` - Sorting by creation date
- `idx_calls_input_data` - JSON queries on input_data (GIN index)
- `idx_calls_output_data` - JSON queries on output_data (GIN index)

## API Usage

### 1. Create Call Record (Automatic)

When you click "Request Energy Switching Call", the system automatically:

1. Creates LiveKit room and dispatches AI agent
2. **Saves all input metadata to database** ✅
3. Returns access token to frontend

**Input data saved includes:**
```json
{
  "call_type": "web",
  "phone_number": null,
  "first_name": "John",
  "last_name": "Smith",
  "street_address": "10 Downing Street",
  "city": "London",
  "postal_code": "SW1A 1AA",
  "phone_type": "web",
  "request_type": "energy_switching",
  "call_direction": "outbound",
  "company_name": "Energy Switch Ltd",
  "electricity_recommended_supplier": "Octopus Energy",
  "electricity_quote_annual_cost": "850",
  "gas_recommended_supplier": "British Gas",
  "gas_quote_annual_cost": "650",
  "participant_name": "web-caller-abc123",
  "created_at": "2024-01-01T12:00:00.000Z"
}
```

### 2. Update Output Data (PATCH Endpoint)

After the AI agent completes the call, update with output data:

```bash
curl -X PATCH http://localhost:3000/api/calls/call-abc123/output \
  -H "Content-Type: application/json" \
  -d '{
    "output_data": {
      "transcript": "Full conversation transcript...",
      "summary": "Customer agreed to switch to Octopus Energy",
      "sentiment": "positive",
      "call_duration": 180,
      "outcome": "successful",
      "next_steps": ["Send confirmation email", "Schedule installation"]
    }
  }'
```

**Response:**
```json
{
  "success": true,
  "call_id": "call-abc123",
  "updated_at": "2024-01-01T12:05:00.000Z"
}
```

### 3. Get Call Output Data

Retrieve output data for a specific call:

```bash
curl http://localhost:3000/api/calls/call-abc123/output
```

**Response:**
```json
{
  "call_id": "call-abc123",
  "output_data": {
    "transcript": "...",
    "summary": "...",
    "sentiment": "positive"
  },
  "updated_at": "2024-01-01T12:05:00.000Z"
}
```

## Database Functions

Available in `lib/db.ts`:

```typescript
import { createCallRecord, updateCallOutput, getCallRecord } from '@/lib/db'

// Create new call record (done automatically on call start)
await createCallRecord(callId, inputData)

// Update call output (use PATCH endpoint or call directly)
await updateCallOutput(callId, outputData)

// Get call record
const record = await getCallRecord(callId)

// Get all records (with pagination)
const records = await getAllCallRecords(limit, offset)

// Delete call record
await deleteCallRecord(callId)
```

## Querying JSON Data

Neon supports powerful JSONB queries:

```sql
-- Find calls by customer name
SELECT * FROM calls 
WHERE input_data->>'first_name' = 'John';

-- Find calls with specific postal code
SELECT * FROM calls 
WHERE input_data->>'postal_code' = 'SW1A 1AA';

-- Find calls with electricity cost > 1000
SELECT * FROM calls 
WHERE (input_data->>'electricity_quote_annual_cost')::numeric > 1000;

-- Get calls from last 24 hours
SELECT * FROM calls 
WHERE created_at > NOW() - INTERVAL '24 hours';

-- Find successful calls
SELECT * FROM calls 
WHERE output_data->>'outcome' = 'successful';

-- Get calls with positive sentiment
SELECT * FROM calls 
WHERE output_data->>'sentiment' = 'positive';

-- Count calls by call type
SELECT 
  input_data->>'call_type' as call_type,
  COUNT(*) as count
FROM calls
GROUP BY input_data->>'call_type';
```

## Environment Variables for Production

### For Vercel Deployment

1. Go to your Vercel project settings
2. Navigate to **Environment Variables**
3. Add:
   - **Key:** `DATABASE_URL`
   - **Value:** Your Neon connection string
   - **Environment:** Production, Preview, Development

### For Local Development

Add to `.env.local`:
```bash
DATABASE_URL="postgresql://user:password@ep-xxx-xxx.region.aws.neon.tech/dbname?sslmode=require"
```

## Monitoring and Analytics

### View Database Metrics

1. Go to Neon Console
2. Select your project
3. View **Monitoring** tab for:
   - Active connections
   - Query performance
   - Storage usage
   - Compute time

### Query Logs

Enable query logging in Neon:
1. Go to Project Settings
2. Enable **Query Logging**
3. View logs in the **Logs** tab

## Backup and Recovery

### Automatic Backups

Neon automatically backs up your data. To restore:

1. Go to **Branches** in Neon Console
2. Create a new branch from a point in time
3. This creates a copy of your database at that moment

### Manual Export

```bash
# Export entire database
pg_dump "postgresql://user:password@ep-xxx-xxx.region.aws.neon.tech/dbname?sslmode=require" > backup.sql

# Export just the calls table
pg_dump -t calls "postgresql://..." > calls_backup.sql

# Restore from backup
psql "postgresql://..." < backup.sql
```

## Troubleshooting

### Connection Issues

1. **Check connection string:**
   ```bash
   echo $DATABASE_URL
   ```

2. **Test connection:**
   ```bash
   psql "$DATABASE_URL" -c "SELECT 1"
   ```

3. **Verify SSL mode:**
   - Neon requires `sslmode=require` in the connection string

### Migration Issues

1. **Check if table exists:**
   ```sql
   SELECT * FROM information_schema.tables WHERE table_name = 'calls';
   ```

2. **Drop and recreate (⚠️ destroys data):**
   ```sql
   DROP TABLE IF EXISTS calls CASCADE;
   ```
   Then run migration again.

### Query Performance

1. **Check indexes:**
   ```sql
   SELECT * FROM pg_indexes WHERE tablename = 'calls';
   ```

2. **Analyze query performance:**
   ```sql
   EXPLAIN ANALYZE SELECT * FROM calls WHERE input_data->>'first_name' = 'John';
   ```

## Best Practices

1. **Always use parameterized queries** to prevent SQL injection
2. **Index frequently queried JSON fields** for better performance
3. **Set up monitoring** to track database usage
4. **Regular backups** before major changes
5. **Use connection pooling** for production (Neon handles this automatically)

## Cost Optimization

Neon offers:
- **Free tier:** 0.5 GB storage, 100 hours compute/month
- **Auto-scaling:** Compute scales to zero when not in use
- **Branching:** Create dev/staging branches without extra cost

Monitor usage in Neon Console to stay within limits.

## Next Steps

1. ✅ Database is set up and ready
2. ✅ Call creation automatically saves input data
3. ✅ PATCH endpoint available for updating output data
4. 🔄 Integrate output data updates from your AI agent
5. 📊 Build analytics dashboard using the stored data

Your database is ready to store all call data! 🎉

