import { Router } from "express";
import {
  handleSearchTv,
  handlePopularTv,
  handleTvDetails,
} from "../controllers/tvController.js";

const router = Router();

// GET /tv/search?q=...
router.get("/search", handleSearchTv);

// GET /tv/popular
router.get("/popular", handlePopularTv);

// GET /tv/:id
router.get("/:id", handleTvDetails);

export default router;
