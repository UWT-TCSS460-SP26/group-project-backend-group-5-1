import { Router } from 'express';
import { discoverRouter } from './discover';

const v1Routes = Router();

v1Routes.use('/discover', discoverRouter);

export { v1Routes };
