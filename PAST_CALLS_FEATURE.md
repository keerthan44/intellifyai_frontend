# Past Calls Feature Documentation

## Overview
This feature allows users to view and manage their call history with pagination support. Users can browse past calls, see key information at a glance, and drill down into detailed call records.

## Architecture

### Backend APIs

#### 1. **GET /api/calls/list** - Paginated Call List
- **Purpose**: Retrieve a paginated list of all calls ordered by creation date
- **Query Parameters**:
  - `page` (optional, default: 1): Page number (must be >= 1)
  - `limit` (optional, default: 10): Number of records per page (1-100)
- **Response**:
  ```json
  {
    "calls": [
      {
        "call_id": "call-abc123",
        "customer_name": "John Doe",
        "call_type": "phone",
        "phone_number": "+441234567890",
        "postal_code": "SW1A 1AA",
        "created_at": "2025-12-11T10:30:00Z",
        "has_output": true,
        "status": "completed"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "hasMore": true,
      "total": 10
    }
  }
  ```

#### 2. **GET /api/calls/[roomName]/detail** - Full Call Details
- **Purpose**: Retrieve complete call record including all input and output data
- **Response**:
  ```json
  {
    "call_id": "call-abc123",
    "input_data": {
      "first_name": "John",
      "last_name": "Doe",
      "street_address": "10 Downing Street",
      "city": "London",
      "postal_code": "SW1A 1AA",
      "call_type": "phone",
      "phone_number": "+441234567890",
      "company_name": "Energy Co",
      "electricity_recommended_supplier": "Octopus Energy",
      "electricity_quote_annual_cost": "850",
      "gas_recommended_supplier": "British Gas",
      "gas_quote_annual_cost": "650"
    },
    "output_data": {
      "outcome": "successful",
      "notes": "Customer agreed to switch"
    },
    "created_at": "2025-12-11T10:30:00Z",
    "updated_at": "2025-12-11T10:45:00Z",
    "status": "successful"
  }
  ```

### Frontend Components

#### 1. **PastCallsModal** (`components/past-calls-modal.tsx`)
- **Purpose**: Modal dialog displaying paginated table of past calls
- **Features**:
  - Responsive table layout
  - Pagination controls (Previous/Next)
  - Loading states
  - Error handling with retry
  - Click-to-navigate to detail page
  - Visual status badges
  - Call type icons (phone/web)
  - Formatted dates

#### 2. **Call Detail Page** (`app/calls/[call_id]/page.tsx`)
- **Purpose**: Comprehensive view of a single call record
- **Features**:
  - Customer information card (name, address, contact method)
  - Company information card (name, electricity/gas suppliers and costs)
  - Call metadata (timestamps, request type)
  - Output data display (JSON formatted)
  - Back navigation
  - Status badge
  - Loading and error states

### UI Integration

#### Updated Components

**`app/page.tsx`**
- Added `isPastCallsOpen` state
- Integrated `PastCallsModal` component
- Passes `onViewPastCalls` callback to `CallSetup`

**`components/call-setup.tsx`**
- Added `onViewPastCalls` prop
- Added "View Past Calls" button in header
- Button positioned next to "Outbound Call Initiation" badge

## User Flow

1. **Access Past Calls**:
   - User clicks "View Past Calls" button on home page
   - Modal opens with paginated call list

2. **Browse Calls**:
   - User sees table with key information (customer, type, contact, postcode, date, status)
   - User can navigate pages using Previous/Next buttons
   - Each row is clickable

3. **View Details**:
   - User clicks on a call row
   - Navigates to `/calls/[call_id]`
   - Sees comprehensive call information including:
     - Full customer details
     - Company and energy information
     - Call metadata
     - Output data (if available)

4. **Return to Home**:
   - User clicks "Back to Home" button
   - Returns to main call setup page

## Database Integration

The feature uses the existing `calls` table with:
- `call_id`: Unique identifier
- `input_data`: JSONB containing all call metadata
- `output_data`: JSONB containing call results
- `created_at`: Timestamp
- `updated_at`: Timestamp

## Styling

- Consistent with existing design system
- Gradient backgrounds matching app theme
- Color-coded status badges (green=successful, blue=completed, yellow=pending, red=failed)
- Responsive layout for mobile and desktop
- Hover effects on interactive elements
- Loading spinners for async operations

## Performance Considerations

- Pagination limits database queries
- Maximum 100 records per page
- Efficient indexing on `call_id` and `created_at`
- Client-side caching of current page
- Lazy loading of detail pages

## Error Handling

- Network errors show user-friendly messages
- Retry functionality on failed requests
- 404 handling for non-existent calls
- Graceful degradation if database is unavailable
- Loading states prevent user confusion

## Future Enhancements

Potential improvements:
- Search and filter functionality
- Export to CSV
- Bulk operations
- Real-time updates via WebSocket
- Advanced sorting options
- Date range filtering
- Call recording playback integration

