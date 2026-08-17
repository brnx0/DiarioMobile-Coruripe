import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
const pattern = process.argv[2] ?? '%CALENDARIO%';
p.$queryRawUnsafe<any[]>(
  `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE' AND TABLE_NAME LIKE @P1 ORDER BY TABLE_NAME`,
  pattern,
).then((rows) => rows.forEach((r) => console.log(r.TABLE_NAME))).catch((e) => console.error(e)).finally(() => p.$disconnect());
