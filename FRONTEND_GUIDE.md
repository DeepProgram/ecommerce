# Frontend Setup & Development Guide

## Overview

Next.js 14 application with complete authentication system, automatic JWT token refresh, and mobile-first design system.

## What's Implemented ✅

### 1. Authentication System
- ✅ JWT token authentication
- ✅ **Automatic token refresh interceptor**
- ✅ Login page
- ✅ Register page
- ✅ Logout functionality
- ✅ Auth state management (Zustand)
- ✅ Token persistence in localStorage

### 2. Token Refresh Mechanism
The axios interceptor (`src/lib/api.ts`) handles token refresh automatically:

**How it works:**
1. User makes API request with expired access token
2. Backend returns 401 Unauthorized
3. Interceptor catches the error
4. Calls `/api/users/token/refresh/` with refresh token
5. Receives new access token
6. Updates localStorage
7. Retries the original failed request
8. User never notices the token expired!

**Queue Management:**
- If multiple requests fail simultaneously, only ONE refresh is triggered
- Other requests wait in a queue
- After refresh succeeds, all queued requests retry with new token

**Failure Handling:**
- If refresh token is also expired/invalid
- Clear all tokens
- Redirect to login page
- User must log in again

### 3. Design System (Tailwind Config)
Based on your UI kit specification:

**Colors:**
- Brand: `#2F6FED` (primary), `#255BE0` (hover)
- Gray scale: 900, 700, 500, 300, 200, 100
- Semantic: success, warning, danger
- Rating: `#F5B301`

**Typography:**
- Display: 28px/34px Semibold
- H1: 22px/28px Semibold
- H2: 18px/24px Semibold
- Body: 15px/22px Regular
- Body Small: 13px/18px Regular
- Caption: 12px/16px Regular
- Button: 15px/20px Semibold

**Spacing (8pt system):**
- 8, 12, 16, 20, 24, 32, 40, 48px

**Border Radius:**
- sm: 8px, md: 12px, lg: 16px, xl: 20px, pill: 24px

**Breakpoints:**
- xs: 0-479px
- sm: 480-767px
- md: 768-1023px
- lg: 1024-1279px
- xl: 1280px+

### 4. Components Created
- ✅ Header (sticky, responsive)
- ✅ Skeleton loaders (products, pages, cart)
- ✅ Button variants (primary, secondary)
- ✅ Input fields with focus states

### 5. Services Layer
- ✅ authService (register, login, logout, profile)
- ✅ catalogService (products, categories, search)
- ✅ cartService (cart CRUD)
- ✅ orderService (create order, get orders)

### 6. State Management
- ✅ Zustand store for auth state
- ✅ User data persistence
- ✅ Token management

## Installation

### With Docker (Recommended)

```bash
docker compose up frontend
```

Frontend will be available at: http://localhost:3000

### Local Development

```bash
cd frontend
npm install
npm run dev
```

## Environment Variables

Create `frontend/.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost
```

For production, change to your actual API domain.

## Project Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Root layout with Header
│   │   ├── page.tsx                # Home page
│   │   ├── login/page.tsx          # Login form
│   │   ├── register/page.tsx       # Registration form
│   │   └── globals.css             # Tailwind & custom styles
│   │
│   ├── components/
│   │   ├── Header.tsx              # Top navigation
│   │   └── Skeletons.tsx           # Loading states
│   │
│   ├── lib/
│   │   └── api.ts                  # Axios + Token Refresh Interceptor
│   │
│   ├── services/
│   │   ├── authService.ts          # Auth API calls
│   │   ├── catalogService.ts       # Products API
│   │   └── cartService.ts          # Cart & Orders API
│   │
│   └── store/
│       └── authStore.ts            # Zustand auth state
│
├── tailwind.config.ts              # Design system tokens
├── tsconfig.json                   # TypeScript config
├── next.config.mjs                 # Next.js config + API proxy
├── package.json
└── Dockerfile
```

## API Proxy Configuration

Next.js proxies `/api/*` requests to Django backend:

```javascript
// next.config.mjs
async rewrites() {
  return [
    {
      source: '/api/:path*',
      destination: 'http://backend:8000/api/:path*',
    },
  ];
}
```

This hides the Django API URL from the frontend (BFF pattern).

## Authentication Flow

### Registration

```typescript
// User fills form on /register
const formData = {
  username: 'john',
  email: 'john@example.com',
  password: 'securePass123',
  password2: 'securePass123',
  first_name: 'John',
  last_name: 'Doe',
};

// Call auth service
const response = await authService.register(formData);

// Response includes:
// - user object
// - access token (60 min lifetime)
// - refresh token (7 day lifetime)

// Store in Zustand + localStorage
setAuth(response.user, response.access, response.refresh);

// Redirect to home
router.push('/');
```

### Login

```typescript
// User fills form on /login
const loginData = {
  email: 'john@example.com',
  password: 'securePass123',
};

// Call auth service
const response = await authService.login(loginData);
const profile = await authService.getProfile();

// Store tokens
setAuth(profile, response.access, response.refresh);

// Redirect
router.push('/');
```

### Making Authenticated Requests

```typescript
import api from '@/lib/api';

// Token is automatically added to headers
const cart = await api.get('/api/orders/cart/');
const profile = await api.get('/api/users/profile/');
```

### Token Refresh (Automatic)

```
User Request (with expired access token)
  ↓
Backend returns 401
  ↓
Interceptor catches error
  ↓
Check if already refreshing?
  ├─ YES → Add to queue
  └─ NO  → Trigger refresh
    ↓
POST /api/users/token/refresh/ { refresh: "..." }
  ↓
Receive new access token
  ↓
Update localStorage
  ↓
Retry original request with new token
  ↓
Process all queued requests
  ↓
Success! User never noticed
```

### Logout

```typescript
const refreshToken = localStorage.getItem('refresh_token');

// Call backend to blacklist token
await authService.logout(refreshToken);

// Clear local state
clearAuth();

// Redirect
router.push('/');
```

## Using the Design System

### Buttons

```tsx
<button className="btn-primary">
  Add to Cart
</button>

<button className="btn-secondary">
  Cancel
</button>
```

### Input Fields

```tsx
<input
  type="text"
  className="input-field"
  placeholder="Search..."
/>
```

### Cards

```tsx
<div className="card p-24">
  <h2 className="text-h2 mb-16">Product Name</h2>
  <p className="text-body text-gray-700">Description</p>
</div>
```

### Typography

```tsx
<h1 className="text-display">Large Heading</h1>
<h2 className="text-h1">Page Title</h2>
<h3 className="text-h2">Section Title</h3>
<p className="text-body">Body text</p>
<p className="text-body-sm">Small text</p>
<p className="text-caption">Caption text</p>
```

### Spacing

```tsx
<div className="mb-24">  {/* 24px margin bottom */}
<div className="px-16">  {/* 16px padding horizontal */}
<div className="gap-32"> {/* 32px gap in flex/grid */}
```

### Colors

```tsx
<div className="bg-brand-600 text-white">
<div className="text-gray-700 border-gray-300">
<div className="text-success">Success message</div>
<div className="text-danger">Error message</div>
```

## Skeleton Loaders

```tsx
import { ProductListSkeleton, ProductDetailSkeleton } from '@/components/Skeletons';

// Show while loading products
{loading ? <ProductListSkeleton count={8} /> : <ProductGrid products={products} />}

// Show while loading product detail
{loading ? <ProductDetailSkeleton /> : <ProductDetail product={product} />}
```

## Testing the Auth System

### 1. Start services
```bash
docker compose up
```

### 2. Open frontend
```
http://localhost:3000
```

### 3. Register a new user
- Go to: http://localhost:3000/register
- Fill the form
- Submit
- You should be logged in and redirected to home

### 4. Check tokens in browser
- Open DevTools → Application → Local Storage
- You should see:
  - `access_token`
  - `refresh_token`

### 5. Test token refresh
Method 1: Wait 60 minutes
- Access token expires after 60 min
- Make any API call
- Interceptor should refresh automatically

Method 2: Manual test
- Delete `access_token` from localStorage (keep `refresh_token`)
- Make an API call
- Interceptor should detect 401 and refresh

Method 3: Check network tab
- DevTools → Network tab
- Make authenticated API call
- If you see two calls (one 401, then retry with 200), refresh worked!

### 6. Test logout
- Click logout in header
- Tokens should be cleared
- Redirected to home
- Header should show "Login" button

## Development Workflow

### 1. Create a new page

```bash
# Create file
touch frontend/src/app/products/page.tsx
```

```tsx
export default function ProductsPage() {
  return (
    <div className="container-padding py-24">
      <h1 className="text-h1 mb-24">Products</h1>
    </div>
  );
}
```

### 2. Create a component

```bash
touch frontend/src/components/ProductCard.tsx
```

```tsx
export default function ProductCard({ product }) {
  return (
    <div className="product-card">
      <img src={product.image} alt={product.name} />
      <h3 className="text-body font-semibold">{product.name}</h3>
      <p className="text-h2 text-brand-600">${product.price}</p>
    </div>
  );
}
```

### 3. Add a new API service

```typescript
// services/productService.ts
import api from '@/lib/api';

export const productService = {
  async getProducts(params) {
    const response = await api.get('/api/catalog/products/', { params });
    return response.data;
  },
};
```

## Next Steps (To Implement)

### High Priority
- [ ] Product listing page with filters
- [ ] Product detail page
- [ ] Shopping cart page
- [ ] Checkout flow
- [ ] Order confirmation page

### Medium Priority
- [ ] User profile page
- [ ] Order history
- [ ] Address management
- [ ] Search functionality
- [ ] Category navigation

### Low Priority
- [ ] Wishlist
- [ ] Product reviews
- [ ] Product comparison
- [ ] Advanced filters
- [ ] Toast notifications
- [ ] Error boundaries

## Common Issues

### Issue: "Cannot find module '@/...'"
**Solution:** Check `tsconfig.json` has correct path mapping:
```json
"paths": {
  "@/*": ["./src/*"]
}
```

### Issue: CORS errors in browser
**Solution:** Ensure backend CORS settings allow frontend origin:
```python
CORS_ALLOWED_ORIGINS = [
    'http://localhost:3000',
]
```

### Issue: Token not refreshing
**Solution:** Check:
1. Refresh token is in localStorage
2. Backend `/api/users/token/refresh/` endpoint works
3. No console errors in interceptor
4. Network tab shows refresh request

### Issue: Styles not applying
**Solution:**
1. Check `tailwind.config.ts` content paths
2. Restart dev server
3. Clear `.next` cache: `rm -rf .next`

## Production Deployment

### Build for production
```bash
cd frontend
npm run build
```

### Run production server
```bash
npm start
```

### Environment variables
Set in production:
```
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```

### Optimizations to add:
- [ ] Enable Next.js Image Optimization
- [ ] Configure CDN for static assets
- [ ] Enable ISR/SSG where appropriate
- [ ] Add Sentry for error tracking
- [ ] Add analytics
- [ ] Optimize bundle size

## Summary

✅ **Authentication**: Complete JWT auth with auto-refresh  
✅ **Design System**: Tailwind config matching UI kit  
✅ **API Integration**: Service layer with axios interceptor  
✅ **State Management**: Zustand for auth state  
✅ **Components**: Header, skeletons, buttons, inputs  
✅ **Mobile-First**: Responsive design from the start  

Frontend foundation is complete and ready for feature development! 🚀
