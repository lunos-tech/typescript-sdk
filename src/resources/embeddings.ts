import type { Lunos } from '../client';
import type { EmbeddingCreateParams, EmbeddingResponse, RequestOptions } from '../types';

export class Embeddings {
  private client: Lunos;

  constructor(client: Lunos) {
    this.client = client;
  }

  async create(params: EmbeddingCreateParams, opts?: RequestOptions): Promise<EmbeddingResponse> {
    return this.client.request<EmbeddingResponse>('POST', '/v1/embeddings', params, opts);
  }
}
