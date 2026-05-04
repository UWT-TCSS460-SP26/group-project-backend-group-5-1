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

const reviewsRouter = Router();

// Public routes
reviewsRouter.get('/:mediaType/:mediaId', getReviewsForItem);
reviewsRouter.get('/:mediaType/:mediaId/:userId', getReviewByUser);

// Authenticated routes
reviewsRouter.post('/', requireAuth, requireRoleAtLeast('User'), resolveLocalUser, createReview);
reviewsRouter.put('/:id', requireAuth, requireRoleAtLeast('User'), resolveLocalUser, updateReview);
reviewsRouter.delete(
  '/:id',
  requireAuth,
  requireRoleAtLeast('User'),
  resolveLocalUser,
  deleteReview
);

// Admin delete
reviewsRouter.delete('/admin/:id', requireAuth, requireRole('Admin'), deleteReviewAdmin);

export { reviewsRouter };
