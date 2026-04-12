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

// Routes
app.get('/hello', (_request: Request, response: Response) => {
  response.json({ message: 'Hello, TCSS 460!' });
});

app.get('/hello/:name', (req: Request, res: Response) => {
  const nameParam = req.params.name;

  // Ensure name is a string (handle edge case where it could be an array)
  const nameString = Array.isArray(nameParam) ? nameParam[0] : nameParam;

  const name = nameString
    .split('-')
    .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  res.json({ greeting: `Hello, ${name}!` });
});

// 404 handler — must be after all routes
app.use((_request: Request, response: Response) => {
  response.status(404).json({ error: 'Route not found' });
});

export { app };
