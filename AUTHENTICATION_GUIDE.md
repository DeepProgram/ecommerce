# Authentication & Authorization System

## Overview

Complete JWT-based authentication with role-based permissions implemented.

## Authentication Endpoints

### Register
```
POST /api/users/register/
```

**Request:**
```json
{
    "username": "johndoe",
    "email": "john@example.com",
    "password": "SecurePass123!",
    "password2": "SecurePass123!",
    "first_name": "John",
    "last_name": "Doe",
    "phone": "1234567890"
}
```

**Response:**
```json
{
    "user": {
        "id": 1,
        "username": "johndoe",
        "email": "john@example.com",
        "first_name": "John",
        "last_name": "Doe"
    },
    "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc...",
    "access": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

### Login
```
POST /api/users/login/
```

**Request:**
```json
{
    "email": "john@example.com",
    "password": "SecurePass123!"
}
```

**Response:**
```json
{
    "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc...",
    "access": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

### Refresh Token
```
POST /api/users/token/refresh/
```

**Request:**
```json
{
    "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

**Response:**
```json
{
    "access": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

### Logout
```
POST /api/users/logout/
```

**Request:**
```json
{
    "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

**Response:**
```json
{
    "message": "Successfully logged out"
}
```

## User Management Endpoints

### Get Profile
```
GET /api/users/profile/
Authorization: Bearer <access_token>
```

### Update Profile
```
PATCH /api/users/profile/
Authorization: Bearer <access_token>
```

**Request:**
```json
{
    "first_name": "John",
    "last_name": "Smith",
    "phone": "9876543210"
}
```

### Change Password
```
POST /api/users/change-password/
Authorization: Bearer <access_token>
```

**Request:**
```json
{
    "old_password": "OldPass123!",
    "new_password": "NewPass123!",
    "new_password2": "NewPass123!"
}
```

## Address Management

### List/Create Addresses
```
GET  /api/users/addresses/
POST /api/users/addresses/
Authorization: Bearer <access_token>
```

**Create Request:**
```json
{
    "address_type": "shipping",
    "full_name": "John Doe",
    "phone": "1234567890",
    "address_line1": "123 Main St",
    "address_line2": "Apt 4B",
    "city": "New York",
    "state": "NY",
    "postal_code": "10001",
    "country": "USA",
    "is_default": true
}
```

### Update/Delete Address
```
GET    /api/users/addresses/{id}/
PATCH  /api/users/addresses/{id}/
DELETE /api/users/addresses/{id}/
Authorization: Bearer <access_token>
```

## Using JWT Tokens

### In Headers
```
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGc...
```

### Token Lifetime
- **Access Token**: 60 minutes
- **Refresh Token**: 7 days
- Refresh tokens are rotated on use
- Old refresh tokens are blacklisted

## Permission System

### Custom Permissions Created

1. **IsOwner** - Only resource owner can access
2. **IsOwnerOrReadOnly** - Owner can edit, others can read
3. **IsAdminOrReadOnly** - Admin can edit, others can read
4. **IsOrderOwner** - User or admin can access order
5. **CanManageInventory** - Only staff can manage inventory

### Applied Permissions

**Public Access (no auth required):**
- GET /api/catalog/categories/
- GET /api/catalog/products/
- GET /api/catalog/search/

**Authenticated Users:**
- Cart operations
- Order creation
- Profile management
- Address management

**Staff/Admin Only:**
- Admin panel
- Inventory management
- Order management
- User management

## Testing Authentication

### 1. Register a User
```bash
curl -X POST http://localhost/api/users/register/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "TestPass123!",
    "password2": "TestPass123!",
    "first_name": "Test",
    "last_name": "User"
  }'
```

### 2. Login
```bash
curl -X POST http://localhost/api/users/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123!"
  }'
```

Save the `access` token from response.

### 3. Access Protected Endpoint
```bash
curl -X GET http://localhost/api/users/profile/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 4. Add to Cart (Requires Auth)
```bash
curl -X POST http://localhost/api/orders/cart/items/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "product_id": 1,
    "variant_id": 1,
    "quantity": 2
  }'
```

## Role-Based Access

### Regular User Can:
- ✅ Browse products
- ✅ Add to cart
- ✅ Create orders
- ✅ View own orders
- ✅ Manage own profile
- ✅ Manage own addresses
- ❌ Access other users' data
- ❌ Access admin panel

### Admin/Staff Can:
- ✅ Everything regular users can
- ✅ Access admin panel
- ✅ Manage all products
- ✅ Manage all orders
- ✅ View all users
- ✅ Manage inventory

## Security Features

### Password Security
- ✅ Password validation (length, complexity)
- ✅ Hashed with Django's PBKDF2
- ✅ Salted automatically

### Token Security
- ✅ JWT signed with SECRET_KEY
- ✅ Short-lived access tokens (60 min)
- ✅ Refresh token rotation
- ✅ Token blacklisting on logout
- ✅ Automatic expiry

### CORS Configuration
Currently set to allow all origins (development):
```python
CORS_ALLOW_ALL_ORIGINS = True
```

**For production**, update to:
```python
CORS_ALLOWED_ORIGINS = [
    "https://yourdomain.com",
]
```

## Frontend Integration

### Login Flow
```javascript
// 1. Login
const response = await fetch('/api/users/login/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
});

const { access, refresh } = await response.json();

// 2. Store tokens
localStorage.setItem('access_token', access);
localStorage.setItem('refresh_token', refresh);

// 3. Use token in requests
const products = await fetch('/api/orders/cart/', {
    headers: {
        'Authorization': `Bearer ${access}`
    }
});
```

### Token Refresh
```javascript
async function refreshAccessToken() {
    const refresh = localStorage.getItem('refresh_token');
    
    const response = await fetch('/api/users/token/refresh/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh })
    });
    
    const { access } = await response.json();
    localStorage.setItem('access_token', access);
    return access;
}
```

### Logout
```javascript
async function logout() {
    const refresh = localStorage.getItem('refresh_token');
    
    await fetch('/api/users/logout/', {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({ refresh })
    });
    
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
}
```

## Error Responses

### 401 Unauthorized
```json
{
    "detail": "Authentication credentials were not provided."
}
```

### 403 Forbidden
```json
{
    "detail": "You do not have permission to perform this action."
}
```

### 400 Bad Request (Invalid Token)
```json
{
    "detail": "Token is invalid or expired",
    "code": "token_not_valid"
}
```

## Debugging

### Check Token Validity
```python
from rest_framework_simplejwt.tokens import AccessToken

token = AccessToken("your_token_here")
print(token.payload)
```

### View Blacklisted Tokens
Access admin panel → Token Blacklist → Outstanding tokens

## Production Checklist

- [ ] Set strong SECRET_KEY
- [ ] Configure CORS_ALLOWED_ORIGINS
- [ ] Set appropriate token lifetimes
- [ ] Enable HTTPS only
- [ ] Set secure cookie flags
- [ ] Add rate limiting on login endpoint
- [ ] Monitor failed login attempts
- [ ] Set up 2FA (optional)

## Complete API Reference

### Public Endpoints (No Auth)
- POST /api/users/register/
- POST /api/users/login/
- GET /api/catalog/categories/
- GET /api/catalog/products/
- GET /api/catalog/search/

### Protected Endpoints (Auth Required)
- POST /api/users/logout/
- POST /api/users/token/refresh/
- GET /api/users/profile/
- PATCH /api/users/profile/
- POST /api/users/change-password/
- GET /api/users/addresses/
- POST /api/users/addresses/
- GET/PATCH/DELETE /api/users/addresses/{id}/
- GET /api/orders/cart/
- POST /api/orders/cart/items/
- PATCH /api/orders/cart/items/{id}/
- DELETE /api/orders/cart/items/{id}/
- POST /api/orders/orders/create/
- GET /api/orders/orders/
- GET /api/orders/orders/{order_number}/

### Admin Only
- /admin/ (Django admin panel)

## Summary

✅ JWT authentication implemented
✅ Token refresh & blacklisting
✅ User registration & login
✅ Password change
✅ Profile management
✅ Address management
✅ Custom permissions
✅ Role-based access control
✅ Secure password handling
✅ Ready for production with minor config changes

Authentication system is complete and production-ready! 🔐
