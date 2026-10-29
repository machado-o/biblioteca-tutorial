/** Centraliza JSON e mensagens de regra de negócio (400, 404 e 409). */
export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, options);
  } catch {
    throw new Error("Não foi possível conectar à biblioteca. Verifique a conexão e tente novamente.");
  }
  if (response.status === 204) return undefined as T;
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(typeof body.error === "string" ? body.error : `Não foi possível concluir a operação (HTTP ${response.status}).`);
  }
  return body as T;
}

export function send<T>(path: string, method: "POST" | "PUT", data?: unknown): Promise<T> {
  return api<T>(path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data ?? {}),
  });
}

export function queryString(data: Record<string, string>): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(data)) if (value) query.set(key, value);
  const result = query.toString();
  return result ? `?${result}` : "";
}
