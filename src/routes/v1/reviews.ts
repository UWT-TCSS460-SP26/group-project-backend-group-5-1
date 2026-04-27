import { Router } from "express";
import {
  createReview,
  updateReview,
  deleteReview,
  getReviewsForItem
} from "../../controllers/reviews";
import { requireAuth } from "../../middleware/requireAuth";

const router = Router();

// Authenticated routes
router.post("/", requireAuth, createReview);
router.put("/:id", requireAuth, updateReview);
router.delete("/:id", requireAuth, deleteReview);

// Public route
router.get("/:tmdbId", getReviewsForItem);

export default router;
