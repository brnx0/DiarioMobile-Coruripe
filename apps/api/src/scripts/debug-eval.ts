import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
async function main() {
    const tables = ['EDU_QUADRO_DE_HORARIOS', 'EDU_QUADRO_DE_HORARIOS_DETALHE'];
    for (const t of tables) {
        console.log(`\n=== ${t} ===`);
        const cols = await p.$queryRawUnsafe<any[]>(
            `SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMNPROPERTY(OBJECT_ID(@P1), COLUMN_NAME, 'IsIdentity') AS isIdent
             FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME=@P1 ORDER BY ORDINAL_POSITION`, t);
        cols.forEach((c: any) => console.log(`  ${String(c.COLUMN_NAME).padEnd(28)} ${String(c.DATA_TYPE).padEnd(12)} null=${c.IS_NULLABLE} ident=${c.isIdent}`));
    }

    console.log('\n=== Quadro existente p/ ESC=119 TMA=1547 ano=2026 ===');
    const qua = await p.$queryRawUnsafe<any[]>(`
        SELECT * FROM EDU_QUADRO_DE_HORARIOS WHERE QUA_ESC_COD=119 AND QUA_TMA_COD=1547 AND QUA_ANO_LETIVO=2026
    `);
    console.log(qua);

    console.log('\n=== Sample QUADRO_DETALHE p/ ver convencoes (qq escola) ===');
    const sample = await p.$queryRawUnsafe<any[]>(`SELECT TOP 5 * FROM EDU_QUADRO_DE_HORARIOS_DETALHE`);
    console.log(sample);
}
main().catch(e => console.error(e)).finally(() => p.$disconnect());
