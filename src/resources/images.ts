import type { Lunos } from '../client';
import type { ImageGenerationParams, ImageGenerationResponse, RequestOptions } from '../types';

export class Images {
  private client: Lunos;

  constructor(client: Lunos) {
    this.client = client;
  }

  async generate(params: ImageGenerationParams, opts?: RequestOptions): Promise<ImageGenerationResponse> {
    return this.client.request<ImageGenerationResponse>('POST', '/v1/image/generations', params, opts);
  }
}
