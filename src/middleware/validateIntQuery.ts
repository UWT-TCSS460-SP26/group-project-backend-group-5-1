import { Request, Response, NextFunction } from 'express';

const INT32_MIN = -2147483648;
const INT32_MAX = 2147483647;
const WHOLE_NUMBER = /^-?\d+$/;

interface Violation {
  field: string;
  value: number;
  message: string;
}

export const validateIntQuery = (req: Request, res: Response, next: NextFunction): void => {
  const violations: Violation[] = [];

  for (const key of Object.keys(req.query)) {
    const raw = req.query[key];
    if (typeof raw !== 'string' || !WHOLE_NUMBER.test(raw)) continue;

    const num = parseInt(raw, 10);
    if (num < INT32_MIN || num > INT32_MAX) {
      violations.push({
        field: key,
        value: num,
        message: `Value ${num} exceeds the 32-bit signed integer range (${INT32_MIN} to ${INT32_MAX})`,
      });
    }
  }

  if (violations.length > 0) {
    res.status(400).json({ error: 'Integer out of range', violations });
    return;
  }

  next();
};
