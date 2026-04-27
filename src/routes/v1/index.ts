import { Router } from 'express';
import { moviesRouter } from './movies';
import { tvRouter } from './tv';
import ratingsRoutes from "./ratings";
import reviewsRoutes from "./reviews";

const v1Routes = Router();

v1Routes.use('/movies', moviesRouter);
v1Routes.use('/tv', tvRouter);
v1Routes.use('/ratings', ratingsRoutes);
v1Routes.use('/reviews', reviewsRoutes);

export { v1Routes };
