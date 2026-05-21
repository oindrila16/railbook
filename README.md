# Train Ticket Booking Platform

Production-ready train ticket booking API built with **Node.js (Express)** and **MySQL**, with a **React + Tailwind** frontend.

## Frontend (React + Vite)

Full UI with search, booking, auth, animated trains, and BDT pricing.

```bash
cd frontend
cp .env.example .env
npm install
npm run dev   # http://localhost:5173
```

Run **backend** on port 3000 first. See [frontend/README.md](frontend/README.md).

---

## Backend API

## AI recommendations (rule-based)

Personalized train suggestions using **booking history** + **popular routes** (no ML model).

### Scoring signals

| Signal | Weight | Example reason |
|--------|--------|----------------|
| Booked same route before | +100 | "You have booked this route before" |
| Same source → destination | +65 | Matches your frequent corridor |
| Frequent departure station | +40 | Station you often use |
| Preferred train class | +20 | AC / Sleeper preference |
| Global popularity | +3 per booking | "Popular with other travelers" |

### Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/recommendations` | JWT | Personalized + popular fallback |
| GET | `/recommendations/popular` | No | Trending routes only |

Optional query: `?date=2026-06-15&limit=5` (includes live availability & pricing).

### Example

```bash
curl "http://localhost:3000/recommendations?date=2026-06-15&limit=5" \
  -H "Authorization: Bearer YOUR_JWT"

curl "http://localhost:3000/recommendations/popular?limit=5"
```

---

## Real-time seat availability (Socket.IO)

Clients subscribe per **route + travel date**. Updates broadcast on booking, cancel, and waitlist promotion.

### WebSocket events

| Direction | Event | Payload |
|-----------|-------|---------|
| Client → Server | `subscribe:route` | `{ routeId, travelDate }` |
| Client → Server | `unsubscribe:route` | `{ routeId, travelDate }` |
| Server → Client | `seat:availability` | Live seats, pricing, `reason` |

### REST snapshot (no socket)

```bash
curl "http://localhost:3000/trains/availability/1?date=2026-06-15"
```

### Browser demo

Open [http://localhost:3000/seats-demo.html](http://localhost:3000/seats-demo.html), subscribe to a route, then book/cancel in another tab to see live updates.

### Client example

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000');

socket.on('connect', () => {
  socket.emit('subscribe:route', { routeId: 1, travelDate: '2026-06-15' });
});

socket.on('seat:availability', (data) => {
  console.log('Available:', data.availability.availableSeats);
  console.log('Price:', data.pricing.currentPrice);
});
```

### Broadcast triggers

| Reason | When |
|--------|------|
| `booking_created` | Confirmed booking |
| `booking_cancelled` | Booking cancelled |
| `waitlist_joined` | Added to waitlist |
| `waitlist_promoted` | Auto-promoted from waitlist |

---

## Email notifications (Nodemailer)

HTML emails are sent for:

| Event | Template |
|-------|----------|
| OTP verification | `templates/email/otp.js` |
| Booking confirmed | `bookingConfirmation.js` |
| Booking cancelled | `bookingCancellation.js` |
| Waitlist joined | `waitlistJoined.js` |
| Waitlist promoted | `waitlistPromoted.js` |

### SMTP setup (Gmail example)

```bash
# backend/.env
EMAIL_ENABLED=true
EMAIL_MOCK=false
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@gmail.com
SMTP_PASS=your_app_password
EMAIL_FROM=Train Booking <your@gmail.com>
```

Use a [Gmail App Password](https://support.google.com/accounts/answer/185833) (not your login password).

Without SMTP, emails are **logged to the console** (`EMAIL_MOCK=true` by default in dev).

Check `GET /health` for email connection status.

---

## Step 7: Dynamic pricing

### Formula

```
finalPrice = basePrice × occupancyMultiplier × timeMultiplier
```

| Occupancy | Multiplier |
|-----------|------------|
| 0–49% | 1.0 (base) |
| 50–79% | 1.2 (+20%) |
| 80–100% | 1.4 (+40%) |

| Days until departure | Multiplier |
|---------------------|------------|
| > 7 days | 1.0 |
| 4–7 days | 1.03 (+3%) |
| 2–3 days | 1.08 (+8%) |
| ≤ 1 day | 1.15 (+15%) |

Applied in **train search**, **booking**, **waitlist promotion**, and **pricing quote API**.

### Fare classes (Economy, Business, First Class)

Each route has three fare tiers in `route_fares` with separate base prices and seat quotas:

| Class | Typical base (vs train economy) | Seat share |
|-------|----------------------------------|------------|
| Economy | 1.0× | 65% |
| Business | 1.55× | 25% |
| First Class | 2.35× | 10% |

Search and booking accept `fareClass` (`economy` | `business` | `first`). The UI class dropdown on the search form maps to query param `class=`.

After pulling this feature, run **`npm run migrate`** then **`npm run seed`** in `backend/` to create `route_fares` and sample prices.

**API usage**

| Action | Parameter |
|--------|-----------|
| Search trains | `GET /trains/search?...&class=economy` |
| Price quote | `GET /pricing/quote?routeId=1&date=2026-06-15&fareClass=business` |
| List fare tiers | `GET /pricing/fare-classes` |
| Book / waitlist | JSON body `"fareClass": "first"` |

Search and availability responses include a **`fares`** array (all three classes) plus top-level **`pricing`** for the selected class.

### Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/pricing/rules` | Public pricing tiers, fare classes, and formula |
| GET | `/pricing/fare-classes` | Economy / Business / First Class list |
| GET | `/pricing/matrix?days=7&fromDate=2026-05-22` | All routes × classes × dates with live prices |
| GET | `/pricing/quote?routeId=1&date=2026-06-15&passengers=2&fareClass=business` | Live quote per fare class |

### Example

```bash
curl "http://localhost:3000/pricing/rules"
curl "http://localhost:3000/pricing/quote?routeId=1&date=2026-06-15&passengers=2"
```

Override tiers via `.env` — see `backend/.env.example` (`PRICING_*` variables).

---

## Step 6: Waitlist system

### How it works

1. **Train full** → user joins waitlist (via `POST /bookings` or `POST /waitlist/join`); passengers stored in `passengers_json`.
2. **FIFO queue** — position 1 is promoted first when seats open.
3. **On cancel** → `DELETE /bookings/:id` frees seats and **auto-promotes** waitlisted users (may promote multiple if enough seats).
4. **Notifications** — email/SMS on join and on promotion.

### Endpoints (JWT required)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/waitlist/status` | Your waitlist entries (`?routeId=&date=` optional) |
| POST | `/waitlist/join` | Join waitlist when train is full |
| DELETE | `/waitlist/:id` | Leave waitlist (waiting only) |

### Examples

```bash
TOKEN="your_jwt"

# Check waitlist status
curl "http://localhost:3000/waitlist/status" -H "Authorization: Bearer $TOKEN"
curl "http://localhost:3000/waitlist/status?routeId=1&date=2026-06-15" -H "Authorization: Bearer $TOKEN"

# Join waitlist directly
curl -X POST http://localhost:3000/waitlist/join \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"routeId\":1,\"travelDate\":\"2026-06-15\",\"passengers\":[{\"name\":\"Jane Doe\",\"age\":28,\"gender\":\"female\"}]}"

# Cancel booking → auto-promotes next in queue
curl -X DELETE http://localhost:3000/bookings/1 -H "Authorization: Bearer $TOKEN"
```

---

## Step 5: Booking system

### Endpoints (JWT required)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/bookings` | Book seats (auto-assign) or join waitlist if full |
| GET | `/bookings/user` | List your bookings with tickets |
| DELETE | `/bookings/:id` | Cancel booking; promotes next waitlist user |

### Example

```bash
TOKEN="your_jwt_token"

# Book (use routeId from /trains/search)
curl -X POST http://localhost:3000/bookings \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"routeId\":1,\"travelDate\":\"2026-06-15\",\"passengers\":[{\"name\":\"John Doe\",\"age\":30,\"gender\":\"male\"}]}"

curl http://localhost:3000/bookings/user -H "Authorization: Bearer $TOKEN"

curl -X DELETE http://localhost:3000/bookings/1 -H "Authorization: Bearer $TOKEN"
```

Uses **MySQL transactions** + `FOR UPDATE` row locks to prevent double booking. Unique constraint on `(route_id, travel_date, seat_number)` is a second safety layer.

---

## Step 4: Train search

### Seed sample data

```bash
cd backend
npm run migrate
npm run seed
```

### Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/trains/search` | Search by `source`, `destination` (station codes), `date` |
| GET | `/trains/stations` | List all stations (helper for testing) |

### Example

```bash
curl "http://localhost:3000/trains/search?source=DHK&destination=CTG&date=2026-06-15"
curl "http://localhost:3000/trains/stations"
```

Response includes **dynamic seat availability** per route/date and **current price** (occupancy + time multipliers).

Sample station codes: `DHK` (Dhaka), `CTG` (Chattogram), `SYL` (Sylhet), `RJSH` (Rajshahi), `KHL` (Khulna), `RGP` (Rangpur), `BOG` (Bogura), `COM` (Cumilla)

---

## Step 3: Authentication

### Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/auth/register` | Register (email or phone) + password; sends 6-digit OTP |
| POST | `/auth/verify-otp` | Verify OTP; activates account; returns JWT |
| POST | `/auth/login` | Login with email/phone + password; returns JWT |

### Example flow

```bash
# 1. Register
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"user@example.com\",\"password\":\"Pass1234\",\"fullName\":\"John Doe\"}"

# 2. Check console for [EMAIL MOCK] OTP, then verify
curl -X POST http://localhost:3000/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"user@example.com\",\"otp\":\"123456\"}"

# 3. Login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"user@example.com\",\"password\":\"Pass1234\"}"
```

Use `Authorization: Bearer <token>` on protected routes.

---

## Step 2: Database schema

### Apply schema

```bash
cd backend
npm run migrate
```

This creates `train_ticket_db` (or your `DB_NAME`) and all tables, foreign keys, indexes, and views.

See [backend/database/README.md](backend/database/README.md) for the ER diagram and table reference.

---

## Step 1: Project setup

### Prerequisites

- **Node.js** >= 18
- **MySQL** >= 8.0
- **npm** or **yarn**

### Folder structure

```
train_ticket/
├── README.md
└── backend/
    ├── app.js                 # Entry point
    ├── package.json
    ├── .env.example
    ├── .gitignore
    ├── config/
    │   ├── index.js           # Env-based config
    │   └── database.js        # MySQL pool
    ├── controllers/           # HTTP request handlers
    ├── routes/
    │   └── index.js           # Route aggregator
    ├── models/                # Data access / queries
    ├── services/              # Business logic
    ├── middlewares/           # Auth, validation, errors
    ├── utils/                 # Helpers (OTP, JWT, etc.)
    └── scripts/               # Seed & migrations (Step 2+)
```

### Quick start

1. **Clone / open the project** and go to the backend folder:

   ```bash
   cd backend
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Configure environment:**

   ```bash
   cp .env.example .env
   ```

   Edit `.env` with your MySQL credentials and JWT secret.

4. **Run the server (dev):**

   ```bash
   npm run dev
   ```

5. **Verify health check:**

   ```bash
   curl http://localhost:3000/health
   ```

   Expected response:

   ```json
   {
     "success": true,
     "message": "Train Ticket Booking API is running",
     "timestamp": "..."
   }
   ```

### Scripts

| Command       | Description              |
|---------------|--------------------------|
| `npm start`   | Run production server    |
| `npm run dev` | Run with nodemon         |
| `npm run migrate` | Create DB + apply schema |
| `npm run seed`    | Seed stations, trains, routes |

### Postman & deployment

- **Postman:** Import [`postman/Train-Ticket-Booking.postman_collection.json`](postman/Train-Ticket-Booking.postman_collection.json) + [environment](postman/Train-Ticket-Booking.postman_environment.json) — see [postman/README.md](postman/README.md)
- **Deploy:** [DEPLOYMENT.md](DEPLOYMENT.md) — production setup for API, MySQL, Nginx, PM2

### Live support chatbot

Public FAQ chatbot on every page (floating button, bottom-right).

| Method | Path | Description |
|--------|------|-------------|
| GET | `/chat/welcome` | Welcome message + quick replies (`?sessionId=` optional) |
| POST | `/chat/message` | Body: `{ "message": "...", "sessionId": "..." }` |

Topics: booking, search, PNR, prices, cancellation, waitlist, OTP, seat availability, live status, contact.

```bash
curl http://localhost:3000/chat/welcome
curl -X POST http://localhost:3000/chat/message \
  -H "Content-Type: application/json" \
  -d "{\"message\":\"How do I check my PNR?\"}"
```

### Full stack (local)

```bash
# Backend
cd backend && npm run migrate && npm run seed && npm run dev

# Frontend  
cd frontend && npm run dev
```

| Service | URL |
|---------|-----|
| React UI | http://localhost:5173 |
| REST API | http://localhost:3000 |
| Socket.IO demo | http://localhost:3000/seats-demo.html |
