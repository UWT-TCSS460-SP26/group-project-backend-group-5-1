import { Router } from "express";
import {
  createReview,
  updateReview,
  deleteReview,
  getReviewsForItem,
  getReviewByUser
} from "../../controllers/reviews";
import { requireAuth } from "../../middleware/requireAuth";

const reviewsRouter = Router();

// Public routes
reviewsRouter.get('/:mediaType/:mediaId', getReviewsForItem);

reviewsRouter.get('/:mediaType/:mediaId/:userId', getReviewByUser);

// Authenticated routes
reviewsRouter.post("/", requireAuth, createReview);
reviewsRouter.put("/:id", requireAuth, updateReview);
reviewsRouter.delete("/:id", requireAuth, deleteReview);

export { reviewsRouter };
