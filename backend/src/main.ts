import { loadSlices, prepareDatabase } from "./composition";
import { ready, redis } from "./infrastructure/redis";
import { refreshDerivedData, refreshDerivedDataOnConnect } from "./integration/derivedData";
import { createServer } from "./server";

await prepareDatabase();

const server = createServer(await loadSlices());

console.log(`Servidor executando em http://localhost:${server.port}`);

// o banco pode ter mudado enquanto o servidor estava parado: na subida, recalcula
// os dados derivados em segundo plano, com ou sem Redis (os vetores estão no Postgres);
// cada (re)conexão ao Redis invalida o cache de autores
void refreshDerivedData();
refreshDerivedDataOnConnect();
if (redis) void ready(redis).catch(() => console.warn("Redis indisponível: seguindo sem cache de autores"));
