import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

// Extract userId safely without using "any"
function getUserId(req: Request): number {
  return (req as unknown as { user: { id: number } }).user.id;
}

// CREATE or UPDATE review
export async function createReview(req: Request, res: Response) {
  try {
    const { tmdbId, mediaType, body, ratingId } = req.body;
    const userId = getUserId(req);

    // Check if review already exists for this user + rating
    const existing = await prisma.review.findFirst({
      where: { userId, ratingId }
    });

    let review;

    if (existing) {
      review = await prisma.review.update({
        where: { id: existing.id },
        data: { body }
      });
    } else {
      review = await prisma.review.create({
        data: {
          userId,
          tmdbId,
          mediaType,
          body,
          ratingId
        }
      });
    }

    return res.status(201).json(review);
  } catch {
    return res.status(500).json({ error: "Failed to create review" });
  }
}

// UPDATE review
export async function updateReview(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { body } = req.body;
    const userId = getUserId(req);

    const existing = await prisma.review.findUnique({
      where: { id: Number(id) }
    });

    if (!existing) {
      return res.status(404).json({ error: "Review not found" });
    }

    if (existing.userId !== userId) {
      return res.status(403).json({ error: "Not authorized" });
    }

    const updated = await prisma.review.update({
      where: { id: Number(id) },
      data: { body }
    });

    return res.json(updated);
  } catch {
    return res.status(500).json({ error: "Failed to update review" });
  }
}

// DELETE review
export async function deleteReview(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const userId = getUserId(req);

    const existing = await prisma.review.findUnique({
      where: { id: Number(id) }
    });

    if (!existing) {
      return res.status(404).json({ error: "Review not found" });
    }

    if (existing.userId !== userId) {
      return res.status(403).json({ error: "Not authorized" });
    }

    await prisma.review.delete({
      where: { id: Number(id) }
    });

    return res.status(204).send();
  } catch {
    return res.status(500).json({ error: "Failed to delete review" });
  }
}

// PUBLIC GET reviews for a media item
export async function getReviewsForItem(req: Request, res: Response) {
  try {
    const { tmdbId } = req.params;

    const reviews = await prisma.review.findMany({
      where: { tmdbId: Number(tmdbId) },
      include: {
        user: { select: { id: true, email: true } }
      }
    });

    return res.json(reviews);
  } catch {
    return res.status(500).json({ error: "Failed to fetch reviews" });
  }
}
