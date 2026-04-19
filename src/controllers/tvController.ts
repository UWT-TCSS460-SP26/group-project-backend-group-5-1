import { Request, Response, NextFunction } from "express";
import {
  searchTvShows,
  getPopularTvShows,
  getTvDetails,
} from "../services/tvService";

function toStringParam(param: unknown): string | undefined {
  if (typeof param === "string") return param;

  if (Array.isArray(param)) {
    const first = param[0];
    return typeof first === "string" ? first : undefined;
  }

  // Express sometimes gives objects (ParsedQs)
  if (param && typeof param === "object") {
    return undefined;
  }

  return undefined;
}



export async function handleSearchTv(req: Request, res: Response, next: NextFunction) {
  try {
    const q = toStringParam(req.query.q);
    const year = toStringParam(req.query.year);
    const pageRaw = toStringParam(req.query.page);

    const page = pageRaw ? Number(pageRaw) : 1;

    const result = await searchTvShows(q as string, year, page);

    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function handlePopularTv(req: Request, res: Response, next: NextFunction) {
  try {
    const pageRaw = toStringParam(req.query.page);
    const page = pageRaw ? Number(pageRaw) : 1;

    const result = await getPopularTvShows(page);

    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function handleTvDetails(req: Request, res: Response, next: NextFunction) {
  try {
    const id = toStringParam(req.params.id);

    const result = await getTvDetails(id as string);

    res.json(result);
  } catch (err) {
    next(err);
  }
}
