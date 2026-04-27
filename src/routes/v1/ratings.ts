import { Router } from "express";
import {
  createRating,
  updateRating,
  deleteRating,
  getRatingsForItem
} from "../../controllers/ratings";
import { requireAuth } from "../../middleware/requireAuth";

const router = Router();

// Authenticated routes
router.post("/", requireAuth, createRating);
router.put("/:id", requireAuth, updateRating);
router.delete("/:id", requireAuth, deleteRating);

// Public route
router.get("/:tmdbId", getRatingsForItem);

export default router;
