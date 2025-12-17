# NatJoub API Documentation

Complete API reference for the NatJoub booking system.

## 📋 Table of Contents

- [Base URLs](#base-urls)
- [Authentication](#authentication)
- [Public Routes](#public-routes)
- [Customer Routes](#customer-routes)
- [Owner Routes](#owner-routes)
- [Admin Routes](#admin-routes)
- [Payment Integration](#payment-integration)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)

---

## 🌐 Base URLs

| Router Type | Base URL |
|------------|----------|
| Public User Routes | `http://localhost:3000/api/v1/user` |
| Private User Routes | `http://localhost:3000/api/v1/user/auth` |
| Customer Routes | `http://localhost:3000/api/v1/user/auth/customer` |
| Owner Routes | `http://localhost:3000/api/v1/user/auth/owner` |
| Public Admin Routes | `http://localhost:3000/api/v1/admin` |
| Private Admin Routes | `http://localhost:3000/api/v1/admin/auth` |

---

## 🔐 Authentication

### Headers

For protected routes, include the JWT token in the Authorization header:

```http
Authorization: Bearer <your_jwt_token>
```

### Authentication Flow

#### User Authentication (Email/Username + OTP)

**1. Initiate Login**
```http
POST /api/v1/user/login
Content-Type: application/json

{
  "username": "john_doe",
  "password": "SecurePassword123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP sent successfully",
  "data": {
    "userId": "uuid",
    "email": "john@example.com",
    "username": "john_doe",
    "role": "customer",
    "requiresOTP": true,
    "otpExpiresInMinutes": 5
  }
}
```

**2. Verify OTP**
```http
POST /api/v1/user/verify
Content-Type: application/json

{
  "username": "john_doe",
  "otp": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "uuid",
      "email": "john@example.com",
      "role": "customer"
    },
    "token": "jwt_token_here"
  }
}
```

#### SMS Authentication (Alternative)

**1. Initial SMS Login**
```http
POST /api/v1/user/sms-login
Content-Type: application/json

{
  "phone_number": "+85512345678"
}
```

**2. Verify SMS OTP**
```http
POST /api/v1/user/sms-verify
Content-Type: application/json

{
  "phone_number": "+85512345678",
  "otp": "123456"
}
```

#### Admin Authentication

**1. Initiate Admin Login**
```http
POST /api/v1/admin/login
Content-Type: application/json

{
  "username": "admin_user",
  "password": "AdminPassword123"
}
```

**2. Verify Admin OTP**
```http
POST /api/v1/admin/verify
Content-Type: application/json

{
  "username": "admin_user",
  "otp": "123456"
}
```

#### Token Refresh

```http
POST /api/v1/user/refresh-token
Content-Type: application/json

{
  "token": "your_current_jwt_token"
}
```

#### Logout

```http
POST /api/v1/user/auth/logout
Authorization: Bearer <token>
```

---

## 🌍 Public Routes

### User Registration

**Register New User**
```http
POST /api/v1/user/register
Content-Type: application/json

{
  "first_name": "John",
  "last_name": "Doe",
  "username": "john_doe",
  "email": "john@example.com",
  "password": "SecurePassword123",
  "phone_number": "+85512345678",
  "role": "customer"
}
```

**Verify Registration OTP**
```http
POST /api/v1/user/verify-registration-otp
Content-Type: application/json

{
  "userId": "uuid",
  "otp": "123456"
}
```

**Resend Registration OTP**
```http
POST /api/v1/user/resend-registration-otp
Content-Type: application/json

{
  "userId": "uuid"
}
```

### Room Availability (Public)

**Check Room Availability**
```http
GET /api/v1/user/booking/room/:roomId/availability?date=2025-12-01
```

**Response:**
```json
{
  "success": true,
  "data": {
    "roomId": "uuid",
    "date": "2025-12-01",
    "availableSlots": [
      {
        "startTime": "09:00",
        "endTime": "10:00"
      }
    ]
  }
}
```

---

## 👤 Customer Routes

**Base URL:** `http://localhost:3000/api/v1/user/auth/customer`

**Required:** JWT Token with `role: customer`

### Profile

**Get User Profile**
```http
GET /api/v1/user/auth/customer/profile
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "User retrieved successfully",
  "data": {
    "id": "uuid",
    "first_name": "John",
    "last_name": "Doe",
    "username": "john_doe",
    "role": "customer"
  }
}
```

---

### Bookings

**Create Booking (with Auto Payment QR)**
```http
POST /api/v1/user/auth/customer/booking
Authorization: Bearer <token>
Content-Type: application/json

{
  "roomId": "room-uuid",
  "startTime": "2025-12-01T10:00:00Z",
  "endTime": "2025-12-01T12:00:00Z",
  "promotionId": "promo-uuid" // Optional
}
```

**Response:**
```json
{
  "success": true,
  "message": "Booking created successfully",
  "data": {
    "booking": {
      "id": "booking-uuid",
      "status": "pending",
      "total_price": 50.00,
      "start_time": "2025-12-01T10:00:00Z",
      "end_time": "2025-12-01T12:00:00Z"
    },
    "payment": {
      "paymentId": "payment-uuid",
      "transactionId": "BK8f509172-72838386",
      "qrImage": "data:image/png;base64,...",
      "qrString": "00020101021230510016...",
      "abapayDeeplink": "abamobilebank://...",
      "amount": 50.00,
      "currency": "USD",
      "appStore": "https://...",
      "playStore": "https://..."
    }
  }
}
```

**Get My Bookings**
```http
GET /api/v1/user/auth/customer/booking/my?status=confirmed&limit=50
Authorization: Bearer <token>
```

**Query Parameters:**
- `status` (optional): Filter by status (pending, confirmed, cancelled)
- `limit` (optional): Maximum number of results

**Response:**
```json
{
  "success": true,
  "count": 1,
  "data": [
    {
      "id": "booking-uuid",
      "status": "confirmed",
      "total_price": 50.00,
      "start_time": "2025-12-01T10:00:00Z",
      "end_time": "2025-12-01T12:00:00Z",
      "room": {
        "room_no": "101",
        "branch": {
          "branch_name": "Downtown Branch"
        }
      }
    }
  ]
}
```

**Cancel Booking**
```http
DELETE /api/v1/user/auth/customer/booking/:bookingId
Authorization: Bearer <token>
```

**Example:**
```http
DELETE /api/v1/user/auth/customer/booking/8f509172-e29b-41d4-a716-446655440001
```

**Get Occupied Room Times**
```http
GET /api/v1/user/auth/customer/room/occupied-times?roomId=uuid&date=2025-12-01
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Occupied room booking times retrieved successfully",
  "data": [
    {
      "start_time": "2025-12-01T09:00:00Z",
      "end_time": "2025-12-01T11:00:00Z"
    },
    {
      "start_time": "2025-12-01T14:00:00Z",
      "end_time": "2025-12-01T16:00:00Z"
    }
  ]
}
```

---

### Payments

**Verify Payment**
```http
POST /api/v1/user/auth/customer/verify/:transactionId
Authorization: Bearer <token>
```

**Example:**
```http
POST /api/v1/user/auth/customer/verify/BK8f509172-72838386
```

**Response:**
```json
{
  "success": true,
  "message": "Payment verified successfully",
  "data": {
    "paymentStatus": "completed",
    "paymentStatusCode": 0,
    "amount": 50.00,
    "currency": "USD",
    "transactionDate": "2025-11-30 10:20:40",
    "apv": "519254",
    "bookingStatus": "confirmed"
  }
}
```

**Get Payment History for Booking**
```http
GET /api/v1/user/auth/customer/history/:bookingId
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "id": "payment-uuid",
      "transaction_id": "BK8f509172-72838386",
      "amount": 50.00,
      "currency": "USD",
      "payment_status": "completed",
      "payment_status_code": 0,
      "apv": "519254",
      "paid_at": "2025-11-30T10:20:40Z",
      "created_at": "2025-11-30T10:15:00Z"
    }
  ]
}
```

**Get Payment Status**
```http
GET /api/v1/user/auth/customer/status/:transactionId
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "paymentId": "payment-uuid",
    "transactionId": "BK8f509172-72838386",
    "paymentStatus": "completed",
    "paymentStatusCode": 0,
    "amount": 50.00,
    "currency": "USD",
    "paidAt": "2025-11-30T10:20:40Z",
    "bookingId": "booking-uuid",
    "bookingStatus": "confirmed"
  }
}
```

---

### Favorite Rooms

**Toggle Favorite Room**
```http
POST /api/v1/user/auth/customer/favorite-room
Authorization: Bearer <token>
Content-Type: application/json

{
  "roomId": "room-uuid"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Room added to favorites successfully",
  "data": {
    "userId": "user-uuid",
    "roomId": "room-uuid",
    "action": "added"
  }
}
```

**Get Favorite Rooms**
```http
GET /api/v1/user/auth/customer/get-favorite-rooms
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Favorite rooms fetched successfully",
  "data": [
    {
      "id": "room-uuid",
      "room_no": "101",
      "people_capacity": 10,
      "price_per_hour": 25.00,
      "branch": {
        "branch_name": "Downtown Branch",
        "address": "123 Main St"
      }
    }
  ]
}
```

---

### Browse & Filter

**Filter Branches**
```http
GET /api/v1/user/auth/customer/filter-branches?city=Phnom+Penh&minPrice=10&maxPrice=100
Authorization: Bearer <token>
```

**Query Parameters:**
- `city` - Filter by city
- `minPrice` - Minimum price per hour
- `maxPrice` - Maximum price per hour
- `work_days` - Filter by working days
- Additional custom filters

**Response:**
```json
{
  "success": true,
  "message": "Filtered data fetched successfully",
  "data": [
    {
      "id": "branch-uuid",
      "branch_name": "Downtown Branch",
      "address": "123 Main St, Phnom Penh",
      "work_days": ["monday", "tuesday", "wednesday", "thursday", "friday"],
      "open_times": "09:00",
      "close_times": "18:00"
    }
  ]
}
```

**Filter Rooms**
```http
GET /api/v1/user/auth/customer/filter-rooms?roomId=uuid&peopleCapacity=5&minPrice=10&maxPrice=50
Authorization: Bearer <token>
```

**Query Parameters:**
- `roomId` (optional) - Specific room ID
- `peopleCapacity` - Filter by capacity
- `minPrice` - Minimum price
- `maxPrice` - Maximum price

**Get Branch Details**
```http
GET /api/v1/user/auth/customer/branch/details?branchId=uuid
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Branch details retrieved successfully",
  "data": {
    "id": "branch-uuid",
    "branch_name": "Downtown Branch",
    "address": "123 Main St, Phnom Penh",
    "work_days": ["monday", "tuesday"],
    "open_times": "09:00",
    "close_times": "18:00",
    "is_active": true,
    "rooms": [
      {
        "id": "room-uuid",
        "room_no": "101",
        "people_capacity": 10,
        "price_per_hour": 25.00
      }
    ]
  }
}
```

**Get Rooms by Branch**
```http
GET /api/v1/user/auth/customer/branch/room/get-rooms-by-branch?branchId=uuid
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Rooms by branch retrieved successfully",
  "data": [
    {
      "id": "room-uuid",
      "room_no": "101",
      "people_capacity": 10,
      "price_per_hour": 25.00,
      "is_available": true,
      "description": "Spacious meeting room"
    }
  ]
}
```

**Get Branch Photos**
```http
GET /api/v1/user/auth/customer/branch/photo?branchId=uuid
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Branch photos retrieved successfully",
  "data": [
    {
      "id": "photo-uuid",
      "photo_url": "https://res.cloudinary.com/...",
      "cloudinary_id": "natjoub/branches/..."
    }
  ]
}
```

**Get Room Details**
```http
GET /api/v1/user/auth/customer/room/details?roomId=uuid
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Room detail retrieved successfully",
  "data": {
    "id": "room-uuid",
    "room_no": "101",
    "people_capacity": 10,
    "price_per_hour": 25.00,
    "is_available": true,
    "description": "Spacious meeting room with projector",
    "branch": {
      "branch_name": "Downtown Branch",
      "address": "123 Main St"
    },
    "photos": [
      {
        "photo_url": "https://res.cloudinary.com/..."
      }
    ]
  }
}
```

---

## 🏢 Owner Routes

**Base URL:** `http://localhost:3000/api/v1/user/auth/owner`

**Required:** JWT Token with `role: owner`

### Branch Management

**Request Branch Creation**
```http
POST /api/v1/user/auth/owner/request-create-branch
Authorization: Bearer <token>
Content-Type: application/json

{
  "branch_name": "Downtown Branch",
  "address": "123 Main St, Phnom Penh",
  "work_days": ["monday", "tuesday", "wednesday", "thursday", "friday"],
  "open_times": "09:00",
  "close_times": "18:00",
  "is_active": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Branch created successfully",
  "data": {
    "id": "branch-uuid",
    "branch_name": "Downtown Branch",
    "address": "123 Main St, Phnom Penh",
    "owner_id": "owner-uuid",
    "is_active": true
  }
}
```

**Upload Branch Photos**
```http
POST /api/v1/user/auth/owner/upload/branch-image?id=branch-uuid
Authorization: Bearer <token>
Content-Type: multipart/form-data

photos: [file1, file2, file3] // Max 10 files
```

**Example with curl:**
```bash
curl -X POST "http://localhost:3000/api/v1/user/auth/owner/upload/branch-image?id=branch-uuid" \
  -H "Authorization: Bearer <token>" \
  -F "photos=@photo1.jpg" \
  -F "photos=@photo2.jpg"
```

**Response:**
```json
{
  "success": true,
  "message": "Photos uploaded successfully",
  "data": {
    "uploaded": 2,
    "photos": [
      {
        "id": "photo-uuid",
        "photo_url": "https://res.cloudinary.com/...",
        "cloudinary_id": "natjoub/branches/..."
      }
    ]
  }
}
```

**Get All My Branches**
```http
GET /api/v1/user/auth/owner/branch/get-all-branches
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Branch retrieved successfully",
  "data": [
    {
      "id": "branch-uuid",
      "branch_name": "Downtown Branch",
      "address": "123 Main St",
      "work_days": ["monday", "tuesday"],
      "open_times": "09:00",
      "close_times": "18:00",
      "is_active": true
    }
  ]
}
```

**Get Rooms by Branch**
```http
GET /api/v1/user/auth/owner/branch/get-all-room-by-branch?branchId=uuid
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Rooms retrieved successfully",
  "data": [
    {
      "id": "room-uuid",
      "room_no": "101",
      "people_capacity": 10,
      "price_per_hour": 25.00,
      "is_available": true
    }
  ]
}
```

**Update Branch**
```http
PATCH /api/v1/user/auth/owner/branch/update-branch?id=branch-uuid
Authorization: Bearer <token>
Content-Type: application/json

{
  "branch_name": "Updated Branch Name",
  "open_times": "08:00",
  "close_times": "20:00",
  "is_active": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Branch updated successfully",
  "data": {
    "id": "branch-uuid",
    "branch_name": "Updated Branch Name",
    "open_times": "08:00",
    "close_times": "20:00"
  }
}
```

**Delete Branch**
```http
DELETE /api/v1/user/auth/owner/branch/delete-branch?id=branch-uuid
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Branch deleted successfully",
  "data": {
    "id": "branch-uuid",
    "deleted": true
  }
}
```

**Get Branch Photos**
```http
GET /api/v1/user/auth/owner/branch/photo?branchId=uuid
Authorization: Bearer <token>
```

---

### Room Management

**Create Room**
```http
POST /api/v1/user/auth/owner/request-create-room?branch_id=branch-uuid
Authorization: Bearer <token>
Content-Type: application/json

{
  "room_no": "101",
  "people_capacity": 10,
  "price_per_hour": 25.00,
  "is_available": true,
  "description": "Spacious meeting room with projector"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Room created successfully",
  "data": {
    "id": "room-uuid",
    "room_no": "101",
    "people_capacity": 10,
    "price_per_hour": 25.00,
    "branch_id": "branch-uuid"
  }
}
```

**Upload Room Photos**
```http
POST /api/v1/user/auth/owner/upload/room-image?id=room-uuid
Authorization: Bearer <token>
Content-Type: multipart/form-data

photos: [file1, file2, file3] // Max 10 files
```

**Example with curl:**
```bash
curl -X POST "http://localhost:3000/api/v1/user/auth/owner/upload/room-image?id=room-uuid" \
  -H "Authorization: Bearer <token>" \
  -F "photos=@room1.jpg" \
  -F "photos=@room2.jpg"
```

**Get All My Rooms**
```http
GET /api/v1/user/auth/owner/room/get-all-rooms
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Rooms retrieved successfully",
  "data": [
    {
      "id": "room-uuid",
      "room_no": "101",
      "people_capacity": 10,
      "price_per_hour": 25.00,
      "is_available": true,
      "branch": {
        "branch_name": "Downtown Branch"
      }
    }
  ]
}
```

**Update Room**
```http
PATCH /api/v1/user/auth/owner/room/update-room?id=room-uuid
Authorization: Bearer <token>
Content-Type: application/json

{
  "price_per_hour": 30.00,
  "is_available": true,
  "description": "Updated description"
}
```

**Delete Room**
```http
DELETE /api/v1/user/auth/owner/room/delete-room?id=room-uuid
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Room deleted successfully",
  "data": {
    "id": "room-uuid",
    "deleted": true
  }
}
```

---

## 💳 Payment Integration

NatJoub uses ABA PayWay for payment processing with automatic QR code generation.

### Payment Flow

```
1. Customer creates booking
   ↓
2. System auto-generates payment QR code
   ↓
3. Customer receives QR in response
   ↓
4. Customer scans QR with ABA Mobile app
   ↓
5. Customer pays in ABA app
   ↓
6. Customer clicks "I've Paid" in your app
   ↓
7. System verifies payment with ABA
   ↓
8. Booking auto-confirms if payment successful
```

### Complete Booking & Payment Example

See the [Customer Routes - Bookings](#bookings) section for the complete flow.

**Key Points:**
- Payment QR is generated automatically when booking is created
- Booking status starts as "pending"
- After payment verification, booking status changes to "confirmed"
- Transaction ID format: `BK{8-char-booking-id}-{8-digit-timestamp}`

### Payment Status Reference

| Code | Status Text | Description |
|------|-------------|-------------|
| 0 | PENDING | Not paid yet |
| 0 | APPROVED | ✅ Payment successful |
| 1 | COMPLETED | ✅ Payment successful |
| 2 | FAILED | ❌ Payment failed |
| 3 | CANCELLED | 🚫 User cancelled |
| 4 | REFUNDED | 💸 Payment refunded |
| 5 | EXPIRED | ⏰ QR code expired |

**Important:** The `payment_status` text is more reliable than `payment_status_code`.

---

## 👨‍💼 Admin Routes

**Base URL:** `http://localhost:3000/api/v1/admin`

**Required:** JWT Token with `role: admin`

### Authentication

**Initiate Admin Login**
```http
POST /api/v1/admin/login
Content-Type: application/json

{
  "username": "admin_user",
  "password": "AdminPassword123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP sent successfully",
  "data": {
    "userId": "admin-uuid",
    "email": "admin@example.com",
    "username": "admin_user",
    "requiresOTP": true,
    "otpExpiresInMinutes": 5
  }
}
```

**Verify Admin OTP**
```http
POST /api/v1/admin/verify
Content-Type: application/json

{
  "username": "admin_user",
  "otp": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "admin-uuid",
      "email": "admin@example.com",
      "role": "admin"
    },
    "token": "jwt_token_here"
  }
}
```

**Refresh Admin Token**
```http
POST /api/v1/admin/refresh-token
Content-Type: application/json

{
  "token": "current_jwt_token"
}
```

**Admin Logout**
```http
POST /api/v1/admin/auth/logout
Authorization: Bearer <token>
```

---

### User Management

**Create User**
```http
POST /api/v1/admin/auth/create-user
Authorization: Bearer <token>
Content-Type: application/json

{
  "first_name": "Jane",
  "last_name": "Smith",
  "username": "jane_smith",
  "email": "jane@example.com",
  "password": "Password123",
  "role": "owner"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "id": "user-uuid",
    "first_name": "Jane",
    "last_name": "Smith",
    "username": "jane_smith",
    "email": "jane@example.com",
    "role": "owner"
  }
}
```

**Get All Users**
```http
GET /api/v1/admin/auth/get-all-users
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "All users",
  "data": [
    {
      "id": "user-uuid",
      "first_name": "Jane",
      "last_name": "Smith",
      "username": "jane_smith",
      "role": "owner",
      "created_at": "2025-11-30T10:00:00Z"
    }
  ]
}
```

---

### Branch Management

**Create Branch**
```http
POST /api/v1/admin/auth/branch/create-branch
Authorization: Bearer <token>
Content-Type: application/json

{
  "branch_name": "Admin Created Branch",
  "address": "456 Admin St, Phnom Penh",
  "work_days": ["monday", "tuesday", "wednesday", "thursday", "friday"],
  "open_times": "08:00",
  "close_times": "20:00",
  "is_active": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Branch created successfully",
  "data": {
    "id": "branch-uuid",
    "branch_name": "Admin Created Branch",
    "address": "456 Admin St, Phnom Penh",
    "work_days": ["monday", "tuesday", "wednesday", "thursday", "friday"],
    "open_times": "08:00",
    "close_times": "20:00",
    "is_active": true
  }
}
```

**Get All Branches**
```http
GET /api/v1/admin/auth/branch/get-all-branches
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Branches retrieved successfully",
  "data": [
    {
      "id": "branch-uuid",
      "branch_name": "Downtown Branch",
      "address": "123 Main St",
      "work_days": ["monday", "tuesday"],
      "open_times": "09:00",
      "close_times": "18:00",
      "is_active": true
    }
  ]
}
```

**Get Branch by ID**
```http
GET /api/v1/admin/auth/branch/get-by-id-branch?id=branch-uuid
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Branch retrieved successfully",
  "data": {
    "id": "branch-uuid",
    "branch_name": "Downtown Branch",
    "address": "123 Main St",
    "work_days": ["monday", "tuesday", "wednesday"],
    "open_times": "09:00",
    "close_times": "18:00",
    "is_active": true,
    "owner": {
      "id": "owner-uuid",
      "first_name": "John",
      "last_name": "Doe"
    }
  }
}
```

**Update Branch**
```http
PATCH /api/v1/admin/auth/branch/update-branch?id=branch-uuid
Authorization: Bearer <token>
Content-Type: application/json

{
  "branch_name": "Updated Branch Name",
  "open_times": "07:00",
  "close_times": "22:00",
  "is_active": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Branch updated successfully",
  "data": {
    "id": "branch-uuid",
    "branch_name": "Updated Branch Name",
    "open_times": "07:00",
    "close_times": "22:00",
    "is_active": true
  }
}
```

**Delete Branch**
```http
DELETE /api/v1/admin/auth/branch/delete-branch?id=branch-uuid
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Branch deleted successfully",
  "data": {
    "id": "branch-uuid",
    "deleted": true
  }
}
```

**View Rooms in Branch**
```http
GET /api/v1/admin/auth/branch/view-rooms-in-branch?branchId=branch-uuid
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Branch/Rooms retrieved successfully",
  "data": {
    "id": "branch-uuid",
    "branch_name": "Downtown Branch",
    "rooms": [
      {
        "id": "room-uuid",
        "room_no": "101",
        "people_capacity": 10,
        "price_per_hour": 25.00,
        "is_available": true
      }
    ]
  }
}
```

---

### Room Management

**Create Room**
```http
POST /api/v1/admin/auth/room/create-room?branch_id=branch-uuid
Authorization: Bearer <token>
Content-Type: application/json

{
  "room_no": "201",
  "people_capacity": 15,
  "price_per_hour": 35.00,
  "is_available": true,
  "description": "Large conference room with projector"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Room created successfully",
  "data": {
    "id": "room-uuid",
    "room_no": "201",
    "people_capacity": 15,
    "price_per_hour": 35.00,
    "is_available": true,
    "branch_id": "branch-uuid"
  }
}
```

**Get All Rooms**
```http
GET /api/v1/admin/auth/room/get-all-rooms
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Rooms retrieved successfully",
  "data": [
    {
      "id": "room-uuid",
      "room_no": "101",
      "people_capacity": 10,
      "price_per_hour": 25.00,
      "is_available": true,
      "branch": {
        "branch_name": "Downtown Branch"
      }
    }
  ]
}
```

**Get Room by ID**
```http
GET /api/v1/admin/auth/room/get-by-id-room?id=room-uuid
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Room retrieved successfully",
  "data": {
    "id": "room-uuid",
    "room_no": "101",
    "people_capacity": 10,
    "price_per_hour": 25.00,
    "is_available": true,
    "description": "Spacious meeting room",
    "branch": {
      "id": "branch-uuid",
      "branch_name": "Downtown Branch"
    }
  }
}
```

**Update Room**
```http
PATCH /api/v1/admin/auth/room/update-room?id=room-uuid
Authorization: Bearer <token>
Content-Type: application/json

{
  "price_per_hour": 40.00,
  "people_capacity": 12,
  "is_available": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Room updated successfully",
  "data": {
    "id": "room-uuid",
    "price_per_hour": 40.00,
    "people_capacity": 12,
    "is_available": true
  }
}
```

**Delete Room**
```http
DELETE /api/v1/admin/auth/room/delete-room?id=room-uuid
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Room deleted successfully",
  "data": {
    "id": "room-uuid",
    "deleted": true
  }
}
```

---

## ⚠️ Error Handling

### Standard Error Response

```json
{
  "success": false,
  "message": "Error description",
  "statusCode": 400
}
```

### Common HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict (duplicate entry) |
| 429 | Too Many Requests (rate limited) |
| 500 | Internal Server Error |

### Common Error Messages

**Authentication Errors:**
```json
{
  "success": false,
  "message": "Invalid credentials",
  "statusCode": 401
}
```

**Validation Errors:**
```json
{
  "success": false,
  "message": "Missing required fields",
  "statusCode": 400
}
```

**Permission Errors:**
```json
{
  "success": false,
  "message": "Unauthorized access",
  "statusCode": 403
}
```

---

## 🚦 Rate Limiting

The API implements rate limiting on sensitive endpoints:

### Rate Limits

| Endpoint Type | Limit | Window |
|--------------|-------|--------|
| Auth (login) | 5 requests | 15 minutes |
| OTP verification | 3 requests | 15 minutes |
| Branch creation | 10 requests | 1 hour |
| General API | 100 requests | 15 minutes |

### Rate Limit Response

```json
{
  "success": false,
  "message": "Too many requests, please try again later",
  "statusCode": 429
}
```

---

## 📝 Request/Response Examples

### Complete Booking Flow

**1. Create Booking**
```http
POST /api/v1/user/auth/customer/booking
Authorization: Bearer eyJhbGc...
Content-Type: application/json

{
  "roomId": "550e8400-e29b-41d4-a716-446655440000",
  "startTime": "2025-12-01T10:00:00Z",
  "endTime": "2025-12-01T12:00:00Z"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Booking created successfully",
  "data": {
    "booking": {
      "id": "8f509172-e29b-41d4-a716-446655440001",
      "status": "pending",
      "total_price": 50.00,
      "start_time": "2025-12-01T10:00:00Z",
      "end_time": "2025-12-01T12:00:00Z"
    },
    "payment": {
      "transactionId": "BK8f509172-72838386",
      "qrImage": "data:image/png;base64,...",
      "amount": 50.00,
      "currency": "USD"
    }
  }
}
```

**2. User Pays via ABA Mobile App**
- User scans QR code
- Completes payment in ABA app

**3. Verify Payment**
```http
POST /api/v1/user/auth/customer/verify/BK8f509172-72838386
Authorization: Bearer eyJhbGc...
```

**Response:**
```json
{
  "success": true,
  "message": "Payment verified successfully",
  "data": {
    "paymentStatus": "completed",
    "bookingStatus": "confirmed",
    "apv": "519254",
    "transactionDate": "2025-12-01 10:05:30"
  }
}
```

**4. Check Booking Status**
```http
GET /api/v1/user/auth/customer/booking/my
Authorization: Bearer eyJhbGc...
```

**Response:**
```json
{
  "success": true,
  "count": 1,
  "data": [
    {
      "id": "8f509172-e29b-41d4-a716-446655440001",
      "status": "confirmed",
      "total_price": 50.00,
      "room": {
        "room_no": "101",
        "branch": {
          "branch_name": "Downtown Branch"
        }
      }
    }
  ]
}
```

---

## 🔒 Security Best Practices

### For Developers

1. **Always use HTTPS in production**
2. **Never commit tokens or sensitive data**
3. **Implement CORS properly**
4. **Use environment variables for sensitive config**
5. **Validate all inputs**
6. **Sanitize user data**
7. **Keep dependencies updated**

### For API Users

1. **Keep your JWT tokens secure**
2. **Don't share your tokens**
3. **Use token refresh instead of storing credentials**
4. **Logout when done**
5. **Monitor for suspicious activity**

---

## 📚 Additional Resources

- [Postman Collection](./postman_collection.json) (if available)
- [ABA PayWay Documentation](./ABA_PAYWAY_API_REFERENCE.md)
- [Payment Integration Guide](./PAYMENT_INTEGRATION_GUIDE.md)

---
