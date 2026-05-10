import { APIError, APIConnectionError, APIConnectionTimeoutError } from './error.js';
import { Stream } from './streaming.js';
import { RequestOptions } from './types.js';
import { Chat } from './resources/chat.js';
import { Audio } from './resources/audio.js';
import { Images } from './resources/images.js';
import { Embeddings } from './resources/embeddings.js';
import { Models } from './resources/models.js';
import { Balance } from './resources/balance.js';

export interface ClientOptions {
  /** Defaults to process.env['LUNOS_API_KEY'] */
  apiKey?: string;
  /** Defaults to https://api.lunos.tech */
  baseURL?: string;
  /** Timeout in ms. Default 60000 (1 minute) */
  timeout?: number;
  /** Max retries on failure. Default 2 */
  maxRetries?: number;
  /** Default headers for every request */
  defaultHeaders?: Record<string, string>;
  /** Custom fetch implementation */
  fetch?: typeof fetch;
}

export class Lunos {
  apiKey: string;
  baseURL: string;
  timeout: number;
  maxRetries: number;
  defaultHeaders: Record<string, string>;

  chat: Chat;
  audio: Audio;
  images: Images;
  embeddings: Embeddings;
  models: Models;
  balance: Balance;

  private _fetch: typeof fetch;

  constructor(opts: ClientOptions = {}) {
    const apiKey = opts.apiKey || (typeof process !== 'undefined' ? process.env?.['LUNOS_API_KEY'] : undefined);
    if (!apiKey) {
      throw new Error(
        "The LUNOS_API_KEY environment variable is missing or empty; either provide it, or instantiate the Lunos client with an apiKey option, like new Lunos({ apiKey: 'my-key' })."
      );
    }

    this.apiKey = apiKey;
    this.baseURL = (opts.baseURL || (typeof process !== 'undefined' ? process.env?.['LUNOS_BASE_URL'] : undefined) || 'https://api.lunos.tech').replace(/\/+$/, '');
    this.timeout = opts.timeout ?? 60_000;
    this.maxRetries = opts.maxRetries ?? 2;
    this.defaultHeaders = opts.defaultHeaders ?? {};
    this._fetch = opts.fetch ?? globalThis.fetch;

    this.chat = new Chat(this);
    this.audio = new Audio(this);
    this.images = new Images(this);
    this.embeddings = new Embeddings(this);
    this.models = new Models(this);
    this.balance = new Balance(this);
  }

  async request<T>(method: string, path: string, body?: unknown, opts?: RequestOptions): Promise<T> {
    const url = `${this.baseURL}${path}`;
    const maxRetries = opts?.maxRetries ?? this.maxRetries;
    const timeout = opts?.timeout ?? this.timeout;

    const headers: Record<string, string> = {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      ...this.defaultHeaders,
      ...opts?.headers,
    };

    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeout);

      if (opts?.signal) {
        opts.signal.addEventListener('abort', () => controller.abort());
      }

      try {
        const response = await this._fetch(url, {
          method,
          headers,
          body: body ? JSON.stringify(body) : undefined,
          signal: controller.signal,
        });

        clearTimeout(timer);

        if (response.ok) {
          const contentType = response.headers.get('content-type') || '';
          if (contentType.includes('application/json')) {
            return (await response.json()) as T;
          }
          return response as unknown as T;
        }

        const errorBody = await response.text().catch(() => '');
        let errorJson: unknown;
        try { errorJson = JSON.parse(errorBody); } catch { errorJson = { error: errorBody }; }

        const msg = typeof errorJson === 'object' && errorJson !== null
          ? (errorJson as Record<string, unknown>).error as string || (errorJson as Record<string, unknown>).message as string || errorBody
          : errorBody;

        const apiError = APIError.generate(response.status, errorJson, msg, response.headers);

        // Retry on 408, 409, 429, 5xx
        if ([408, 409, 429].includes(response.status) || response.status >= 500) {
          lastError = apiError;
          if (attempt < maxRetries) {
            await this.sleep(this.retryDelay(attempt));
            continue;
          }
        }

        throw apiError;
      } catch (err) {
        clearTimeout(timer);
        if (err instanceof APIError) throw err;

        if (err instanceof Error && err.name === 'AbortError') {
          lastError = new APIConnectionTimeoutError();
        } else {
          lastError = new APIConnectionError(err instanceof Error ? err.message : 'Connection error');
        }

        if (attempt < maxRetries) {
          await this.sleep(this.retryDelay(attempt));
          continue;
        }
      }
    }

    throw lastError!;
  }

  async streamRequest(method: string, path: string, body?: unknown, opts?: RequestOptions): Promise<Stream> {
    const url = `${this.baseURL}${path}`;
    const timeout = opts?.timeout ?? this.timeout;

    const headers: Record<string, string> = {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      ...this.defaultHeaders,
      ...opts?.headers,
    };

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    if (opts?.signal) {
      opts.signal.addEventListener('abort', () => controller.abort());
    }

    try {
      const response = await this._fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timer);

      if (!response.ok) {
        const errorBody = await response.text().catch(() => '');
        let errorJson: unknown;
        try { errorJson = JSON.parse(errorBody); } catch { errorJson = { error: errorBody }; }
        const msg = typeof errorJson === 'object' && errorJson !== null
          ? (errorJson as Record<string, unknown>).error as string || errorBody
          : errorBody;
        throw APIError.generate(response.status, errorJson, msg, response.headers);
      }

      return new Stream(response, controller);
    } catch (err) {
      clearTimeout(timer);
      if (err instanceof APIError) throw err;
      if (err instanceof Error && err.name === 'AbortError') throw new APIConnectionTimeoutError();
      throw new APIConnectionError(err instanceof Error ? err.message : 'Connection error');
    }
  }

  async rawRequest(method: string, path: string, body?: unknown, opts?: RequestOptions): Promise<Response> {
    return this.request<Response>(method, path, body, opts);
  }

  private retryDelay(attempt: number): number {
    return Math.min(500 * Math.pow(2, attempt), 8000);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
