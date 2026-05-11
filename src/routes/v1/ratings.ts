import { Router } from 'express';
import {
  createRating,
  getRatingByUser,
  getRatingsForItem,
  updateRating,
  deleteRating,
} from '../../controllers/ratings';
import { requireAuth, requireRoleAtLeast } from '../../middleware/requireAuth';
import { resolveLocalUser } from '../../middleware/resolveLocalUser';
import { requireNonNegativeIds, requireNonNegativeBodyIds } from '../../middleware/validateId';

const ratingsRouter = Router();

// PUBLIC — get all ratings for a specific media item
ratingsRouter.get('/:mediaType/:mediaId', requireNonNegativeIds('mediaId'), getRatingsForItem);
ratingsRouter.get(
  '/:mediaType/:mediaId/:userId',
  requireNonNegativeIds('mediaId', 'userId'),
  getRatingByUser
);

// PROTECTED — create, update, delete
ratingsRouter.post(
  '/',
  requireAuth,
  requireRoleAtLeast('User'),
  resolveLocalUser,
  requireNonNegativeBodyIds('mediaId'),
  createRating
);
ratingsRouter.put(
  '/:id',
  requireAuth,
  requireRoleAtLeast('User'),
  requireNonNegativeIds('id'),
  resolveLocalUser,
  updateRating
);
ratingsRouter.delete(
  '/:id',
  requireAuth,
  requireRoleAtLeast('User'),
  requireNonNegativeIds('id'),
  resolveLocalUser,
  deleteRating
);

export { ratingsRouter };
