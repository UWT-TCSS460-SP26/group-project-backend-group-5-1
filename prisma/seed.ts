import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';

const connectionString = process.env.DATABASE_URL!;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log(`Start seeding ...`);
  await prisma.user.create({
    data: {
      username: 'admin',
      email: 'admin@example.com',
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
    },
  });
}
