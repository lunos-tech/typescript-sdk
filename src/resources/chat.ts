import type { Lunos } from '../client';
import type { ChatCompletionCreateParams, ChatCompletion, ChatCompletionChunk, RequestOptions } from '../types';
import { Stream } from '../streaming';

export class Completions {
  private client: Lunos;

  constructor(client: Lunos) {
    this.client = client;
  }

  async create(params: ChatCompletionCreateParams & { stream: true }, opts?: RequestOptions): Promise<Stream<ChatCompletionChunk>>;
  async create(params: ChatCompletionCreateParams & { stream?: false }, opts?: RequestOptions): Promise<ChatCompletion>;
  async create(params: ChatCompletionCreateParams, opts?: RequestOptions): Promise<ChatCompletion | Stream<ChatCompletionChunk>>;
  async create(params: ChatCompletionCreateParams, opts?: RequestOptions): Promise<ChatCompletion | Stream<ChatCompletionChunk>> {
    if (params.stream) {
      return this.client.streamRequest('POST', '/v1/chat/completions', params, opts);
    }
    return this.client.request<ChatCompletion>('POST', '/v1/chat/completions', params, opts);
  }
}

export class Chat {
  completions: Completions;

  constructor(client: Lunos) {
    this.completions = new Completions(client);
  }
}
