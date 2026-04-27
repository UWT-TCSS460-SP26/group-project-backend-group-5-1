import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

// Extract userId safely without using "any"
function getUserId(req: Request): number {
  return (req as unknown as { user: { id: number } }).user.id;
}

// CREATE or UPDATE rating
export async function createRating(req: Request, res: Response) {
  try {
    const { tmdbId, mediaId, mediaType, score } = req.body;
    const userId = getUserId(req);

    // Check if rating already exists
    const existing = await prisma.rating.findFirst({
      where: { userId, mediaId, mediaType }
    });

    let rating;

    if (existing) {
      rating = await prisma.rating.update({
        where: { id: existing.id },
        data: { score }
      });
    } else {
      rating = await prisma.rating.create({
        data: {
          userId,
          tmdbId,
          mediaId,
          mediaType,
          score
        }
      });
    }

    return res.status(201).json(rating);
  } catch {
    return res.status(500).json({ error: "Failed to create rating" });
  }
}

// UPDATE rating
export async function updateRating(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { score } = req.body;
    const userId = getUserId(req);

    const existing = await prisma.rating.findUnique({
      where: { id: Number(id) }
    });

    if (!existing) {
      return res.status(404).json({ error: "Rating not found" });
    }

    if (existing.userId !== userId) {
      return res.status(403).json({ error: "Not authorized" });
    }

    const updated = await prisma.rating.update({
      where: { id: Number(id) },
      data: { score }
    });

    return res.json(updated);
  } catch {
    return res.status(500).json({ error: "Failed to update rating" });
  }
}

// DELETE rating
export async function deleteRating(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const userId = getUserId(req);

    const existing = await prisma.rating.findUnique({
      where: { id: Number(id) }
    });

    if (!existing) {
      return res.status(404).json({ error: "Rating not found" });
    }

    if (existing.userId !== userId) {
      return res.status(403).json({ error: "Not authorized" });
    }

    await prisma.rating.delete({
      where: { id: Number(id) }
    });

    return res.status(204).send();
  } catch {
    return res.status(500).json({ error: "Failed to delete rating" });
  }
}

// PUBLIC GET ratings for a media item
export async function getRatingsForItem(req: Request, res: Response) {
  try {
    const { mediaId, mediaType } = req.params;

    const ratings = await prisma.rating.findMany({
      where: {
        mediaId: Number(mediaId),
        mediaType: mediaType as string,
      },
      include: {
        user: { select: { id: true, email: true } }
      }
    });

    return res.json(ratings);
  } catch {
    return res.status(500).json({ error: "Failed to fetch ratings" });
  }
}
