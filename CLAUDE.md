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
├── index.ts           # Entry point, starts server on PORT
├── app.ts             # Express app setup, middleware, routes, 404 handler
├── routes/
│   └── v1/
│       └── movies.ts  # /v1/movies routes (popular, search/discover, by id)
├── controllers/
│   └── movies.ts      # getMovies, getMovieById, getPopularMovies + fetchTmdb helpers
└── middleware/
    └── movies.ts      # validateLimit, validateMovieId, trimMovieFields, trimMovieByIdFields
```

**Route registration:** `app.ts` → `routes` → `v1Routes` → `moviesRouter`

**TMDB query params** (forwarded by `getMovies`):
- `query` — text search by title (uses `/search/movie` endpoint)
- `primary_release_date_gte` / `primary_release_date_lte` — release date range
- `with_genres` — genre IDs (comma-separated)
- `vote_average_gte` / `vote_average_lte` — rating range
- `with_runtime_gte` / `with_runtime_lte` — runtime range (minutes)
- `language` — response language code
- `limit` — max results to return (capped at 50)

## Configuration

Environment variables (see `.env.example`):
- `PORT` — server port (default 3000)
- `TMDB_API_KEY` — TMDB API key (passed as `?api_key=` query param)
- `TMDB_BASE_URL` — TMDB base URL (e.g., `https://api.themoviedb.org/3`)

## API Documentation

OpenAPI spec at `/openapi.yaml` — served as JSON at `/openapi.json`. Interactive docs via Scalar at `/api-docs`.

## Key Patterns

- `fetchTmdb(path, params)` in controllers is the shared HTTP helper for TMDB API calls
- `fetchMoviePage` handles single-page TMDB responses; callers merge multiple pages
- Middleware (`validateLimit`, `validateMovieId`) runs before controllers to sanitize input
- `trimMovieFields` / `trimMovieByIdFields` intercept `res.json()` to filter response fields
- Text search (`?query=`) uses TMDB's `/search/movie`; all other filters use `/discover/movie`
