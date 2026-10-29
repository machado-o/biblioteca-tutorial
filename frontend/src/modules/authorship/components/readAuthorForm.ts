/** Corpo JSON enviado no cadastro e na atualização. */
export function readAuthorForm(data: FormData) {
  return { nome: String(data.get("nome")), tipo: String(data.get("tipo")) };
}
