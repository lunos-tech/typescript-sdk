import { describe, it, expect, vi } from 'vitest';
import { Lunos } from '../src/client';
import { AuthenticationError, RateLimitError, InternalServerError, APIConnectionTimeoutError } from '../src/error';

function mockFetch(status: number, body: unknown = {}) {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers({ 'content-type': 'application/json' }),
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(JSON.stringify(body)),
  }) as unknown as typeof fetch;
}

function client(fn: typeof fetch, opts?: { maxRetries?: number; timeout?: number }) {
  return new Lunos({ apiKey: 'sk-test', fetch: fn, ...opts });
}

describe('HTTP Requests', () => {
  describe('headers', () => {
    it('sends Authorization Bearer header', async () => {
      const fn = mockFetch(200, { data: [] });
      await client(fn).request('GET', '/v1/models');
      expect(fn).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer sk-test' }),
      }));
    });

    it('sends Content-Type json', async () => {
      const fn = mockFetch(200);
      await client(fn).request('POST', '/test', { x: 1 });
      expect(fn).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({
        headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
      }));
    });

    it('merges defaultHeaders', async () => {
      const fn = mockFetch(200);
      const c = new Lunos({ apiKey: 'sk-test', fetch: fn, defaultHeaders: { 'X-Custom': 'val' } });
      await c.request('GET', '/test');
      expect(fn).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({
        headers: expect.objectContaining({ 'X-Custom': 'val' }),
      }));
    });

    it('per-request headers override defaults', async () => {
      const fn = mockFetch(200);
      const c = new Lunos({ apiKey: 'sk-test', fetch: fn, defaultHeaders: { 'X-H': 'a' } });
      await c.request('GET', '/test', undefined, { headers: { 'X-H': 'b' } });
      expect(fn).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({
        headers: expect.objectContaining({ 'X-H': 'b' }),
      }));
    });

    it('sends X-App-ID header when appId is set', async () => {
      const fn = mockFetch(200);
      const c = new Lunos({ apiKey: 'sk-test', fetch: fn, appId: 'my-app' });
      await c.request('GET', '/test');
      expect(fn).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({
        headers: expect.objectContaining({ 'X-App-ID': 'my-app' }),
      }));
    });

    it('does not send X-App-ID header when appId is not set', async () => {
      const fn = mockFetch(200);
      await client(fn).request('GET', '/test');
      const headers = (fn as any).mock.calls[0][1].headers;
      expect(headers['X-App-ID']).toBeUndefined();
    });
  });

  describe('body', () => {
    it('serializes body as JSON', async () => {
      const fn = mockFetch(200);
      const body = { model: 'gpt-4', messages: [] };
      await client(fn).request('POST', '/test', body);
      expect(fn).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({
        body: JSON.stringify(body),
      }));
    });

    it('sends undefined body for GET', async () => {
      const fn = mockFetch(200);
      await client(fn).request('GET', '/test');
      expect(fn).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({
        body: undefined,
      }));
    });
  });

  describe('errors', () => {
    it('throws AuthenticationError on 401', async () => {
      const fn = mockFetch(401, { error: 'Invalid secret key' });
      await expect(client(fn, { maxRetries: 0 }).request('GET', '/t')).rejects.toBeInstanceOf(AuthenticationError);
    });

    it('throws RateLimitError on 429 after retries', async () => {
      const fn = mockFetch(429, { error: 'rate limited' });
      const c = client(fn, { maxRetries: 0 });
      await expect(c.request('GET', '/t')).rejects.toBeInstanceOf(RateLimitError);
    });

    it('throws InternalServerError on 500 after retries', async () => {
      const fn = mockFetch(500, { error: 'server error' });
      const c = client(fn, { maxRetries: 0 });
      await expect(c.request('GET', '/t')).rejects.toBeInstanceOf(InternalServerError);
    });
  });

  describe('retries', () => {
    it('retries on 500 up to maxRetries', async () => {
      const fn = mockFetch(500, { error: 'err' });
      const c = client(fn, { maxRetries: 2 });
      (c as any).sleep = vi.fn().mockResolvedValue(undefined);
      await expect(c.request('GET', '/t')).rejects.toThrow();
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('retries on 429', async () => {
      const fn = mockFetch(429, { error: 'err' });
      const c = client(fn, { maxRetries: 1 });
      (c as any).sleep = vi.fn().mockResolvedValue(undefined);
      await expect(c.request('GET', '/t')).rejects.toThrow();
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('does not retry on 400', async () => {
      const fn = mockFetch(400, { error: 'bad' });
      await expect(client(fn, { maxRetries: 2 }).request('GET', '/t')).rejects.toThrow();
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('does not retry on 401', async () => {
      const fn = mockFetch(401, { error: 'unauth' });
      await expect(client(fn, { maxRetries: 2 }).request('GET', '/t')).rejects.toThrow();
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('succeeds after transient failure', async () => {
      const fn = vi.fn()
        .mockResolvedValueOnce({ ok: false, status: 500, headers: new Headers(), text: () => Promise.resolve('{"error":"x"}') })
        .mockResolvedValueOnce({ ok: true, status: 200, headers: new Headers({ 'content-type': 'application/json' }), json: () => Promise.resolve({ ok: true }) });
      const c = client(fn as any, { maxRetries: 1 });
      (c as any).sleep = vi.fn().mockResolvedValue(undefined);
      const res = await c.request('GET', '/t');
      expect(res).toEqual({ ok: true });
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('retries on network error', async () => {
      const fn = vi.fn()
        .mockRejectedValueOnce(new Error('fetch failed'))
        .mockResolvedValueOnce({ ok: true, status: 200, headers: new Headers({ 'content-type': 'application/json' }), json: () => Promise.resolve({ ok: 1 }) });
      const c = client(fn as any, { maxRetries: 1 });
      (c as any).sleep = vi.fn().mockResolvedValue(undefined);
      expect(await c.request('GET', '/t')).toEqual({ ok: 1 });
    });
  });

  describe('timeout', () => {
    it('throws APIConnectionTimeoutError on abort', async () => {
      const fn = vi.fn().mockImplementation(() => {
        const e = new Error('aborted'); e.name = 'AbortError'; return Promise.reject(e);
      });
      const c = client(fn as any, { maxRetries: 0, timeout: 1 });
      await expect(c.request('GET', '/t')).rejects.toBeInstanceOf(APIConnectionTimeoutError);
    });
  });
});
