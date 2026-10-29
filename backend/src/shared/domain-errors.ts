export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

/** Valor malformado: o dado não pode existir com essa forma. */
export class InvalidValue extends DomainError {}

/** Invariante violada: os valores existem, mas a operação não é permitida agora. */
export class RuleViolation extends DomainError {}
