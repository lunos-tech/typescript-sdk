import { ChatCompletionChunk } from './types.js';

export class Stream<T = ChatCompletionChunk> implements AsyncIterable<T> {
  private response: Response;
  private controller: AbortController;

  constructor(response: Response, controller: AbortController) {
    this.response = response;
    this.controller = controller;
  }

  async *[Symbol.asyncIterator](): AsyncIterator<T> {
    const reader = this.response.body?.getReader();
    if (!reader) throw new Error('Response body is null');

    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith(':')) continue;
          if (trimmed === 'data: [DONE]') return;
          if (trimmed.startsWith('data: ')) {
            const json = trimmed.slice(6);
            try {
              yield JSON.parse(json) as T;
            } catch {
              // skip malformed JSON
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  abort(): void {
    this.controller.abort();
  }
}
