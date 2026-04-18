import { Router } from 'express';
import { moviesRouter } from './movies';

const v1Routes = Router();

v1Routes.use('/movies', moviesRouter);

export { v1Routes };
