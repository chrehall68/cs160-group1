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

The following variables are optional and tune throughput under load.
Defaults are applied when unset (except `POSTGRES_MAX_CONNECTIONS` on
bare-metal, which must be set explicitly):

```
NUM_WORKERS=<number of uvicorn worker processes, default 4>
POSTGRES_MAX_CONNECTIONS=<postgres max_connections, default 100>
UPSTREAM_KEEPALIVE=<nginx→backend keepalive pool size, default 32>
```

- `NUM_WORKERS` controls how many FastAPI worker processes the backend
  runs. Scale with available CPU cores.
- `POSTGRES_MAX_CONNECTIONS` is passed to Postgres as `max_connections`.
  Size it to cover every connection the backend workers may open
  concurrently.
- `UPSTREAM_KEEPALIVE` sets the size of nginx's idle keepalive pool to
  the backend, reducing TCP churn for bursty traffic.

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

### To Run Load Tests

A [k6](https://k6.io/) script at [load-tests/script.js](load-tests/script.js)
exercises the account-creation endpoint against a running deployment. It is
useful for validating the tuning knobs above (`NUM_WORKERS`,
`POSTGRES_MAX_CONNECTIONS`, `UPSTREAM_KEEPALIVE`) under realistic concurrency.

Two env vars are required:

```
BASE_URL=<deployment base URL, e.g. https://bank.example.com>
ACCESS_TOKEN=<access_token cookie from a logged-in session>
```

Obtain `ACCESS_TOKEN` by logging into the deployed frontend and copying the
value of the `access_token` cookie from your browser's devtools.

Then run k6 with the virtual-user count and duration of your choice:

```bash
BASE_URL=<...> ACCESS_TOKEN=<...> k6 run --vus 50 --duration 30s load-tests/script.js
```

The script reports `status_2xx`, `status_4xx`, and `status_5xx` counters
alongside k6's built-in latency metrics.

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
