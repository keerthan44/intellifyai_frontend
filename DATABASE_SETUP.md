# Database Setup Guide - Vercel Postgres

This guide will help you set up Vercel Postgres for storing call records.

## Prerequisites

- Vercel account
- Project deployed on Vercel (or linked locally)

## Step 1: Install Dependencies

```bash
npm install @vercel/postgres
```

## Step 2: Create Vercel Postgres Database

### Option A: Via Vercel Dashboard

1. Go to your project on [Vercel Dashboard](https://vercel.com/dashboard)
2. Navigate to the **Storage** tab
3. Click **Create Database**
4. Select **Postgres**
5. Choose a name for your database (e.g., `intellifyai-calls`)
6. Select a region close to your users
7. Click **Create**

### Option B: Via Vercel CLI

```bash
vercel link  # Link your project if not already linked
vercel storage create postgres intellifyai-calls
```

## Step 3: Connect Database to Project

After creating the database:

1. Vercel will automatically add environment variables to your project:
   - `POSTGRES_URL`
   - `POSTGRES_PRISMA_URL`
   - `POSTGRES_URL_NON_POOLING`
   - `POSTGRES_USER`
   - `POSTGRES_HOST`
   - `POSTGRES_PASSWORD`
   - `POSTGRES_DATABASE`

2. Pull the environment variables locally:
```bash
vercel env pull .env.local
```

## Step 4: Run Database Migration

### Option A: Using Vercel Postgres Dashboard

1. Go to your database in the Vercel Dashboard
2. Click on the **Query** tab
3. Copy the contents of `scripts/init-db.sql`
4. Paste into the query editor
5. Click **Run Query**

### Option B: Using psql (Local)

```bash
# Connect to your database
psql "$(grep POSTGRES_URL .env.local | cut -d '=' -f2-)"

# Run the migration
\i scripts/init-db.sql

# Verify the table was created
\dt
\d calls
```

### Option C: Using Node.js Script

Create a migration script:

```bash
# Create migration script
cat > scripts/migrate.ts << 'EOF'
import { sql } from '@vercel/postgres'
import { readFileSync } from 'fs'
import { join } from 'path'

async function migrate() {
  try {
    const migrationSQL = readFileSync(
      join(__dirname, 'init-db.sql'),
      'utf-8'
    )
    
    await sql.query(migrationSQL)
    console.log('✅ Migration completed successfully')
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  }
}

migrate()
EOF

# Run migration
npx tsx scripts/migrate.ts
```

## Step 5: Verify Database Setup

Test the database connection:

```typescript
// test-db.ts
import { sql } from '@vercel/postgres'

async function testConnection() {
  try {
    const result = await sql`SELECT NOW()`
    console.log('✅ Database connected:', result.rows[0])
    
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `
    console.log('📋 Tables:', tables.rows)
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
| `input_data` | JSONB | Input metadata (customer info, company info, etc.) |
| `output_data` | JSONB | Output data from AI agent (nullable) |
| `created_at` | TIMESTAMP | Record creation timestamp |
| `updated_at` | TIMESTAMP | Last update timestamp |

### Indexes

- `idx_calls_call_id` - Fast lookups by call_id
- `idx_calls_created_at` - Sorting by creation date
- `idx_calls_input_data` - JSON queries on input_data (GIN index)
- `idx_calls_output_data` - JSON queries on output_data (GIN index)

## API Usage

### Create Call Record (Automatic)

When a call is initiated via `POST /api/calls`, the input data is automatically saved to the database.

### Update Output Data

```bash
# Update call output data
curl -X PATCH http://localhost:3000/api/calls/[roomName]/output \
  -H "Content-Type: application/json" \
  -d '{
    "output_data": {
      "transcript": "...",
      "summary": "...",
      "sentiment": "positive"
    }
  }'
```

### Get Call Record

```bash
# Get output data for a call
curl http://localhost:3000/api/calls/[roomName]/output
```

## Database Functions

Available in `lib/db.ts`:

```typescript
// Create new call record
await createCallRecord(callId, inputData)

// Update call output
await updateCallOutput(callId, outputData)

// Get call record
const record = await getCallRecord(callId)

// Get all records (with pagination)
const records = await getAllCallRecords(limit, offset)

// Delete call record
await deleteCallRecord(callId)
```

## Querying JSON Data

Example queries for filtering by JSON fields:

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
```

## Troubleshooting

### Connection Issues

1. Verify environment variables are set:
```bash
echo $POSTGRES_URL
```

2. Check if database is accessible:
```bash
vercel storage ls
```

3. Ensure you're using the correct connection string (pooled vs non-pooled)

### Migration Issues

1. Check if table already exists:
```sql
SELECT * FROM information_schema.tables WHERE table_name = 'calls';
```

2. Drop and recreate (⚠️ destroys data):
```sql
DROP TABLE IF EXISTS calls CASCADE;
```

## Production Deployment

1. Ensure environment variables are set in Vercel:
   - Go to Project Settings → Environment Variables
   - Verify all `POSTGRES_*` variables are present

2. Deploy your application:
```bash
vercel --prod
```

3. Run migration on production database (if needed):
   - Use Vercel Dashboard Query tab
   - Or connect via psql using production credentials

## Monitoring

View database metrics in Vercel Dashboard:
- Storage → [Your Database] → Metrics
- Monitor queries, connections, and storage usage

## Backup

Vercel Postgres automatically backs up your database. To create manual backups:

```bash
# Export data
pg_dump "$(grep POSTGRES_URL .env.local | cut -d '=' -f2-)" > backup.sql

# Restore from backup
psql "$(grep POSTGRES_URL .env.local | cut -d '=' -f2-)" < backup.sql
```

