# NatJoub API Quick Reference

## 📍 Base URLs

```
Public User:     http://localhost:3000/api/v1/user
Private User:    http://localhost:3000/api/v1/user/auth
Customer:        http://localhost:3000/api/v1/user/auth/customer
Owner:           http://localhost:3000/api/v1/user/auth/owner
Public Admin:    http://localhost:3000/api/v1/admin
Private Admin:   http://localhost:3000/api/v1/admin/auth
```

---

## 🔐 Authentication Endpoints

### User Authentication (Email + OTP)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/user/register` | Register new user |
| POST | `/api/v1/user/verify-registration-otp` | Verify registration OTP |
| POST | `/api/v1/user/resend-registration-otp` | Resend registration OTP |
| POST | `/api/v1/user/login` | Initiate login (send OTP) |
| POST | `/api/v1/user/verify` | Verify OTP & get token |
| POST | `/api/v1/user/refresh-token` | Refresh JWT token |
| POST | `/api/v1/user/auth/logout` | Logout (invalidate token) |

### SMS Authentication (Alternative)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/user/sms-login` | Initiate SMS login |
| POST | `/api/v1/user/sms-verify` | Verify SMS OTP |
| POST | `/api/v1/user/sms-refresh-token` | Refresh token (SMS auth) |

### Admin Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/admin/login` | Initiate admin login |
| POST | `/api/v1/admin/verify` | Verify admin OTP |
| POST | `/api/v1/admin/refresh-token` | Refresh admin token |
| POST | `/api/v1/admin/auth/logout` | Admin logout |

---

## 👤 Customer Endpoints

**Base:** `/api/v1/user/auth/customer`

### Profile
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/profile` | Get user profile |

### Bookings & Payments
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/booking` | Create booking (auto-generates payment QR) |
| GET | `/booking/my` | Get my bookings |
| DELETE | `/booking/:id` | Cancel booking |
| POST | `/verify/:transactionId` | Verify payment status |
| GET | `/history/:bookingId` | Get payment history |
| GET | `/status/:transactionId` | Get payment status |
| GET | `/room/occupied-times` | Get occupied time slots |

### Favorites
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/favorite-room` | Toggle favorite room |
| GET | `/get-favorite-rooms` | Get all favorite rooms |

### Browse & Filter
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/filter-branches` | Filter/search branches |
| GET | `/filter-rooms` | Filter/search rooms |
| GET | `/branch/details` | Get branch details |
| GET | `/branch/room/get-rooms-by-branch` | Get rooms in branch |
| GET | `/branch/photo` | Get branch photos |
| GET | `/room/details` | Get room details |

---

## 🏢 Owner Endpoints

**Base:** `/api/v1/user/auth/owner`

### Branch Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/request-create-branch` | Create new branch |
| POST | `/upload/branch-image` | Upload branch photos (max 10) |
| GET | `/branch/get-all-branches` | Get all my branches |
| GET | `/branch/get-all-room-by-branch` | Get rooms in my branch |
| PATCH | `/branch/update-branch` | Update branch |
| DELETE | `/branch/delete-branch` | Delete branch |
| GET | `/branch/photo` | Get branch photos |

### Room Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/request-create-room` | Create room in branch |
| POST | `/upload/room-image` | Upload room photos (max 10) |
| GET | `/room/get-all-rooms` | Get all my rooms |
| PATCH | `/room/update-room` | Update room |
| DELETE | `/room/delete-room` | Delete room |

---

## 👨‍💼 Admin Endpoints

**Base:** `/api/v1/admin/auth`

### User Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/create-user` | Create new user |
| GET | `/get-all-users` | Get all users |

### Branch Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/branch/create-branch` | Create branch |
| GET | `/branch/get-all-branches` | Get all branches |
| GET | `/branch/get-by-id-branch` | Get branch by ID |
| PATCH | `/branch/update-branch` | Update branch |
| DELETE | `/branch/delete-branch` | Delete branch |
| GET | `/branch/view-rooms-in-branch` | View rooms in branch |

### Room Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/room/create-room` | Create room |
| GET | `/room/get-all-rooms` | Get all rooms |
| GET | `/room/get-by-id-room` | Get room by ID |
| PATCH | `/room/update-room` | Update room |
| DELETE | `/room/delete-room` | Delete room |

---

## 🌍 Public Endpoints

**Base:** `/api/v1/user`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/booking/room/:roomId/availability` | Check room availability (public) |

---

## 💳 Payment Flow Quick Guide

### 1. Create Booking
```bash
POST /api/v1/user/auth/customer/booking
{
  "roomId": "uuid",
  "startTime": "2025-12-01T10:00:00Z",
  "endTime": "2025-12-01T12:00:00Z"
}

# Returns QR code + transaction ID
```

### 2. User Pays
```
- Customer scans QR code
- Opens ABA Mobile app  
- Completes payment
```

### 3. Verify Payment
```bash
POST /api/v1/user/auth/customer/verify/:transactionId

# If payment successful:
# - Booking status → "confirmed"
# - Payment status → "completed"
```

---

## 📝 Common Query Parameters

### Filtering
- `city` - Filter by city name
- `minPrice` - Minimum price per hour
- `maxPrice` - Maximum price per hour
- `work_days` - Filter by working days
- `peopleCapacity` - Minimum people capacity

### Pagination
- `limit` - Maximum results to return
- `offset` - Number of results to skip

### Bookings
- `status` - Filter by status (pending, confirmed, cancelled)
- `date` - Filter by date (YYYY-MM-DD)
- `roomId` - Filter by room
- `branchId` - Filter by branch

---

## 🔑 Authentication Headers

All protected routes require:

```http
Authorization: Bearer <your_jwt_token>
```

---

## 📤 File Upload Format

For photo uploads:

```http
Content-Type: multipart/form-data

photos: [file1, file2, ...] // Max 10 files
```

**Supported formats:** JPG, JPEG, PNG  
**Max file size:** 10MB per file

---

## ⚡ Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "statusCode": 400
}
```

---

## 🚦 HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized (invalid/missing token) |
| 403 | Forbidden (wrong role) |
| 404 | Not Found |
| 409 | Conflict (duplicate entry) |
| 429 | Too Many Requests (rate limited) |
| 500 | Internal Server Error |

---

## 🔒 Rate Limits

| Endpoint Type | Limit | Window |
|--------------|-------|--------|
| Login | 5 requests | 15 minutes |
| OTP verification | 3 requests | 15 minutes |
| Branch creation | 10 requests | 1 hour |
| General API | 100 requests | 15 minutes |

---

## 🧪 Testing with curl

### Login Flow
```bash
# Step 1: Initiate login
curl -X POST http://localhost:3000/api/v1/user/login \
  -H "Content-Type: application/json" \
  -d '{"username":"john_doe","password":"password123"}'

# Step 2: Verify OTP (check your email)
curl -X POST http://localhost:3000/api/v1/user/verify \
  -H "Content-Type: application/json" \
  -d '{"username":"john_doe","otp":"123456"}'

# Returns: { "token": "jwt_token_here" }
```

### Create Booking
```bash
curl -X POST http://localhost:3000/api/v1/user/auth/customer/booking \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "roomId": "uuid",
    "startTime": "2025-12-01T10:00:00Z",
    "endTime": "2025-12-01T12:00:00Z"
  }'
```

### Upload Photos
```bash
curl -X POST "http://localhost:3000/api/v1/user/auth/owner/upload/branch-image?id=uuid" \
  -H "Authorization: Bearer <token>" \
  -F "photos=@photo1.jpg" \
  -F "photos=@photo2.jpg"
```

---

