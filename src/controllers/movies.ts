import { Request, Response } from 'express';

// TODO: add environment variables
export const getMovie = async (req: Request, res: Response) => {
  try {
    const response = await fetch(
      `${process.env.TMDB_BASE_URL}/discover/movie`,
      {
        headers: {
          Authorization: `Bearer ${process.env.TMDB_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`TMDB error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    res.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({ error: message });
  }
};
