import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const p = new PrismaClient();

const PROFESSOR_PES_COD = 6438; // teles
const ESC_COD = 119;
const ANO = 2026;

// Slots: [TMA_COD, DIS_COD, DIA, TEMPO]
// DIA: convencao tomcat legada -> 2=Seg,3=Ter,4=Qua,5=Qui,6=Sex,7=Sab (1=Dom)
const slots: { tma: number; dis: number; dia: number; tempo: number }[] = [
    // 3o Ano A - Arte (TMA=1547)
    { tma: 1547, dis: 116, dia: 2, tempo: 1 }, // segunda 1o tempo
    { tma: 1547, dis: 116, dia: 2, tempo: 2 }, // segunda 2o tempo
    { tma: 1547, dis: 116, dia: 4, tempo: 3 }, // quarta 3o tempo

    // 3o Ano A - Educacao Fisica (TMA=1547, DIS=121)
    { tma: 1547, dis: 121, dia: 6, tempo: 1 }, // sexta 1o tempo
    { tma: 1547, dis: 121, dia: 6, tempo: 2 }, // sexta 2o tempo

    // 5o Ano A - Geografia (TMA=1541, DIS=123)
    { tma: 1541, dis: 123, dia: 3, tempo: 1 }, // terca 1o
    { tma: 1541, dis: 123, dia: 3, tempo: 2 }, // terca 2o
    { tma: 1541, dis: 123, dia: 5, tempo: 4 }, // quinta 4o

    // 5o Ano A - Historia (TMA=1541, DIS=122)
    { tma: 1541, dis: 122, dia: 4, tempo: 1 }, // quarta 1o
    { tma: 1541, dis: 122, dia: 4, tempo: 2 }, // quarta 2o
];

async function ensureQuadro(tma: number): Promise<number> {
    const existing = await p.$queryRawUnsafe<any[]>(`
        SELECT TOP 1 QUA_COD FROM EDU_QUADRO_DE_HORARIOS
        WHERE QUA_ESC_COD=@P1 AND QUA_TMA_COD=@P2 AND QUA_ANO_LETIVO=@P3
    `, ESC_COD, tma, ANO);
    if (existing[0]) return existing[0].QUA_COD;

    const created = await p.$queryRawUnsafe<any[]>(`
        DECLARE @out TABLE (id INT);
        INSERT INTO EDU_QUADRO_DE_HORARIOS (QUA_ESC_COD, QUA_TMA_COD, QUA_ANO_LETIVO)
        OUTPUT INSERTED.QUA_COD INTO @out
        VALUES (@P1, @P2, @P3);
        SELECT id FROM @out;
    `, ESC_COD, tma, ANO);
    return Number(created[0].id);
}

async function main() {
    const tmaSet = Array.from(new Set(slots.map(s => s.tma)));
    const quaByTma = new Map<number, number>();
    for (const tma of tmaSet) {
        const qua = await ensureQuadro(tma);
        quaByTma.set(tma, qua);
        console.log(`TMA=${tma} -> QUA_COD=${qua}`);
    }

    let count = 0;
    for (const s of slots) {
        const qua = quaByTma.get(s.tma)!;
        // skip se ja existe slot identico
        const dup = await p.$queryRawUnsafe<any[]>(`
            SELECT 1 FROM EDU_QUADRO_DE_HORARIOS_DETALHE
            WHERE QUA_COD=@P1 AND TEMPO=@P2 AND PROFESSOR=@P3 AND DISCIPLINA=@P4 AND DIA=@P5
        `, qua, s.tempo, PROFESSOR_PES_COD, s.dis, s.dia);
        if (dup[0]) {
            console.log(`SKIP TMA=${s.tma} DIA=${s.dia} TEMPO=${s.tempo} DIS=${s.dis} (ja existe)`);
            continue;
        }
        await p.$executeRawUnsafe(`
            INSERT INTO EDU_QUADRO_DE_HORARIOS_DETALHE (QUA_COD, TEMPO, PROFESSOR, DISCIPLINA, DIA, TMP_EXTRA, CARENCIA_TEMP)
            VALUES (@P1, @P2, @P3, @P4, @P5, 'N', 'N')
        `, qua, s.tempo, PROFESSOR_PES_COD, s.dis, s.dia);
        count++;
        console.log(`OK TMA=${s.tma} DIA=${s.dia} TEMPO=${s.tempo} DIS=${s.dis}`);
    }
    console.log(`\nTotal inserido: ${count}`);
    console.log(`\nRollback:`);
    console.log(`  DELETE FROM EDU_QUADRO_DE_HORARIOS_DETALHE WHERE PROFESSOR=${PROFESSOR_PES_COD} AND QUA_COD IN (${Array.from(quaByTma.values()).join(',')});`);
}

main().catch(e => console.error(e)).finally(() => p.$disconnect());
