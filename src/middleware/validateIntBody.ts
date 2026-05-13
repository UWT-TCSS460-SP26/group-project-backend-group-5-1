import { Request, Response, NextFunction } from 'express';

const INT32_MIN = -2147483648;
const INT32_MAX = 2147483647;

interface Violation {
  field: string;
  value: number;
  message: string;
}

function walk(value: unknown, path: string, violations: Violation[]): void {
  if (Array.isArray(value)) {
    value.forEach((item, i) => walk(item, `${path}[${i}]`, violations));
  } else if (typeof value === 'object' && value !== null) {
    for (const key of Object.keys(value as object)) {
      walk((value as Record<string, unknown>)[key], path ? `${path}.${key}` : key, violations);
    }
  } else if (typeof value === 'number' && Number.isInteger(value)) {
    if (value < INT32_MIN || value > INT32_MAX) {
      violations.push({
        field: path,
        value,
        message: `Value ${value} exceeds the 32-bit signed integer range (${INT32_MIN} to ${INT32_MAX})`,
      });
    }
  }
}

export const validateIntBody = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.body || typeof req.body !== 'object') return next();

  const violations: Violation[] = [];
  walk(req.body, '', violations);

  if (violations.length > 0) {
    res.status(400).json({ error: 'Integer out of range', violations });
    return;
  }

  next();
};
