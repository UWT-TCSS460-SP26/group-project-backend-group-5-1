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
https://tcss460-group-5-api.onrender.com
