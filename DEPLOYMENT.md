# Deploying RailBook

I use MAMP for local development. For a public version, this guide uses a Linux server with MySQL, Nginx, and one Node.js API process. Nginx serves the React build and forwards API and socket requests to Express.

These steps describe the deployment setup. They are not a claim that this project has already been tested on a public production server.

## Before starting

You need Node.js 22.16 or newer, npm, MySQL 8 or newer, Nginx, and a domain pointing to the server. The examples use `/var/www/railbook` for the project folder and `railbook.example.com` for the domain. Replace those with your own values.

Keep MySQL and the Node.js port private. Public traffic should go through Nginx over HTTPS. MAMP and phpMyAdmin are not needed on the production server.

## 1. Set up the database

Log in to MySQL as a database administrator and create a database and a project user:

```sql
CREATE DATABASE train_ticket_db
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'railbook'@'127.0.0.1' IDENTIFIED BY 'REPLACE_WITH_A_STRONG_PASSWORD';
GRANT ALL PRIVILEGES ON train_ticket_db.* TO 'railbook'@'127.0.0.1';
```

This gives the project user permission on its own database, including the schema changes used by migrations.

## 2. Configure the backend

From the server's checkout:

```sh
cd /var/www/railbook/backend
npm ci --omit=dev
cp .env.example .env
```

Only copy the example for a new setup. Keep an existing `.env` when updating the app.

Edit it with your real settings:

```env
NODE_ENV=production
HOST=127.0.0.1
PORT=3000
TRUST_PROXY=loopback
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=railbook
DB_PASSWORD=REPLACE_WITH_YOUR_DATABASE_PASSWORD
DB_NAME=train_ticket_db
JWT_SECRET=REPLACE_WITH_A_RANDOM_SECRET
JWT_EXPIRES_IN=7d
CORS_ORIGIN=https://railbook.example.com
EMAIL_ENABLED=true
EMAIL_MOCK=false
SMTP_HOST=REPLACE_WITH_YOUR_SMTP_HOST
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=REPLACE_WITH_YOUR_SMTP_USER
SMTP_PASS=REPLACE_WITH_YOUR_SMTP_PASSWORD
EMAIL_FROM=RailBook <REPLACE_WITH_YOUR_VERIFIED_SENDER>
APP_NAME=RailBook
APP_URL=https://railbook.example.com
SMS_PROVIDER=twilio
TWILIO_ACCOUNT_SID=REPLACE_WITH_YOUR_ACCOUNT_SID
TWILIO_AUTH_TOKEN=REPLACE_WITH_YOUR_AUTH_TOKEN
TWILIO_PHONE_NUMBER=REPLACE_WITH_YOUR_SMS_NUMBER
```

Generate `JWT_SECRET` with:

```sh
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Production rejects a missing, short, or known placeholder JWT secret. Do not commit `.env` or put backend secrets in a `VITE_` variable; Vite variables are included in the browser build.

`TRUST_PROXY=loopback` lets Express use the client address forwarded by local Nginx. Use this setting with the API bound to `127.0.0.1`, as shown above.

Apply the database updates:

```sh
npm run migrate
npm run audit
```

**Do not run `npm run seed` on production data.** It resets development data and creates a public demo admin account. The script refuses to run when `NODE_ENV=production`.

Add actual stations, trains, routes, and fare rows through your database administration process. Fare quotas must add up to the train capacity, with at least one seat per fare class. The repository's seed data is intended for a local demo, not an official railway timetable.

To make an existing verified user an admin, run this as a database administrator, using the intended email:

```sql
UPDATE users SET role = 'admin'
WHERE email = 'YOUR_ADMIN_EMAIL' AND is_verified = 1;
```

## 3. Check notifications

Email-only registration needs working SMTP delivery. Set the sender to an address approved by your email provider. Port `587` normally uses STARTTLS with `SMTP_SECURE=false`; for implicit TLS on port `465`, use `SMTP_SECURE=true`.

If you use Gmail, use an app password where your account supports it. Google's [app-password instructions](https://support.google.com/accounts/answer/185833) explain the account requirements.

Check `/health` after starting the API. SMTP should report `configured: true`, `verified: true`, and `mode: smtp`. A healthy API process by itself does not prove that email or database-backed requests work, so test those separately.

SMS uses Twilio's [Messages API](https://www.twilio.com/docs/messaging/api/message-resource). The sending number must support SMS. Provider acceptance means a message was queued; it does not guarantee delivery to the phone. Mock notifications are disabled in production.

## 4. Keep the API running

Use one process for this setup. With PM2 installed:

```sh
cd /var/www/railbook/backend
pm2 start app.js --name railbook-api
pm2 save
pm2 startup
```

Run the startup command that PM2 prints for your server. See the [PM2 guide](https://pm2.keymetrics.io/docs/usage/quick-start/) for the system-specific steps.

Useful checks:

```sh
pm2 status
pm2 logs railbook-api
curl http://127.0.0.1:3000/health
curl http://127.0.0.1:3000/trains/stations
```

The request limits currently use memory in each API process. Before using multiple processes or servers, add a shared limit store and a Socket.IO adapter. The OTP guess limit itself is stored in MySQL.

## 5. Build the frontend

```sh
cd /var/www/railbook/frontend
npm ci
cp .env.example .env
```

Use the same-origin API path:

```env
VITE_API_URL=/api
```

Then build:

```sh
npm run lint
npm test
npm run build
```

Nginx serves `frontend/dist`. Changing a `VITE_` variable requires rebuilding the frontend.

## 6. Configure Nginx

Put this in a site configuration included inside Nginx's `http` context. Adjust the domain and project path. If the `map` is already defined elsewhere, reuse it rather than defining it twice.

```nginx
map $http_upgrade $connection_upgrade {
    default upgrade;
    '' close;
}

server {
    listen 80;
    server_name railbook.example.com;
    root /var/www/railbook/frontend/dist;
    index index.html;

    location /api/ {
        proxy_pass http://127.0.0.1:3000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /socket.io/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_read_timeout 90s;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

The trailing slash on the API `proxy_pass` removes `/api/` before forwarding the request. The socket location preserves `/socket.io/`. The SPA fallback lets direct links such as `/book/1` reach React.

Validate and reload Nginx:

```sh
sudo nginx -t
sudo systemctl reload nginx
```

Add a TLS certificate and redirect HTTP to HTTPS before opening the app to users. Keep the WebSocket headers when configuring TLS; Nginx's [WebSocket documentation](https://nginx.org/en/docs/http/websocket.html) explains why they are needed.

## 7. Test the hosted app

Test on the public HTTPS address:

- Search for a route and compare prices with the database.
- Register, receive an OTP, verify it, and log in.
- Open a booking link directly, choose a seat, and book.
- Check the booking reference and My bookings page.
- Cancel the booking and confirm the seat becomes available.
- Test waitlist promotion using controlled test data.
- Keep two browser tabs open and check that seat changes update live.
- Check admin permissions and route/price updates.

Do this with dedicated test accounts. Train running status is still a schedule simulation, and there is no payment gateway.

## Updating and backing up

Back up MySQL before applying an update. For example:

```sh
mysqldump -h 127.0.0.1 -u railbook -p \
  --single-transaction --no-tablespaces train_ticket_db > railbook-backup.sql
```

Keep backups outside the public web directory and test a restore separately.

For an app update, install the locked dependencies, run the tests, apply migrations, rebuild the frontend, and restart the API:

```sh
cd /var/www/railbook/backend
npm ci --omit=dev
npm test
npm run migrate
npm run audit
pm2 restart railbook-api --update-env
cd ../frontend
npm ci
npm run lint
npm test
npm run build
```

Never replace the server's `.env` with the example during an update. If an update fails, use the previous app release and its compatible database backup or migration plan.
