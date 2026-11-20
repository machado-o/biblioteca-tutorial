import { afterAll, expect, test } from "bun:test";
import { api, testCopy } from "#tests/api";
import { testReader } from "#tests/reader-fixtures";
import { createMemorySender, emailSender, type MemorySender } from "../../../infrastructure/email";
import { sql } from "../../../infrastructure/postgres";
import { prepareGroups, workOnce } from "../../../infrastructure/queue";
import { createRedis } from "../../../infrastructure/redis";
import { inTransaction } from "../../../infrastructure/transaction";
import type { EmailSender } from "../../../shared/EmailSender";
import { circulationDependencies } from "./dependencies";
import { loanReceiptJob, scheduleLoanReceipt, sendLoanReceipt } from "./loanReceiptJob";
import { brazilianDate } from "./receiptEmail";
import { RegisterLoan } from "../features/register-loan/RegisterLoan";

/*
 * Testes de aceite da atividade. Cada um começa como test.todo: o bun test lista,
 * mas não executa. Quando implementar a parte que um teste cobre, troque
 * test.todo por test e rode a suíte. Não altere o que os testes esperam.
 */

// a suíte roda sem QUEUE_URL; aqui o cliente da fila é explícito, como nos testes da aula
const queue = createRedis(process.env.TEST_QUEUE_URL ?? "redis://fila:6379");
afterAll(() => queue.close());

// sem espera: cada volta do worker lê o que há na fila e devolve o controle ao teste
const workerOptions = { client: queue, consumer: "teste", blockMs: null, retryAfterMs: 300, maxDeliveries: 2 };

/** Um provedor de e-mail fora do ar. */
const failing: EmailSender = {
  async send() {
    throw new Error("provedor de e-mail fora do ar");
  },
};

/** Um empréstimo de um leitor novo, registrado pelo caso de uso, sem passar pela rota: o comprovante ainda não saiu. */
async function newLoan() {
  const reader = await testReader();
  const copy = await testCopy();
  const loan = await inTransaction((tx) => new RegisterLoan(...circulationDependencies(tx)).execute(reader.id, copy.id));
  return { reader, loan };
}

async function receiptSentAt(loanId: number): Promise<Date | null> {
  const [row] = await sql`SELECT comprovante_enviado_em AS "sentAt" FROM emprestimos WHERE id = ${loanId}`;
  return row.sentAt;
}

const sentTo = (sender: MemorySender, address: string) => sender.sent.filter((email) => email.to === address);

test("o stream dos comprovantes pertence à Circulação", () => {
  expect(loanReceiptJob(null).stream).toBe(`${process.env.REDIS_PREFIX ?? "biblioteca"}:circulacao:fila:comprovantes`);
});

test("UC19 API: sem fila, o comprovante sai na hora, para o e-mail do leitor", async () => {
  const reader = await testReader();
  const copy = await testCopy();
  const response = await api("POST", "/emprestimos", { leitorId: reader.id, exemplarId: copy.id });
  expect(response.status).toBe(201);
  const loan = await response.json();
  // a suíte manda os e-mails para a caixa de saída em memória (EMAIL_PROVIDER=memory)
  const received = sentTo(emailSender as MemorySender, reader.email);
  expect(received).toHaveLength(1);
  expect(received[0]).toMatchObject({ toName: reader.nome, subject: `Comprovante de empréstimo: ${loan.livroTitulo}` });
  expect(received[0]!.text).toContain(`exemplar ${loan.numeroRegistro}`);
  expect(received[0]!.text).toContain(`Devolva até ${brazilianDate(loan.dataPrevistaDevolucao)}`);
  expect(await receiptSentAt(loan.id)).not.toBeNull();
});

test("UC19: com fila, a mensagem leva só o id do empréstimo, e o worker manda o comprovante", async () => {
  const { reader, loan } = await newLoan();
  const sender = createMemorySender();
  const job = loanReceiptJob(sender);
  await prepareGroups([job], queue);
  await scheduleLoanReceipt(loan.id, { client: queue, sender });
  // publicou e voltou: ninguém mandou nada ainda
  expect(sender.sent).toHaveLength(0);
  const [last] = await queue.send("XREVRANGE", [job.stream, "+", "-", "COUNT", "1"]) as [string, string[]][];
  const fields = last![1];
  expect(JSON.parse(fields[fields.indexOf("dados") + 1]!)).toEqual({ loanId: loan.id });
  await workOnce([job], workerOptions);
  expect(sentTo(sender, reader.email)).toHaveLength(1);
  expect(await receiptSentAt(loan.id)).not.toBeNull();
});

test("a mesma mensagem entregue duas vezes manda um e-mail só", async () => {
  const { reader, loan } = await newLoan();
  const sender = createMemorySender();
  const job = loanReceiptJob(sender);
  await job.handle({ loanId: loan.id });
  await job.handle({ loanId: loan.id });
  expect(sentTo(sender, reader.email)).toHaveLength(1);
  expect(await sendLoanReceipt(loan.id, sender)).toBe("já enviado");
});

test("o leitor trocou de e-mail antes do envio: o comprovante vai para o endereço atual", async () => {
  const { reader, loan } = await newLoan();
  const sender = createMemorySender();
  const job = loanReceiptJob(sender);
  await prepareGroups([job], queue);
  await scheduleLoanReceipt(loan.id, { client: queue, sender });
  const newEmail = `${crypto.randomUUID()}@exemplo.com`;
  const update = await api("PUT", `/leitores/${reader.id}`, { nome: reader.nome, cpf: reader.cpf, email: newEmail, telefone: reader.telefone });
  expect(update.status).toBe(200);
  await workOnce([job], workerOptions);
  expect(sentTo(sender, reader.email)).toHaveLength(0);
  expect(sentTo(sender, newEmail)).toHaveLength(1);
});

test("se o provedor falha, a tarefa lança e o comprovante não fica marcado; a nova tentativa envia", async () => {
  const { reader, loan } = await newLoan();
  await expect(loanReceiptJob(failing).handle({ loanId: loan.id })).rejects.toThrow("provedor de e-mail fora do ar");
  expect(await receiptSentAt(loan.id)).toBeNull();
  const sender = createMemorySender();
  await loanReceiptJob(sender).handle({ loanId: loan.id });
  expect(sentTo(sender, reader.email)).toHaveLength(1);
  expect(await receiptSentAt(loan.id)).not.toBeNull();
});

test("sem fila, o comprovante sai na hora; se o provedor falha, pedir o comprovante não lança", async () => {
  const { reader, loan } = await newLoan();
  await scheduleLoanReceipt(loan.id, { client: null, sender: failing });
  expect(await receiptSentAt(loan.id)).toBeNull();
  const sender = createMemorySender();
  await scheduleLoanReceipt(loan.id, { client: null, sender });
  expect(sentTo(sender, reader.email)).toHaveLength(1);
});

test("empréstimo inexistente não manda nada nem lança; mensagem sem o id falha", async () => {
  const sender = createMemorySender();
  expect(await sendLoanReceipt(2147483647, sender)).toBe("empréstimo não encontrado");
  await loanReceiptJob(sender).handle({ loanId: 2147483647 });
  await expect(loanReceiptJob(sender).handle({ loanId: "7" } as never)).rejects.toThrow("sem o id do empréstimo");
  await expect(loanReceiptJob(sender).handle(null as never)).rejects.toThrow("sem o id do empréstimo");
  expect(sender.sent).toHaveLength(0);
});

test("sem remetente configurado, nada é enviado nem marcado", async () => {
  const { loan } = await newLoan();
  expect(await sendLoanReceipt(loan.id, null)).toBe("sem remetente");
  await loanReceiptJob(null).handle({ loanId: loan.id });
  expect(await receiptSentAt(loan.id)).toBeNull();
});

/*
 * Passo 07: para discutir.
 *
 * 1. Marcar antes ou depois. Aqui a marca vem depois do envio. Se o processo
 *    morrer entre os dois, a mensagem fica sem XACK, volta, e o leitor recebe o
 *    comprovante duas vezes. Na ordem inversa (marcar e depois enviar), morrer no
 *    meio deixa a coluna preenchida sem e-mail: a nova tentativa encontra "já
 *    enviado" e o leitor nunca recebe. Para um comprovante, repetido é melhor que
 *    nenhum. Numa cobrança no cartão, a resposta muda: cobrar duas vezes é pior que
 *    não cobrar, e o certo seria uma chave de idempotência aceita pelo provedor.
 *
 * 2. O outbox. Se a aplicação cair entre o COMMIT e o XADD, o empréstimo existe e
 *    nenhuma mensagem foi publicada: o comprovante nunca sai. A coluna nula ajuda a
 *    achá-los: uma varredura periódica republica { loanId } dos empréstimos com
 *    comprovante_enviado_em IS NULL registrados há mais de alguns minutos (para não
 *    disputar com o pedido normal, que ainda pode estar a caminho). Os empréstimos
 *    anteriores a esta atividade também têm a coluna nula: a varredura precisa de
 *    um corte (só empréstimos depois da data da implantação), ou eles teriam de ser
 *    marcados de uma vez, sem envio, na migração. O outbox de verdade grava a
 *    tarefa numa tabela na mesma transação do empréstimo, e um publicador a leva
 *    para a fila.
 *
 * 3. Dois workers, a mesma mensagem. A coluna só é preenchida depois do envio;
 *    se o provedor demorar mais de 10 s, o XCLAIM entrega a mensagem a outro worker,
 *    que ainda vê a coluna nula e envia de novo: dois e-mails. O adaptador desiste em
 *    5 s justamente para terminar (com sucesso ou erro) antes dos 10 s da nova
 *    entrega. Um UPDATE ... WHERE comprovante_enviado_em IS NULL RETURNING id antes
 *    do envio funciona como trava: só um worker ganha. O custo: se o envio falhar,
 *    é preciso desfazer a marca (UPDATE ... SET NULL); se o processo morrer antes
 *    disso, a marca fica e o comprovante nunca sai. Uma coluna de "reservado em",
 *    com prazo, resolveria os dois lados.
 *
 * 4. A fila de mortas. Reprocessar é ler cada mensagem de ...:mortas com XRANGE e
 *    publicar de novo o campo dados no stream original (XADD), apagando-a das mortas
 *    (XDEL). É seguro porque a tarefa é idempotente: comprovante já enviado devolve
 *    "já enviado". A mensagem {"loanId":"7"} não: ela falha pela validação, e vai
 *    falhar sempre; o certo é investigar quem a publicou. Quem opera o sistema
 *    precisa saber: um alerta no monitoramento sobre o lag do grupo e o tamanho
 *    (XLEN) da fila de mortas.
 *
 * 5. O e-mail é dado pessoal. A mensagem só leva o id, mas o e-mail passa pela
 *    memória do worker, pela requisição ao provedor, fica na caixa do Mailpit (ou
 *    nos logs e no histórico de um provedor real), no próprio e-mail entregue e nos
 *    backups do Postgres. Com só o id na mensagem, a fila e a fila de mortas (que
 *    têm volume e guardam até 10 mil mensagens) não viram mais uma cópia do dado
 *    pessoal, e um pedido de exclusão do leitor não precisa alcançá-las.
 */
