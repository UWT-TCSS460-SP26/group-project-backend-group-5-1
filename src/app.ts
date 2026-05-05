import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import fs from 'fs';
import YAML from 'yaml';
import { apiReference } from '@scalar/express-api-reference';
import { routes } from './routes';

const app = express();

// Application-level middleware
app.use(
  cors({
    origin: process.env.CORS_ALLOWED_ORIGINS?.split(','),
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
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

// 404 handler — must be after all routes
app.use((_request: Request, response: Response) => {
  response.status(404).json({ error: 'Route not found' });
});

// Global error handler — catches next(err) from any middleware

app.use((err: Error, _request: Request, response: Response, _next: NextFunction) => {
  console.error(err);
  response.status(500).json({ error: 'Internal server error' });
});

export { app };
