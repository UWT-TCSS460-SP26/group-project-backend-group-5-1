import { Request, Response } from 'express';
import type { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';

type ReviewUser = {
  id: number;
  username: string;
  firstName?: string | null;
  lastName?: string | null;
  [key: string]: unknown;
};

type ReviewWithUser = { user?: ReviewUser; [key: string]: unknown };

function getUserId(req: Request): number {
  return req.localUser!.id;
}

function parseId(raw: string): number | null {
  const n = Number(raw);
  return isNaN(n) || !Number.isInteger(n) ? null : n;
}

function getDisplayName(user: ReviewUser): string {
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
  return fullName || user.username;
}

function serializeReview(review: ReviewWithUser) {
  const user = review.user;
  const author = user
    ? { id: user.id, displayName: getDisplayName(user) }
    : { id: 0, displayName: 'Unknown' };
  const { user: _user, ...rest } = review;
  return {
    ...rest,
    author,
  };
}

export async function createReview(req: Request, res: Response) {
  try {
    const { mediaId, mediaType, body } = req.body;
    const userId = getUserId(req);

    if (!mediaId || !mediaType || !body) {
      return res.status(400).json({ error: 'mediaId, mediaType, and body are required' });
    }

    const mediaIdNum = Number(mediaId);
    if (!Number.isInteger(mediaIdNum)) {
      return res.status(400).json({ error: 'mediaId must be an integer' });
    }

    const existing = await prisma.review.findFirst({
      where: { userId, mediaId: mediaIdNum },
    });

    if (existing) {
      return res
        .status(409)
        .json({ error: 'You have already reviewed this item. Use PUT to update your review.' });
    }

    const existingRating = await prisma.rating.findUnique({
      where: { userId_mediaId: { userId, mediaId: mediaIdNum } },
    });

    const reviewData = {
      userId,
      mediaType,
      mediaId: Number(mediaId),
      body,
      ...(existingRating ? { ratingId: existingRating.id } : {}),
    };

    const review = await prisma.review.create({
      data: reviewData as unknown as Prisma.ReviewUncheckedCreateInput,
      include: { user: true },
    });

    return res.status(201).json(serializeReview(review));
  } catch (_err) {
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
      include: { user: true },
    });

    return res.json(serializeReview(updated));
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

    if (existing.userId !== userId && req.user?.role !== 'Admin') {
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

    const mediaIdNum = parseId(mediaId);
    if (mediaIdNum === null) return res.status(400).json({ error: 'Invalid mediaId' });

    const reviews = await prisma.review.findMany({
      where: {
        mediaId: mediaIdNum,
        mediaType,
      },
      include: { user: true },
    });

    return res.json(reviews.map(serializeReview));
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

    const mediaIdNum = parseId(mediaId);
    if (mediaIdNum === null) return res.status(400).json({ error: 'Invalid mediaId' });
    const userIdNum = parseId(userId);
    if (userIdNum === null) return res.status(400).json({ error: 'Invalid userId' });

    const review = await prisma.review.findFirst({
      where: {
        userId: userIdNum,
        mediaType,
        mediaId: mediaIdNum,
      },
      include: { user: true },
    });

    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    return res.json(serializeReview(review));
  } catch {
    return res.status(500).json({ error: 'Failed to fetch review' });
  }
}

export async function getMyReviews(req: Request, res: Response) {
  try {
    const userId = getUserId(req);
    const reviews = await prisma.review.findMany({
      where: { userId },
      include: { user: true },
    });
    return res.json(reviews.map(serializeReview));
  } catch {
    return res.status(500).json({ error: 'Failed to fetch user reviews' });
  }
}

export async function deleteReviewAdmin(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const existing = await prisma.review.findUnique({
      where: { id: Number(id) },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Review not found' });
    }

    await prisma.review.delete({
      where: { id: Number(id) },
    });

    return res.status(204).send();
  } catch {
    return res.status(500).json({ error: 'Failed to delete review' });
  }
}
