# Postman Setup Guide for NatJoub API

This guide helps you set up Postman to test the NatJoub API efficiently.

---

## 📦 Step 1: Create Environment

1. Open Postman
2. Click "Environments" in the left sidebar
3. Click "+" to create new environment
4. Name it: `NatJoub Local`

### Environment Variables

Add these variables:

| Variable | Initial Value | Current Value |
|----------|--------------|---------------|
| `base_url` | `http://localhost:3000/api/v1` | `http://localhost:3000/api/v1` |
| `user_token` | (leave empty) | (auto-filled after login) |
| `admin_token` | (leave empty) | (auto-filled after admin login) |
| `customer_id` | (leave empty) | (auto-filled) |
| `owner_id` | (leave empty) | (auto-filled) |
| `branch_id` | (leave empty) | (for testing) |
| `room_id` | (leave empty) | (for testing) |
| `booking_id` | (leave empty) | (for testing) |
| `transaction_id` | (leave empty) | (for testing) |

---

## 📂 Step 2: Create Collections

Create these collections in Postman:

### Collection 1: Authentication
- `POST` User Registration
- `POST` User Login (Step 1)
- `POST` User Verify OTP (Step 2)
- `POST` User Refresh Token
- `POST` User Logout
- `POST` SMS Login
- `POST` SMS Verify
- `POST` Admin Login
- `POST` Admin Verify OTP
- `POST` Admin Logout

### Collection 2: Customer
- `GET` Get Profile
- `POST` Create Booking
- `GET` Get My Bookings
- `DELETE` Cancel Booking
- `POST` Verify Payment
- `GET` Payment History
- `GET` Payment Status
- `POST` Toggle Favorite Room
- `GET` Get Favorite Rooms
- `GET` Filter Branches
- `GET` Filter Rooms
- `GET` Branch Details
- `GET` Rooms by Branch
- `GET` Branch Photos
- `GET` Room Details
- `GET` Room Occupied Times

### Collection 3: Owner
- `POST` Request Create Branch
- `POST` Upload Branch Photos
- `GET` Get All My Branches
- `GET` Get Rooms by Branch
- `PATCH` Update Branch
- `DELETE` Delete Branch
- `POST` Create Room
- `POST` Upload Room Photos
- `GET` Get All My Rooms
- `PATCH` Update Room
- `DELETE` Delete Room

### Collection 4: Admin
- `POST` Create User
- `GET` Get All Users
- `POST` Create Branch
- `GET` Get All Branches
- `GET` Get Branch by ID
- `PATCH` Update Branch
- `DELETE` Delete Branch
- `GET` View Rooms in Branch
- `POST` Create Room
- `GET` Get All Rooms
- `GET` Get Room by ID
- `PATCH` Update Room
- `DELETE` Delete Room

---

## 🔧 Step 3: Configure Requests

### Example 1: User Login (with auto token save)

**Request:**
```
Method: POST
URL: {{base_url}}/user/login
Headers:
  Content-Type: application/json
Body (raw JSON):
{
  "username": "johndoe",
  "password": "Pass123"
}
```

**Tests (to auto-save user ID):**
```javascript
if (pm.response.code === 200) {
    const response = pm.response.json();
    pm.environment.set("customer_id", response.data.userId);
}
```

### Example 2: User Verify OTP (with auto token save)

**Request:**
```
Method: POST
URL: {{base_url}}/user/verify
Headers:
  Content-Type: application/json
Body (raw JSON):
{
  "username": "johndoe",
  "otp": "123456"
}
```

**Tests (to auto-save token):**
```javascript
if (pm.response.code === 200) {
    const response = pm.response.json();
    pm.environment.set("user_token", response.data.token);
}
```

### Example 3: Create Booking (with auto-save IDs)

**Request:**
```
Method: POST
URL: {{base_url}}/user/auth/customer/booking
Headers:
  Authorization: Bearer {{user_token}}
  Content-Type: application/json
Body (raw JSON):
{
  "roomId": "{{room_id}}",
  "startTime": "2025-12-01T10:00:00Z",
  "endTime": "2025-12-01T12:00:00Z"
}
```

**Tests (to auto-save booking and transaction IDs):**
```javascript
if (pm.response.code === 201) {
    const response = pm.response.json();
    pm.environment.set("booking_id", response.data.booking.id);
    pm.environment.set("transaction_id", response.data.payment.transactionId);
}
```

### Example 4: Verify Payment

**Request:**
```
Method: POST
URL: {{base_url}}/user/auth/customer/verify/{{transaction_id}}
Headers:
  Authorization: Bearer {{user_token}}
```

**Tests (to check status):**
```javascript
pm.test("Payment verified successfully", function () {
    const response = pm.response.json();
    pm.expect(response.success).to.be.true;
    pm.expect(response.data.paymentStatus).to.be.oneOf(["completed", "pending"]);
});
```

### Example 5: Admin Create User

**Request:**
```
Method: POST
URL: {{base_url}}/admin/auth/create-user
Headers:
  Authorization: Bearer {{admin_token}}
  Content-Type: application/json
Body (raw JSON):
{
  "first_name": "Jane",
  "last_name": "Smith",
  "username": "janesmith",
  "email": "jane@example.com",
  "password": "Pass123",
  "role": "owner"
}
```

**Tests:**
```javascript
pm.test("User created successfully", function () {
    pm.response.to.have.status(201);
    const response = pm.response.json();
    pm.expect(response.success).to.be.true;
    pm.expect(response.data).to.have.property("id");
});
```

---

## 🧪 Step 4: Common Test Scripts

### Auto-Save Token from Login
```javascript
if (pm.response.code === 200) {
    const response = pm.response.json();
    if (response.data && response.data.token) {
        pm.environment.set("user_token", response.data.token);
        console.log("Token saved:", response.data.token);
    }
}
```

### Check Success Response
```javascript
pm.test("Request successful", function () {
    const response = pm.response.json();
    pm.expect(response.success).to.be.true;
    pm.expect(response.message).to.exist;
});
```

### Check Error Response
```javascript
pm.test("Handle error gracefully", function () {
    if (pm.response.code >= 400) {
        const response = pm.response.json();
        pm.expect(response.success).to.be.false;
        pm.expect(response.message).to.exist;
    }
});
```

### Log Response Time
```javascript
pm.test("Response time is acceptable", function () {
    pm.expect(pm.response.responseTime).to.be.below(2000);
    console.log("Response time:", pm.response.responseTime, "ms");
});
```

---

## 🔄 Step 5: Create Request Workflows

### Workflow 1: Complete Customer Journey

1. **Register User** → Saves `customer_id`
2. **Verify Registration OTP** → Confirms account
3. **Login** → Saves `customer_id`
4. **Verify Login OTP** → Saves `user_token`
5. **Browse Branches** → Uses `user_token`
6. **View Room Details** → Get `room_id`
7. **Create Booking** → Saves `booking_id`, `transaction_id`
8. *[User pays in ABA app]*
9. **Verify Payment** → Confirms booking
10. **Get My Bookings** → Verify status is "confirmed"

### Workflow 2: Owner Setup

1. **Admin Login** → Saves `admin_token`
2. **Admin Verify OTP** → Confirms admin
3. **Create Owner User** → Create owner account
4. **User Login as Owner** → Get owner token
5. **Create Branch** → Saves `branch_id`
6. **Upload Branch Photos** → Add images
7. **Create Room** → Saves `room_id`
8. **Upload Room Photos** → Add room images

### Workflow 3: Admin Management

1. **Admin Login** → Get admin token
2. **Get All Users** → View all users
3. **Get All Branches** → View all branches
4. **Get All Rooms** → View all rooms
5. **Update Branch** → Modify branch
6. **Delete Room** → Remove room

---

## 📋 Step 6: Pre-request Scripts

### Auto-Include Auth Header

Add this to collection-level pre-request script:

```javascript
// For user endpoints
if (pm.request.url.toString().includes("/user/auth/")) {
    const token = pm.environment.get("user_token");
    if (token) {
        pm.request.headers.add({
            key: "Authorization",
            value: "Bearer " + token
        });
    }
}

// For admin endpoints
if (pm.request.url.toString().includes("/admin/auth/")) {
    const token = pm.environment.get("admin_token");
    if (token) {
        pm.request.headers.add({
            key: "Authorization",
            value: "Bearer " + token
        });
    }
}
```

### Generate Dynamic Timestamps

```javascript
// For booking dates
const now = new Date();
const tomorrow = new Date(now);
tomorrow.setDate(tomorrow.getDate() + 1);

pm.environment.set("start_time", tomorrow.toISOString());

const endTime = new Date(tomorrow);
endTime.setHours(endTime.getHours() + 2);
pm.environment.set("end_time", endTime.toISOString());
```

---

## 🎨 Step 7: Organize Collections

### Folder Structure

```
📁 NatJoub API
  📁 01 - Authentication
    📁 User Auth
    📁 SMS Auth
    📁 Admin Auth
  📁 02 - Customer
    📁 Profile
    📁 Bookings & Payments
    📁 Favorites
    📁 Browse & Filter
  📁 03 - Owner
    📁 Branch Management
    📁 Room Management
  📁 04 - Admin
    📁 User Management
    📁 Branch Management
    📁 Room Management
```

---

## 🚀 Step 8: Quick Start Checklist

- [ ] Create environment with variables
- [ ] Set `base_url` to `http://localhost:3000/api/v1`
- [ ] Import/create authentication requests
- [ ] Add test scripts to save tokens automatically
- [ ] Test user registration flow
- [ ] Test user login flow (2-step OTP)
- [ ] Test customer booking creation
- [ ] Test payment verification (after ABA payment)
- [ ] Test owner branch/room creation
- [ ] Test admin user management
- [ ] Save collection for reuse

---

## 💡 Pro Tips

### 1. Use Collection Runner for Testing
- Select a folder
- Click "Run" to execute all requests in sequence
- Great for testing complete workflows

### 2. Share Collections
- Export collection as JSON
- Share with team members
- Keep in version control

### 3. Use Environment for Different Stages
- `NatJoub Local` (localhost:3000)
- `NatJoub Staging` (staging.natjoub.com)
- `NatJoub Production` (api.natjoub.com)

### 4. Monitor API
- Use Postman Monitors to run tests periodically
- Get alerts if API is down or slow

### 5. Documentation
- Use Postman's built-in documentation feature
- Generate and publish API docs from collections

---

## 🐛 Troubleshooting

### Token Not Saved
- Check test script is in "Tests" tab
- Verify environment is selected
- Check response structure matches script

### 401 Unauthorized
- Verify token is saved in environment
- Check token hasn't expired (refresh if needed)
- Ensure Authorization header is set

### 404 Not Found
- Check endpoint URL is correct
- Verify base_url doesn't have trailing slash
- Check route path matches documentation

### 400 Bad Request
- Validate request body structure
- Check required fields are present
- Verify data types match API expectations

---

For complete API reference, see [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)