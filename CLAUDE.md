# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Express + TypeScript REST API for TCSS 460 group project. Proxies movie/TV discovery data from TMDB (The Movie Database) API.

**Deployed:** https://tcss460-group-5-api.onrender.com

## Commands

```bash
npm install          # Install dependencies
npm run dev         # Start dev server with auto-reload (tsx watch)
npm run build       # Compile TypeScript to dist/
npm start           # Run compiled output
npm test            # Run Jest tests
npm run lint        # Run ESLint
npm run format      # Format code with Prettier
```

Single test file: `npx jest path/to/test.test.ts --watch`

## Architecture

```
src/
├── index.ts          # Entry point, starts server on PORT
├── app.ts            # Express app setup, middleware, routes, 404 handler
├── routes/           # Route definitions
│   └── v1/           # API version 1
│       └── discover/ # /discover/movies and /discover/tv routes
├── controllers/      # Request handlers (currently: movies.ts)
└── middleware/       # Express middleware (logger.ts)
```

**Route pattern:** `src/routes/v1/{resource}/{action}.ts` — each file exports an Express Router.

**Route registration chain:** `app.ts` → `routes` → `v1Routes` → `discoverRouter` → individual resource routers

## Configuration

Environment variables (see `.env.example`):
- `PORT` — server port (default 3000)
- `TMDB_API_KEY` — TMDB API token
- `TMDB_BASE_URL` — TMDB base URL for API calls

## API Documentation

OpenAPI spec at `/openapi.yaml` — served as JSON at `/openapi.json`. Interactive docs via Scalar at `/api-docs`.

## Key Patterns

- Controllers make fetch calls to TMDB API using environment variable credentials
- All routes return JSON; errors return `{ error: string }` with appropriate status code
- 404 handler catches unmatched routes after all defined routes
