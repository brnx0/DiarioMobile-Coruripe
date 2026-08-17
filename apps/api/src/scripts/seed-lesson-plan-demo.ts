import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const p = new PrismaClient();

const PES_COD = 6438;     // teles
const ESC_COD = 119;      // Grupo Escolar Dom Justino
const SER_COD = 139;      // 3o Ano
const DIS_COD = 116;      // Arte

const plans = [
    {
        TEMA: 'Cores primarias e secundarias',
        DATA: new Date('2026-03-17'),
        DATA_FIM: new Date('2026-03-21'),
        CONTEUDO:
            'Estudo das cores primarias (vermelho, azul, amarelo) e secundarias (verde, laranja, roxo). '
            + 'Discussao sobre o circulo cromatico, harmonia entre cores quentes e frias, '
            + 'e a influencia das cores na expressao artistica. Apresentacao de obras de Tarsila do Amaral, Volpi e Mondrian '
            + 'para observacao do uso das cores.',
        DESENVOLVIMENTO:
            '1. Roda de conversa inicial (15 min): perguntar quais cores os alunos conhecem e onde aparecem no dia a dia.\n'
            + '2. Apresentacao expositiva com cartazes do circulo cromatico (20 min).\n'
            + '3. Atividade pratica: mistura de tinta guache em paletas. Cada aluno produz tres cores secundarias a partir das primarias (30 min).\n'
            + '4. Producao final: cada aluno pinta uma paisagem livre usando somente cores que ele mesmo misturou (40 min).\n'
            + '5. Roda de apreciacao: alunos apresentam suas obras e identificam as cores usadas (15 min).\n\n'
            + 'Recursos: tinta guache (3 primarias), pincéis, paletas descartaveis, papel A3, copos com agua, panos.\n'
            + 'Avaliacao: participacao na roda, organizacao do material, criatividade na composicao final.',
    },
    {
        TEMA: 'Releitura de obras - Tarsila do Amaral',
        DATA: new Date('2026-03-24'),
        DATA_FIM: new Date('2026-03-28'),
        CONTEUDO:
            'Apresentacao da artista Tarsila do Amaral, contexto modernista brasileiro e analise das obras '
            + '"Abaporu", "Operarios" e "A Negra". Conceito de releitura como forma de homenagem e reinterpretacao artistica. '
            + 'Identificacao de elementos visuais: cores, formas, proporcao e expressao.',
        DESENVOLVIMENTO:
            '1. Apresentacao biografica e contextualizacao historica do Modernismo brasileiro (20 min).\n'
            + '2. Exibicao de slides com obras de Tarsila + analise coletiva guiada (20 min).\n'
            + '3. Atividade pratica: cada aluno escolhe uma das tres obras e produz sua releitura em papel A3 '
            + '   usando lapis de cor, giz pastel ou tinta (60 min).\n'
            + '4. Montagem de exposicao na sala com as releituras dos alunos.\n\n'
            + 'Recursos: projetor, slides das obras, papel A3, lapis de cor, giz pastel, fita crepe para exposicao.\n'
            + 'Avaliacao: identificacao dos elementos da obra original, criatividade na releitura, organizacao do trabalho.',
    },
];

async function main() {
    let count = 0;
    for (const plan of plans) {
        await p.$executeRawUnsafe(`
            INSERT INTO EDU_PLANO_AULA (PES_COD, ESC_COD, SER_COD, DIS_COD, TEMA, DATA, DATA_FIM, CONTEUDO, DESENVOLVIMENTO)
            VALUES (@P1, @P2, @P3, @P4, @P5, @P6, @P7, @P8, @P9)
        `,
            PES_COD, ESC_COD, SER_COD, DIS_COD, plan.TEMA, plan.DATA, plan.DATA_FIM, plan.CONTEUDO, plan.DESENVOLVIMENTO,
        );
        count++;
        console.log(`Plano "${plan.TEMA}" inserido.`);
    }
    console.log(`\nTotal: ${count} planos.`);
    console.log(`\nPara remover depois:`);
    console.log(`  DELETE FROM EDU_PLANO_AULA WHERE PES_COD = ${PES_COD} AND ESC_COD = ${ESC_COD} AND DIS_COD = ${DIS_COD} AND DATA >= '2026-03-17';`);
}

main().catch(e => console.error(e)).finally(() => p.$disconnect());
