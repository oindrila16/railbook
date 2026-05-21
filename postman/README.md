# Postman Collection

## Import

1. Open Postman → **Import**
2. Select both files:
   - `Train-Ticket-Booking.postman_collection.json`
   - `Train-Ticket-Booking.postman_environment.json`
3. Choose environment **Train Ticket - Local**

## Quick test flow

| Step | Request | Notes |
|------|---------|-------|
| 1 | Health → Health Check | Server running |
| 2 | Auth → Register | Check terminal for OTP |
| 3 | Auth → Verify OTP | Auto-saves `token` |
| 4 | Trains → Search Trains | `DHK` → `CTG` |
| 5 | Bookings → Create Booking | Uses `{{token}}` |
| 6 | Bookings → My Bookings | List reservations |
| 7 | Bookings → Cancel Booking | Frees seats, promotes waitlist |

## Environment variables

| Variable | Description |
|----------|-------------|
| `baseUrl` | API root (default `http://localhost:3000`) |
| `token` | JWT (set by Verify OTP / Login scripts) |
| `email`, `password`, `otp` | Auth test data |
| `source`, `destination`, `travelDate` | Search params |
| `routeId`, `bookingId`, `waitlistId` | Resource IDs |

## Socket.IO (manual test)

Use the browser demo: `http://localhost:3000/seats-demo.html`

Or a WebSocket client connecting to `http://localhost:3000` with event `subscribe:route` and payload `{ "routeId": 1, "travelDate": "2026-06-15" }`.
