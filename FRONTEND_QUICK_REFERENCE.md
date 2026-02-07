# Frontend Quick Reference

## Start Development

```bash
# With Docker (recommended)
docker compose up frontend

# Local
cd frontend && npm run dev
```

Access: http://localhost:3000

---

## Pages

| Route | Description |
|-------|-------------|
| `/` | Home page |
| `/login` | Login form |
| `/register` | Registration form |

---

## Auth Flow

### Register
```typescript
import { authService } from '@/services/authService';
import { useAuthStore } from '@/store/authStore';

const { setAuth } = useAuthStore();

const response = await authService.register({
  username: 'john',
  email: 'john@example.com',
  password: 'pass123',
  password2: 'pass123',
  first_name: 'John',
  last_name: 'Doe',
});

setAuth(response.user, response.access, response.refresh);
```

### Login
```typescript
const response = await authService.login({
  email: 'john@example.com',
  password: 'pass123',
});

const profile = await authService.getProfile();
setAuth(profile, response.access, response.refresh);
```

### Logout
```typescript
const { clearAuth } = useAuthStore();
const refreshToken = localStorage.getItem('refresh_token');

await authService.logout(refreshToken);
clearAuth();
```

### Make Authenticated Request
```typescript
import api from '@/lib/api';

// Token automatically added!
const cart = await api.get('/api/orders/cart/');
const profile = await api.get('/api/users/profile/');
```

---

## Design System

### Colors
```tsx
bg-brand-600       // Primary blue
bg-brand-700       // Hover blue
bg-gray-900        // Primary text
bg-gray-700        // Secondary text
bg-gray-500        // Tertiary text
bg-gray-300        // Borders
bg-gray-200        // Dividers
bg-gray-100        // Background
bg-success         // Green
bg-warning         // Orange
bg-danger          // Red
bg-rating          // Star yellow
```

### Typography
```tsx
text-display       // 28px/34px Semibold
text-h1            // 22px/28px Semibold
text-h2            // 18px/24px Semibold
text-body          // 15px/22px Regular
text-body-sm       // 13px/18px Regular
text-caption       // 12px/16px Regular
text-button        // 15px/20px Semibold
```

### Spacing
```tsx
p-8, m-8          // 8px
p-12, m-12        // 12px
p-16, m-16        // 16px
p-20, m-20        // 20px
p-24, m-24        // 24px
p-32, m-32        // 32px
p-40, m-40        // 40px
p-48, m-48        // 48px

gap-16            // 16px gap
space-x-24        // 24px horizontal space
```

### Border Radius
```tsx
rounded-sm        // 8px
rounded-md        // 12px
rounded-lg        // 16px
rounded-xl        // 20px
rounded-pill      // 24px
```

### Components
```tsx
// Primary button
<button className="btn-primary">Click me</button>

// Secondary button
<button className="btn-secondary">Cancel</button>

// Input field
<input className="input-field" type="text" />

// Card
<div className="card p-24">Content</div>

// Product card
<div className="product-card">Product</div>
```

---

## Breakpoints

```tsx
// Mobile first (default)
<div className="px-16">

// Tablet (768px+)
<div className="px-16 md:px-24">

// Desktop (1024px+)
<div className="px-16 md:px-24 lg:px-32">
```

| Breakpoint | Size | Usage |
|------------|------|-------|
| xs | 0-479px | Mobile (default) |
| sm | 480-767px | Large mobile |
| md | 768-1023px | Tablet |
| lg | 1024-1279px | Desktop |
| xl | 1280px+ | Large desktop |

---

## Services

### Auth Service
```typescript
import { authService } from '@/services/authService';

authService.register(data)
authService.login(data)
authService.logout(refreshToken)
authService.getProfile()
authService.updateProfile(data)
authService.changePassword(oldPassword, newPassword)
```

### Catalog Service
```typescript
import { catalogService } from '@/services/catalogService';

catalogService.getCategories()
catalogService.getCategory(slug)
catalogService.getProducts(params)
catalogService.getProduct(slug)
catalogService.searchProducts(query, params)
```

### Cart Service
```typescript
import { cartService } from '@/services/cartService';

cartService.getCart()
cartService.addToCart(productId, variantId, quantity)
cartService.updateCartItem(itemId, quantity)
cartService.removeCartItem(itemId)
```

### Order Service
```typescript
import { orderService } from '@/services/cartService';

orderService.createOrder(shippingAddressId, billingAddressId, paymentMethod)
orderService.getOrders()
orderService.getOrder(orderNumber)
```

---

## Store (Zustand)

```typescript
import { useAuthStore } from '@/store/authStore';

const { 
  user,              // User object or null
  isAuthenticated,   // Boolean
  setAuth,           // (user, access, refresh) => void
  clearAuth,         // () => void
  updateUser,        // (user) => void
} = useAuthStore();
```

---

## Skeletons

```typescript
import { 
  ProductCardSkeleton,
  ProductListSkeleton,
  ProductDetailSkeleton,
  CartItemSkeleton,
  PageSkeleton,
} from '@/components/Skeletons';

// Usage
{loading ? <ProductListSkeleton count={8} /> : <ProductGrid />}
```

---

## Token Refresh (Automatic!)

The interceptor handles everything:

```typescript
// You just make requests normally
const data = await api.get('/api/users/profile/');

// Behind the scenes:
// 1. Request with expired token → 401
// 2. Interceptor catches error
// 3. Calls /token/refresh/
// 4. Gets new access token
// 5. Retries original request
// 6. Returns data
```

**Token Lifetimes:**
- Access: 60 minutes
- Refresh: 7 days

---

## Common Patterns

### Loading State
```typescript
const [loading, setLoading] = useState(true);

useEffect(() => {
  catalogService.getProducts()
    .then(setProducts)
    .finally(() => setLoading(false));
}, []);

if (loading) return <ProductListSkeleton />;
```

### Error Handling
```typescript
const [error, setError] = useState('');

try {
  await authService.login(data);
} catch (err) {
  setError(err.response?.data?.detail || 'Error occurred');
}

{error && <div className="text-danger">{error}</div>}
```

### Protected Route
```typescript
'use client';

import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ProtectedPage() {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();
  
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated]);
  
  if (!isAuthenticated) return null;
  
  return <div>Protected content</div>;
}
```

---

## Environment Variables

```bash
# .env.local
NEXT_PUBLIC_API_URL=http://localhost
```

---

## Docker Commands

```bash
# Start frontend only
docker compose up frontend

# Rebuild
docker compose up --build frontend

# View logs
docker compose logs -f frontend

# Stop
docker compose stop frontend

# Shell access
docker compose exec frontend sh
```

---

## NPM Commands

```bash
npm install          # Install dependencies
npm run dev          # Start dev server
npm run build        # Build for production
npm start            # Start production server
npm run lint         # Run linter
```

---

## File Locations

| What | Where |
|------|-------|
| Pages | `src/app/*/page.tsx` |
| Components | `src/components/*.tsx` |
| API client | `src/lib/api.ts` |
| Services | `src/services/*.ts` |
| Store | `src/store/*.ts` |
| Styles | `src/app/globals.css` |
| Config | `tailwind.config.ts` |

---

## Testing

### Test Login
```bash
# 1. Start services
docker compose up

# 2. Register
# http://localhost:3000/register

# 3. Check localStorage
# DevTools → Application → Local Storage
# Should see: access_token, refresh_token

# 4. Test API call
# Any authenticated request
# Token should be added automatically

# 5. Test refresh
# Delete access_token (keep refresh_token)
# Make API call
# Should auto-refresh and succeed
```

---

## Troubleshooting

### Issue: Cannot connect to backend
```bash
# Check backend is running
docker compose ps

# Check NGINX
curl http://localhost/api/users/profile/
```

### Issue: Token not refreshing
```bash
# Check localStorage has refresh_token
localStorage.getItem('refresh_token')

# Check Network tab
# Should see POST /api/users/token/refresh/
```

### Issue: Styles not working
```bash
# Restart Next.js
docker compose restart frontend

# Clear cache
rm -rf frontend/.next
```

---

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/users/register/` | POST | Register user |
| `/api/users/login/` | POST | Login (get tokens) |
| `/api/users/logout/` | POST | Logout (blacklist token) |
| `/api/users/token/refresh/` | POST | Refresh access token |
| `/api/users/profile/` | GET/PATCH | User profile |
| `/api/catalog/products/` | GET | List products |
| `/api/catalog/products/{slug}/` | GET | Product detail |
| `/api/catalog/search/` | GET | Search products |
| `/api/orders/cart/` | GET | Get cart |
| `/api/orders/cart/items/` | POST | Add to cart |
| `/api/orders/orders/create/` | POST | Create order |

---

## Next Steps

Build these pages next:
1. Product listing page
2. Product detail page
3. Cart page
4. Checkout flow
5. User profile
6. Order history

---

## Resources

- Next.js Docs: https://nextjs.org/docs
- Tailwind Docs: https://tailwindcss.com/docs
- React Docs: https://react.dev
- TypeScript Docs: https://www.typescriptlang.org/docs

---

## Summary

✅ Next.js 14 setup complete
✅ JWT auth with auto-refresh
✅ Design system configured
✅ Services layer ready
✅ Components created
✅ Docker integrated

**Start building features!** 🚀
