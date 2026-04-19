import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import fs from 'fs';
import YAML from 'yaml';
import axios from 'axios';
import { apiReference } from '@scalar/express-api-reference';
import { routes } from './routes';

const app = express();

// Application-level middleware
app.use(cors());
app.use(express.json());

// OpenAPI documentation
const specFile = fs.readFileSync('./openapi.yaml', 'utf8');
const spec = YAML.parse(specFile);
app.get('/openapi.json', (_request: Request, response: Response) => {
  response.json(spec);
});

app.use('/api-docs', apiReference({ spec: { url: '/openapi.json' } }));

// Routes
app.get('/health', (_request: Request, response: Response) => {
  response.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

app.use(routes);

// Error handler — must be after all routes
app.use((err: unknown, _request: Request, response: Response, _next: NextFunction) => {
  // Forward HTTP errors from axios (e.g. TMDB 404) as-is
  if (axios.isAxiosError(err) && err.response) {
    return response.status(err.response.status).json({ error: err.response.data });
  }

  // Handle errors thrown manually with a status property (e.g. 400 validation errors)
  if (err instanceof Error && 'status' in err) {
    const status = (err as Error & { status: number }).status;
    return response.status(status).json({ error: err.message });
  }

  // Fallback
  return response.status(500).json({ error: 'Internal server error' });
});

// 404 handler — must be after all routes
app.use((_request: Request, response: Response) => {
  response.status(404).json({ error: 'Route not found' });
});

export { app };
