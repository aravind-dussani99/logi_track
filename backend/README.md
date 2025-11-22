# LogiTrack Backend API

Backend API for the LogiTrack Logistics Management System built with Node.js, Express, and PostgreSQL.

## Features

- RESTful API with Express.js
- PostgreSQL database with CloudSQL support
- JWT-based authentication
- Role-based access control (Admin, Manager, Supervisor, Accountant)
- Comprehensive CRUD operations for all entities
- User-specific data filtering
- Scalable architecture for Cloud Run deployment

## Prerequisites

- Node.js 20+
- PostgreSQL 15+ (or CloudSQL)
- npm or yarn

## Setup

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Required variables:
- `DB_HOST` - Database host
- `DB_PORT` - Database port (default: 5432)
- `DB_NAME` - Database name
- `DB_USER` - Database user
- `DB_PASSWORD` - Database password
- `JWT_SECRET` - Secret key for JWT tokens
- `CORS_ORIGIN` - Frontend URL for CORS

### 3. Database Setup

#### Local Development

1. Create PostgreSQL database:
```bash
createdb logitrack
```

2. Run migrations:
```bash
npm run migrate
```

#### CloudSQL (Production)

The migrations will be run automatically or manually via Cloud SQL Proxy.

### 4. Start Development Server

```bash
npm run dev
```

The API will be available at `http://localhost:3000`

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `GET /api/auth/verify` - Verify token

### Trips
- `GET /api/trips` - Get all trips
- `GET /api/trips/:id` - Get single trip
- `POST /api/trips` - Create trip
- `PUT /api/trips/:id` - Update trip
- `DELETE /api/trips/:id` - Delete trip

### Daily Expenses
- `GET /api/expenses` - Get expenses
- `GET /api/expenses/balance` - Get balance
- `POST /api/expenses` - Create expense
- `PUT /api/expenses/:id` - Update expense
- `DELETE /api/expenses/:id` - Delete expense

### Advances
- `GET /api/advances` - Get all advances
- `GET /api/advances/:id` - Get single advance
- `POST /api/advances` - Create advance
- `PUT /api/advances/:id` - Update advance
- `DELETE /api/advances/:id` - Delete advance

### Ledger
- `GET /api/ledger` - Get ledger entries
- `POST /api/ledger` - Create ledger entry
- `PUT /api/ledger/:id` - Update ledger entry
- `DELETE /api/ledger/:id` - Delete ledger entry

### Master Data
- `GET /api/master-data/customers` - Get customers
- `POST /api/master-data/customers` - Create customer
- `GET /api/master-data/vehicles` - Get vehicles
- `POST /api/master-data/vehicles` - Create vehicle
- Similar endpoints for quarries, royalty-owners, transport-owners, materials, places, accounts

### Users
- `GET /api/users` - Get all users (admin only)
- `GET /api/users/:id` - Get user
- `POST /api/users` - Create user (admin only)
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user (admin only)

### Dashboard
- `GET /api/dashboard/summary` - Get dashboard summary
- `GET /api/dashboard/profit-by-day` - Get profit chart data
- `GET /api/dashboard/cost-breakdown` - Get cost breakdown

## Authentication

All endpoints (except `/api/auth/login`) require authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

## Database Schema

See `migrations/schema.sql` for the complete database schema.

Key tables:
- `users` - User accounts and authentication
- `trips` - Main trip transactions
- `daily_expenses` - User-specific expenses
- `advances` - Advance payments
- `ledger_entries` - Accounting ledger
- `customers`, `vehicles`, `quarries`, etc. - Master data

## Deployment

### Cloud Run Deployment

The backend is configured for deployment to Google Cloud Run with CloudSQL.

1. Set up GitHub Secrets:
   - `GCP_PROJECT_ID`
   - `GCP_SA_KEY`
   - `DB_PASSWORD`
   - `JWT_SECRET`
   - `CORS_ORIGIN`

2. Push to main branch - GitHub Actions will automatically deploy.

### Manual Deployment

```bash
# Build Docker image
docker build -t logitrack-backend .

# Tag and push to Artifact Registry
docker tag logitrack-backend gcr.io/PROJECT_ID/logitrack-backend
docker push gcr.io/PROJECT_ID/logitrack-backend

# Deploy to Cloud Run
gcloud run deploy logitrack-backend \
  --image gcr.io/PROJECT_ID/logitrack-backend \
  --platform managed \
  --region us-central1
```

## Development

### Running Migrations

```bash
npm run migrate
```

### Testing

```bash
# Health check
curl http://localhost:3000/health

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"Admin User","password":"malli275"}'
```

## Security Notes

- Passwords are hashed using bcrypt
- JWT tokens expire after 7 days (configurable)
- Role-based access control enforced
- SQL injection protection via parameterized queries
- CORS configured for specific origins

## License

Proprietary - All rights reserved

