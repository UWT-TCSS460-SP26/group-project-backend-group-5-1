import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

function getUserId(req: Request): number {
  return req.localUser!.id;
}

function parseId(raw: string): number | null {
  const n = Number(raw);
  return isNaN(n) || !Number.isInteger(n) ? null : n;
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

    if (!isValidMediaType(mediaType)) {
      return res
        .status(400)
        .json({ error: `mediaType must be one of: ${VALID_MEDIA_TYPES.join(', ')}` });
    }

    if (typeof score !== 'number' || score < 1 || score > 10) {
      return res.status(400).json({ error: 'score must be a number between 1 and 10' });
    }

    const existing = await prisma.rating.findFirst({
      where: { userId, mediaId: Number(mediaId), mediaType },
    });

    if (existing) {
      return res
        .status(409)
        .json({ error: 'You have already rated this item. Use PUT to update your rating.' });
    }

    const created = await prisma.rating.create({
      data: { userId, mediaId: Number(mediaId), mediaType, score },
    });
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
      include: { user: { select: { id: true, email: true } } },
    });

    if (!rating) return res.status(404).json({ error: 'Rating not found' });

    return res.json(rating);
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

    const mediaIdNum = parseId(mediaId);
    if (mediaIdNum === null) return res.status(400).json({ error: 'Invalid mediaId' });

    if (!isValidMediaType(mediaType)) {
      return res
        .status(400)
        .json({ error: `mediaType must be one of: ${VALID_MEDIA_TYPES.join(', ')}` });
    }

    const ratings = await prisma.rating.findMany({
      where: { mediaId: mediaIdNum, mediaType },
      include: { user: { select: { id: true, email: true } } },
    });

    return res.json(ratings);
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

    const rating = await prisma.rating.findFirst({
      where: {
        userId: Number(userId),
        mediaType,
        mediaId: Number(mediaId),
      },
      include: {
        user: { select: { id: true, email: true } },
      },
    });

    if (!rating) {
      return res.status(404).json({ error: 'Rating not found' });
    }

    return res.json(rating);
  } catch {
    return res.status(500).json({ error: 'Failed to fetch rating' });
  }
}
