import { Router } from 'express';
import { v1Routes } from './v1';
import authRoute from './devAuth';

const routes = Router();

routes.use('/authRoutes', authRoute);
routes.use('/v1', v1Routes);

export { routes };
