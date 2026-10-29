/** Corpo JSON enviado no cadastro e na atualização. */
export function readBookForm(data: FormData) {
  return { isbn: String(data.get("isbn")), titulo: String(data.get("titulo")), autorId: Number(data.get("autorId")) };
}
