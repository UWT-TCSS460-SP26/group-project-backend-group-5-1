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

## Team Contributions

### Kylen Nguyen

**Project Setup & Infrastructure**
- Bootstrapped the Express + TypeScript project: npm scripts, ESLint, Prettier, Jest config
- Set up the Prisma schema, database migrations, and seed data
- Configured Docker Compose for the local PostgreSQL database
- Fixed build process and TypeScript compilation throughout the project
- Managed merges and resolved conflicts across all sprints
- Maintained and updated OpenAPI documentation

**Sprint 1**
- Implemented `GET /v1/movies`, `GET /v1/movies/:id`, and `GET /v1/movies/popular` with TMDB integration
- Built shared `fetchTmdb` helper and response-trimming middleware
- Restructured TV and movie routes into a unified pattern

**Sprint 2**
- Created the Prisma schema (users, movies, TV, ratings, reviews)
- Wrote database migrations and seed script
- Merged all sprint 2 feature branches and resolved integration issues

**Sprint 3**
- Completed sprint 3 setup and integration work
- Added `resolveLocalUser` middleware for Auth² JWT resolution
- Set role-based guards (`role: User` required) on ratings/reviews write routes

**Sprint 4**
- Fixed `POST /v1/reviews` so a pre-existing rating is not required
- Fixed admin-gated route pipeline
- Renamed `query` param to `q` on movie routes to match TV route convention
- Added search-by-person feature
- Fixed database cascade behavior (deleting a rating no longer deletes the linked review)
- Fixed `GET /v1/movies/:id` and `GET /v1/tv/:id` to include community ratings and reviews
- Added input validation middleware to prevent bad requests

---

### Evin Roen

**Sprint 1**
- Added initial hello/evin route
- Created test scaffolding for TV details, popular shows, and search routes
- Added Jest config file to resolve linting issues in test files
- Renamed files for consistent naming conventions

**Sprint 2**
- Implemented JWT auth route; dev-login endpoint returns a signed token
- Added `docker-compose.yml` for local PostgreSQL
- Configured CORS in `app.ts` (allowed origins via environment variable, `Content-Type` and `Authorization` headers)
- Updated `.env.example` with sprint 2 variables

**Sprint 3**
- Removed the `devAuth.ts` development shortcut and cleaned up `app.ts`
- Fixed a duplicate key in `openapi.yaml`

**Sprint 4**
- Implemented `GET /v1/discover/top-rated` and `GET /v1/discover/most-reviewed` discovery endpoints
- Implemented `GET /v1/ratings/me` self-list endpoint (authenticated user's ratings with TMDB metadata)
- Updated OpenAPI documentation for all discovery routes
- Wrote tests for discovery and self-list routes

---

### Carson Poirier

**Sprint 1**
- Added hello/carson route
- Implemented TV show routes: `GET /v1/tv`, `GET /v1/tv/:id`, `GET /v1/tv/popular`

**Sprint 2**
- Implemented ratings CRUD routes (`GET/POST/PUT/DELETE /v1/ratings`)
- Implemented reviews CRUD routes (`GET/POST/PUT/DELETE /v1/reviews`)
- Wrote OpenAPI documentation for ratings and reviews endpoints

**Sprint 3**
- Added movie and TV details enrichment features
- Implemented the bug report feature (`POST /v1/issues`)

**Sprint 4**
- Implemented self-list routes (`GET /v1/ratings/me`, `GET /v1/reviews/me`)
- Added author objects to review and rating responses
- Implemented display name derivation logic
- Implemented the community feed

---

### Geovani Vasquez

**Sprint 1**
- Added hello/geovani route
- Implemented `GET /health` route and its OpenAPI documentation
- Wrote initial test files for all three planned movie routes
- Updated movie tests to match actual route response shapes

**Sprint 2**
- Wrote test files for ratings and reviews on both movies and TV
- Added dev-login test
- Ran Prettier across test files to fix formatting

**Sprint 3**
- Rewrote his sprint 3 contribution from scratch after integration issues

**Sprint 4**
- Wrote all sprint 4 tests
- Backfilled missing tests from sprint 3

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
