import { Router } from 'express';
import { getMovie } from '../../../controllers/movies';

const moviesRouter = Router();

// TODO: update function to have non-default response
moviesRouter.get('/', getMovie);

export { moviesRouter };
