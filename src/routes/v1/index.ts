import { Router } from 'express';
import { moviesRouter } from './movies';
import { tvRouter } from './tv';

const v1Routes = Router();

v1Routes.use('/movies', moviesRouter);
v1Routes.use('/tv', tvRouter);

export { v1Routes };
