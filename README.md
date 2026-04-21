# Online Bank Platform – CS160 Group 1

This is Group 1's submission for the Online Bank project for CS 160.

---

## Project Overview

We are building a secure online banking system that supports:

- Customer account management
- Deposits and withdrawals
- Internal and external transfers
- Recurring payments
- Check deposits via image upload
- ATM locator (Chase integration)
- Manager dashboard with reporting and filtering

The system follows a 3-tier architecture:

- **Web Client** (React)
- **Mobile Client** (React Native / Expo)
- **Backend API** (FastAPI)

### To Run Web Client

```bash
cd web-client
npm install
npm start
```

Runs on:

```
http://localhost:3000
```

### To Run Mobile Client

```bash
cd mobile-client
npm install
npm start
```

Then:

- Press `w` for web preview
- Press `a` for Android emulator
- Or scan QR code with Expo Go

### To Run All Services with Docker Compose

To run the web client, backend, and database together in development mode:

First, make sure you create a `.env` file with your Google API key,
Plaid Client ID, and Plaid (Sandbox) Secret.

Example:

```
# (.env file)
GOOGLE_API_KEY=<YOUR_GOOGLE_API_KEY>
PLAID_CLIENT_ID=<YOUR_PLAID_CLIENT_ID>
PLAID_SECRET=<YOUR_PLAID_SECRET>
```

Then, you can run:

```bash
docker compose -f docker-compose.dev.yml up --build
```

This will start:

- **Frontend** (Web Client): `http://localhost:3000`
- **Backend API**: `http://localhost:8000`
- **Database** (PostgreSQL): `localhost:5432`

To stop all services:

```bash
docker compose -f docker-compose.dev.yml down
```

## Deployment

Two production deployment modes are supported, each as its own Compose file.
Both build the frontend, backend, and a PostgreSQL database on a single host.
Pick whichever matches your networking setup.

Both modes require the following env vars (in a `.env` file next to the
compose file):

```
DOMAIN=<your public domain, e.g. bank.example.com>
DB_USER=<postgres user>
DB_PASSWORD=<postgres password>
JWT_SECRET_KEY=<long random string>
GOOGLE_API_KEY=<google maps api key>
PLAID_CLIENT_ID=<plaid client id>
PLAID_SECRET=<plaid secret>
AWS_ACCESS_KEY_ID=<aws key>
AWS_SECRET_ACCESS_KEY=<aws secret>
AWS_DEFAULT_REGION=<aws region, e.g. us-west-1>
AWS_S3_BUCKET=<s3 bucket for check images>
```

### Option 1: Bare-metal with Let's Encrypt

Use [docker-compose.prod.baremetal.yml](docker-compose.prod.baremetal.yml)
when the host is directly reachable on ports 80 and 443. A bundled
`certbot` service obtains and renews TLS certificates automatically.

Prerequisites:

- A DNS A/AAAA record for `$DOMAIN` pointing at the host
- Ports 80 and 443 open to the public internet
- Docker + Docker Compose installed on the host
- An email to use with certbot, provided as `CERTBOT_EMAIL` in `.env`

Add to `.env`:

```
CERTBOT_EMAIL=<email address>
```

Then:

```bash
docker compose -f docker-compose.prod.baremetal.yml up -d --build
```

### Option 2: Cloudflare Tunnel

Use [docker-compose.prod.cloudflare.yml](docker-compose.prod.cloudflare.yml)
when the host sits behind NAT or you don't want to expose ports 80/443.
A `cloudflared` sidecar establishes an outbound tunnel to Cloudflare,
which handles TLS termination and public ingress.

Prerequisites:

- A Cloudflare account with a tunnel configured for `$DOMAIN` pointing
  at `http://frontend:80`
- The tunnel token available as `CLOUDFLARE_TUNNEL_TOKEN` in `.env`

Add to `.env`:

```
CLOUDFLARE_TUNNEL_TOKEN=<tunnel token from the cloudflare dashboard>
```

Then:

```bash
docker compose -f docker-compose.prod.cloudflare.yml up -d --build
```

The frontend is also exposed locally on port `8099` for debugging.

### To Run Backend Integration Tests

The backend integration tests use `testcontainers` to start a real PostgreSQL
database automatically. They do not use an in-memory database, because the app
is built around PostgreSQL-specific behavior.

To run the backend tests:

```bash
cd backend
uv pip install -r requirements.txt --python .venv/bin/python
./.venv/bin/python -m pytest tests
```

Docker must be running locally because `testcontainers` starts a temporary
PostgreSQL container for the test session.

# Team Members

- Arian Bahram
- Christian Her
- Eliot Hall
- Tan Nam Ngo
- Tristan Brennan-Evans
- Aayush Kumar
