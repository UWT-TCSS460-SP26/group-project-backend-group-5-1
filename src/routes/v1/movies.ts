import { Router } from 'express';
import { getMovies, getMovieById, getPopularMovies } from '../../controllers/movies';
import { validateLimit, trimFields, validateMovieId } from '../../middleware/movies';
import { MOVIE_SUMMARY_FIELDS } from '../../mappers/movies';

const moviesRouter = Router();

moviesRouter.get('/', validateLimit, trimFields(MOVIE_SUMMARY_FIELDS), getMovies);
moviesRouter.get('/popular', validateLimit, trimFields(MOVIE_SUMMARY_FIELDS), getPopularMovies);
moviesRouter.get('/:id', validateMovieId, getMovieById);

export { moviesRouter };
