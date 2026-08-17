import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const p = new PrismaClient();

// Parametros de demo
const TMA_COD = 1547;       // 3o Ano A
const DIS_COD = 116;        // Arte
const ANO_LETIVO = 2026;
const UNS_COD = 1;          // 1a unidade
const DAT_COD = 1;          // AVALIACAO 1
const PES_COD_PROFESSOR = 6438; // teles
const DIA_DATA = new Date('2026-03-15');
const DIA_VALOR_MAXIMO = 10;
const DIA_TITULO = 'Avaliacao Demo';
const DIA_DESCRICAO = 'Avaliacao gerada para demonstracao';

async function main() {
    // INSERT EDU_DIARIO_AVALIACAO (tabela tem trigger -> OUTPUT precisa INTO @tmp)
    const inserted = await p.$queryRawUnsafe<any[]>(`
        DECLARE @out TABLE (diaCod INT);
        INSERT INTO EDU_DIARIO_AVALIACAO
        (TMA_COD, UNS_COD, DIS_COD, DIA_DATA, DIA_VALOR_MAXIMO, DIA_DESCRICAO, PES_COD, DAT_COD, DIA_TITULO)
        OUTPUT INSERTED.DIA_COD INTO @out
        VALUES (@P1, @P2, @P3, @P4, @P5, @P6, @P7, @P8, @P9);
        SELECT diaCod FROM @out;
    `,
        TMA_COD, UNS_COD, DIS_COD, DIA_DATA, DIA_VALOR_MAXIMO, DIA_DESCRICAO, PES_COD_PROFESSOR, DAT_COD, DIA_TITULO,
    );
    const diaCod = Number(inserted[0].diaCod);
    console.log(`Avaliacao inserida com DIA_COD=${diaCod}.`);

    // 3) listar alunos ativos da turma
    const alunos = await p.$queryRawUnsafe<any[]>(`
        SELECT ta.TMH_COD
        FROM EDU_TURMA_ALUNO ta
        WHERE ta.TMA_COD = @P1 AND ta.TMH_ANO_LETIVO = @P2 AND ta.TMH_HABILITADO = 'S'
    `, TMA_COD, ANO_LETIVO);
    console.log(`Alunos ativos: ${alunos.length}`);

    // 4) INSERT 1 row por aluno em EDU_DIARIO_AVALIACAO_ALUNO (DAA_VALOR NULL p/ app preencher)
    for (const a of alunos) {
        await p.$executeRawUnsafe(`
            INSERT INTO EDU_DIARIO_AVALIACAO_ALUNO (TMH_COD, DIA_COD, DAA_VALOR, DAA_DISPENSADO)
            VALUES (@P1, @P2, NULL, 'N')
        `, a.TMH_COD, diaCod);
    }
    console.log(`Notas vazias inseridas para ${alunos.length} alunos.`);
    console.log(`\nPara remover depois:`);
    console.log(`  DELETE FROM EDU_DIARIO_AVALIACAO_ALUNO WHERE DIA_COD = ${diaCod};`);
    console.log(`  DELETE FROM EDU_DIARIO_AVALIACAO WHERE DIA_COD = ${diaCod};`);
}

main().catch(e => console.error(e)).finally(() => p.$disconnect());
