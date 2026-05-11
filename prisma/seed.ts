import { PrismaClient } from '@prisma/client';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL! });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// TMDB IDs used for seed data
const MEDIA = [
  { mediaId: 550, mediaType: 'movie' }, // Fight Club
  { mediaId: 238, mediaType: 'movie' }, // The Godfather
  { mediaId: 680, mediaType: 'movie' }, // Pulp Fiction
  { mediaId: 1396, mediaType: 'tv' }, // Breaking Bad
  { mediaId: 1399, mediaType: 'tv' }, // Game of Thrones
];

// scores[userIndex][mediaIndex]
const SCORES = [
  [9, 10, 8, 10, 7],
  [7, 9, 8, 9, 8],
  [8, 10, 7, 10, 6],
  [9, 9, 9, 8, 7],
  [6, 8, 7, 9, 9],
  [8, 9, 8, 10, 7],
  [7, 10, 6, 9, 8],
  [9, 8, 9, 8, 6],
  [8, 9, 7, 10, 7],
  [7, 8, 8, 9, 8],
];

const SEED_USERS = [
  {
    username: 'admin',
    email: 'admin@example.com',
    subjectId: 'seed|admin',
    role: 'Admin',
    firstName: null,
    lastName: null,
  },
  {
    username: 'alice',
    email: 'alice@example.com',
    subjectId: 'seed|alice',
    role: 'User',
    firstName: 'Alice',
    lastName: 'Smith',
  },
  {
    username: 'bob',
    email: 'bob@example.com',
    subjectId: 'seed|bob',
    role: 'User',
    firstName: 'Bob',
    lastName: 'Jones',
  },
  {
    username: 'carol',
    email: 'carol@example.com',
    subjectId: 'seed|carol',
    role: 'User',
    firstName: 'Carol',
    lastName: 'White',
  },
  {
    username: 'dave',
    email: 'dave@example.com',
    subjectId: 'seed|dave',
    role: 'User',
    firstName: 'Dave',
    lastName: 'Brown',
  },
  {
    username: 'eve',
    email: 'eve@example.com',
    subjectId: 'seed|eve',
    role: 'User',
    firstName: 'Eve',
    lastName: 'Davis',
  },
  {
    username: 'frank',
    email: 'frank@example.com',
    subjectId: 'seed|frank',
    role: 'User',
    firstName: 'Frank',
    lastName: 'Miller',
  },
  {
    username: 'grace',
    email: 'grace@example.com',
    subjectId: 'seed|grace',
    role: 'User',
    firstName: 'Grace',
    lastName: 'Wilson',
  },
  {
    username: 'henry',
    email: 'henry@example.com',
    subjectId: 'seed|henry',
    role: 'User',
    firstName: 'Henry',
    lastName: 'Moore',
  },
  {
    username: 'iris',
    email: 'iris@example.com',
    subjectId: 'seed|iris',
    role: 'User',
    firstName: 'Iris',
    lastName: 'Taylor',
  },
];

async function main() {
  console.log('Seeding...');

  const users = await Promise.all(
    SEED_USERS.map(({ username, email, subjectId, role, firstName, lastName }) =>
      prisma.user.upsert({
        where: { email },
        update: {},
        create: { username, email, subjectId, role, firstName, lastName },
      })
    )
  );
  console.log(`Seeded ${users.length} users.`);

  const ratingUsers = users;

  const ratings = await Promise.all(
    ratingUsers.flatMap((user, userIdx) =>
      MEDIA.map((item, mediaIdx) =>
        prisma.rating.upsert({
          where: { userId_mediaId: { userId: user.id, mediaId: item.mediaId } },
          update: {},
          create: {
            userId: user.id,
            mediaType: item.mediaType,
            mediaId: item.mediaId,
            score: SCORES[userIdx][mediaIdx],
          },
        })
      )
    )
  );
  console.log(`Seeded ${ratings.length} ratings across ${MEDIA.length} media items.`);
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
