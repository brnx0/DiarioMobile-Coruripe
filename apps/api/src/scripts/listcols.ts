import { PrismaClient } from '@prisma/client';

const tables = process.argv.slice(2);
const p = new PrismaClient();

async function main() {
    if (tables.length === 0) {
        console.error('Uso: tsx src/scripts/listcols.ts NOME_TABELA [outra]');
        process.exit(1);
    }
    for (const table of tables) {
        console.log(`\n=== ${table} ===`);
        const cols = await p.$queryRawUnsafe<any[]>(
            "SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = @P1 ORDER BY ORDINAL_POSITION",
            table,
        );
        cols.forEach((c) => console.log(`${String(c.COLUMN_NAME).padEnd(34)} ${String(c.DATA_TYPE).padEnd(15)} ${c.IS_NULLABLE}`));
    }
}
main().catch((e) => { console.error(e); process.exit(1); }).finally(() => p.$disconnect());
