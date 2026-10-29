import { SQL } from "bun";

const url = process.env.DATABASE_URL;

if (!url) {
  throw new Error(
    "DATABASE_URL não definida: o banco só existe na rede do Docker, rode pelo docker compose -f infra/compose.yaml",
  );
}

/**
 * Pool de conexões com o Postgres. A URL vem do ambiente, definida no
 * infra/compose.yaml: o banco não tem porta aberta no seu computador, então só um
 * contêiner da mesma rede consegue chegar até ele.
 */
export const sql = new SQL(url);
