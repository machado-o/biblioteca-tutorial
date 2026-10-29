# Reestruturação do backend — monólito modular com fatias verticais

**Estado: aplicado no backend e no frontend em 2026-10-29 (typecheck, build, lint, fronteiras e 65 testes passando; rotas da API e das telas idênticas).**
Working tree limpo em `saas-evolution/fase02`, HEAD `cd8700b`. Na linha de base, `bun run typecheck` e
`bun run verificar` passam.

Este documento guarda tudo o que foi decidido e o contrato completo da execução, para retomar sem a
conversa original.

## 1. Objetivo

- Eliminar `backend/src/use-cases/ucNN.ts`. Cada caso de uso vira uma pasta (fatia) dentro do seu módulo.
- Dar a mesma estrutura interna aos quatro módulos e remover o código legado do tutorial.
- Usar inglês em pastas, arquivos e identificadores.
- Manter o comportamento idêntico: mesmas rotas, payloads, status HTTP, schema do banco e mensagens.

## 2. Decisões do usuário (2026-10-29)

1. O código legado do tutorial pode sair. Ele continua preservado nas branches `modular-monolith/*`.
2. Nenhum arquivo pode ter nome sem sentido arquitetural ou semântico, como `uc02.ts`.
3. Pastas, arquivos e identificadores ficam em inglês: entidades, tipos, funções, variáveis, parâmetros e
   propriedades de objetos internos.
4. O contrato externo continua em **português**:
   - rotas HTTP e nomes de query params;
   - campos JSON de entrada e saída;
   - valores enumerados expostos ou persistidos (`em_aberto`, `disponivel`, `ativa`, `literatura`);
   - tabelas e colunas do PostgreSQL e o JSON persistido.

   Mensagens exibidas ao usuário também continuam em português.
5. Comentários, JSDoc e títulos de testes continuam em português.
6. O frontend (`frontend/src/use-cases/ucNN.tsx`) fica para uma etapa posterior, com o mesmo padrão.
7. O glossário da seção 4 foi aprovado.
8. A execução usa um workflow multiagente, para acelerar.

## 3. Regras da estrutura

1. **Módulo** = `index.ts` + `domain/` + `infrastructure/` + `features/<slice>/`:
   - `index.ts`: API pública do módulo;
   - `domain/`: regras, tipos, portas e parsers de entrada, sem SQL;
   - `infrastructure/`: `schema.ts`, SQL usado por mais de uma fatia, repositórios Postgres e `json.ts`,
     que monta o JSON da API em português.
2. **Fatia** = `route.ts` + caso de uso + `<slice>.test.ts`. Uma fatia não importa outra; só os testes
   podem fazer isso. O `route.ts` exporta `registerRoutes(api: Hono)` e, nessa função:
   - lê a entrada HTTP;
   - abre a transação e monta as dependências;
   - chama o caso de uso e aplica o presenter de `json.ts`.
3. SQL que cruza módulos fica só em `src/integration/`:
   - `integration/` importa módulos só pelo `index.ts`;
   - fatias podem importar `integration/` para montar dependências.
4. A raiz de `src/` contém só pontos de entrada (`main.ts`, `seed.ts`, `import-books.ts`) e composição
   (`server.ts`, `composition.ts`).
5. Português no código aparece só em:
   - strings visíveis ao usuário;
   - strings com nomes de campos, rotas e colunas, como `getFieldAsText(data, "titulo")`,
     `c.req.query("situacao")` ou SQL;
   - chaves JSON da API em `infrastructure/json.ts`;
   - valores enumerados persistidos ou expostos;
   - JSON persistido do seed;
   - comentários e títulos de teste.
6. O SQL devolve objetos já em inglês, via alias de coluna: `titulo AS title`, `autor_id AS "authorId"`.
7. Literais usados só internamente viram inglês. Exemplo: a tiragem `"curta"`/`"ampla"` vira
   `PrintRun = "short" | "large"`.
8. Arquivos têm o nome do export principal:
   - PascalCase para classes e tipos;
   - camelCase para módulos de funções;
   - kebab-case para pastas de fatia, testes de fatia e suporte de testes.
9. Verbos: `executar`→`execute`, `obter`→`get`, `cadastrar`→`create`, `buscar`→`search`,
   `atualizar`→`update`, `excluir`→`delete`, `preparar`→`prepare`, `verificar`→`check`,
   `registrar`→`register`.

## 4. Glossário

| Português | Inglês |
|---|---|
| acervo (módulo) | `catalog` |
| autoria (módulo) | `authorship` |
| leitores (módulo) | `readers` |
| circulacao (módulo) | `circulation` |
| Livro | `Book` |
| Exemplar | `Copy` |
| Autor | `Author` |
| Leitor | `Reader` |
| Reserva | `Reservation` |
| Empréstimo | `Loan` |
| Devolução | `Return` |
| integração entre módulos (`adapters/`) | `integration/` |

### 4.1 Propriedades internas ↔ JSON / coluna

| Entidade | Interno (inglês) | JSON (API) | Coluna |
|---|---|---|---|
| Book | `id`, `isbn`, `title`, `authorId`, `authorName`, `catalogedOn`, `authorBookCount`, `totalCopies`, `availableCopies` | `id`, `isbn`, `titulo`, `autorId`, `autor`, `dataCatalogacao`, `livrosDoAutor`, `totalExemplares`, `exemplaresDisponiveis` | `titulo`, `autor_id`, `data_catalogacao` |
| Copy | `id`, `bookId`, `registrationNumber`, `location`, `condition`, `catalogedOn`, `status`, `title`, `isbn` | `id`, `livroId`, `numeroRegistro`, `localizacao`, `estadoConservacao`, `dataCatalogacao`, `titulo`, `isbn`, `situacao` | `livro_id`, `numero_registro`, `localizacao`, `estado_conservacao`, `data_catalogacao` |
| Author | `id`, `name`, `type`, `bookCount` | `id`, `nome`, `tipo`, `livrosNoAcervo` | `nome`, `tipo`, `livros_no_acervo` |
| Reader | `id`, `name`, `cpf`, `email`, `phone` | `id`, `nome`, `cpf`, `email`, `telefone` | `nome`, `cpf`, `email`, `telefone` |
| Reservation | `id`, `readerId`, `copyId`, `reservedOn`, `pickupDeadline`, `expiresOn`, `status` (+ view: `readerName`, `readerCpf`, `bookTitle`, `registrationNumber`) | `id`, `leitorId`, `exemplarId`, `dataReserva`, `dataLimiteRetirada`, `dataExpiracao`, `situacao`, `leitorNome`, `leitorCpf`, `livroTitulo`, `numeroRegistro` | `leitor_id`, `exemplar_id`, `data_reserva`, `data_limite_retirada`, `data_expiracao`, `situacao` |
| Loan | `id`, `readerId`, `copyId`, `loanedOn`, `dueOn`, `returnedOn` (+ view: `status`, `daysOverdue`, `readerName`, `readerCpf`, `bookTitle`, `registrationNumber`) | `id`, `leitorId`, `exemplarId`, `dataEmprestimo`, `dataPrevistaDevolucao`, `dataDevolucao`, `situacao`, `diasDeAtraso`, `leitorNome`, `leitorCpf`, `livroTitulo`, `numeroRegistro` | `data_emprestimo`, `data_prevista_devolucao`, `data_devolucao` |
| Filtros (query) | `readerId`, `copyId`, `status`; exemplares: `q`, `bookId`, `status` | `leitorId`, `exemplarId`, `situacao`; `q`, `livroId`, `situacao` | — |

Os valores enumerados ficam como estão, porque são dados do banco e da API:

| Tipo | Valores |
|---|---|
| `CopyAvailability` | `"disponivel" \| "reservado" \| "emprestado"` |
| `ReservationStatus` | `"ativa" \| "cancelada" \| "atendida"` |
| `LoanStatus` | `"em_aberto" \| "atrasado" \| "devolvido"` |
| `AuthorType` | `"literatura" \| "didatico"` |

Também não mudam `SEED_VERSION = "uc23-v1"` e os valores de entidade de `seed_registros`.

## 5. Árvore alvo

```
backend/
├── package.json            scripts: check-boundaries (ex verificar), import-books (ex importar);
│                           "name" continua "biblioteca" (bun.lock + --frozen-lockfile)
├── scripts/check-boundaries.ts
├── tests/                  suporte + testes da aplicação inteira
│   ├── api.ts              (ex suporte-api.ts)
│   ├── reader-fixtures.ts  (ex leitoresApiFixture.ts)
│   ├── reader-doubles.ts   (ex leitoresDouble.ts)
│   ├── circulation-doubles.ts (ex circulacaoDouble.ts)
│   ├── clean-catalog.ts    (ex limpar-acervo-teste.ts)
│   ├── server.e2e.test.ts  (ex cadastro.e2e.test.ts)
│   └── import-books.test.ts (ex importacao.test.ts)
└── src/
    ├── main.ts             prepareDatabase → loadSlices → createServer
    ├── seed.ts             CLI do seed (comando do README igual)
    ├── import-books.ts     CLI da importação CSV (ex importar.ts)
    ├── server.ts           createApp(slices) / createServer(slices, port); sem rotas legadas
    ├── composition.ts      prepareDatabase() + loadSlices()
    ├── infrastructure/     postgres.ts · transaction.ts (inTransaction)
    ├── shared/             errors · domain-errors · Clock · validation (+parseId) · http · dates
    ├── integration/
    │   ├── catalogIntegration.ts        (ex adapters/acervoIntegracao.ts)
    │   ├── authorshipIntegration.ts     (ex adapters/autoriaIntegracao.ts)
    │   ├── PostgresReaderHistory.ts     (ex adapters/LeitorHistoricoPostgres.ts)
    │   ├── PostgresCirculationLookup.ts (ex adapters/ConsultaCirculacaoPostgres.ts)
    │   └── seed/  route.ts · run.ts · report.ts · schema.ts · catalog.ts · catalog.json · seed.test.ts
    └── modules/
        ├── catalog/
        │   ├── index.ts
        │   ├── domain/  Isbn · RegistrationNumber · BookLimit · Book · Copy · CatalogIntegration
        │   │            + BookLimit.test.ts · RegistrationNumber.test.ts (sem banco)
        │   ├── infrastructure/  schema.ts · books.ts · copies.ts · json.ts
        │   └── features/
        │       ├── create-book/   route.ts · createBook.ts · create-book.test.ts
        │       ├── search-books/  route.ts · searchBooks.ts · getBook.ts · search-books.test.ts
        │       ├── update-book/   route.ts · updateBook.ts · update-book.test.ts
        │       ├── delete-book/   route.ts · deleteBook.ts · delete-book.test.ts
        │       ├── create-copy/   route.ts · createCopy.ts · create-copy.test.ts
        │       ├── search-copies/ route.ts · searchCopies.ts · getCopy.ts · search-copies.test.ts
        │       ├── update-copy/   route.ts · updateCopy.ts · update-copy.test.ts
        │       └── delete-copy/   route.ts · deleteCopy.ts · delete-copy.test.ts
        ├── authorship/
        │   ├── index.ts
        │   ├── domain/  Author · AuthorshipIntegration
        │   ├── infrastructure/  schema.ts · authors.ts · json.ts
        │   └── features/  create-author · search-authors (searchAuthors + getAuthor) · update-author · delete-author
        ├── readers/
        │   ├── index.ts
        │   ├── domain/  Reader · ReaderRepository · ReaderHistory
        │   ├── infrastructure/  schema.ts · PostgresReaderRepository.ts · json.ts
        │   └── features/  create-reader (CreateReader) · search-readers (SearchReaders)
        │                  update-reader (UpdateReader) · delete-reader (DeleteReader)
        └── circulation/
            ├── index.ts
            ├── domain/  Reservation · Loan · CirculationLookup · CirculationRepository · CirculationUseCase
            ├── infrastructure/  schema.ts · PostgresCirculationRepository.ts · dependencies.ts · json.ts
            └── features/  reserve-copy (ReserveCopy) · cancel-reservation (CancelReservation)
                           register-loan (RegisterLoan) · register-return (RegisterReturn)
                           list-loans (ListLoans) · list-reservations (ListReservations)
```

### 5.1 UC → fatia (vai para o README)

| UC | Fatia | Rotas |
|---|---|---|
| UC01 | `catalog/features/create-book` | `POST /livros` |
| UC02 | `catalog/features/search-books` | `GET /livros?q=`, `GET /livros/id/:id`, `GET /livros/:q` (busca legada, que estava em uc01) |
| UC03 | `catalog/features/update-book` | `PUT /livros/:id` |
| UC04 | `catalog/features/delete-book` | `DELETE /livros/:id` |
| UC05 | `authorship/features/create-author` | `POST /autores` |
| UC06 | `authorship/features/search-authors` | `GET /autores?q=`, `GET /autores/:id` |
| UC07 | `authorship/features/update-author` | `PUT /autores/:id` |
| UC08 | `authorship/features/delete-author` | `DELETE /autores/:id` |
| UC09 | `readers/features/create-reader` | `POST /leitores` |
| UC10 | `readers/features/search-readers` | `GET /leitores?q=`, `GET /leitores/:id` |
| UC11 | `readers/features/update-reader` | `PUT /leitores/:id` |
| UC12 | `readers/features/delete-reader` | `DELETE /leitores/:id` |
| UC13 | `catalog/features/create-copy` | `POST /exemplares` |
| UC14 | `catalog/features/search-copies` | `GET /exemplares`, `GET /exemplares/:id` |
| UC15 | `catalog/features/update-copy` | `PUT /exemplares/:id` |
| UC16 | `catalog/features/delete-copy` | `DELETE /exemplares/:id` |
| UC17 | `circulation/features/reserve-copy` | `POST /reservas` |
| UC18 | `circulation/features/cancel-reservation` | `POST /reservas/:id/cancelamento` |
| UC19 | `circulation/features/register-loan` | `POST /emprestimos` |
| UC20 | `circulation/features/register-return` | `POST /emprestimos/:id/devolucao` |
| UC21 | `circulation/features/list-loans` | `GET /emprestimos`, `GET /emprestimos/:id` |
| UC22 | `circulation/features/list-reservations` | `GET /reservas`, `GET /reservas/:id` |
| UC23 | `integration/seed` | `GET /seed`, `POST /seed` |

Cada `route.ts` leva um JSDoc de uma linha com o número da UC.

## 6. Contratos compartilhados (fundação, feita no fio principal antes do workflow)

| Arquivo | Conteúdo |
|---|---|
| `shared/http.ts` (ex `adapters/circulacaoHttp.ts`) | `type RegisterRoutes = (api: Hono) => void`; `parsePositiveId(value, label = "Identificador")` (ex `idPositivo`); `readJsonBody(c)` (ex `corpoJson`); `parseIdFilter(value)` (ex `filtroId`). Mensagens idênticas. |
| `shared/validation.ts` | Mantém `getBodyAsObject`, `getFieldAsText`, `getFieldAsPositiveInt`. Acrescenta `parseId(raw) = getFieldAsPositiveInt({ id: raw }, "id")`, que substitui `identificador` (acervo) e `idDoAutor` (autoria), funções idênticas. `parseId` e `parsePositiveId` têm mensagens e limites diferentes de propósito: preservam o comportamento atual. |
| `shared/dates.ts` | `civilDate(instant: Date)` (ex `diaDoCatalogo`); `today(clock = () => new Date())` (ex `hoje`); `addDays(date, days)` (ex `somarDias`). Fuso `America/Sao_Paulo`, formato `en-CA`. |
| `infrastructure/transaction.ts` | `emTransacao` → `inTransaction(run)` |
| `composition.ts` | `prepareDatabase()` chama, nesta ordem: `prepareAuthorship()`, `prepareCatalog()`, `prepareReaders()`, `prepareCirculation()`, `prepareSeed()`. `loadSlices()` faz glob de `modules/*/features/*/route.ts` e `integration/*/route.ts`, ordena, importa e exige `registerRoutes` (função). |
| `server.ts` | `createApp(slices: RegisterRoutes[] = [])`; `createServer(slices, port = Number(process.env.PORT ?? 3000))`. Sai a lógica de ids `uc01`/`uc02`. |
| `main.ts` | `await prepareDatabase()`; `createServer(await loadSlices())` |
| `tests/api.ts` | `api`, `TestResponse`, `testName`, `testIsbn`, `testAuthor(type = "literatura")`, `testBook()`, `testCopy()`. Os tipos de retorno mantêm as chaves do JSON da API. |
| `tests/reader-fixtures.ts` | `testCpf()`, `testReader(): Promise<{ id; nome; cpf; email; telefone }>` |
| `tests/clean-catalog.ts` | `cleanTestCatalog()` (ex `limparAcervoDeTeste`) |
| `tests/server.e2e.test.ts` | Ex `cadastro.e2e.test.ts`, com identificadores em inglês. |

Remover na fundação:
- `src/use-cases/loader.ts` e `src/use-cases/types.ts`;
- `src/infrastructure/db.ts`;
- `src/shared/EventBus.ts` e `src/shared/identifiers.ts`;
- `src/adapters/AutoriaComoConsulta.ts` e `src/adapters/circulacaoHttp.ts` (este depois de virar `shared/http.ts`);
- `tests/doubles.ts` e `tests/cadastrar-livro.test.ts`.

**Alias para os testes co-localizados importarem `tests/`:**
- preferido: `package.json` → `"imports": { "#tests/*": "./tests/*.ts" }`;
- alternativa: `paths` no tsconfig;
- último recurso: imports relativos.

Testar antes com Bun 1.4.4 e TypeScript 7.0.2.

## 7. Contratos por módulo

### 7.1 catalog (ex acervo)

**`index.ts`:**
```ts
export { prepareCatalog } from "./infrastructure/schema";
export type { CatalogAuthor, CatalogDb, CatalogIntegration, CopyAvailability } from "./domain/CatalogIntegration";
export { Isbn } from "./domain/Isbn";
```

**`domain/`:**

| Arquivo | Conteúdo |
|---|---|
| `Isbn.ts` | O método privado `digitoConfere` vira `checkDigitMatches`. |
| `RegistrationNumber.ts` (ex `NumeroRegistro`) | `SEQUENCE_DIGITS`; `next(year, catalogedInYear)`. |
| `BookLimit.ts` (ex `LimiteDeLivros`) | `PrintRun`; `BookLimitExceeded` (mensagem igual); `BookLimit.limitFor`; `BookLimit.check`; mapa `{ short: 5, large: 10 }`. |
| `Book.ts` | `BookInput { isbn; title; authorId }`, `BookView`, `parseBookInput(body)` (ex `dadosDoLivro`; lê `isbn`, `titulo`, `autorId`). |
| `Copy.ts` | `CopyInput { location; condition }`, `NewCopyInput { bookId; location; condition }`, `CopyView`, `parseCopyInput` (ex `dadosFisicos`), `parseNewCopyInput`. O `parseNewCopyInput` valida `livroId` antes de `localizacao` e `estadoConservacao`, na mesma ordem de hoje. |
| `CatalogIntegration.ts` (topo de `catalogo.ts`) | `CatalogDb = SQL \| TransactionSQL`; `CatalogAuthor { id; name; type }`; `CopyAvailability`; `CatalogIntegration` com `author`, `authorIdsByName`, `syncAuthorBookCounts`, `copyAvailability`, `copyHasHistory`. |

**`infrastructure/`:**
- `schema.ts`: `prepareCatalog()` junta, nesta ordem e com o SQL idêntico:
  1. o conteúdo de `postgresSchema.ts`;
  2. o `ALTER TABLE livros ALTER COLUMN numero_registro DROP NOT NULL` de `prepararCatalogo`, dentro de `inTransaction`;
  3. o corpo de `prepararExemplares`.
- `books.ts`: `BookRow`, `findBook` (ex `obterLivro`), `toBookView` (ex `livroDoCatalogo`), `checkBookRules` (ex `verificarLivro`).
- `copies.ts`: `findCopyView` (ex `exemplarDoCatalogo`).
- `json.ts`: `bookJson`, `copyJson`, com as chaves na mesma ordem de hoje.

**Fatias:**
- `create-book`: `createBook(input, integration, now)`. Header `Location: /api/livros/${isbn}`.
- `search-books`: `searchBooks(term, …)` e `getBook(id, …)`. A rota legada `GET /livros/:q` vem para cá.
- `update-book`: `updateBook(id, input, …)`.
- `delete-book`: `deleteBook(id, …)`.
- `create-copy`: `createCopy(input, …)`.
- `search-copies`: `searchCopies(filters, …)` e `getCopy(id, …)`.
- `update-copy`: `updateCopy(id, input, …)`.
- `delete-copy`: `deleteCopy(id, …)`.

**Integração:** `integration/catalogIntegration.ts` exporta `catalogIntegration`, com o helper `tableExists`
(ex `tabelaExiste`).

**CLI:** `src/import-books.ts` (ex `importar.ts`):
- chama `prepareDatabase()`, depois `parseBookInput({ isbn, titulo, autorId: Number(autorId) })` e `createBook`;
- muda o texto de uso para `bun run import-books`;
- mantém a saída `importados: X | rejeitados: Y`.

**Remover (legado):**
- `features/cadastrar-livro/*`, `features/buscar-livro/*`;
- `routes.ts`, `output.ts`;
- `domain/{ConsultaDeAutoria,Livro,LivroRepository,events}.ts`;
- `infrastructure/{SqliteLivroRepository,PostgresLivroRepository,postgresSchema}.ts` e o `schema.ts` SQLite.

**Testes novos sem banco:**
- `domain/BookLimit.test.ts`: RF05 e RF05′ (5/10, mensagem);
- `domain/RegistrationNumber.test.ts`: RF06 e RF07 (formato, sequencial, recomeço por ano, valor inválido).

O README passa a citar `bun test src/modules/catalog/domain` como verificação local sem PostgreSQL.

### 7.2 authorship (ex autoria)

**`index.ts`:**
```ts
export { prepareAuthorship } from "./infrastructure/schema";
export type { AuthorshipDb, AuthorshipIntegration } from "./domain/AuthorshipIntegration";
```

**`domain/`:**
- `Author.ts`: `AuthorType`, `AuthorInput { name; type }`, `AuthorView { id; name; type; bookCount }`,
  `parseAuthorInput(body)` (ex `dadosDoAutor`; valida `tipo` antes de `nome`, na mesma ordem de hoje).
- `AuthorshipIntegration.ts`: `AuthorshipDb`, `AuthorshipIntegration { countBooks(db, authorId) }`.

**`infrastructure/`:**
- `schema.ts`: `INITIAL_AUTHORS` (ex `AUTORES`, que vem do schema SQLite) e `prepareAuthorship()`
  (ex `createAutoriaTablesPostgres`). O lock 22001, a tabela `autoria_migracoes` e o valor `'carga-inicial'` ficam iguais.
- `authors.ts`: `AuthorRow`, `findAuthor` (ex `obterAutor`), `toAuthorView` (ex `autorCadastrado`).
- `json.ts`: `authorJson` → `{ id, nome, tipo, livrosNoAcervo }`.

**Fatias:** `createAuthor(input)`, `searchAuthors(term, integration)` + `getAuthor(id, integration)`,
`updateAuthor(id, input, integration)` (limite 5/10 e mensagem iguais), `deleteAuthor(id, integration)`.

**Integração:** `integration/authorshipIntegration.ts` exporta `authorshipIntegration`.

**Remover (legado):**
- `cadastro.ts` (depois da divisão);
- `ConsultaDeAutores.ts`, `ProjecaoDeLivros.ts`;
- `domain/{Autor,AutorRepository,dadosDoAutor}.ts`;
- `infrastructure/{PostgresAutorRepository,SqliteAutorRepository,postgresSchema}.ts` e o `schema.ts` SQLite.

### 7.3 readers (ex leitores)

**`index.ts`:**
```ts
export { prepareReaders } from "./infrastructure/schema";
export type { ReaderHistory } from "./domain/ReaderHistory";
export { normalizeCpf, parseReaderInput, type Reader, type ReaderInput } from "./domain/Reader";
```

**`domain/`:**
- `Reader.ts`: `ReaderInput { name; cpf; email; phone }`, `Reader`, `normalizeCpf`,
  `parseReaderInput` (ex `validarDadosLeitor`; mensagens iguais).
- `ReaderRepository.ts`: `search`, `get`, `cpfExists`, `insert`, `update`, `remove`.
- `ReaderHistory.ts`: `existsFor`.

**`infrastructure/`:**
- `schema.ts`: `prepareReaders(db = sql)`.
- `PostgresReaderRepository.ts` (ex `LeitoresPostgres`), com alias SQL.
- `json.ts`: `readerJson` → `{ id, nome, cpf, email, telefone }`.

**Fatias:** classes `CreateReader`, `SearchReaders` (`execute`, `get`), `UpdateReader`, `DeleteReader`.
A rota de exclusão usa `integration/PostgresReaderHistory.ts`.

**Suporte de teste:** `tests/reader-doubles.ts` com `InMemoryReaderRepository`, `ana` e `bruno`.
`ana` e `bruno` continuam corpos de requisição com chaves em português.

### 7.4 circulation (ex circulacao)

**`index.ts`:**
```ts
export { prepareCirculation } from "./infrastructure/schema";
export type { CirculationLookup, CopySummary, ReaderSummary } from "./domain/CirculationLookup";
```

**`domain/`** (`modelo.ts` dividido):

| Arquivo | Conteúdo |
|---|---|
| `Reservation.ts` | `Reservation`, `ReservationStatus`, `reservationStatus()` (ex `situacaoReserva`; devolve também `"expirada"`) |
| `Loan.ts` | `Loan`, `LoanStatus`, `loanStatus()`, `daysOverdue()` |
| `CirculationLookup.ts` | `ReaderSummary { id; name; cpf }`, `CopySummary { id; bookTitle; registrationNumber }`, `CirculationLookup { reader(id); copy(id) }` |
| `CirculationRepository.ts` | `Filters`, `CirculationRepository` com `reservations`, `loans`, `insertReservation`, `setReservationStatus`, `insertLoan`, `returnLoan` |
| `CirculationUseCase.ts` (ex `BaseCirculacao`) | `repository`, `lookup`, `clock`; `checkLinks`, `details`, `presentReservation`, `presentLoan`; tipos `ReservationView` e `LoanView` |

**`infrastructure/`:**
- `schema.ts`: `prepareCirculation(db = sql)`.
- `PostgresCirculationRepository.ts` (ex `CirculacaoPostgres`), com alias SQL.
- `dependencies.ts`: `circulationDependencies(db)` (ex `adapters/criarCirculacao.ts`).
- `json.ts`: `reservationJson` e `loanJson`.

**Fatias:** `ReserveCopy`, `CancelReservation`, `RegisterLoan`, `RegisterReturn`, `ListLoans` (`execute`, `get`),
`ListReservations` (`execute`, `get`). A regra "reserva só no dia corrente" continua no `route.ts` de `reserve-copy`.

**Integração:** `integration/PostgresCirculationLookup.ts`, com SQL que devolve `name`, `bookTitle` e `registrationNumber`.

**Suporte de teste:** `tests/circulation-doubles.ts`:
- `InMemoryCirculationRepository` (`savedReservations`, `savedLoans`);
- `scenario()` devolve `{ memory, time, create }`, e `time.now` substitui `tempo.agora`.

### 7.5 integration/seed (UC23, ex `src/seed/` + `uc23.ts`)

| Arquivo | Conteúdo |
|---|---|
| `route.ts` | `GET /seed` → `seedReport(sql)`; `POST /seed` → `runSeed()` |
| `run.ts` (ex `executar.ts`) | `runSeed(db = sql, now = new Date(), provided?)`; `mark` (ex `marcar`); `fictitiousCpf` (ex `cpfFicticio`, exportado) |
| `report.ts` (ex `relatorio.ts`) | `seedReport`; tipos `SeedSummary` e `SeedReport` |
| `schema.ts` (ex `preparar.ts`) | `SEED_VERSION = "uc23-v1"`; `prepareSeed(db = sql)` |
| `catalog.ts` | `SeedCatalog`, `validateSeedCatalog` (mensagens iguais) |
| `catalog.json` (ex `catalogo.json`) | Chaves traduzidas: `source`, `consultedOn`, `authors`, `name`, `books`, `title`, `isbn`. Valores intactos. |
| `seed.test.ts` | Ex `tests/executar-seed.test.ts`. |

**Exceção às chaves em inglês:** `SeedSummary` e `SeedReport` mantêm as chaves em português, porque
espelham o JSON persistido em `seed_execucoes.resumo` e o payload da API. Linhas antigas no banco já usam
essas chaves.

**Entrada:** `src/seed.ts` chama `prepareDatabase()` e `runSeed()`, imprime o resultado e fecha o `sql`.

**Imports de outros módulos:**
- `Isbn` via `modules/catalog`;
- `parseReaderInput` via `modules/readers`;
- `today` e `addDays` via `shared/dates`.

## 8. Testes co-localizados

| Antes (`tests/`) | Depois |
|---|---|
| `catalogar-livro.test.ts` | `src/modules/catalog/features/create-book/create-book.test.ts` |
| `buscar-livros.test.ts` | `…/catalog/features/search-books/search-books.test.ts` |
| `atualizar-livro.test.ts` | `…/catalog/features/update-book/update-book.test.ts` |
| `excluir-livro.test.ts` | `…/catalog/features/delete-book/delete-book.test.ts` |
| `cadastrar-exemplar.test.ts` | `…/catalog/features/create-copy/create-copy.test.ts` (reexecuta a migração com `prepareCatalog()`) |
| `buscar-exemplares.test.ts` | `…/catalog/features/search-copies/search-copies.test.ts` |
| `atualizar-exemplar.test.ts` | `…/catalog/features/update-copy/update-copy.test.ts` |
| `excluir-exemplar.test.ts` | `…/catalog/features/delete-copy/delete-copy.test.ts` |
| `cadastrar-autor.test.ts` | `…/authorship/features/create-author/create-author.test.ts` |
| `buscar-autores.test.ts` | `…/authorship/features/search-authors/search-authors.test.ts` |
| `atualizar-autor.test.ts` | `…/authorship/features/update-author/update-author.test.ts` |
| `excluir-autor.test.ts` | `…/authorship/features/delete-author/delete-author.test.ts` (reinicializa com `prepareAuthorship()`) |
| `cadastrar-leitor.test.ts` | `…/readers/features/create-reader/create-reader.test.ts` |
| `buscar-leitores.test.ts` | `…/readers/features/search-readers/search-readers.test.ts` |
| `atualizar-leitor.test.ts` | `…/readers/features/update-reader/update-reader.test.ts` |
| `excluir-leitor.test.ts` | `…/readers/features/delete-reader/delete-reader.test.ts` |
| `reservar-exemplar.test.ts` | `…/circulation/features/reserve-copy/reserve-copy.test.ts` |
| `cancelar-reserva.test.ts` | `…/circulation/features/cancel-reservation/cancel-reservation.test.ts` |
| `registrar-emprestimo.test.ts` | `…/circulation/features/register-loan/register-loan.test.ts` |
| `registrar-devolucao.test.ts` | `…/circulation/features/register-return/register-return.test.ts` |
| `consultar-emprestimos.test.ts` | `…/circulation/features/list-loans/list-loans.test.ts` |
| `consultar-reservas.test.ts` | `…/circulation/features/list-reservations/list-reservations.test.ts` |
| `executar-seed.test.ts` | `src/integration/seed/seed.test.ts` |
| `importacao.test.ts` | `tests/import-books.test.ts` (executa `bun src/import-books.ts`) |
| `cadastro.e2e.test.ts` | `tests/server.e2e.test.ts` |
| `cadastrar-livro.test.ts`, `doubles.ts` | removidos (legado); regras vivas cobertas por `create-book.test.ts` e pelos testes de domínio do catálogo |

Os títulos dos testes ficam em português e sem mudança. Nas asserções de API, as chaves JSON continuam em
português. Nos testes unitários de classes, as propriedades passam para inglês.

## 9. `scripts/check-boundaries.ts`

- Identificadores em inglês; mensagens de saída em português, sem mudança.
- `TABLE_OWNERS`:

  | Tabelas | Dono |
  |---|---|
  | `livros`, `exemplares`, `acervo_sequencias` | `catalog` |
  | `autores`, `autoria_migracoes` | `authorship` |
  | `leitores` | `readers` |
  | `reservas`, `emprestimos` | `circulation` |

  Na linha de base, o código atual dos módulos já passa com esse mapa completo.
- Ignorar `*.test.ts`.
- Regra nova: arquivo em `src/modules/<m>/features/<a>/` não importa de `src/modules/<m>/features/<b>/`.

## 10. Documentação

- **README**:
  - seção "Estrutura";
  - comandos: `bun run check-boundaries`, `bun test src/modules/catalog/domain`;
  - tabela UC → fatia (seção 5.1);
  - regra de idioma (código em inglês, contrato e textos em português);
  - trocar "Os testes ficam em `backend/tests/`" por testes co-localizados.
- **Diagramas:** atualizar `.docs/arquitetura/*.architecture.json` e regenerar o HTML com o skill archify
  (`~/.claude/skills/archify`, que tem `renderers/`, `scripts/` e `bin/`). Ainda falta conferir o comando de
  renderização.
- **`.docs/saas-evolution/saas-fase01.html`:** não mexer, porque é aula histórica.

## 11. Verificação

1. **Antes de mexer**, tirar um retrato das rotas: método + path de `createApp(...).routes`, com
   `DATABASE_URL` fictícia, a partir de HEAD `cd8700b`.
2. `bun run typecheck` e `bun run check-boundaries`.
3. `bun test src/modules/catalog/domain`, que roda sem banco.
4. Suíte completa: `docker compose -f infra/compose.yaml run --rm --build test`. O serviço `db` está no ar.
   Se faltar o banco de testes, criar `biblioteca_test`.
5. Retrato das rotas depois deve ser idêntico ao de antes.
6. Buscas:
   - não sobra nenhum `uc[0-9][0-9]` em nome de arquivo;
   - não sobra `use-cases/` nem `adapters/` no backend;
   - nenhum identificador em português fora de strings, SQL, `json.ts`, comentários e JSON persistido.
     Heurística: `livro|autor|leitor|exemplar|reserva|emprestimo|acervo|autoria|circulacao|cadastr|buscar|excluir|atualizar|obter|executar|preparar|dados|situacao|integracao|consulta`.

## 12. Plano de execução (workflow)

- **Fase 0 (fio principal):**
  - teste do alias;
  - retrato das rotas;
  - fundação da seção 6.
- **Fase 1 (5 agentes em paralelo, cada um com arquivos exclusivos):**
  - **catalog:**
    - `src/modules/acervo/**`;
    - `use-cases/uc{01,02,03,04,13,14,15,16}.ts`;
    - `adapters/acervoIntegracao.ts`;
    - `src/importar.ts`;
    - os 8 testes de livro e exemplar e `tests/importacao.test.ts`;
    - os testes novos de domínio.
  - **authorship:** `src/modules/autoria/**`, `uc05–08`, `adapters/autoriaIntegracao.ts`, os 4 testes de autor.
  - **readers:** `src/modules/leitores/**`, `uc09–12`, `adapters/LeitorHistoricoPostgres.ts`, os 4 testes de
    leitor e `tests/leitoresDouble.ts`.
  - **circulation:**
    - `src/modules/circulacao/**` e `uc17–22`;
    - `adapters/{ConsultaCirculacaoPostgres,criarCirculacao}.ts`;
    - os 6 testes de circulação e `tests/circulacaoDouble.ts`.
  - **seed:** `src/seed/**`, `uc23.ts`, `src/seed.ts`, `tests/executar-seed.test.ts`.
- **Fase 2:** um agente de verificação e correção roda a seção 11 inteira.
  Em paralelo, um agente de documentação atualiza os diagramas; o README fica com o fio principal.
- **Fase 3:**
  - um revisor só de leitura confere a conformidade com este documento;
  - depois, correções;
  - por fim, o fio principal roda a seção 11 de novo.

**Regras para os agentes:**
- Nenhum comando git que altere estado (`add`, `mv`, `rm`, `commit`, `stash`, `checkout`, `reset`); mover com `mv` comum.
- Não tocar arquivo fora da sua lista.
- Strings ficam byte a byte iguais: mensagens, SQL de tabelas e colunas, chaves JSON, rotas.
- Comentários ficam em português.
- Rodar `bun run typecheck` e corrigir só os erros dos próprios arquivos.

## 13. Restrições operacionais (CLAUDE.md do usuário)

- Trabalhar na branch atual; nunca criar branch sem permissão.
- Commit e push só com permissão explícita, e cada ação pede nova autorização. Nunca abrir PR sem pedir.
- `git add` só com caminhos explícitos: nunca `-A`, `.`, `-u` ou `commit -a`. Conferir `git status --short` antes de commitar.
- Não se identificar como Claude nos commits (sem linha `Co-Authored-By`).

## 14. Pendências para retomar

1. Testar o alias `#tests/*`, conforme a seção 6.
2. Gerar o retrato das rotas a partir de HEAD.
3. Conferir como o archify regenera o HTML a partir do `.architecture.json`.
4. Executar as fases 0–3 da seção 12.
5. Perguntar ao usuário antes de qualquer commit.
6. Depois: frontend (`frontend/src/use-cases/ucNN.tsx`) com o mesmo padrão.

**Ambiente em 2026-10-29:**
- Bun 1.4.4, TypeScript 7.0.2, Docker 29.9.2;
- `biblioteca-tutorial-db-1` saudável;
- git limpo em `cd8700b`.
