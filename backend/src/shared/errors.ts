export class ApplicationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

export class InvalidInput extends ApplicationError {}

export class NotFound extends ApplicationError {}

export class RuleConflict extends ApplicationError {}
