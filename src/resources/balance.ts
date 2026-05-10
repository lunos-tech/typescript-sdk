import type { Lunos } from '../client.js';
import type { BalanceResponse, RequestOptions } from '../types.js';

export class Balance {
  private client: Lunos;

  constructor(client: Lunos) {
    this.client = client;
  }

  async retrieve(opts?: RequestOptions): Promise<BalanceResponse> {
    return this.client.request<BalanceResponse>('GET', '/v1/balance', undefined, opts);
  }
}
