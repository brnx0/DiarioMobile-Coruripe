import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const p = new PrismaClient();

async function main() {
    const DIA_COD = 2;
    const NEW_DAT_COD = 2; // AVALIACAO 2 (notas numericas)

    const r = await p.$executeRawUnsafe(`
        UPDATE EDU_DIARIO_AVALIACAO SET DAT_COD = @P1 WHERE DIA_COD = @P2
    `, NEW_DAT_COD, DIA_COD);
    console.log(`Rows afetadas: ${r}. DIA_COD=${DIA_COD} agora tem DAT_COD=${NEW_DAT_COD}.`);
}

main().catch(e => console.error(e)).finally(() => p.$disconnect());
