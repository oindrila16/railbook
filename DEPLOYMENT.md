# Deployment Guide

Deploy the Train Ticket Booking Platform (Node.js API + React frontend + MySQL).

---

## Architecture

```
[Browser] → [React static / Nginx] → [Express API :3000] → [MySQL :3306]
                    ↓
              Socket.IO (same server)
```

---

## Prerequisites

- **Node.js** 18+
- **MySQL** 8.0+
- **npm** 9+

---

## 1. Database (MySQL)

```sql
CREATE DATABASE train_ticket_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'trainapp'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON train_ticket_db.* TO 'trainapp'@'localhost';
FLUSH PRIVILEGES;
```

---

## 2. Backend API

```bash
cd backend
cp .env.example .env
```

Edit `.env` for production:

```env
NODE_ENV=production
PORT=3000

DB_HOST=localhost
DB_USER=trainapp
DB_PASSWORD=your_secure_password
DB_NAME=train_ticket_db

JWT_SECRET=use_a_long_random_string_at_least_32_chars

CORS_ORIGIN=https://your-frontend-domain.com

EMAIL_ENABLED=true
EMAIL_MOCK=false
SMTP_HOST=smtp.yourprovider.com
SMTP_USER=...
SMTP_PASS=...
```

Run migrations and seed:

```bash
npm install --production
npm run migrate
npm run seed
```

Start with a process manager:

```bash
# PM2 (recommended)
npm install -g pm2
pm2 start app.js --name train-api
pm2 save
pm2 startup
```

Or **systemd** — create `/etc/systemd/system/train-api.service`:

```ini
[Unit]
Description=Train Ticket API
After=network.target mysql.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/train_ticket/backend
ExecStart=/usr/bin/node app.js
Restart=on-failure
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

---

## 3. Frontend (React)

```bash
cd frontend
cp .env.example .env
```

Production `.env`:

```env
VITE_API_URL=https://api.yourdomain.com
```

Build static files:

```bash
npm install
npm run build
```

Output is in `frontend/dist/`. Serve with **Nginx**:

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    root /var/www/train_ticket/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Optional: proxy API on same domain
    location /api/ {
        rewrite ^/api/(.*) /$1 break;
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

If using same-domain `/api` proxy, set `VITE_API_URL=` empty or `/api` in frontend build.

Enable HTTPS with **Certbot** (Let's Encrypt).

---

## 4. Socket.IO

Socket.IO runs on the same HTTP server as Express. Ensure:

- Nginx passes `Upgrade` and `Connection` headers (see config above)
- `CORS_ORIGIN` matches your frontend URL

---

## 5. Health checks

```bash
curl https://api.yourdomain.com/health
```

Expected: `"success": true` and email/socket status.

---

## 6. Security checklist

- [ ] Strong `JWT_SECRET` (32+ random characters)
- [ ] MySQL user with minimal privileges
- [ ] HTTPS on frontend and API
- [ ] `NODE_ENV=production`
- [ ] Do not commit `.env` files
- [ ] Firewall: expose only 80/443, not 3306 publicly
- [ ] Rate limiting (add middleware in production if needed)

---

## 7. Local development (full stack)

```bash
# Terminal 1
cd backend && npm run migrate && npm run seed && npm run dev

# Terminal 2
cd frontend && npm run dev
```

- API: http://localhost:3000  
- UI: http://localhost:5173  
- Postman: import `postman/` collection  

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| CORS errors | Set `CORS_ORIGIN` to exact frontend URL |
| DB connection refused | Check MySQL running, credentials, firewall |
| OTP emails not sent | Use `EMAIL_MOCK=true` for dev; configure SMTP for prod |
| Socket not connecting | Match `VITE_API_URL` to API origin; check Nginx WebSocket headers |
| Empty train search | Run `npm run seed` on backend |
