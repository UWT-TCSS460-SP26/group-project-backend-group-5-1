import { Router } from 'express';
import { handleSearchTv, handlePopularTv, handleTvDetails } from '../../controllers/tv';

const tvRouter = Router();

// GET /tv/search?q=...
tvRouter.get('/search', handleSearchTv);

// GET /tv/popular
tvRouter.get('/popular', handlePopularTv);

// GET /tv/:id
tvRouter.get('/:id', handleTvDetails);

export { tvRouter };
