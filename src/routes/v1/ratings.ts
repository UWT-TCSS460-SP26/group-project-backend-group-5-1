import { Router } from 'express';
import {
  createRating,
  getMyRatings,
  getRatingByUser,
  getRatingsForItem,
  updateRating,
  deleteRating,
} from '../../controllers/ratings';
import { requireAuth, requireRoleAtLeast } from '../../middleware/requireAuth';
import { resolveLocalUser } from '../../middleware/resolveLocalUser';

const ratingsRouter = Router();

// Authenticated user routes
ratingsRouter.get('/me', requireAuth, requireRoleAtLeast('User'), resolveLocalUser, getMyRatings);

// PUBLIC - get all ratings for a specific media item
ratingsRouter.get('/:mediaType/:mediaId', getRatingsForItem);
ratingsRouter.get('/:mediaType/:mediaId/:userId', getRatingByUser);

// PROTECTED - create, update, delete
ratingsRouter.post('/', requireAuth, requireRoleAtLeast('User'), resolveLocalUser, createRating);
ratingsRouter.put('/:id', requireAuth, requireRoleAtLeast('User'), resolveLocalUser, updateRating);
ratingsRouter.delete(
  '/:id',
  requireAuth,
  requireRoleAtLeast('User'),
  resolveLocalUser,
  deleteRating
);

export { ratingsRouter };
