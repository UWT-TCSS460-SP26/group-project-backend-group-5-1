import { Router } from 'express';
import { getMovies, getMovieById, getPopularMovies } from '../../controllers/movies';
import {
  validateLimit,
  trimMovieFields,
  validateMovieId,
  trimMovieByIdFields,
} from '../../middleware/movies';

const moviesRouter = Router();

// TODO: update function to have non-default response
moviesRouter.get('/popular', validateLimit, trimMovieFields, getPopularMovies);
moviesRouter.get('/', validateLimit, trimMovieFields, getMovies);
moviesRouter.get('/:id', validateMovieId, trimMovieByIdFields, getMovieById);

export { moviesRouter };
