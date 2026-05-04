import { Router } from 'express';
import { moviesRouter } from './movies';
import { tvRouter } from './tv';
import { ratingsRouter } from './ratings';
import { reviewsRouter } from './reviews';
import { issuesRouter } from './issues';

const v1Routes = Router();

v1Routes.use('/ratings', ratingsRouter);
v1Routes.use('/movies', moviesRouter);
v1Routes.use('/tv', tvRouter);
v1Routes.use('/issues', issuesRouter);
v1Routes.use('/reviews', reviewsRouter);

export { v1Routes };
