import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

function getUserId(req: Request): number {
  return req.localUser!.id;
}

const INT32_MIN = -2147483648;
const INT32_MAX = 2147483647;

function parseId(raw: string): number | null {
  const n = Number(raw);
  if (isNaN(n) || !Number.isInteger(n)) return null;
  if (n < INT32_MIN || n > INT32_MAX) return null;
  return n;
}

type RatingUser = {
  id: number;
  username: string;
  firstName?: string | null;
  lastName?: string | null;
  [key: string]: unknown;
};

type RatingWithUser = { user?: RatingUser | null; [key: string]: unknown };

function getDisplayName(user: RatingUser): string {
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
  return fullName || user.username;
}

function serializeRating(rating: RatingWithUser) {
  const user = rating.user;
  const author = user
    ? { id: user.id, displayName: getDisplayName(user) }
    : { id: 0, displayName: 'Unknown' };
  const { user: _user, ...rest } = rating;
  return { ...rest, author };
}

const VALID_MEDIA_TYPES = ['movie', 'tv', 'book'] as const;
type MediaType = (typeof VALID_MEDIA_TYPES)[number];

function isValidMediaType(value: string): value is MediaType {
  return VALID_MEDIA_TYPES.includes(value as MediaType);
}

/** POST /ratings — create a rating for a media item */
export async function createRating(req: Request, res: Response) {
  try {
    const { mediaId, mediaType, score } = req.body;
    const userId = getUserId(req);

    if (!mediaId || !mediaType || score === undefined) {
      return res.status(400).json({ error: 'mediaId, mediaType, and score are required' });
    }

    const mediaIdNum = Number(mediaId);
    if (!Number.isInteger(mediaIdNum)) {
      return res.status(400).json({ error: 'mediaId must be an integer' });
    }

    if (!isValidMediaType(mediaType)) {
      return res
        .status(400)
        .json({ error: `mediaType must be one of: ${VALID_MEDIA_TYPES.join(', ')}` });
    }

    if (typeof score !== 'number' || score < 1 || score > 10) {
      return res.status(400).json({ error: 'score must be a number between 1 and 10' });
    }

    const existing = await prisma.rating.findFirst({
      where: { userId, mediaId: mediaIdNum, mediaType },
    });

    if (existing) {
      return res
        .status(409)
        .json({ error: 'You have already rated this item. Use PUT to update your rating.' });
    }

    const created = await prisma.rating.create({
      data: { userId, mediaId: mediaIdNum, mediaType, score },
    });

    const orphan = await prisma.review.findFirst({
      where: { userId, mediaId: mediaIdNum, rating: { isNot: {} } },
    });
    if (orphan) {
      await prisma.review.update({
        where: { userId_mediaId: { userId, mediaId: mediaIdNum } },
        data: { ratingId: created.id },
      });
    }

    return res.status(201).json(created);
  } catch (_err) {
    // console.error('[createRating]', err);
    return res.status(500).json({ error: 'Failed to create rating' });
  }
}

/** GET /ratings/:id — get a single rating by id */
export async function getRatingById(req: Request, res: Response) {
  try {
    const id = parseId(req.params.id as string);
    if (id === null) return res.status(400).json({ error: 'Invalid id' });

    const rating = await prisma.rating.findUnique({
      where: { id },
      include: { user: { select: { id: true, username: true, firstName: true, lastName: true } } },
    });

    if (!rating) return res.status(404).json({ error: 'Rating not found' });

    return res.json(serializeRating(rating as RatingWithUser));
  } catch (_err) {
    // console.error('[getRatingById]', err);
    return res.status(500).json({ error: 'Failed to fetch rating' });
  }
}

/** GET /ratings/:mediaType/:mediaId — list all ratings for a media item */
export async function getRatingsForItem(req: Request, res: Response) {
  try {
    const mediaId = req.params.mediaId as string;
    const mediaType = req.params.mediaType as string;

    const mediaIdN = Number(mediaId);
    if (Number.isInteger(mediaIdN) && (mediaIdN > INT32_MAX || mediaIdN < INT32_MIN)) {
      return res.status(400).json({ error: 'Integer out of range' });
    }
    const mediaIdNum = parseId(mediaId);
    if (mediaIdNum === null) return res.status(400).json({ error: 'Invalid mediaId' });

    if (!isValidMediaType(mediaType)) {
      return res
        .status(400)
        .json({ error: `mediaType must be one of: ${VALID_MEDIA_TYPES.join(', ')}` });
    }

    const ratings = await prisma.rating.findMany({
      where: { mediaId: mediaIdNum, mediaType },
      include: { user: { select: { id: true, username: true, firstName: true, lastName: true } } },
    });

    return res.json(ratings.map((r) => serializeRating(r as RatingWithUser)));
  } catch (_err) {
    // console.error('[getRatingsForItem]', err);
    return res.status(500).json({ error: 'Failed to fetch ratings' });
  }
}

/** PATCH /ratings/:id — update a rating's score */
export async function updateRating(req: Request, res: Response) {
  try {
    const id = parseId(req.params.id as string);
    if (id === null) return res.status(400).json({ error: 'Invalid id' });

    const { score } = req.body;
    const userId = getUserId(req);

    if (typeof score !== 'number' || score < 1 || score > 10) {
      return res.status(400).json({ error: 'score must be a number between 1 and 10' });
    }

    const existing = await prisma.rating.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Rating not found' });
    if (existing.userId !== userId) return res.status(403).json({ error: 'Not authorized' });

    const updated = await prisma.rating.update({ where: { id }, data: { score } });
    return res.json(updated);
  } catch (_err) {
    // console.error('[updateRating]', err);
    return res.status(500).json({ error: 'Failed to update rating' });
  }
}

/** DELETE /ratings/:id — delete a rating */
export async function deleteRating(req: Request, res: Response) {
  try {
    const id = parseId(req.params.id as string);
    if (id === null) return res.status(400).json({ error: 'Invalid id' });

    const userId = getUserId(req);

    const existing = await prisma.rating.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Rating not found' });
    if (existing.userId !== userId) return res.status(403).json({ error: 'Not authorized' });

    await prisma.rating.delete({ where: { id } });
    return res.status(204).send();
  } catch (_err) {
    // console.error('[deleteRating]', err);
    return res.status(500).json({ error: 'Failed to delete rating' });
  }
}

// PUBLIC GET a specific user's rating for a media item
export async function getRatingByUser(req: Request, res: Response) {
  try {
    const mediaType = req.params.mediaType as string;
    const mediaId = req.params.mediaId as string;
    const userId = req.params.userId as string;

    const mediaIdN = Number(mediaId);
    if (Number.isInteger(mediaIdN) && (mediaIdN > INT32_MAX || mediaIdN < INT32_MIN)) {
      return res.status(400).json({ error: 'Integer out of range' });
    }
    const mediaIdNum = parseId(mediaId);
    if (mediaIdNum === null) return res.status(400).json({ error: 'Invalid mediaId' });
    const userIdNum = parseId(userId);
    if (userIdNum === null) return res.status(400).json({ error: 'Invalid userId' });

    const rating = await prisma.rating.findFirst({
      where: {
        userId: userIdNum,
        mediaType,
        mediaId: mediaIdNum,
      },
      include: {
        user: { select: { id: true, username: true, firstName: true, lastName: true } },
      },
    });

    if (!rating) {
      return res.status(404).json({ error: 'Rating not found' });
    }

    return res.json(serializeRating(rating as RatingWithUser));
  } catch {
    return res.status(500).json({ error: 'Failed to fetch rating' });
  }
}

export async function getMyRatedItems(req: Request, res: Response) {
  try {
    const userId = getUserId(req);
    const ratings = await prisma.rating.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, username: true, firstName: true, lastName: true } },
        review: { select: { id: true } },
      },
    });
    return res.json(
      ratings.map((r) => {
        const { review, ...ratingWithoutReview } = r;
        return {
          ...serializeRating(ratingWithoutReview as RatingWithUser),
          reviewId: review?.id ?? null,
        };
      })
    );
  } catch (_err) {
    return res.status(500).json({ error: 'Failed to fetch rated items' });
  }
}
