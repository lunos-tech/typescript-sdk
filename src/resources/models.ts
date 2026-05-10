import type { Lunos } from '../client.js';
import type { ModelListResponse, ModelListParams, RequestOptions } from '../types.js';

export class Models {
  private client: Lunos;

  constructor(client: Lunos) {
    this.client = client;
  }

  async list(params?: ModelListParams, opts?: RequestOptions): Promise<ModelListResponse> {
    const query = new URLSearchParams();
    if (params?.input) query.set('input', params.input);
    if (params?.output) query.set('output', params.output);
    const qs = query.toString();
    const path = '/v1/models' + (qs ? `?${qs}` : '');
    return this.client.request<ModelListResponse>('GET', path, undefined, opts);
  }
}
