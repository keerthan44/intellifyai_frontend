-- Create calls table for storing call input and output data
CREATE TABLE IF NOT EXISTS calls (
  id SERIAL PRIMARY KEY,
  call_id VARCHAR(255) UNIQUE NOT NULL,
  input_data JSONB NOT NULL,
  output_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on call_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_calls_call_id ON calls(call_id);

-- Create index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_calls_created_at ON calls(created_at DESC);

-- Create index on input_data for JSON queries (optional, useful for filtering)
CREATE INDEX IF NOT EXISTS idx_calls_input_data ON calls USING GIN (input_data);

-- Create index on output_data for JSON queries (optional, useful for filtering)
CREATE INDEX IF NOT EXISTS idx_calls_output_data ON calls USING GIN (output_data);

-- Add a comment to the table
COMMENT ON TABLE calls IS 'Stores call records with input metadata and output data from LiveKit AI agent calls';
COMMENT ON COLUMN calls.call_id IS 'Unique identifier for the call (room name)';
COMMENT ON COLUMN calls.input_data IS 'JSON object containing all input metadata (customer info, company info, etc.)';
COMMENT ON COLUMN calls.output_data IS 'JSON object containing output data from the AI agent call';
COMMENT ON COLUMN calls.created_at IS 'Timestamp when the call record was created';
COMMENT ON COLUMN calls.updated_at IS 'Timestamp when the call record was last updated';

