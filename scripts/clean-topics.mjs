import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function clean(s) {
  return s
    .replace(/​/g, '')
    .replace(/­/g, '')
    .replace(/﻿/g, '')
    .replace(/‌/g, '')
    .replace(/‍/g, '')
    .replace(/&#8203;/g, '')
    .replace(/&#173;/g, '')
    .replace(/&shy;/g, '')
    .replace(/<wbr\s*\/?>/gi, '');
}

const modules = await prisma.module.findMany();
let count = 0;
for (const m of modules) {
  const cleaned = m.topics.map(clean);
  const changed = cleaned.some((t, i) => t !== m.topics[i]);
  if (changed) {
    await prisma.module.update({ where: { id: m.id }, data: { topics: cleaned } });
    count++;
  }
}

console.log(`Limpiados ${count} módulos.`);
await prisma.$disconnect();
