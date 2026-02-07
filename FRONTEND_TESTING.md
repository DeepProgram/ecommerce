# Frontend Testing Guide

## Quick Test Checklist

### 1. Start Services
```bash
docker compose up
```

Wait for all services to be healthy (~2 minutes).

### 2. Access Frontend
```
http://localhost:3000
```

You should see:
- Header with logo and search bar
- Login button (if not logged in)
- Home page content

---

## Testing Authentication

### Test 1: User Registration

**Steps:**
1. Go to http://localhost:3000/register
2. Fill in the form:
   ```
   First Name: John
   Last Name: Doe
   Username: johndoe
   Email: john@example.com
   Phone: +1234567890 (optional)
   Password: SecurePass123!
   Confirm Password: SecurePass123!
   ```
3. Click "Register"

**Expected Result:**
- ✅ No validation errors
- ✅ Redirected to home page
- ✅ Header shows "👤 John" and "Logout" button
- ✅ Tokens stored in localStorage

**Verify:**
1. Open DevTools → Application → Local Storage → http://localhost:3000
2. Check for:
   - `access_token` (JWT string)
   - `refresh_token` (JWT string)

### Test 2: Logout

**Steps:**
1. While logged in, click "Logout" in header

**Expected Result:**
- ✅ Redirected to home
- ✅ Header shows "Login" button
- ✅ Tokens cleared from localStorage

**Verify:**
1. Check localStorage - should be empty
2. Try accessing protected endpoint - should fail

### Test 3: Login

**Steps:**
1. Go to http://localhost:3000/login
2. Enter credentials:
   ```
   Email: john@example.com
   Password: SecurePass123!
   ```
3. Click "Login"

**Expected Result:**
- ✅ Redirected to home
- ✅ User menu appears in header
- ✅ Tokens stored in localStorage

### Test 4: Invalid Login

**Steps:**
1. Go to http://localhost:3000/login
2. Enter wrong credentials:
   ```
   Email: wrong@example.com
   Password: wrongpassword
   ```
3. Click "Login"

**Expected Result:**
- ✅ Error message displayed: "Login failed. Please try again."
- ✅ User stays on login page
- ✅ No tokens stored

---

## Testing Token Refresh (Critical!)

### Method 1: Manual Token Deletion

**Steps:**
1. Login to get valid tokens
2. Open DevTools → Application → Local Storage
3. Delete `access_token` (keep `refresh_token`)
4. Make an API call (e.g., visit profile page when built)

**Expected Result:**
- ✅ Request initially fails with 401
- ✅ Token refresh triggered automatically
- ✅ New access token received
- ✅ Original request retries successfully
- ✅ User never sees an error

**How to Verify:**
Open DevTools → Network tab:
```
1. GET /api/users/profile/ → 401 Unauthorized
2. POST /api/users/token/refresh/ → 200 OK
3. GET /api/users/profile/ → 200 OK (retry)
```

### Method 2: Wait for Expiration

**Steps:**
1. Login to get tokens
2. Wait 60 minutes (access token lifetime)
3. Make any API call

**Expected Result:**
- ✅ Token automatically refreshed
- ✅ Request succeeds
- ✅ User never notices

**Note:** This is the most realistic test but takes time.

### Method 3: Expired Refresh Token

**Steps:**
1. Login to get tokens
2. Wait 7 days (or manually invalidate refresh token)
3. Try to use the app

**Expected Result:**
- ✅ Refresh attempt fails
- ✅ User redirected to /login
- ✅ All tokens cleared
- ✅ User must login again

---

## Testing Multiple Simultaneous Requests

This tests the queue mechanism in the interceptor.

**Steps:**
1. Login and delete access token (keep refresh)
2. Quickly make multiple API calls simultaneously
3. Watch Network tab

**Expected Result:**
- ✅ Multiple requests fail with 401
- ✅ Only ONE refresh token call is made
- ✅ All failed requests retry after refresh
- ✅ All requests succeed

**Test Code (in browser console):**
```javascript
const api = axios.create({
  baseURL: 'http://localhost',
  headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` }
});

// Delete access token first
localStorage.removeItem('access_token');

// Make multiple simultaneous requests
Promise.all([
  api.get('/api/users/profile/'),
  api.get('/api/orders/cart/'),
  api.get('/api/catalog/products/'),
  api.get('/api/catalog/categories/')
]).then(() => console.log('All succeeded!'));
```

**Expected Network Tab:**
```
4x GET requests → 401
1x POST /token/refresh/ → 200
4x GET requests (retries) → 200
```

---

## Testing UI Components

### Test: Header Component

**Desktop (>768px):**
- ✅ Logo on left
- ✅ Search bar in center (max 640px width)
- ✅ Cart and user menu on right
- ✅ Single search bar

**Mobile (<768px):**
- ✅ Logo on left
- ✅ Cart and user menu on right
- ✅ Search bar on separate row below header

### Test: Responsive Design

**Steps:**
1. Open DevTools → Device toolbar (Cmd/Ctrl + Shift + M)
2. Test different sizes:
   - iPhone SE (375px)
   - iPad (768px)
   - Desktop (1280px)

**Expected Result:**
- ✅ Layout adjusts smoothly
- ✅ No horizontal scrolling
- ✅ Touch targets are ≥44px
- ✅ Text is readable at all sizes

### Test: Buttons

**Steps:**
1. Test primary button:
   - Default: Blue background
   - Hover: Darker blue
   - Disabled: Gray
2. Test secondary button:
   - Default: White with border
   - Hover: Light gray background

### Test: Input Fields

**Steps:**
1. Click input field
2. Check focus state

**Expected Result:**
- ✅ Blue ring appears (20% opacity)
- ✅ Border changes to brand color
- ✅ Smooth transition

---

## Testing Skeleton Loaders

### Test: Loading States

**Steps:**
1. Add artificial delay to API calls:
```typescript
// In services/catalogService.ts
await new Promise(resolve => setTimeout(resolve, 2000));
```

2. Navigate to a page that loads data

**Expected Result:**
- ✅ Skeleton animation appears
- ✅ Shimmer effect visible
- ✅ Layout matches actual content
- ✅ Smooth transition to real content

---

## Testing Forms

### Test: Form Validation

**Registration Form:**
1. Try submitting empty form
   - ✅ Browser validation errors
2. Enter mismatched passwords
   - ✅ Error message: "Passwords do not match"
3. Enter invalid email
   - ✅ Browser validation error
4. Enter short password
   - ✅ Backend validation error displayed

**Login Form:**
1. Try submitting empty form
   - ✅ Browser validation errors
2. Enter invalid credentials
   - ✅ Error message displayed
   - ✅ Form stays populated (except password)

---

## Integration Testing

### Test: Full User Journey

**Scenario: New user shops and checks out**

1. Register new account
   - ✅ Success
2. Browse products (when implemented)
   - ✅ Products load
3. Add to cart
   - ✅ Cart updated
   - ✅ Token auto-refreshes if expired
4. Checkout
   - ✅ Order created
5. View order history
   - ✅ Order visible

---

## Performance Testing

### Test: Initial Load Time

**Steps:**
1. Clear browser cache
2. Open DevTools → Network tab
3. Load http://localhost:3000
4. Check "DOMContentLoaded" and "Load" times

**Expected Result:**
- ✅ DOMContentLoaded < 1s
- ✅ Full Load < 2s
- ✅ No console errors

### Test: Bundle Size

**Steps:**
```bash
cd frontend
npm run build
```

**Expected Result:**
- ✅ First Load JS < 200KB (gzipped)
- ✅ No large dependencies
- ✅ Code splitting working

---

## Error Handling Testing

### Test: Network Errors

**Steps:**
1. Stop backend: `docker compose stop backend`
2. Try to login
3. Start backend: `docker compose start backend`

**Expected Result:**
- ✅ Error message displayed
- ✅ No app crash
- ✅ Can retry after backend starts

### Test: Invalid Tokens

**Steps:**
1. Manually edit tokens in localStorage to invalid values
2. Try to access protected page

**Expected Result:**
- ✅ Refresh attempt fails
- ✅ Redirect to login
- ✅ Tokens cleared

---

## Browser Compatibility Testing

### Test: Multiple Browsers

Test in:
- ✅ Chrome (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Edge (latest)

**Check:**
- Layout consistency
- Authentication works
- Token refresh works
- Responsive design
- No console errors

---

## Security Testing

### Test: XSS Protection

**Steps:**
1. Try entering script tags in forms:
   ```
   <script>alert('XSS')</script>
   ```

**Expected Result:**
- ✅ Rendered as text, not executed

### Test: Token Security

**Check:**
- ✅ Tokens stored in localStorage (acceptable for this project)
- ✅ Tokens not in URL
- ✅ Tokens sent only over HTTPS in production
- ✅ Refresh token used only for refresh endpoint

### Test: CORS

**Steps:**
1. Try accessing API from different origin
2. Check if request is blocked

**Expected Result:**
- ✅ Only allowed origins can access API

---

## Automated Testing (To Add Later)

### Unit Tests
```bash
# Install testing libraries
npm install -D @testing-library/react @testing-library/jest-dom jest

# Run tests
npm test
```

### E2E Tests
```bash
# Install Playwright
npm install -D @playwright/test

# Run E2E tests
npx playwright test
```

---

## Common Issues & Solutions

### Issue: "Cannot connect to backend"
**Check:**
- Backend service running: `docker compose ps`
- Network connectivity: `curl http://localhost/api/users/profile/`

### Issue: Token refresh not working
**Check:**
1. Refresh token exists in localStorage
2. Backend `/api/users/token/refresh/` works
3. No CORS errors in console
4. Network tab shows refresh request

### Issue: Styles not applying
**Solutions:**
- Restart Next.js dev server
- Clear `.next` cache: `rm -rf frontend/.next`
- Check Tailwind config paths

### Issue: TypeScript errors
**Solutions:**
- Run `npm install` again
- Check `tsconfig.json` is correct
- Restart IDE/editor

---

## Testing Checklist

Before deploying to production:

**Authentication:**
- [ ] Registration works
- [ ] Login works
- [ ] Logout works
- [ ] Token refresh automatic
- [ ] Invalid credentials handled
- [ ] Expired tokens handled

**UI:**
- [ ] Responsive on all breakpoints
- [ ] Touch targets ≥44px
- [ ] Focus states visible
- [ ] Loading states shown
- [ ] Error states shown

**Performance:**
- [ ] Initial load < 2s
- [ ] No layout shifts
- [ ] Images optimized
- [ ] Bundle size reasonable

**Security:**
- [ ] XSS protection
- [ ] CORS configured
- [ ] Tokens secure
- [ ] HTTPS in production

**Browser:**
- [ ] Chrome works
- [ ] Firefox works
- [ ] Safari works
- [ ] Edge works

**Accessibility:**
- [ ] Keyboard navigation
- [ ] Screen reader friendly
- [ ] Color contrast sufficient
- [ ] Alt text on images

---

## Summary

✅ Complete testing strategy
✅ Manual test procedures
✅ Token refresh validation
✅ UI/UX testing
✅ Security checks
✅ Performance benchmarks

**Start with:** Authentication tests → Token refresh → UI testing
