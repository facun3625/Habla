import { PrismaClient } from './src/generated/prisma/client';

const prisma = new PrismaClient({ log: [] });

async function main() {
  const users = await prisma.user.findMany();
  console.log(JSON.stringify(users, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
