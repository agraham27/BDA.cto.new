import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // TODO: Implement application-specific seed data
  console.info('Seed script executed. Add seed data in prisma/seed.ts.');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error('Seeding failed', error);
    await prisma.$disconnect();
    process.exit(1);
  });
