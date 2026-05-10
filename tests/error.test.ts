import { describe, it, expect } from 'vitest';
import {
  LunosError, APIError, BadRequestError, AuthenticationError,
  PermissionDeniedError, NotFoundError, ConflictError,
  UnprocessableEntityError, RateLimitError, InternalServerError,
  APIConnectionError, APIConnectionTimeoutError,
} from '../src/error';

describe('Error Classes', () => {
  it('LunosError extends Error', () => {
    const err = new LunosError('test');
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe('LunosError');
    expect(err.message).toBe('test');
  });

  it('APIError stores status and error body', () => {
    const err = new APIError(400, { error: 'bad' }, 'bad request');
    expect(err.status).toBe(400);
    expect(err.error).toEqual({ error: 'bad' });
    expect(err.message).toBe('bad request');
  });

  it('APIError uses default message when none provided', () => {
    const err = new APIError(500, null, undefined);
    expect(err.message).toBe('API error 500');
  });

  it('generate returns BadRequestError for 400', () => {
    const err = APIError.generate(400, null, 'bad');
    expect(err).toBeInstanceOf(BadRequestError);
    expect(err.name).toBe('BadRequestError');
  });

  it('generate returns AuthenticationError for 401', () => {
    const err = APIError.generate(401, null, 'unauth');
    expect(err).toBeInstanceOf(AuthenticationError);
  });

  it('generate returns PermissionDeniedError for 403', () => {
    expect(APIError.generate(403, null, 'x')).toBeInstanceOf(PermissionDeniedError);
  });

  it('generate returns NotFoundError for 404', () => {
    expect(APIError.generate(404, null, 'x')).toBeInstanceOf(NotFoundError);
  });

  it('generate returns ConflictError for 409', () => {
    expect(APIError.generate(409, null, 'x')).toBeInstanceOf(ConflictError);
  });

  it('generate returns UnprocessableEntityError for 422', () => {
    expect(APIError.generate(422, null, 'x')).toBeInstanceOf(UnprocessableEntityError);
  });

  it('generate returns RateLimitError for 429', () => {
    expect(APIError.generate(429, null, 'x')).toBeInstanceOf(RateLimitError);
  });

  it('generate returns InternalServerError for 500+', () => {
    expect(APIError.generate(502, null, 'x')).toBeInstanceOf(InternalServerError);
  });

  it('generate returns generic APIError for unknown status', () => {
    const err = APIError.generate(418, null, 'teapot');
    expect(err).toBeInstanceOf(APIError);
    expect(err.status).toBe(418);
  });

  it('APIConnectionError has default message', () => {
    const err = new APIConnectionError();
    expect(err.message).toBe('Connection error');
  });

  it('APIConnectionTimeoutError extends APIConnectionError', () => {
    const err = new APIConnectionTimeoutError();
    expect(err).toBeInstanceOf(APIConnectionError);
    expect(err.message).toBe('Request timed out');
  });
});
