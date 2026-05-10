export class LunosError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LunosError';
  }
}

export class APIError extends LunosError {
  readonly status: number;
  readonly headers: Headers | undefined;
  readonly error: unknown;

  constructor(status: number, error: unknown, message: string | undefined, headers?: Headers) {
    super(message || `API error ${status}`);
    this.status = status;
    this.headers = headers;
    this.error = error;
    this.name = 'APIError';
  }

  static generate(status: number, error: unknown, message: string | undefined, headers?: Headers): APIError {
    if (status === 400) return new BadRequestError(status, error, message, headers);
    if (status === 401) return new AuthenticationError(status, error, message, headers);
    if (status === 403) return new PermissionDeniedError(status, error, message, headers);
    if (status === 404) return new NotFoundError(status, error, message, headers);
    if (status === 409) return new ConflictError(status, error, message, headers);
    if (status === 422) return new UnprocessableEntityError(status, error, message, headers);
    if (status === 429) return new RateLimitError(status, error, message, headers);
    if (status >= 500) return new InternalServerError(status, error, message, headers);
    return new APIError(status, error, message, headers);
  }
}

export class BadRequestError extends APIError {
  override readonly name = 'BadRequestError';
}

export class AuthenticationError extends APIError {
  override readonly name = 'AuthenticationError';
}

export class PermissionDeniedError extends APIError {
  override readonly name = 'PermissionDeniedError';
}

export class NotFoundError extends APIError {
  override readonly name = 'NotFoundError';
}

export class ConflictError extends APIError {
  override readonly name = 'ConflictError';
}

export class UnprocessableEntityError extends APIError {
  override readonly name = 'UnprocessableEntityError';
}

export class RateLimitError extends APIError {
  override readonly name = 'RateLimitError';
}

export class InternalServerError extends APIError {
  override readonly name = 'InternalServerError';
}

export class APIConnectionError extends LunosError {
  readonly name = 'APIConnectionError';
  constructor(message = 'Connection error') {
    super(message);
  }
}

export class APIConnectionTimeoutError extends APIConnectionError {
  // @ts-expect-error override name
  readonly name = 'APIConnectionTimeoutError';
  constructor() {
    super('Request timed out');
  }
}
