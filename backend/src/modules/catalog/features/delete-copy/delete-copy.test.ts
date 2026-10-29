import { expect, test } from "bun:test";
import { api, testCopy } from "#tests/api";
import { catalogIntegration } from "../../../../integration/catalogIntegration";
import { RuleConflict } from "../../../../shared/errors";
import { deleteCopy } from "./deleteCopy";

test("UC16: exclui exemplar sem histórico e informa ausência na repetição", async () => {
  const copy = await testCopy();
  expect((await api("DELETE", `/exemplares/${copy.id}`)).status).toBe(204);
  expect((await api("DELETE", `/exemplares/${copy.id}`)).status).toBe(404);
});

test("UC16: histórico informado pela integração impede exclusão física", async () => {
  const copy = await testCopy();
  // A porta permite provar a regra antes de os UCs de circulação estarem integrados.
  await expect(deleteCopy(copy.id, { ...catalogIntegration, copyHasHistory: async () => true })).rejects.toBeInstanceOf(RuleConflict);
});
