import { Router } from 'express';
import {
  createRating,
  getRatingByUser,
  getRatingsForItem,
  updateRating,
  deleteRating,
  getMyRatedItems,
} from '../../controllers/ratings';
import { requireAuth, requireRoleAtLeast } from '../../middleware/requireAuth';
import { resolveLocalUser } from '../../middleware/resolveLocalUser';

const ratingsRouter = Router();

// PROTECTED self-list — must be before /:mediaType/:mediaId to avoid param conflict
ratingsRouter.get(
  '/me',
  requireAuth,
  requireRoleAtLeast('User'),
  resolveLocalUser,
  getMyRatedItems
);

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
