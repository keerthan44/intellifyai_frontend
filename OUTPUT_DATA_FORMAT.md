# Output Data Format Guide

## Overview
This document describes the expected format for `output_data` in the calls database and how it's displayed in the UI.

## Data Structure

### Complete Output Data Schema

```json
{
  "room_name": "call-s7iZLuGJ",
  "job_metadata": {
    "city": "London",
    "today": "11-12-2025",
    "call_type": "web",
    "last_name": "Smith",
    "created_at": "2025-12-11T09:15:19.465Z",
    "first_name": "John",
    "phone_type": "web",
    "postal_code": "SW1A 1AA",
    "company_name": "Energy Switch Ltd",
    "phone_number": null,
    "request_type": "energy_switching",
    "call_direction": "outbound",
    "street_address": "10 Downing Street",
    "participant_name": "user-IaL-ay",
    "gas_quote_annual_cost": "650",
    "gas_recommended_supplier": "British Gas",
    "electricity_quote_annual_cost": "850",
    "electricity_recommended_supplier": "Octopus Energy"
  },
  "collected_data": {
    "introduction_status": "completed",
    "call_recording_consent": false,
    "has_previous_text_been_acknowledged": true
  },
  "call_transcripts": [
    {
      "response": "Hi John, this is Emma calling from Energy Switch Ltd about your energy tariff. && {'introduction_status': 'in_progress'}",
      "user_message": "Yeah. You just said"
    },
    {
      "response": "Great. Is now a good time to have a quick chat? && {'introduction_status': 'in_progress', 'call_recording_consent': true}",
      "user_message": "No. Currently busy."
    }
  ],
  "outcome": "successful",
  "notes": "Customer agreed to switch to Octopus Energy",
  "call_duration_seconds": 180
}
```

## Field Descriptions

### `room_name` (String)
- **Purpose**: LiveKit room identifier for the call
- **Type**: String (e.g., "call-s7iZLuGJ")
- **Display**: Shown in call metadata

### `job_metadata` (Object)
- **Purpose**: Stores all initial call parameters and customer information passed to the AI agent
- **Type**: Key-value pairs (flexible schema)
- **Display**: Shown as key-value pairs in a dedicated "Job Metadata" section
- **Common Fields**:
  - Customer details: `first_name`, `last_name`, `street_address`, `city`, `postal_code`
  - Call details: `call_type`, `phone_type`, `phone_number`, `call_direction`, `request_type`
  - Company info: `company_name`, `electricity_recommended_supplier`, `electricity_quote_annual_cost`, `gas_recommended_supplier`, `gas_quote_annual_cost`
  - System fields: `created_at`, `today`, `participant_name`

### `collected_data` (Object)
- **Purpose**: Stores all data points collected by the AI during the call
- **Type**: Key-value pairs (flexible schema)
- **Display**: Shown as key-value pairs in "Data Collected" section
- **Examples**:
  - Call flow status: `introduction_status`, `call_recording_consent`
  - Customer confirmations: `has_previous_text_been_acknowledged`, `switch_confirmed`
  - Collected information: Any custom fields the AI gathers during conversation

### `call_transcripts` (Array)
- **Purpose**: Complete conversation transcript between AI and customer
- **Type**: Array of transcript objects
- **Required Fields per Transcript**:
  - `response`: AI assistant's message (may include metadata after `&&`)
  - `user_message` (optional): Customer's message
- **Display**: Chat-like interface with:
  - Customer messages on the right (primary color)
  - AI messages on the left (accent color)
  - Avatars (Bot icon for AI, User icon for customer)
  - Metadata in responses is automatically stripped for clean display
  - Scrollable container (max height 600px)

### `llm_call_history` (Array) - Alternative Format
- **Purpose**: Alternative format for conversation history
- **Type**: Array of message objects
- **Required Fields per Message**:
  - `role`: "assistant", "agent", "user", or "customer"
  - `content`, `message`, or `text`: The actual message text
  - `timestamp` (optional): ISO 8601 timestamp
- **Display**: Same chat-like interface as `call_transcripts`
- **Note**: Used if `call_transcripts` is not present

### Additional Fields
- `outcome`: Call result status (e.g., "successful", "failed", "pending")
- `notes`: Free-text notes about the call
- `call_duration_seconds`: Duration in seconds
- Any other custom fields will be shown in raw JSON format

## UI Display Logic

### 1. Job Metadata Section
- **Shows when**: `output_data.job_metadata` exists
- **Layout**: Key-value pairs in a single column
- **Formatting**: 
  - Keys converted from snake_case to Title Case
  - Values displayed as strings (null values show as "N/A")
  - Boolean values show as "Yes"/"No"
  - Clean table-like layout with borders between rows

### 2. Data Collected Section
- **Shows when**: `output_data.collected_data` exists
- **Layout**: Key-value pairs in a single column
- **Formatting**: 
  - Keys converted from snake_case to Title Case
  - Values displayed as strings or formatted JSON
  - Boolean values show as "Yes"/"No"
  - Clean table-like layout with borders between rows

### 3. Conversation Transcript Section
- **Shows when**: `output_data.call_transcripts` exists and is a non-empty array
- **Layout**: Vertical chat timeline
- **Features**:
  - Customer messages on the right (primary blue color)
  - AI messages on the left (accent color)
  - Avatar icons (Bot for AI, User for customer)
  - Metadata stripped from AI responses (text after `&&` is removed)
  - User messages displayed first, then AI responses
  - Scrollable for long conversations (max height 600px)

### 4. Alternative Conversation History Section
- **Shows when**: `output_data.llm_call_history` exists (and `call_transcripts` doesn't)
- **Layout**: Vertical chat timeline
- **Features**:
  - Same as Conversation Transcript but uses role-based formatting
  - Supports timestamps if provided

### 5. Raw Output Section
- **Shows when**: None of the structured fields exist
- **Layout**: JSON code block
- **Purpose**: Fallback for unstructured output data

### 6. No Data Section
- **Shows when**: `output_data` is null or undefined
- **Message**: "No output data available yet. The call may still be in progress or pending processing."

## Example API Response

When fetching call details from `/api/calls/[call_id]/detail`:

```json
{
  "call_id": "call-abc123",
  "input_data": { ... },
  "output_data": {
    "collected_data": {
      "customer_name": "Jane Smith",
      "postcode": "SW1A 1AA",
      "switch_confirmed": true
    },
    "llm_call_history": [
      {
        "role": "assistant",
        "content": "Hello! How can I help you today?",
        "timestamp": "2025-12-11T10:00:00Z"
      },
      {
        "role": "user",
        "content": "I want to switch my energy supplier.",
        "timestamp": "2025-12-11T10:00:10Z"
      }
    ],
    "outcome": "successful"
  },
  "created_at": "2025-12-11T10:00:00Z",
  "updated_at": "2025-12-11T10:05:00Z",
  "status": "successful"
}
```

## Updating Output Data

Use the PATCH endpoint to update output data:

```bash
curl -X PATCH /api/calls/[call_id]/output \
  -H "Content-Type: application/json" \
  -d '{
    "output_data": {
      "collected_data": { ... },
      "llm_call_history": [ ... ],
      "outcome": "successful"
    }
  }'
```

## Best Practices

1. **Structured Data**: Always use `collected_data` for key-value pairs that need to be displayed clearly
2. **Conversation Logs**: Use `llm_call_history` for complete transcripts
3. **Timestamps**: Include ISO 8601 timestamps in conversation history for better tracking
4. **Consistent Roles**: Use standard role names ("assistant", "user") for proper UI rendering
5. **Outcome Field**: Include an `outcome` field for quick status identification
6. **Flexible Schema**: The `collected_data` object can contain any fields - they'll be displayed automatically

## Future Enhancements

Potential improvements:
- Search/filter within conversation history
- Export conversation as PDF or text
- Sentiment analysis indicators
- Audio playback integration (if recordings are available)
- Real-time updates during active calls

