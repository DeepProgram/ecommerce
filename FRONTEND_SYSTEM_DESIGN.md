# Frontend System Design (Next.js)

This document captures the **frontend system design** for your ecommerce
platform. Backend details are intentionally excluded.

---

## Goals

- Mobile-first design
- SEO-friendly pages
- Fast initial load with skeletons
- Hide backend APIs (use Next.js as BFF)
- Production-ready performance and scalability

---

# Architecture Overview

## Framework

- **Next.js App Router**
- Hybrid rendering: SSR + ISR + client components
- TypeScript recommended for stability

## Rendering Strategy

- **SSR**: product detail, cart, checkout
- **ISR**: category pages, search landing pages
- **SSG**: static marketing pages (about, help, policies)
- **Client components**: cart interactions, filters, add-to-cart UI

---

# Data Access (BFF Pattern)

## Why

- Hide Django API URLs and keys
- Centralized caching, auth, validation
- Stable API contract for the frontend

## Approach

- `app/api/*` routes in Next.js act as proxy
- Next.js calls Django on the server
- Browser only sees `yourdomain.com/api/*`

---

# Mobile-First UI Strategy

- Base styles for small screens
- Progressive enhancement for `md`, `lg`, `xl`
- Flexible layout: stacked → grid
- Use Tailwind or CSS Modules

---

# Visual Style (Based on Approved UI Reference)

## Look and Feel
- Clean, airy layout with generous padding and rounded cards
- Light neutral background with subtle shadows
- Friendly, modern ecommerce tone (approachable, not heavy)
- Soft accent colors for CTAs and badges

## Layout Patterns
- Mobile-first, one-column layout
- Header with compact search bar + icons
- Content blocks in stacked cards
- Consistent section spacing to avoid visual noise

## Color Direction
- Primary: soft blue for CTAs and highlights
- Neutrals: light gray background, white cards, charcoal text
- Accents: warm highlight (e.g., orange) for ratings and offers

## Typography
- Sans-serif, medium weight for headings
- Clear hierarchy: page title > section title > body
- Price emphasized with stronger weight and higher contrast

---

# UI Components (Detailed)

## Header / Top Bar
- Back arrow on inner pages
- Page title centered or left-aligned
- Icons: search, wishlist, cart, user
- Badge for cart count

## Search
- Compact rounded search bar
- Placeholder text and search icon
- Suggestion list on focus (mobile-friendly)

## Category Pills / Quick Actions
- Circular icons with short labels (e.g., Women, Men, Shoes)
- Light icon background for visual grouping

## Product Cards (Grid)
- Image on top, name, price, rating
- 2-column grid on mobile
- Strong tap area, rounded corners
- Rating stars in accent color

## Product Detail
- Large hero image
- Title, price, rating, reviews count
- Variant selectors (size, color) as pills
- Primary CTA: Add to Cart (full width)
- Section tabs: Description, Reviews

## Cart
- List of items with thumbnail
- Price aligned right
- Qty stepper (+/-) aligned to item row
- Subtotal section with prominent CTA

## Checkout
- Step list: Address, Payment, Summary
- Order summary card with totals
- Primary CTA: Place Order

## Skeletons
- Card skeletons for lists
- Hero skeleton for product detail
- Row skeleton for cart items

---

# Page-Level UI Structure

## Home
- Hero banner + CTA
- Category quick actions
- Trending section (horizontal cards)
- Offers banner
- Footer placeholder blocks

## Category Listing
- Top filters bar (filter + sort)
- Grid of product cards
- Sticky filter entry on mobile

## Product Detail
- Image gallery
- Title, price, rating
- Variant pills + quantity selector
- Add to cart button
- Description and reviews

## Cart
- Item list with qty controls
- Subtotal and coupon link
- Checkout CTA

## Checkout
- Shipping, payment, summary in stacked cards
- Total emphasized at bottom

---

# Skeletons + Loading UX

## Route-level loading

- `loading.tsx` per route segment
- Shown automatically while server data is loading

## Component-level loading

- `Suspense` around expensive components
- Skeleton placeholders for lists/cards

---

# Core Pages

- Home
- Category listing
- Product detail
- Search
- Cart
- Checkout
- Account / Orders

---

# SEO Strategy

- **Metadata API** for title/description/canonical
- **OpenGraph** and **Twitter** tags
- **Schema.org**: Product, Offer, Breadcrumbs
- **Sitemaps** and **robots.txt**
- Clean URLs: `/category/men/shirts`, `/product/slug`

---

# Performance Strategy

- Use `next/image` for responsive images
- `next/font` for optimized font loading
- Reduce client JS by keeping components server-side where possible
- Dynamic import for heavy components (filters, analytics)

---

# Caching Strategy

## Server fetch caching

- Use `fetch` with `revalidate` for ISR pages
- Short revalidate for price/stock-sensitive pages

## CDN caching

- Cache static assets and images
- Cache API responses (short TTL for catalog/search)

---

# State Management

- Local state for UI (cart drawer, filters)
- Shared state via URL params for search/filter
- Persist cart in server session or local storage (depending on auth)

---

# Analytics + Monitoring

- Web Vitals collection
- Error monitoring (Sentry frontend SDK)
- Track key funnel events (view → add to cart → checkout)

---

# Deployment Notes

- Use NGINX or CDN in front of Next.js
- Scale Next.js horizontally
- Keep Next.js stateless

