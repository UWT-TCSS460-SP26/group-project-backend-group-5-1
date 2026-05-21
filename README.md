# TCSS 460 — Group Project Backend

Express + TypeScript API for the TCSS 460 group project.

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment file and fill in your values
cp .env.example .env

# Start Docker (requires Docker Desktop running)
docker compose up -d

# Run database migrations
npx prisma migrate deploy

# Seed the database
npx prisma db seed

# Start development server (auto-reloads on changes)
npm run dev
```

The server starts at [http://localhost:3000](http://localhost:3000).
API documentation is at [http://localhost:3000/api-docs](http://localhost:3000/api-docs).

## Prerequisites

- [Node.js](https://nodejs.org/) >= 22.0.0
- [Docker Desktop](https://www.docker.com/products/docker-desktop) (for the local PostgreSQL database)

## Environment Variables

Copy `.env.example` to `.env` and fill in the following:

| Variable            | Description                              |
| ------------------- | ---------------------------------------- |
| `POSTGRES_USER`     | PostgreSQL username                      |
| `POSTGRES_PASSWORD` | PostgreSQL password                      |
| `POSTGRES_DB`       | PostgreSQL database name                 |
| `DATABASE_URL`      | Full Prisma connection string            |
| `JWT_SECRET`        | Any long random string for local dev     |
| `PORT`              | Port to run the server on (default 3000) |

## Scripts

| Command                    | Description                         |
| -------------------------- | ----------------------------------- |
| `npm run dev`              | Start dev server with auto-reload   |
| `npm run dev:format`       | Prettier -> start dev server        |
| `npm run build`            | Compile TypeScript to `dist/`       |
| `npm start`                | Run compiled output                 |
| `npm test`                 | Run tests                           |
| `npm run lint`             | Run ESLint                          |
| `npm run format`           | Format code with Prettier           |
| `npm run format:check`     | Check formatting                    |
| `npx prisma db seed`       | Seed the database with initial data |
| `npx prisma migrate dev`   | Create and apply a new migration    |
| `npx prisma migrate reset` | Reset DB and reseed                 |

## Deployed URL

**Backend API:** https://tcss460-group-5-api.onrender.com

**Frontend (downstream partner):** https://group-project-bug-tracker-front-end-one.vercel.app/

---

## Partner Integration Guide

### 1. What auth provider do you use?

We use **Auth²** (`https://iam.onrender.com`) as our identity provider. Tokens are RS256-signed JWTs verified via Auth²'s JWKS endpoint. The expected claims are:

| Claim  | Value                                                  |
| ------ | ------------------------------------------------------ |
| `iss`  | `https://iam.onrender.com`                             |
| `aud`  | `group-5-api`                                          |
| `role` | `User`, `Moderator`, `Admin`, `SuperAdmin`, or `Owner` |

### 2. How do I authenticate?

Obtain a JWT from the Auth² login endpoint, then include it on every protected request:

```
Authorization: Bearer <your-jwt-token>
```

Public endpoints (movie/TV browsing, rating/review reads, bug reports) require no token. Write operations (creating/editing ratings and reviews) and the self-list routes require at least `role: User`. Admin endpoints require `role: Admin`.

### 3. What headers do I need?

| Header          | Value              | Required                    |
| --------------- | ------------------ | --------------------------- |
| `Authorization` | `Bearer <token>`   | Protected routes only       |
| `Content-Type`  | `application/json` | POST / PUT / PATCH requests |

### 4. What are the available endpoints?

Full interactive documentation is at **https://tcss460-group-5-api.onrender.com/api-docs**.

Key route groups:

| Prefix                            | Description                                             |
| --------------------------------- | ------------------------------------------------------- |
| `GET /v1/movies`                  | Search and browse movies (TMDB-proxied)                 |
| `GET /v1/tv`                      | Search and browse TV shows (TMDB-proxied)               |
| `GET/POST/PUT/DELETE /v1/ratings` | Community ratings (1–10) for movies, TV, and books      |
| `GET /v1/ratings/me`              | Authenticated: your ratings enriched with TMDB metadata |
| `GET/POST/PUT/DELETE /v1/reviews` | Community text reviews                                  |
| `GET /v1/reviews/me`              | Authenticated: your own reviews                         |
| `GET /v1/discover/top-rated`      | Public: community top-rated items (SQL aggregate)       |
| `GET /v1/discover/most-reviewed`  | Public: most-reviewed items (SQL aggregate)             |
| `POST /v1/issues`                 | Public: submit a bug report                             |
| `GET/PATCH/DELETE /v1/issues`     | Admin-only: manage bug reports                          |

### 5. What do error responses look like?

All errors return JSON. The shape depends on whether there is additional context:

```json
{ "error": "Not found" }
```

```json
{ "error": "Invalid bug report", "details": ["A title or description is required"] }
```

Standard HTTP status codes are used consistently: `400` bad input, `401` missing/invalid token, `403` insufficient role, `404` not found, `409` conflict, `500` server error.

### 6. CORS — can my frontend call this API?

Yes. Set the `CORS_ALLOWED_ORIGINS` environment variable on your deployment to a comma-separated list of allowed origins:

```
CORS_ALLOWED_ORIGINS=https://your-app.onrender.com,http://localhost:5173
```

Contact us to add your production or dev origin to the deployed allowlist.
