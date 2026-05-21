# Database

## Entity relationship overview

```
stations ──┐
           ├──< routes >── trains
stations ──┘       │
                   ├──< bookings >── users
                   │        │
                   │        └──< tickets
                   │
                   └──< waitlist >── users

users ──< otp_verifications
```

## Tables

| Table | Purpose |
|-------|---------|
| `users` | Registered accounts (email and/or phone) |
| `otp_verifications` | 6-digit OTP with expiry for activation/login |
| `stations` | Railway stations |
| `trains` | Train metadata, `total_seats`, `base_price` |
| `routes` | Train path: source → destination with timings |
| `bookings` | Reservation header; **`travel_date`** drives availability |
| `tickets` | Passengers + seats; unique per `(route_id, travel_date, seat_number)` |
| `waitlist` | FIFO queue when train is full; `passengers_json` for auto-promotion |

## Views

| View | Purpose |
|------|---------|
| `v_route_booked_seats` | Dynamic seat count per route + date |
| `v_popular_routes` | Routes ranked by confirmed bookings (AI suggestions) |

## Run migration

```bash
cd backend
cp .env.example .env   # set DB_* credentials
npm run migrate
```

## Manual apply (optional)

```bash
mysql -u root -p < database/schema.sql
```

Create the database first if needed:

```sql
CREATE DATABASE train_ticket_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE train_ticket_db;
SOURCE database/schema.sql;
```
