import { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * Returns 404 when any of the named route params parse to a negative integer.
 * Non-integer values (e.g. "abc") pass through so downstream validators can
 * return the appropriate 400.
 *
 * Usage:
 *   router.get('/:id', requireNonNegativeIds('id'), handler)
 *   router.get('/:mediaId/:userId', requireNonNegativeIds('mediaId', 'userId'), handler)
 */
export const requireNonNegativeIds =
  (...paramNames: string[]): RequestHandler =>
  (req: Request, res: Response, next: NextFunction): void => {
    for (const name of paramNames) {
      const raw = req.params[name];
      if (raw === undefined) continue;
      const n = Number(raw);
      if (Number.isInteger(n) && n < 0) {
        res.status(404).json({ error: 'Not found' });
        return;
      }
    }
    next();
  };

/**
 * Returns 400 when any of the named body fields parse to a negative integer.
 *
 * Usage:
 *   router.post('/', requireNonNegativeBodyIds('mediaId'), handler)
 */
export const requireNonNegativeBodyIds =
  (...fieldNames: string[]): RequestHandler =>
  (req: Request, res: Response, next: NextFunction): void => {
    for (const name of fieldNames) {
      const raw = req.body[name];
      if (raw === undefined) continue;
      const n = Number(raw);
      if (Number.isInteger(n) && n < 0) {
        res.status(400).json({ error: `${name} must not be negative` });
        return;
      }
    }
    next();
  };
