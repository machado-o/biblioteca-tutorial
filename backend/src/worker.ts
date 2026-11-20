import { queue, work } from "./infrastructure/queue";
import { catalogIntegration } from "./integration/catalogIntegration";
import { bookIndexJob } from "./modules/catalog";
import { loanReceiptJob } from "./modules/circulation";

/**
 * O worker: o mesmo código da aplicação, com outro ponto de entrada. Não abre
 * porta nem prepara o banco (isso é do app); só consome a fila. Cada tarefa vem
 * do index.ts do módulo dono, como as fatias chegam ao composition.ts.
 */
if (!queue) throw new Error("QUEUE_URL não definida: o worker só existe junto da fila");

// no Docker, o HOSTNAME é o id do contêiner: com --scale, cada worker tem o seu nome
const consumer = process.env.HOSTNAME ?? `worker-${process.pid}`;
console.log(`Worker ${consumer} esperando tarefas`);

await work([bookIndexJob(catalogIntegration), loanReceiptJob()], { client: queue, consumer });
process.exit(0);
