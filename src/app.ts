import express, { Request, Response } from 'express';
import cors from 'cors';
import fs from 'fs';
import YAML from 'yaml';
import { apiReference } from '@scalar/express-api-reference';

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

// TODO: Remove Hello Route

// Routes
app.get('/health', (_request: Request, response: Response) => {
  response.status(200).json({
    status:    'ok',
    uptime:    process.uptime(),
    timestamp: new Date().toISOString(),
  });
})

app.get('/hello/kylen-nguyen', (_request: Request, response: Response) => {
  response.json({ message: 'Hello, Kylen Nguyen!' });
});

app.get('/hello/evin-roen', (_request: Request, response: Response) => {
  response.json({ message: 'Hello, Evin Roen!' });
});

// 404 handler — must be after all routes
app.use((_request: Request, response: Response) => {
  response.status(404).json({ error: 'Route not found' });
});

export { app };
