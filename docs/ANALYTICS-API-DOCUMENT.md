# NetJoub Analytics API Documentation

## Table of Contents
1. [Admin Analytics Endpoints](#admin-analytics-endpoints)
2. [Store Owner Analytics Endpoints](#store-owner-analytics-endpoints)
3. [Query Parameters](#query-parameters)
4. [Response Format](#response-format)
5. [Usage Examples](#usage-examples)

---

## Admin Analytics Endpoints

### 1. Platform Overview
Get comprehensive platform-wide statistics.

**Endpoint:** `GET /api/v1/admin/auth/analytics/overview`

**Auth Required:** Yes (Admin role)

**Query Parameters:**
- `startDate` (optional): ISO date string (e.g., "2025-10-01")
- `endDate` (optional): ISO date string (e.g., "2025-11-11")
- `branch_id` (optional): UUID - Filter analytics to specific branch
- `room_id` (optional): UUID - Filter analytics to specific room

**Filtering Behavior:**
- No filters: Returns platform-wide global totals
- `branch_id` only: Returns totals for all bookings in that branch
- `room_id` only: Returns totals for bookings of that specific room
- `room_id` takes precedence if both are provided

**Response:**
```json
{
  "success": true,
  "data": {
    "revenue": {
      "total": 125000.50,
      "average": 450.75
    },
    "bookings": {
      "total": 1250,
      "completionRate": "85.50"
    },
    "platform": {
      "branches": 45,
      "rooms": 150,
      "customers": 500,
      "activeOwners": 30
    }
  }
}
```

---

### 2. Revenue Trends
Get revenue trends over time with configurable grouping.

**Endpoint:** `GET /api/v1/admin/auth/analytics/revenue-trends`

**Auth Required:** Yes (Admin role)

**Query Parameters:**
- `startDate` (optional): ISO date string
- `endDate` (optional): ISO date string
- `groupBy` (optional): `day`, `week`, `month`, `year` (default: `day`)
  - **Note**: Only accepts valid values: `day`, `week`, `month`, `year`. Invalid values default to `day`.
  - Input is sanitized and validated to prevent SQL injection.
- `branch_id` (optional): UUID - Filter trends to specific branch
- `room_id` (optional): UUID - Filter trends to specific room

**Filtering Behavior:**
- No filters: Returns platform-wide revenue trends
- `branch_id` only: Returns trends for all bookings in that branch
- `room_id` only: Returns trends for bookings of that specific room

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "period": "2025-10-01T00:00:00.000Z",
      "revenue": 5250.00,
      "bookingCount": 42,
      "avgBookingValue": 125.00
    },
    {
      "period": "2025-10-02T00:00:00.000Z",
      "revenue": 6100.00,
      "bookingCount": 48,
      "avgBookingValue": 127.08
    }
  ]
}
```

---

### 3. Top Performing Branches
Get top branches by revenue.

**Endpoint:** `GET /api/v1/admin/auth/analytics/top-branches`

**Auth Required:** Yes (Admin role)

**Query Parameters:**
- `startDate` (optional): ISO date string
- `endDate` (optional): ISO date string
- `limit` (optional): Number of results (default: 10)

**Note:** This endpoint does NOT support `branch_id` or `room_id` filtering as it's designed to compare multiple branches.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "branchId": "11111111-1111-1111-1111-111111111111",
      "branchName": "Downtown Branch",
      "address": "123 Main St, Phnom Penh",
      "ownerName": "John Doe",
      "metrics": {
        "totalBookings": 250,
        "totalRevenue": 45000.00,
        "avgBookingValue": 180.00
      }
    }
  ]
}
```

---

### 4. Booking Status Distribution
Get distribution of bookings by status.

**Endpoint:** `GET /api/v1/admin/auth/analytics/booking-status`

**Auth Required:** Yes (Admin role)

**Query Parameters:**
- `startDate` (optional): ISO date string
- `endDate` (optional): ISO date string
- `branch_id` (optional): UUID - Filter to specific branch
- `room_id` (optional): UUID - Filter to specific room

**Filtering Behavior:**
- No filters: Returns status distribution for all bookings
- `branch_id` only: Returns status distribution for bookings in that branch
- `room_id` only: Returns status distribution for bookings of that room

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "status": "completed",
      "count": 850,
      "revenue": 127500.00
    },
    {
      "status": "confirmed",
      "count": 120,
      "revenue": 18000.00
    },
    {
      "status": "pending",
      "count": 80,
      "revenue": 0
    },
    {
      "status": "cancelled",
      "count": 50,
      "revenue": 0
    }
  ]
}
```

---

### 5. Top Customers
Get top customers by spending.

**Endpoint:** `GET /api/v1/admin/auth/analytics/top-customers`

**Auth Required:** Yes (Admin role)

**Query Parameters:**
- `startDate` (optional): ISO date string
- `endDate` (optional): ISO date string
- `limit` (optional): Number of results (default: 10)
- `branch_id` (optional): UUID - Filter to customers who booked in specific branch
- `room_id` (optional): UUID - Filter to customers who booked specific room

**Filtering Behavior:**
- No filters: Returns top customers across entire platform
- `branch_id` only: Returns top customers for bookings in that branch
- `room_id` only: Returns top customers who booked that specific room

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "customerId": "123e4501-e89b-12d3-a456-426614174000",
      "name": "Jane Smith",
      "totalBookings": 25,
      "totalSpent": 4500.00,
      "avgSpent": 180.00
    }
  ]
}
```

---

### 6. Room Utilization
Get room utilization rates across the platform.

**Endpoint:** `GET /api/v1/admin/auth/analytics/room-utilization`

**Auth Required:** Yes (Admin role)

**Query Parameters:**
- `startDate` (optional): ISO date string
- `endDate` (optional): ISO date string
- `branch_id` (optional): UUID - Filter to rooms in specific branch
- `room_id` (optional): UUID - Filter to specific room

**Filtering Behavior:**
- No filters: Returns utilization for all rooms across platform
- `branch_id` only: Returns utilization for all rooms in that branch
- `room_id` only: Returns utilization for that specific room only

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "roomId": "11111111-1111-1111-1111-111111111111",
      "roomNo": "R101",
      "branchName": "Downtown Branch",
      "totalBookings": 42,
      "hoursBooked": 210.5,
      "totalAvailableHours": 504,
      "utilizationRate": "41.77"
    }
  ]
}
```

---

## Store Owner Analytics Endpoints

### 1. Owner Dashboard Overview
Get comprehensive overview of owner's business.

**Endpoint:** `GET /api/v1/user/auth/owner/analytics/overview`

**Auth Required:** Yes (Owner role)

**Query Parameters:**
- `startDate` (optional): ISO date string
- `endDate` (optional): ISO date string
- `branch_id` (optional): UUID - Filter to specific branch owned by this owner
- `room_id` (optional): UUID - Filter to specific room in owner's branches

**Filtering Behavior:**
- No filters: Returns overview for all of owner's branches and rooms
- `branch_id` only: Returns overview for that specific branch
- `room_id` only: Returns overview for bookings of that specific room

**Response:**
```json
{
  "success": true,
  "data": {
    "revenue": {
      "total": 45000.50,
      "average": 350.75
    },
    "bookings": {
      "total": 450,
      "completionRate": "88.50"
    },
    "business": {
      "branches": 3,
      "rooms": 12,
      "uniqueCustomers": 125
    }
  }
}
```

---

### 2. Owner Revenue Trends
Get revenue trends for owner's branches.

**Endpoint:** `GET /api/v1/user/auth/owner/analytics/revenue-trends`

**Auth Required:** Yes (Owner role)

**Query Parameters:**
- `startDate` (optional): ISO date string
- `endDate` (optional): ISO date string
- `groupBy` (optional): `day`, `week`, `month`, `year` (default: `day`)
  - **Note**: Only accepts valid values: `day`, `week`, `month`, `year`. Invalid values default to `day`.
  - Input is sanitized and validated to prevent SQL injection.
- `branch_id` (optional): UUID - Filter trends to specific branch
- `room_id` (optional): UUID - Filter trends to specific room

**Filtering Behavior:**
- No filters: Returns trends for all of owner's branches
- `branch_id` only: Returns trends for that specific branch
- `room_id` only: Returns trends for bookings of that specific room

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "period": "2025-10-01T00:00:00.000Z",
      "revenue": 1250.00,
      "bookingCount": 12,
      "avgBookingValue": 104.17
    }
  ]
}
```

---

### 3. Branch Performance Comparison
Compare performance across owner's branches.

**Endpoint:** `GET /api/v1/user/auth/owner/analytics/branch-performance`

**Auth Required:** Yes (Owner role)

**Query Parameters:**
- `startDate` (optional): ISO date string
- `endDate` (optional): ISO date string
- `branch_id` (optional): UUID - Filter to specific branch (useful for single branch analysis)

**Filtering Behavior:**
- No filters: Returns performance comparison for all owner's branches
- `branch_id` only: Returns performance for that specific branch only

**Note:** This endpoint does NOT support `room_id` filtering as it's designed to analyze branch-level performance.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "branchId": "11111111-1111-1111-1111-111111111111",
      "branchName": "Downtown Branch",
      "address": "123 Main St",
      "roomCount": 5,
      "metrics": {
        "totalBookings": 180,
        "totalRevenue": 27000.00,
        "avgBookingValue": 150.00
      }
    },
    {
      "branchId": "22222222-2222-2222-2222-222222222222",
      "branchName": "Riverside Branch",
      "address": "456 River Rd",
      "roomCount": 4,
      "metrics": {
        "totalBookings": 150,
        "totalRevenue": 22500.00,
        "avgBookingValue": 150.00
      }
    }
  ]
}
```

---

### 4. Branch Room Performance
Get detailed room performance for a specific branch.

**Endpoint:** `GET /api/v1/user/auth/owner/analytics/branch/:branchId/rooms`

**Auth Required:** Yes (Owner role)

**URL Parameters:**
- `branchId`: UUID of the branch (must be owned by authenticated owner)

**Query Parameters:**
- `startDate` (optional): ISO date string
- `endDate` (optional): ISO date string
- `room_id` (optional): UUID - Filter to specific room within the branch

**Filtering Behavior:**
- No filters: Returns performance for all rooms in the specified branch
- `room_id` only: Returns performance for that specific room only

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "roomId": "11111111-1111-1111-1111-111111111111",
      "roomNo": "R101",
      "capacity": 3,
      "pricePerHour": 50.00,
      "metrics": {
        "totalBookings": 42,
        "totalRevenue": 10500.00,
        "hoursBooked": 210
      }
    }
  ]
}
```

---

### 5. Peak Hours Analysis
Analyze booking patterns by hour of day.

**Endpoint:** `GET /api/v1/user/auth/owner/analytics/peak-hours`

**Auth Required:** Yes (Owner role)

**Query Parameters:**
- `startDate` (optional): ISO date string
- `endDate` (optional): ISO date string
- `branch_id` (optional): UUID - Filter to specific branch
- `room_id` (optional): UUID - Filter to specific room

**Filtering Behavior:**
- No filters: Returns peak hours for all of owner's branches
- `branch_id` only: Returns peak hours for that specific branch
- `room_id` only: Returns peak hours for bookings of that specific room

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "hour": 8,
      "bookingCount": 45,
      "revenue": 6750.00
    },
    {
      "hour": 9,
      "bookingCount": 52,
      "revenue": 7800.00
    },
    {
      "hour": 10,
      "bookingCount": 48,
      "revenue": 7200.00
    }
  ]
}
```

---

### 6. Customer Insights
Get insights about customers who book at owner's branches.

**Endpoint:** `GET /api/v1/user/auth/owner/analytics/customers`

**Auth Required:** Yes (Owner role)

**Query Parameters:**
- `startDate` (optional): ISO date string
- `endDate` (optional): ISO date string
- `limit` (optional): Number of results (default: 20)
- `branch_id` (optional): UUID - Filter to customers who booked at specific branch
- `room_id` (optional): UUID - Filter to customers who booked specific room

**Filtering Behavior:**
- No filters: Returns customer insights for all of owner's branches
- `branch_id` only: Returns insights for customers who booked at that branch
- `room_id` only: Returns insights for customers who booked that specific room

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "customerId": "123e4501-e89b-12d3-a456-426614174000",
      "name": "Jane Smith",
      "totalBookings": 15,
      "totalSpent": 2250.00,
      "avgSpent": 150.00,
      "lastBooking": "2025-11-10T14:00:00.000Z"
    }
  ]
}
```

---

## Query Parameters

### Common Parameters

| Parameter | Type | Description | Default | Example |
|-----------|------|-------------|---------|---------|
| `startDate` | String | Start date (ISO format) | - | `2025-10-01` |
| `endDate` | String | End date (ISO format) | - | `2025-11-11` |
| `groupBy` | String | Time grouping for trends | `day` | `week`, `month` |
| `limit` | Integer | Number of results | 10 or 20 | `20` |
| `branch_id` | String (UUID) | Filter to specific branch | - | `550e8400-e29b-41d4-a716-446655440000` |
| `room_id` | String (UUID) | Filter to specific room | - | `660e8400-e29b-41d4-a716-446655440001` |

### Date Filtering
- If both `startDate` and `endDate` are provided, data is filtered to that range
- If only `startDate` is provided, data from that date onwards is included
- If only `endDate` is provided, data up to that date is included
- If neither is provided, all data is included

### Branch/Room Filtering
- **No filters**: Returns analytics for entire scope (platform-wide for admin, all owner's branches for owner)
- **`branch_id` only**: Returns analytics scoped to all bookings in that branch
- **`room_id` only**: Returns analytics scoped to bookings of that specific room
- **Both provided**: `room_id` takes precedence (room filtering is more specific)
- **Filtering is database-level**: All filters are applied in SQL queries, not post-processed in memory
- **Admin endpoints**: Can filter across all branches/rooms platform-wide
- **Owner endpoints**: Automatically scoped to owner's branches, additional filters further narrow the scope
- **Exceptions**:
  - `getTopBranches` does NOT support filtering (designed to compare multiple branches)
  - `getOwnerBranchPerformance` supports `branch_id` only (NOT `room_id`)

---

## Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message"
}
```

### HTTP Status Codes
- `200` - Success
- `400` - Bad Request (invalid parameters)
- `401` - Unauthorized (not authenticated)
- `403` - Forbidden (insufficient permissions)
- `500` - Internal Server Error

---

## Usage Examples

### Example 1: Get Admin Overview for October 2025
```bash
curl -X GET \
  'http://localhost:3000/api/v1/admin/auth/analytics/overview?startDate=2025-10-01&endDate=2025-10-31' \
  -H 'Authorization: Bearer YOUR_ADMIN_TOKEN'
```

### Example 2: Get Owner Revenue Trends (Weekly)
```bash
curl -X GET \
  'http://localhost:3000/api/v1/user/auth/owner/analytics/revenue-trends?startDate=2025-10-01&endDate=2025-11-11&groupBy=week' \
  -H 'Authorization: Bearer YOUR_OWNER_TOKEN'
```

### Example 3: Get Top 20 Customers
```bash
curl -X GET \
  'http://localhost:3000/api/v1/admin/auth/analytics/top-customers?limit=20&startDate=2025-10-01' \
  -H 'Authorization: Bearer YOUR_ADMIN_TOKEN'
```

### Example 4: Get Room Performance for Specific Branch
```bash
curl -X GET \
  'http://localhost:3000/api/v1/user/auth/owner/analytics/branch/11111111-1111-1111-1111-111111111111/rooms?startDate=2025-10-01' \
  -H 'Authorization: Bearer YOUR_OWNER_TOKEN'
```

### Example 5: Get Overview for Specific Branch *(NEW)*
```bash
curl -X GET \
  'http://localhost:3000/api/v1/admin/auth/analytics/overview?branch_id=550e8400-e29b-41d4-a716-446655440000&startDate=2025-10-01&endDate=2025-10-31' \
  -H 'Authorization: Bearer YOUR_ADMIN_TOKEN'
```

### Example 6: Get Revenue Trends for Specific Room *(NEW)*
```bash
curl -X GET \
  'http://localhost:3000/api/v1/admin/auth/analytics/revenue-trends?room_id=660e8400-e29b-41d4-a716-446655440001&groupBy=week' \
  -H 'Authorization: Bearer YOUR_ADMIN_TOKEN'
```

### Example 7: Get Top Customers for a Branch *(NEW)*
```bash
curl -X GET \
  'http://localhost:3000/api/v1/admin/auth/analytics/top-customers?branch_id=550e8400-e29b-41d4-a716-446655440000&limit=10' \
  -H 'Authorization: Bearer YOUR_ADMIN_TOKEN'
```

### Example 8: Get Room Utilization for Specific Branch *(NEW)*
```bash
curl -X GET \
  'http://localhost:3000/api/v1/admin/auth/analytics/room-utilization?branch_id=550e8400-e29b-41d4-a716-446655440000' \
  -H 'Authorization: Bearer YOUR_ADMIN_TOKEN'
```

### Example 9: Get Owner Overview for Specific Branch *(NEW)*
```bash
curl -X GET \
  'http://localhost:3000/api/v1/user/auth/owner/analytics/overview?branch_id=550e8400-e29b-41d4-a716-446655440000&startDate=2025-10-01&endDate=2025-10-31' \
  -H 'Authorization: Bearer YOUR_OWNER_TOKEN'
```

### Example 10: Get Owner Peak Hours for Specific Room *(NEW)*
```bash
curl -X GET \
  'http://localhost:3000/api/v1/user/auth/owner/analytics/peak-hours?room_id=660e8400-e29b-41d4-a716-446655440001' \
  -H 'Authorization: Bearer YOUR_OWNER_TOKEN'
```

---

## Frontend Integration Examples

### React/JavaScript Example
```javascript
// Fetch admin overview (global or filtered)
const fetchAdminOverview = async (filters = {}) => {
  const { startDate, endDate, branch_id, room_id } = filters;

  const params = new URLSearchParams();
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);
  if (branch_id) params.append('branch_id', branch_id);
  if (room_id) params.append('room_id', room_id);

  try {
    const response = await fetch(
      `/api/v1/admin/auth/analytics/overview?${params}`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const result = await response.json();

    if (result.success) {
      console.log('Overview data:', result.data);
      // Update UI with data
      return result.data;
    }
  } catch (error) {
    console.error('Error fetching overview:', error);
  }
};

// Example usage: Get overview for specific branch
fetchAdminOverview({
  startDate: '2025-10-01',
  endDate: '2025-10-31',
  branch_id: '550e8400-e29b-41d4-a716-446655440000'
});

// Fetch revenue trends (with optional branch/room filter)
const fetchRevenueTrends = async (filters = {}) => {
  const { startDate, endDate, groupBy = 'day', branch_id, room_id } = filters;

  const params = new URLSearchParams({
    startDate: startDate || '2025-10-01',
    endDate: endDate || '2025-11-11',
    groupBy: groupBy
  });

  if (branch_id) params.append('branch_id', branch_id);
  if (room_id) params.append('room_id', room_id);

  try {
    const response = await fetch(
      `/api/v1/admin/auth/analytics/revenue-trends?${params}`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      }
    );

    const result = await response.json();

    if (result.success) {
      // Process data for charts
      const chartData = result.data.map(item => ({
        date: new Date(item.period),
        revenue: item.revenue,
        bookings: item.bookingCount
      }));

      // Update chart component
      updateChart(chartData);
      return chartData;
    }
  } catch (error) {
    console.error('Error fetching trends:', error);
  }
};

// Example usage: Get trends for specific room
fetchRevenueTrends({
  room_id: '660e8400-e29b-41d4-a716-446655440001',
  groupBy: 'week'
});

// Fetch top customers for a branch
const fetchTopCustomersForBranch = async (branchId, limit = 10) => {
  const params = new URLSearchParams({
    branch_id: branchId,
    limit: limit.toString()
  });

  try {
    const response = await fetch(
      `/api/v1/admin/auth/analytics/top-customers?${params}`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      }
    );

    const result = await response.json();

    if (result.success) {
      return result.data;
    }
  } catch (error) {
    console.error('Error fetching top customers:', error);
  }
};

// Fetch owner analytics with optional filtering
const fetchOwnerOverview = async (filters = {}) => {
  const { startDate, endDate, branch_id, room_id } = filters;

  const params = new URLSearchParams();
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);
  if (branch_id) params.append('branch_id', branch_id);
  if (room_id) params.append('room_id', room_id);

  try {
    const response = await fetch(
      `/api/v1/user/auth/owner/analytics/overview?${params}`,
      {
        headers: {
          'Authorization': `Bearer ${ownerToken}`
        }
      }
    );

    const result = await response.json();

    if (result.success) {
      return result.data;
    }
  } catch (error) {
    console.error('Error fetching owner overview:', error);
  }
};

// Example: Get owner analytics for specific branch
fetchOwnerOverview({
  startDate: '2025-10-01',
  endDate: '2025-10-31',
  branch_id: '550e8400-e29b-41d4-a716-446655440000'
});
```

---

## Key Metrics Explained

### Revenue Metrics
- **Total Revenue**: Sum of all completed bookings
- **Average Booking Value**: Mean price per completed booking
- **Revenue by Period**: Revenue aggregated by day/week/month

### Booking Metrics
- **Total Bookings**: Count of all bookings (regardless of status)
- **Completion Rate**: Percentage of bookings with "completed" status
- **Booking Count by Status**: Distribution across pending/confirmed/cancelled/completed

### Performance Metrics
- **Room Utilization Rate**: (Hours Booked / Total Available Hours) × 100
- **Peak Hours**: Hours with highest booking count and revenue
- **Branch Performance**: Comparative metrics across branches

### Customer Metrics
- **Total Spent**: Sum of all completed bookings by customer
- **Average Spent**: Mean value per booking for each customer
- **Unique Customers**: Count of distinct customers

---

## Notes

1. All monetary values are in the database's configured currency
2. Dates are in ISO 8601 format (UTC timezone)
3. Authentication is required for all endpoints
4. Role-based access control is enforced
5. Large date ranges may impact performance
6. Consider implementing caching for frequently accessed analytics
7. **NEW**: Branch/room filtering is now available for both admin and owner analytics endpoints
8. **NEW**: All filtering is applied at database query level (not in-memory) for optimal performance
9. **NEW**: `groupBy` parameter is validated and sanitized (only accepts: `day`, `week`, `month`, `year`)
10. **IMPORTANT**: Some endpoints don't support certain filters:
    - `getTopBranches` - No branch_id/room_id filtering (designed to compare branches)
    - `getOwnerBranchPerformance` - Only branch_id (no room_id)

---

## Branch/Room Filtering Deep Dive

### How It Works

The filtering feature allows admins and owners to scope analytics to specific branches or rooms:

**Query Logic:**
- When `room_id` is provided: Query filters bookings directly by `room_id` in WHERE clause
- When `branch_id` is provided: Query joins `bookings → rooms` and filters where `rooms.branch_id = branch_id`
- When neither is provided: Returns analytics for entire scope (platform-wide for admin, all owner's branches for owner)

**Performance Characteristics:**
- All filtering happens at the **database level** using SQL WHERE clauses and JOINs
- No post-processing or in-memory filtering
- Indexed foreign keys (`room_id`, `branch_id`) ensure fast query performance
- Uses INNER JOINs with `required: true` for optimal query plans

### Use Cases

**Admin Use Cases:**

**1. Branch Performance Analysis**
```
GET /api/v1/admin/auth/analytics/overview?branch_id={BRANCH_ID}
```
→ Get total revenue, bookings, customers for a specific branch

**2. Room-Level Deep Dive**
```
GET /api/v1/admin/auth/analytics/revenue-trends?room_id={ROOM_ID}&groupBy=day
```
→ Analyze daily revenue trends for a specific room

**3. Branch Customer Segmentation**
```
GET /api/v1/admin/auth/analytics/top-customers?branch_id={BRANCH_ID}&limit=20
```
→ Find top customers who book at a specific branch

**4. Room Utilization Audit**
```
GET /api/v1/admin/auth/analytics/room-utilization?room_id={ROOM_ID}
```
→ Get detailed utilization metrics for a specific room

**Owner Use Cases:**

**5. Owner Branch-Specific Overview**
```
GET /api/v1/user/auth/owner/analytics/overview?branch_id={BRANCH_ID}
```
→ Get overview metrics for one of owner's branches

**6. Owner Room Revenue Analysis**
```
GET /api/v1/user/auth/owner/analytics/revenue-trends?room_id={ROOM_ID}&groupBy=week
```
→ Analyze weekly revenue for a specific room

**7. Owner Branch Customer Insights**
```
GET /api/v1/user/auth/owner/analytics/customers?branch_id={BRANCH_ID}&limit=20
```
→ Find top customers at a specific branch

**8. Owner Room Peak Hours**
```
GET /api/v1/user/auth/owner/analytics/peak-hours?room_id={ROOM_ID}
```
→ Analyze peak hours for a specific room

### Backward Compatibility

✅ **Fully backward compatible**: All existing API calls without `branch_id`/`room_id` work identically to before
✅ **No breaking changes**: Response structure remains unchanged
✅ **Additive feature**: New parameters are optional and ignored if not provided

### Validation & Security

**groupBy Parameter Validation:**
- Only accepts: `day`, `week`, `month`, `year`
- Invalid values automatically default to `day`
- Input is sanitized to prevent SQL injection

**UUID Validation:**
- Branch and room IDs must be valid UUIDs
- Owner endpoints automatically verify ownership (cannot access other owners' data)
- Invalid UUIDs will result in no matches (empty results)

---

## Best Practices

1. **Date Range Selection**: Use reasonable date ranges (e.g., 3-6 months max) for performance
2. **Pagination**: Use `limit` parameter for large result sets
3. **Caching**: Implement client-side caching for dashboard data
4. **Error Handling**: Always check `success` field before processing data
5. **Rate Limiting**: Be mindful of API rate limits for analytics endpoints
6. **Branch/Room Filtering**: Use UUID validation on frontend before sending to prevent invalid queries
7. **Filtering Strategy**: Prefer `room_id` for granular analysis, `branch_id` for aggregated branch-level insights