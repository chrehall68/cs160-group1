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

# Team Members

- Arian Bahram
- Christian Her
- Eliot Hall
- Tan Nam Ngo
- Tristan Brennan-Evans
- Aayush Kumar
