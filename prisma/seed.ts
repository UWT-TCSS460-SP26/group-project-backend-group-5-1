import { PrismaClient } from '@prisma/client';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL! });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log(`Start seeding ...`);

  // Admin user (required)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@example.com',
      role: 'admin',
    },
  });
  console.log('Admin user seeded.');

  // Regular users
  const alice = await prisma.user.upsert({
    where: { email: 'alice@example.com' },
    update: {},
    create: {
      username: 'alice',
      email: 'alice@example.com',
      role: 'user',
    },
  });

  const bob = await prisma.user.upsert({
    where: { email: 'bob@example.com' },
    update: {},
    create: {
      username: 'bob',
      email: 'bob@example.com',
      role: 'user',
    },
  });
  console.log('Regular users seeded.');

  // Ratings — TMDB ID 550 = Fight Club (movie), 1396 = Breaking Bad (tv)
  const aliceMovieRating = await prisma.rating.upsert({
    where: { userId_mediaId: { userId: alice.id, mediaId: 550 } },
    update: {},
    create: { userId: alice.id, mediaType: 'movie', mediaId: 550, score: 9 },
  });

  const aliceTvRating = await prisma.rating.upsert({
    where: { userId_mediaId: { userId: alice.id, mediaId: 1396 } },
    update: {},
    create: { userId: alice.id, mediaType: 'tv', mediaId: 1396, score: 10 },
  });

  const bobMovieRating = await prisma.rating.upsert({
    where: { userId_mediaId: { userId: bob.id, mediaId: 550 } },
    update: {},
    create: { userId: bob.id, mediaType: 'movie', mediaId: 550, score: 7 },
  });
  console.log('Ratings seeded.');

  // Reviews linked to ratings
  await prisma.review.upsert({
    where: { userId_mediaId: { userId: alice.id, mediaId: 550 } },
    update: {},
    create: {
      userId: alice.id,
      mediaType: 'movie',
      mediaId: 550,
      ratingId: aliceMovieRating.id,
      body: 'A mind-bending exploration of identity and consumerism. An absolute classic.',
    },
  });

  await prisma.review.upsert({
    where: { userId_mediaId: { userId: alice.id, mediaId: 1396 } },
    update: {},
    create: {
      userId: alice.id,
      mediaType: 'tv',
      mediaId: 1396,
      ratingId: aliceTvRating.id,
      body: 'The best TV show ever made. Every episode is better than the last.',
    },
  });

  await prisma.review.upsert({
    where: { userId_mediaId: { userId: bob.id, mediaId: 550 } },
    update: {},
    create: {
      userId: bob.id,
      mediaType: 'movie',
      mediaId: 550,
      ratingId: bobMovieRating.id,
      body: 'Great film but a bit overrated. Still worth watching.',
    },
  });
  console.log('Reviews seeded.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
