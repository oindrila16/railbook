# Train Ticket Booking — Frontend

React + Vite + Tailwind CSS · Monochrome theme · BDT (৳) currency.

## Quick start

**Terminal 1 — Backend:**
```bash
cd backend
npm run migrate
npm run seed
npm run dev
```

**Terminal 2 — Frontend:**
```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Open **http://localhost:5173**

## Environment

```env
VITE_API_URL=http://localhost:3000
```

Or leave unset to use Vite proxy (`/api` → backend).

## Pages

| Route | Description |
|-------|-------------|
| `/` | Home — hero, search, features, popular routes |
| `/search` | Train search results |
| `/book/:routeId` | Booking form (auth required) |
| `/bookings` | My bookings (auth required) |
| `/login` | Login |
| `/register` | Register |
| `/verify-otp` | 6-digit OTP verification |

## Features

- Black & white minimal UI
- Animated train background (SVG + CSS)
- BDT formatting via `Intl.NumberFormat('en-BD', { currency: 'BDT' })`
- JWT in `localStorage`
- Protected routes for bookings
- **Live seats** on search page via Socket.IO (`useSeatAvailability` hook)
- **Mobile hamburger menu** with animated drawer
- **Framer Motion** page transitions + interactive hovers

## Test flow

1. Register → verify OTP (see backend console for mock email OTP)
2. Search: DHK (Dhaka) → CTG (Chattogram), future date
3. Book Now → fill passengers → confirm
4. My Bookings → view / cancel

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server :5173 |
| `npm run build` | Production build |
| `npm run preview` | Preview build |
