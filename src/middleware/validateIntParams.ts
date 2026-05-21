import { Request, Response, NextFunction } from 'express';

const INT32_MIN = -2147483648;
const INT32_MAX = 2147483647;
const WHOLE_NUMBER = /^-?\d+$/;

// router.param() callback factory. Register on each sub-router for every param
// name that may carry a numeric value, e.g.:
//   router.param('id', validateIntParam('id'))
// The callback fires after the route is matched and params are extracted, so
// req.params is populated by the time it runs — unlike router.use(), which sees
// an empty req.params because sub-router params haven't been resolved yet.
export const validateIntParam =
  (paramName: string) =>
  (req: Request, res: Response, next: NextFunction, value: string): void => {
    if (!WHOLE_NUMBER.test(value)) return next();

    const num = parseInt(value, 10);
    if (num >= INT32_MIN && num <= INT32_MAX) return next();

    res.status(400).json({ error: 'Integer out of range' });
  };
