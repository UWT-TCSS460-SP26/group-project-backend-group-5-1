import { Router } from 'express';
import { moviesRouter } from './movies';
import { tvShowsRouter } from './tv_shows';

const discoverRouter = Router();

discoverRouter.use('/movies', moviesRouter);
discoverRouter.use('/tv', tvShowsRouter);

export { discoverRouter };
