import { Router } from 'express';
import { getTopRated, getMostReviewed } from '../../controllers/discovery';

const discoveryRouter = Router();

// PUBLIC - no auth required
discoveryRouter.get('/top-rated', getTopRated);
discoveryRouter.get('/most-reviewed', getMostReviewed);

export { discoveryRouter };
