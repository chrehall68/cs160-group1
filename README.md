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

### To Run the Mobile Client with Docker Compose

[docker-compose.mobile.dev.yml](docker-compose.mobile.dev.yml) runs the Expo
Metro bundler inside a container. You still need a phone with Expo Go installed. The only required env var
is `EXPO_PUBLIC_BACKEND_URL`, which tells the app where the backend lives:

```bash
EXPO_PUBLIC_BACKEND_URL=https://ob.chrehall68.com/api \
    docker compose -f docker-compose.mobile.dev.yml up --build
```

Scan the QR code that appears in the logs with Expo Go or the camera app on your phone.

> **Note:** external transfers (the Plaid Link flow) will not work in Expo Go.
> Plaid's SDK ships as a native module, and Expo Go bundles only a fixed set
> of native modules — it cannot load arbitrary third-party native code. Every
> other screen works fine over Expo Go. To use external transfers, build
> and install the release APK via
> [Dockerfile.apk](mobile-client/Dockerfile.apk) (see the next section); that
> build has the Plaid native module compiled in.

### To Build the Mobile Client APK

[mobile-client/Dockerfile.apk](mobile-client/Dockerfile.apk) produces a signed
release APK reproducibly, without needing an Expo account or a local Android
SDK install. It runs `expo prebuild` to materialize the native Android project,
generates a fresh keystore inside the image with random credentials, and builds
with gradle directly.

The keystore is regenerated on every build and its credentials never leave the
build layer, so there is nothing to manage externally. The only required build
arg is:

- `BACKEND_URL` — baked into the app as `EXPO_PUBLIC_BACKEND_URL`

The final stage is `FROM scratch` and contains only the signed APK, so extract
it with BuildKit's `--output`:

```bash
docker buildx build \
    -f mobile-client/Dockerfile.apk \
    --build-arg BACKEND_URL=https://ob.chrehall68.com/api \
    --output type=local,dest=./out \
    mobile-client
```

The signed APK lands at `./out/app-release.apk`. Note that you must uninstall any previous version of the app before installing the apk.

### To Run All Services with Docker Compose

To run the web client, backend, and database together in development mode:

First, make sure you create a `.env` file with your Google API key,
Plaid Client ID, Plaid (Sandbox) Secret, and AWS credentials.

Example:

```
# (.env file)
GOOGLE_API_KEY=<YOUR_GOOGLE_API_KEY>
PLAID_CLIENT_ID=<YOUR_PLAID_CLIENT_ID>
PLAID_SECRET=<YOUR_PLAID_SECRET>
AWS_S3_BUCKET=<YOUR_S3_BUCKET>
AWS_ACCESS_KEY_ID=<YOUR_AWS_ACCESS_KEY_ID>
AWS_SECRET_ACCESS_KEY=<YOUR_AWS_SECRET_ACCESS_KEY>
AWS_DEFAULT_REGION=<YOUR_AWS_DEFAULT_REGION>
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
Defaults are applied when unset:

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
