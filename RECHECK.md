# RailBook recheck — 13 October 2026

## Working checks

- Live frontend, backend health, frontend-to-backend station/search proxy, Socket.IO proxy, and phpMyAdmin returned HTTP 200.
- All 16 backend tests passed, including isolated MySQL migration tests; all 3 frontend tests passed. Frontend lint and production build passed.
- The read-only database audit returned `ok: true`, no issues, and counts of 12 stations, 26 trains, 44 routes, 132 fares, and 1 admin.
- Thirteen API flow checks passed in a separate database: registration/OTP/login, authorization, search, pricing/seat map, confirmed booking, PNR, waitlist joining, cancellation/promotion, leaving/rejoining, repeated seat reuse, concurrent booking protection, recommendations/chat/simulated train status, and admin reads.
- Notifications were mocked during isolated API flow checks. No emails or SMS were sent. The temporary databases were removed afterward; project data was preserved.

## Outstanding findings

1. **SMTP authentication fails.** Live `/health` reports email configured but not verified. Real OTP email delivery is unavailable with the current credentials; email-only registration can return 503. Code reference: `backend/services/email.service.js:43`.
2. **Admin capacity changes can allocate more seats than exist.** In an isolated database, updating a three-seat train to `totalSeats: 1` returned success while its fare quotas still summed to 3. The quota algorithm assigns at least one seat to every class, and capacity changes do not protect existing reservations or seat ranges. References: `backend/services/admin.service.js:131`, `backend/models/routeFare.model.js:145`.
3. **Overnight status finishes too early.** At a fixed Asia/Dhaka time of 01:00 on 14 October, a journey departing at 20:30 on 13 October and arriving at 03:45 on 14 October returned `completed` instead of `running`. The previous-calendar-day branch overrides the actual arrival time. Reference: `backend/services/liveStatus.service.js:57`. Train status is simulated rather than GPS-backed.
4. **Direct booking links lose required details.** BookingPage reads the train only from React Router navigation state. Opening the URL directly or in a new tab without that state shows “Train not found”, even for an existing route. References: `frontend/src/pages/BookingPage.jsx:23`, `:74`.
5. **MAMP's PHP repair is temporary.** phpMyAdmin currently works, but MAMP regenerates the wrapper containing `PHP_FCGI_CHILDREN=0` when starting Apache. A later restart can reset the workaround and reproduce the macOS PHP-worker crash.

## Limits

This recheck establishes that the tested paths work; it does not establish that the project has no other bugs. Frontend validation consisted of lint, build, server-rendered component tests, and HTTP serving/proxy checks. Full browser click-through, live SMTP/Twilio delivery, and production deployment were not tested. Source behavior was not changed during this recheck.


## Follow-up fixes

The outstanding code and local setup findings above have now been addressed:

- Local OTPs work through console notifications, and the verification page explains the delivery mode. Real SMTP/Twilio still needs provider credentials.
- Capacity changes are transactional, quotas add up exactly, and current/future bookings or waiting passengers block resizing. MySQL also rejects capacities below three.
- Overnight status follows arrival time rather than the calendar-day boundary.
- Direct booking URLs fetch their train details from the API.
- MAMP's startup script reapplies the PHP worker workaround. Regeneration/restart testing confirmed phpMyAdmin still returns HTTP 200.

Verification: 20 backend and 4 frontend tests pass, frontend lint/build pass, and the read-only database audit still reports no issues. Fourteen isolated API flow checks also pass, including console OTPs and capacity protections. Full browser click-through and a public production deployment remain untested. The updated setup instructions are in README.md and DEPLOYMENT.md.
