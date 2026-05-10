import type { Lunos } from '../client.js';
import type { AudioGenerationParams, RequestOptions } from '../types.js';

export class Audio {
  private client: Lunos;

  constructor(client: Lunos) {
    this.client = client;
  }

  /** Generate audio from text. Returns raw Response with binary audio data. */
  async create(params: AudioGenerationParams, opts?: RequestOptions): Promise<Response> {
    return this.client.rawRequest('POST', '/v1/audio/generations', params, opts);
  }
}
