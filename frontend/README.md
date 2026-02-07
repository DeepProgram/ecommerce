# Frontend - Next.js Application

## Overview

Modern Next.js 14 application with:
- ✅ TypeScript
- ✅ Tailwind CSS with custom design system
- ✅ JWT authentication with auto token refresh
- ✅ Axios interceptor
- ✅ Zustand state management
- ✅ Mobile-first responsive design

## Quick Start

### With Docker (Recommended)

```bash
docker compose up frontend
```

Access at: http://localhost:3000

### Local Development

```bash
cd frontend
npm install
npm run dev
```

## Features Implemented

### Authentication System ✅
- JWT token management
- Automatic token refresh via interceptor
- Login/Register pages
- Logout functionality
- Protected routes
- Auth state persistence

### Token Refresh Interceptor ✅
The axios interceptor (`src/lib/api.ts`) automatically:
1. Adds Bearer token to all requests
2. Detects 401 errors
3. Refreshes access token using refresh token
4. Retries failed request with new token
5. Handles multiple simultaneous refresh requests
6. Redirects to login if refresh fails

### Design System ✅
Based on provided UI kit:
- Colors: Brand, Gray scale, Semantic
- Typography: Inter font with defined scale
- Spacing: 8pt system
- Components: Buttons, Inputs, Cards
- Mobile-first responsive

## Project Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Root layout
│   │   ├── page.tsx            # Home page
│   │   ├── login/
│   │   │   └── page.tsx        # Login page
│   │   ├── register/
│   │   │   └── page.tsx        # Register page
│   │   └── globals.css         # Global styles
│   ├── components/
│   │   └── Header.tsx          # Header component
│   ├── lib/
│   │   └── api.ts              # Axios with interceptor
│   ├── services/
│   │   ├── authService.ts      # Auth API calls
│   │   ├── catalogService.ts   # Product API calls
│   │   └── cartService.ts      # Cart/Order API calls
│   └── store/
│       └── authStore.ts        # Auth state management
├── tailwind.config.ts          # Design system config
├── package.json
└── Dockerfile
```

## API Integration

### Backend Proxy
Next.js proxies API requests to Django backend:
```
/api/* → http://backend:8000/api/*
```

Configured in `next.config.mjs`

### Services Created

**authService.ts**
- register()
- login()
- logout()
- getProfile()
- updateProfile()
- changePassword()

**catalogService.ts**
- getCategories()
- getProducts()
- getProduct(slug)
- searchProducts(query)

**cartService.ts**
- getCart()
- addToCart()
- updateCartItem()
- removeCartItem()

**orderService**
- createOrder()
- getOrders()
- getOrder(orderNumber)

## Authentication Flow

### 1. User Logs In
```typescript
const response = await authService.login({ email, password });
// Returns: { access, refresh }

const profile = await authService.getProfile();
// Returns user data

setAuth(profile, response.access, response.refresh);
// Stores in Zustand + localStorage
```

### 2. Making Authenticated Requests
```typescript
import api from '@/lib/api';

// Token automatically added to headers
const cart = await api.get('/api/orders/cart/');
```

### 3. Token Expires (After 60 min)
```
Request → 401 Error
  ↓
Interceptor catches error
  ↓
Calls /api/users/token/refresh/
  ↓
Gets new access token
  ↓
Retries original request
  ↓
Success!
```

### 4. Refresh Token Expires (After 7 days)
```
Refresh fails → Redirect to /login
```

## Components

### Header
- Logo
- Search bar (desktop center, mobile below)
- Cart icon with badge
- User menu (logged in) or Login button
- Responsive layout

### Buttons
- `btn-primary` - Main CTA
- `btn-secondary` - Secondary action
- Hover states and disabled styles

### Input Fields
- `input-field` - Consistent styling
- Focus ring with brand color
- Rounded pill shape

### Cards
- `card` - Base card style
- `product-card` - Product-specific with hover

## Design Tokens (Tailwind)

### Colors
```typescript
brand: { 50, 600, 700 }
gray: { 900, 700, 500, 300, 200, 100 }
success, warning, danger, rating
```

### Typography
```typescript
text-display, text-h1, text-h2
text-body, text-body-sm, text-caption
text-button
```

### Spacing
```typescript
8, 12, 16, 20, 24, 32, 40, 48 (in px)
```

### Radius
```typescript
rounded-sm (8px)
rounded-md (12px)
rounded-lg (16px)
rounded-xl (20px)
rounded-pill (24px)
```

## State Management

### Auth Store (Zustand)
```typescript
{
  user: User | null,
  accessToken: string | null,
  refreshToken: string | null,
  isAuthenticated: boolean,
  setAuth: (user, access, refresh) => void,
  clearAuth: () => void,
}
```

Persisted to localStorage automatically.

## Environment Variables

Create `.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost
```

## Development

### Install dependencies
```bash
npm install
```

### Run dev server
```bash
npm run dev
```

### Build for production
```bash
npm run build
npm start
```

## Next Steps (To Implement)

- [ ] Product listing page
- [ ] Product detail page
- [ ] Cart page
- [ ] Checkout flow
- [ ] Profile page
- [ ] Order history
- [ ] Search functionality
- [ ] Category pages
- [ ] Loading skeletons
- [ ] Error boundaries
- [ ] Toast notifications

## Testing Authentication

### 1. Start frontend
```bash
docker compose up frontend
```

### 2. Register a user
Go to: http://localhost:3000/register

### 3. Login
Go to: http://localhost:3000/login

### 4. Check token refresh
- Wait 60 minutes (or modify token lifetime)
- Make an API call
- Interceptor should refresh automatically
- Check browser Network tab

## Production Considerations

- Set proper NEXT_PUBLIC_API_URL
- Enable HTTPS
- Configure CORS on backend
- Add error monitoring (Sentry)
- Add analytics
- Optimize images
- Enable caching
- Add CDN

## Summary

✅ Next.js 14 with App Router
✅ TypeScript
✅ Tailwind with custom design system
✅ JWT authentication
✅ **Automatic token refresh interceptor**
✅ Login/Register pages
✅ Auth state management
✅ API service layer
✅ Mobile-first responsive design
✅ Docker integration

Frontend foundation is complete! 🎉
