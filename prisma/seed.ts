import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL ?? '' });
const prisma = new PrismaClient({ adapter });

async function main() {
  const hash = await bcrypt.hash('admin123', 10);

  const user = await prisma.user.upsert({
    where: { email: 'admin@hablapraxia.com' },
    update: {},
    create: {
      email: 'admin@hablapraxia.com',
      password: hash,
      name: 'Administrador',
      role: 'ADMIN',
    },
  });

  console.log(`Usuario admin creado: ${user.email}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
