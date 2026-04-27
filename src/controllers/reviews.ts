import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

// Extract userId safely without using "any"
function getUserId(req: Request): number {
  return (req as unknown as { user: { sub: number } }).user.sub;
}

export async function createReview(req: Request, res: Response) {
  try {
    const { mediaId, mediaType, body, ratingId } = req.body;
    const userId = getUserId(req);

    if (!mediaId || !mediaType || !body || !ratingId) {
      return res.status(400).json({ error: 'mediaId, mediaType, body, and ratingId are required' });
    }

    const rating = await prisma.rating.findUnique({
      where: { id: Number(ratingId) },
    });

    if (!rating) {
      return res
        .status(404)
        .json({ error: 'Rating not found. You must create a rating before writing a review.' });
    }

    if (rating.userId !== userId) {
      return res.status(403).json({ error: 'You can only review your own ratings.' });
    }

    const existing = await prisma.review.findFirst({
      where: { userId, ratingId: Number(ratingId) },
    });

    if (existing) {
      return res
        .status(409)
        .json({ error: 'You have already reviewed this item. Use PUT to update your review.' });
    }

    const review = await prisma.review.create({
      data: {
        userId,
        mediaType,
        mediaId: Number(mediaId),
        body,
        ratingId: Number(ratingId),
      },
    });

    return res.status(201).json(review);
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: 'Failed to create review' });
  }
}

// UPDATE review
export async function updateReview(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { body } = req.body;
    const userId = getUserId(req);

    const existing = await prisma.review.findUnique({
      where: { id: Number(id) },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Review not found' });
    }

    if (existing.userId !== userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const updated = await prisma.review.update({
      where: { id: Number(id) },
      data: { body },
    });

    return res.json(updated);
  } catch {
    return res.status(500).json({ error: 'Failed to update review' });
  }
}

// DELETE review
export async function deleteReview(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const userId = getUserId(req);

    const existing = await prisma.review.findUnique({
      where: { id: Number(id) },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Review not found' });
    }

    if (existing.userId !== userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await prisma.review.delete({
      where: { id: Number(id) },
    });

    return res.status(204).send();
  } catch {
    return res.status(500).json({ error: 'Failed to delete review' });
  }
}

// PULBLIC GET reviews for a media item
export async function getReviewsForItem(req: Request, res: Response) {
  try {
    const mediaType = req.params.mediaType as string;
    const mediaId = req.params.mediaId as string;

    const reviews = await prisma.review.findMany({
      where: {
        mediaId: Number(mediaId),
        mediaType,
      },
      include: {
        user: { select: { id: true, email: true } },
      },
    });

    return res.json(reviews);
  } catch {
    return res.status(500).json({ error: 'Failed to fetch reviews' });
  }
}

// PUBLIC GET a specific user's review for a media item
export async function getReviewByUser(req: Request, res: Response) {
  try {
    const mediaType = req.params.mediaType as string;
    const mediaId = req.params.mediaId as string;
    const userId = req.params.userId as string;

    const review = await prisma.review.findFirst({
      where: {
        userId: Number(userId),
        mediaType,
        mediaId: Number(mediaId),
      },
      include: {
        user: { select: { id: true, email: true } },
      },
    });

    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    return res.json(review);
  } catch {
    return res.status(500).json({ error: 'Failed to fetch review' });
  }
}
