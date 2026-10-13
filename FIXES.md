# RailBook review fixes

The ten reported code issues have been addressed in the source. Existing databases must be migrated before using the updated authentication and booking code.

| Issue | Fix |
| --- | --- |
| Cancelled seats remained reserved | A generated column reserves only active tickets. Cancelled ticket history remains intact. |
| Registration accepted a new contact for an existing account | Existing accounts use their stored contacts, reject substituted contacts, and require the original password to resend registration verification. Password updates and OTP consumption occur in one transaction after verification. |
| Direct waitlist joining crashed | The queue count receives `(routeId, travelDate, connection)` in the correct order. |
| Live seat and price updates were ignored | Live fare data takes precedence over search snapshots; obsolete requests and subscription data are ignored. |
| Full trains had no waitlist action | Full trains link to the passenger form; My bookings displays waitlist entries and supports leaving. |
| Leaving prevented rejoining | Uniqueness applies only to currently waiting entries, preserving previous history. |
| SMS delivery only logged messages | The Twilio implementation sends an authenticated, form-encoded API request and reports failures. Missing credentials never report success. Mock SMS is disabled in production. |
| OTP delivery failure reported registration success | Registration returns HTTP 503 when neither delivery channel succeeds. |
| JWT configuration defaulted to a known secret | Production rejects missing, short, or known placeholder secrets. Development uses a random process-local secret when none is configured. |
| Login and OTP guesses were unlimited | Authentication routes limit IP and contact attempts. Each OTP permits at most five failed guesses and is consumed atomically. |

Related fixes include class-specific Socket.IO rooms and a development WebSocket proxy, calendar-date handling, route-first transaction locking, promotion inside the cancellation transaction, releasing connections before querying the pool, and preserving successful cancellations when notifications fail. Waitlist promotion follows FIFO within each fare class, so a full economy queue cannot block available business seats.

The frontend lint violations were resolved without disabling lint rules. Requests derive loading from their identity and discard outdated responses. Auth hooks and landscape constants now have separate modules for Fast Refresh. Page routes load on demand to reduce the initial bundle.

## Local setup

Use Node.js 20.19+ or 22.12+ for the Vite frontend. The backend requires Node.js 18 or newer. A temporary Node.js 22.16 runtime was downloaded to `/private/tmp/node-v22.16.0-darwin-arm64/bin` for this session; it is not a permanent installation.

For the temporary runtime in this session, run this first in your terminal:

```sh
export PATH="/private/tmp/node-v22.16.0-darwin-arm64/bin:$PATH"
```

1. Start MySQL 8 or newer and check the `DB_*` values in `backend/.env`.
2. Run `npm run migrate` from `backend/`. Migration `004_booking_and_auth_safety.sql` upgrades existing tables without deleting booking history and can be run repeatedly.
3. Configure a strong `JWT_SECRET`, real SMTP credentials, and Twilio credentials for production. For local console OTPs, set `EMAIL_ENABLED=false`, `EMAIL_MOCK=true`, and `SMS_PROVIDER=mock`. Existing credentials were not changed.
4. Restart the backend after migration. The frontend is available at http://127.0.0.1:5173/.

Do not run `npm run seed` against an existing database you want to preserve: the current seed script clears booking and route-related data.

The SMS request follows the [Twilio Messages API](https://www.twilio.com/docs/messaging/api/message-resource). Provider acceptance means the message has been queued, not that delivery to the handset has been confirmed.

## Verification

- `cd backend && npm test`: backend regression tests for registration, OTP lockout and replay, secret configuration, request limits, SMS failures, queue joining, and cancellation transaction order.
- `cd frontend && npm test`: rendered card tests for live data precedence, the full-train waitlist link, and fare-class-specific values.
- `cd frontend && npm run lint && npm run build`: lint and production build.
- `MYSQL_TEST_HOST=localhost MYSQL_TEST_USER=root MYSQL_TEST_PASSWORD=... npm test` from `backend/`: enables the MySQL integration test. It creates and drops a uniquely named test database and requires permission to create databases. It does not modify `DB_NAME`.

Verification completed: 20 backend (including live MySQL integration) and 4 frontend regression tests passed; frontend lint and production build passed; all 86 backend JavaScript files passed syntax checks. The local homepage, transformed app module, API health endpoint, and Socket.IO proxy responded successfully. The initial JavaScript bundle decreased from about 560 KB to 470 KB.

MAMP MySQL 8.0.44 is now running on 127.0.0.1:8889. The project connection settings were updated, the schema and migrations were applied, and sample data was added only after checking that the new database was empty. Station listing and train search now return successful responses.

MAMP's PHP 8.3.30 FastCGI workers crashed with a macOS Objective-C fork-initialization error. The installer at `scripts/install-mamp-fix.py` now patches MAMP's Apache startup script to reapply `PHP_FCGI_CHILDREN=0` after MAMP regenerates its wrappers. The original startup script is backed up at `/Applications/MAMP/bin/startApache.railbook-original.sh`. A wrapper-regeneration and Apache-restart test passed, and phpMyAdmin returned HTTP 200 afterward. A MAMP update can replace the startup script; rerun the installer if that happens.

Local development now uses console OTPs (`EMAIL_ENABLED=false`, `EMAIL_MOCK=true`). The verification page tells users when to read the code from the server terminal. SMTP credentials have not been replaced; real email delivery in production still requires valid provider credentials.

The follow-up fixes also make capacity updates transactional, enforce a minimum of three seats in MySQL and the API, prevent resizing trains with current/future bookings or waitlists, and reuse the same quota allocator for seeding and updates. Migration `005_train_capacity.sql` has been applied to the local database. Overnight status now uses actual arrival time, and booking URLs reload their details from the API without depending on navigation state.

README.md and DEPLOYMENT.md have been rewritten to reflect the current setup. Production starts the API on loopback by default; the optional loopback proxy setting supports Nginx client addresses. Demo seeding is blocked in production.

Authentication rate limits are stored in memory per server process. Run a shared rate-limit store if deploying multiple API instances; the five-guess OTP limit is persisted in MySQL.
