/** Corpo JSON enviado no cadastro e na atualização. */
export function readReaderForm(data: FormData) {
  return { nome: String(data.get("nome")), cpf: String(data.get("cpf")), email: String(data.get("email")), telefone: String(data.get("telefone")) };
}
