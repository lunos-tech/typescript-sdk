import { describe, it, expect } from 'vitest';
import { Lunos } from '../src/client';

describe('Lunos Client', () => {
  it('throws when no API key is provided', () => {
    const orig = process.env['LUNOS_API_KEY'];
    delete process.env['LUNOS_API_KEY'];
    expect(() => new Lunos()).toThrow('LUNOS_API_KEY');
    if (orig) process.env['LUNOS_API_KEY'] = orig;
  });

  it('accepts apiKey option', () => {
    const client = new Lunos({ apiKey: 'sk-test' });
    expect(client.apiKey).toBe('sk-test');
  });

  it('reads apiKey from environment', () => {
    process.env['LUNOS_API_KEY'] = 'sk-env';
    const client = new Lunos();
    expect(client.apiKey).toBe('sk-env');
    delete process.env['LUNOS_API_KEY'];
  });

  it('uses default baseURL', () => {
    const client = new Lunos({ apiKey: 'sk-test' });
    expect(client.baseURL).toBe('https://api.lunos.tech');
  });

  it('accepts custom baseURL and strips trailing slashes', () => {
    const client = new Lunos({ apiKey: 'sk-test', baseURL: 'https://custom.api.com///' });
    expect(client.baseURL).toBe('https://custom.api.com');
  });

  it('reads baseURL from environment', () => {
    process.env['LUNOS_BASE_URL'] = 'https://env.api.com';
    const client = new Lunos({ apiKey: 'sk-test' });
    expect(client.baseURL).toBe('https://env.api.com');
    delete process.env['LUNOS_BASE_URL'];
  });

  it('uses default timeout of 60s', () => {
    const client = new Lunos({ apiKey: 'sk-test' });
    expect(client.timeout).toBe(60_000);
  });

  it('accepts custom timeout', () => {
    const client = new Lunos({ apiKey: 'sk-test', timeout: 30_000 });
    expect(client.timeout).toBe(30_000);
  });

  it('uses default maxRetries of 2', () => {
    const client = new Lunos({ apiKey: 'sk-test' });
    expect(client.maxRetries).toBe(2);
  });

  it('accepts custom maxRetries', () => {
    const client = new Lunos({ apiKey: 'sk-test', maxRetries: 5 });
    expect(client.maxRetries).toBe(5);
  });

  it('initializes all resource namespaces', () => {
    const client = new Lunos({ apiKey: 'sk-test' });
    expect(client.chat).toBeDefined();
    expect(client.chat.completions).toBeDefined();
    expect(client.audio).toBeDefined();
    expect(client.images).toBeDefined();
    expect(client.embeddings).toBeDefined();
    expect(client.models).toBeDefined();
    expect(client.balance).toBeDefined();
  });

  it('stores appId when provided', () => {
    const client = new Lunos({ apiKey: 'sk-test', appId: 'my-app-v1' });
    expect(client.appId).toBe('my-app-v1');
  });

  it('appId is undefined when not provided', () => {
    const client = new Lunos({ apiKey: 'sk-test' });
    expect(client.appId).toBeUndefined();
  });
});
