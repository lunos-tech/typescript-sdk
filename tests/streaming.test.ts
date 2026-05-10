import { describe, it, expect, vi } from 'vitest';
import { Stream } from '../src/streaming';

function createMockResponse(chunks: string[]): Response {
  let index = 0;
  const reader = {
    read: vi.fn().mockImplementation(() => {
      if (index >= chunks.length) return Promise.resolve({ done: true, value: undefined });
      const value = new TextEncoder().encode(chunks[index++]);
      return Promise.resolve({ done: false, value });
    }),
    releaseLock: vi.fn(),
  };
  return { body: { getReader: () => reader } } as unknown as Response;
}

describe('Stream', () => {
  it('parses SSE data lines into objects', async () => {
    const response = createMockResponse([
      'data: {"id":"1","choices":[{"delta":{"content":"Hello"}}]}\n\n',
      'data: {"id":"1","choices":[{"delta":{"content":" world"}}]}\n\n',
      'data: [DONE]\n\n',
    ]);
    const stream = new Stream(response, new AbortController());
    const chunks = [];
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    expect(chunks).toHaveLength(2);
    expect((chunks[0] as any).choices[0].delta.content).toBe('Hello');
    expect((chunks[1] as any).choices[0].delta.content).toBe(' world');
  });

  it('skips empty lines and comments', async () => {
    const response = createMockResponse([
      ': this is a comment\n\n',
      '\n',
      'data: {"id":"1","choices":[{"delta":{"content":"ok"}}]}\n\n',
      'data: [DONE]\n\n',
    ]);
    const stream = new Stream(response, new AbortController());
    const chunks = [];
    for await (const chunk of stream) chunks.push(chunk);
    expect(chunks).toHaveLength(1);
  });

  it('handles chunked data split across reads', async () => {
    const response = createMockResponse([
      'data: {"id":"1","cho',
      'ices":[{"delta":{"content":"split"}}]}\n\ndata: [DONE]\n\n',
    ]);
    const stream = new Stream(response, new AbortController());
    const chunks = [];
    for await (const chunk of stream) chunks.push(chunk);
    expect(chunks).toHaveLength(1);
    expect((chunks[0] as any).choices[0].delta.content).toBe('split');
  });

  it('skips malformed JSON', async () => {
    const response = createMockResponse([
      'data: not-json\n\n',
      'data: {"id":"1","choices":[{"delta":{"content":"ok"}}]}\n\n',
      'data: [DONE]\n\n',
    ]);
    const stream = new Stream(response, new AbortController());
    const chunks = [];
    for await (const chunk of stream) chunks.push(chunk);
    expect(chunks).toHaveLength(1);
  });

  it('throws if response body is null', async () => {
    const response = { body: null } as unknown as Response;
    const stream = new Stream(response, new AbortController());
    const iter = stream[Symbol.asyncIterator]();
    await expect(iter.next()).rejects.toThrow('Response body is null');
  });

  it('abort() calls controller.abort()', () => {
    const controller = new AbortController();
    const spy = vi.spyOn(controller, 'abort');
    const stream = new Stream({} as Response, controller);
    stream.abort();
    expect(spy).toHaveBeenCalled();
  });
});
