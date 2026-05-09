import { prisma } from './src/lib/prisma';

async function main() {
  const subs = await prisma.subscriber.findMany();
  console.log('Subscribers in DB:', subs);
}

main();
