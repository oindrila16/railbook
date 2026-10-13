# RailBook

RailBook is my train ticket booking project, built with React, Express, and MySQL. It uses sample Bangladesh Railway routes and shows fares in Bangladeshi taka.

Users can search for a train, choose a fare class, pick seats, and manage their bookings. I also added a waitlist for full trains and an admin page for updating routes and prices.

## What it does

- Registration with OTP verification and password login
- Train search by station and travel date
- Economy, Business, and First Class fares
- Seat selection, automatic seat allocation, and live availability updates
- Booking references and public PNR lookup
- Booking cancellation and automatic waitlist promotion
- Waitlist viewing, leaving, and rejoining
- Prices that change with occupancy and the travel date
- Route recommendations based on booking history and popular routes
- A support chat with answers to common questions
- An admin dashboard for trains, routes, prices, and bookings

The running-status page is a schedule-based simulation. It is not connected to railway GPS data. Recommendations are rule-based, and the project does not currently process online payments.

## Tools used

| Part | Tools |
| --- | --- |
| Frontend | React, Vite, Tailwind CSS, Framer Motion |
| Backend | Node.js, Express, Socket.IO |
| Database | MySQL 8 |
| Authentication | JWT, bcrypt, OTP verification |
| Notifications | Nodemailer and Twilio, with a local mock mode |

Use Node.js 22.16 or newer and npm. MySQL 8 or newer is required. phpMyAdmin is optional; it is just a convenient way to view the database.

## Running it locally

Run the commands from the project folder. Keep the backend and frontend running in separate terminals.

### 1. Start MySQL

I use MAMP on my Mac. Open the free MAMP app, click **Start**, then open **WebStart → phpMyAdmin**. MAMP normally runs MySQL on port `8889`.

Create `backend/.env` from the example only if you do not already have one:

```sh
cd backend
cp .env.example .env
npm ci
```

For a default local MAMP installation, use these database settings:

```env
DB_HOST=127.0.0.1
DB_PORT=8889
DB_USER=root
DB_PASSWORD=root
DB_NAME=train_ticket_db
```

Use your own credentials if you changed MAMP's defaults. A standalone MySQL installation usually uses port `3306` instead.

### 2. Create the tables

From `backend/`:

```sh
npm run migrate
```

This creates the database and applies the schema updates. You do not need to import the SQL files manually through phpMyAdmin.

For a fresh development database, add the sample stations, trains, and routes:

```sh
npm run seed
```

**Seeding deletes existing booking, ticket, waitlist, and route-related data.** I only use it when setting up or resetting a development database. It is disabled in production.

The demo admin account is `admin@railbook.com` with password `Admin@1234`. It is for local testing only.

### 3. Set up local OTPs

For local testing, I use console notifications:

```env
NODE_ENV=development
EMAIL_ENABLED=false
EMAIL_MOCK=true
SMS_PROVIDER=mock
```

After registration, the backend terminal prints the OTP. Enter that code on the verification page. These settings do not send a real email or text message.

Set a JWT secret too:

```sh
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the generated value into `JWT_SECRET` in `backend/.env`. Without a configured secret, development uses a temporary secret that changes when the backend restarts.

### 4. Start the backend

```sh
npm run dev
```

The API runs at `http://localhost:3000`. Check `http://localhost:3000/health` to see whether the process is running and which email mode it uses.

### 5. Start the frontend

In another terminal, from the project folder:

```sh
cd frontend
cp .env.example .env
npm ci
npm run dev
```

Keep `VITE_API_URL=/api` in `frontend/.env`. Vite forwards API and Socket.IO requests to the backend.

Open `http://localhost:5173`. Try a route such as **DHK → CTG** with a future travel date.

## Useful commands

| Folder | Command | Purpose |
| --- | --- | --- |
| backend | `npm run dev` | Start the API with automatic restarts |
| backend | `npm start` | Start the API without nodemon |
| backend | `npm run migrate` | Create or update the database schema |
| backend | `npm run seed` | Reset and add development demo data |
| backend | `npm run audit` | Check database consistency without changing data |
| backend | `npm test` | Run backend regression tests |
| frontend | `npm run dev` | Start Vite |
| frontend | `npm run lint` | Check frontend code |
| frontend | `npm test` | Run frontend component tests |
| frontend | `npm run build` | Create the production build in `dist/` |

To include the MySQL integration tests, run this from `backend/` with your test-server credentials:

```sh
MYSQL_TEST_HOST=127.0.0.1 MYSQL_TEST_PORT=8889 \
MYSQL_TEST_USER=root MYSQL_TEST_PASSWORD=root npm test
```

The integration tests create and remove their own databases. They do not use the project's booking data. The test user needs permission to create databases.

## How bookings work

Seats belong to a route, travel date, and fare class. The backend uses transactions and database constraints to prevent two active tickets from reserving the same seat.

Cancelling a booking frees its seats while keeping the old ticket records. Waiting passengers in the same fare class are promoted in queue order when enough seats become available. A promoted booking uses the fare calculated at that time.

Every train needs at least three seats because there are three fare classes. Capacity changes are blocked while the train has current or future bookings or waiting passengers, so existing seat assignments cannot shift underneath a booking.

## API examples

Call these directly on port `3000`, or add `/api` when using the frontend proxy.

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/auth/register` | Register |
| POST | `/auth/verify-otp` | Verify a code |
| POST | `/auth/login` | Log in |
| GET | `/trains/stations` | List stations |
| GET | `/trains/search?source=DHK&destination=CTG&date=YYYY-MM-DD` | Search trains |
| GET | `/trains/availability/1?date=YYYY-MM-DD&class=economy` | Get current availability |
| GET | `/trains/seat-map/1?date=YYYY-MM-DD&class=economy` | Get the seat layout |
| POST | `/bookings` | Book or join the waitlist |
| GET | `/bookings/user` | View my bookings |
| DELETE | `/bookings/1` | Cancel a booking |
| GET | `/waitlist/status` | View my waitlist entries |
| POST | `/waitlist/join` | Join a full train's waitlist |
| DELETE | `/waitlist/1` | Leave the waitlist |
| GET | `/pnr/BOOKING_REFERENCE` | Look up a booking |
| GET | `/pricing/matrix?days=7` | Compare fares by date |

Protected routes need `Authorization: Bearer YOUR_TOKEN`. Admin routes also check the user's role. Login, registration, and verification have request limits, and an OTP stops accepting guesses after five failed attempts.

## If something does not work

**Database connection refused:** start MySQL and check the host and port in `backend/.env`. Restart the backend after changing the settings.

**Access denied by MySQL:** check the database username and password. MAMP's default local credentials are different from some standalone MySQL setups.

**No OTP in my inbox:** local mock mode prints the code in the backend terminal. For real email, configure SMTP and turn mock mode off. See [DEPLOYMENT.md](DEPLOYMENT.md).

**MAMP shows an Internal Server Error:** on the Mac setup used for this project, PHP workers crashed after forking. The repair installer below makes MAMP disable those PHP child workers each time Apache starts:

```sh
python3 scripts/install-mamp-fix.py
```

It changes MAMP's startup script, saves a backup beside it, and restarts Apache. It requires permission to write to `/Applications/MAMP`. Run it again after a MAMP update if that update replaces the startup script.

**npm is not found:** install Node.js and reopen the terminal. The temporary runtime downloaded during setup was under `/private/tmp`, so it should not be treated as a permanent installation.

## Project folders

```text
backend/       API, services, models, migrations, and tests
frontend/      React pages, components, and tests
postman/       API collection and environment examples
scripts/       Local setup helpers
```

For public hosting, see [DEPLOYMENT.md](DEPLOYMENT.md).
