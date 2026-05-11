import { Router } from 'express';
import {
  createReview,
  updateReview,
  deleteReview,
  getReviewsForItem,
  getReviewByUser,
  deleteReviewAdmin,
} from '../../controllers/reviews';
import { requireAuth, requireRole, requireRoleAtLeast } from '../../middleware/requireAuth';
import { resolveLocalUser } from '../../middleware/resolveLocalUser';
import { requireNonNegativeIds, requireNonNegativeBodyIds } from '../../middleware/validateId';

const reviewsRouter = Router();

// Public routes
reviewsRouter.get('/:mediaType/:mediaId', requireNonNegativeIds('mediaId'), getReviewsForItem);
reviewsRouter.get(
  '/:mediaType/:mediaId/:userId',
  requireNonNegativeIds('mediaId', 'userId'),
  getReviewByUser
);

// Authenticated routes
reviewsRouter.post(
  '/',
  requireAuth,
  requireRoleAtLeast('User'),
  resolveLocalUser,
  requireNonNegativeBodyIds('mediaId'),
  createReview
);
reviewsRouter.put(
  '/:id',
  requireAuth,
  requireRoleAtLeast('User'),
  requireNonNegativeIds('id'),
  resolveLocalUser,
  updateReview
);
reviewsRouter.delete(
  '/:id',
  requireAuth,
  requireRoleAtLeast('User'),
  requireNonNegativeIds('id'),
  resolveLocalUser,
  deleteReview
);

// Admin delete
reviewsRouter.delete(
  '/admin/:id',
  requireAuth,
  requireRole('Admin'),
  requireNonNegativeIds('id'),
  deleteReviewAdmin
);

export { reviewsRouter };
