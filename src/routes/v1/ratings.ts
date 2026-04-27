import { Router } from 'express';
import {
  createRating,
  getRatingByUser,
  getRatingsForItem,
  updateRating,
  deleteRating,
} from '../../controllers/ratings';
import { requireAuth } from '../../middleware/requireAuth';

const ratingsRouter = Router();

// PUBLIC - get all ratings for a specific media item
ratingsRouter.get('/:mediaType/:mediaId', getRatingsForItem);
ratingsRouter.get('/:mediaType/:mediaId/:userId', getRatingByUser);

// PROTECTED - create, update, delete
ratingsRouter.post('/', requireAuth, createRating);
ratingsRouter.put('/:id', requireAuth, updateRating);
ratingsRouter.delete('/:id', requireAuth, deleteRating);

export { ratingsRouter };
