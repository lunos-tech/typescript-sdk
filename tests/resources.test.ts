import { describe, it, expect, vi } from 'vitest';
import { Lunos } from '../src/client';

function mockJson(data: unknown) {
  return vi.fn().mockResolvedValue({
    ok: true, status: 200,
    headers: new Headers({ 'content-type': 'application/json' }),
    json: () => Promise.resolve(data),
  }) as unknown as typeof fetch;
}

function c(fn: typeof fetch) {
  return new Lunos({ apiKey: 'sk-test', fetch: fn });
}

describe('Resources', () => {
  describe('chat.completions.create', () => {
    it('POSTs to /v1/chat/completions', async () => {
      const data = { id: '1', choices: [{ index: 0, message: { role: 'assistant', content: 'Hi' }, finish_reason: 'stop' }], model: 'gpt-4' };
      const fn = mockJson(data);
      const res = await c(fn).chat.completions.create({ model: 'gpt-4', messages: [{ role: 'user', content: 'Hi' }] });
      expect(fn).toHaveBeenCalledWith('https://api.lunos.tech/v1/chat/completions', expect.objectContaining({ method: 'POST' }));
      expect(res.choices[0].message.content).toBe('Hi');
    });

    it('passes optional params in body', async () => {
      const fn = mockJson({ id: '1', choices: [], model: 'x' });
      await c(fn).chat.completions.create({ model: 'x', messages: [{ role: 'user', content: 'x' }], temperature: 0.5, max_tokens: 50 });
      const body = JSON.parse((fn as any).mock.calls[0][1].body);
      expect(body.temperature).toBe(0.5);
      expect(body.max_tokens).toBe(50);
    });
  });

  describe('embeddings.create', () => {
    it('POSTs to /v1/embeddings', async () => {
      const data = { object: 'list', data: [{ object: 'embedding', embedding: [0.1], index: 0 }], model: 'emb', usage: { prompt_tokens: 1, total_tokens: 1 } };
      const fn = mockJson(data);
      const res = await c(fn).embeddings.create({ model: 'emb', input: 'hi' });
      expect(fn).toHaveBeenCalledWith('https://api.lunos.tech/v1/embeddings', expect.objectContaining({ method: 'POST' }));
      expect(res.data[0].embedding).toEqual([0.1]);
    });

    it('supports array input', async () => {
      const fn = mockJson({ object: 'list', data: [], model: 'x', usage: { prompt_tokens: 0, total_tokens: 0 } });
      await c(fn).embeddings.create({ model: 'x', input: ['a', 'b'] });
      const body = JSON.parse((fn as any).mock.calls[0][1].body);
      expect(body.input).toEqual(['a', 'b']);
    });
  });

  describe('images.generate', () => {
    it('POSTs to /v1/image/generations', async () => {
      const data = { created: 1, data: [{ url: 'https://img.test/1.png' }], model: 'imagen', cost: 0.02 };
      const fn = mockJson(data);
      const res = await c(fn).images.generate({ prompt: 'sunset', model: 'imagen' });
      expect(fn).toHaveBeenCalledWith('https://api.lunos.tech/v1/image/generations', expect.objectContaining({ method: 'POST' }));
      expect(res.data[0].url).toBe('https://img.test/1.png');
    });
  });

  describe('models.list', () => {
    it('GETs /v1/models', async () => {
      const data = { data: [{ id: 'gpt-4', object: 'model', created: 1, owned_by: 'openai' }] };
      const fn = mockJson(data);
      const res = await c(fn).models.list();
      expect(fn).toHaveBeenCalledWith('https://api.lunos.tech/v1/models', expect.any(Object));
      expect(res.data[0].id).toBe('gpt-4');
    });

    it('appends query params', async () => {
      const fn = mockJson({ data: [] });
      await c(fn).models.list({ input: 'text', output: 'image' });
      expect(fn).toHaveBeenCalledWith('https://api.lunos.tech/v1/models?input=text&output=image', expect.any(Object));
    });
  });

  describe('balance.retrieve', () => {
    it('GETs /v1/balance', async () => {
      const data = { success: true, message: 'ok', data: { balance: 10.5, email: 'a@b.c', alertBalance: 1, enableAlert: 1, updatedAt: '', isAlertEnabled: true, isBalanceLow: false } };
      const fn = mockJson(data);
      const res = await c(fn).balance.retrieve();
      expect(fn).toHaveBeenCalledWith('https://api.lunos.tech/v1/balance', expect.objectContaining({ method: 'GET' }));
      expect(res.data.balance).toBe(10.5);
    });
  });

  describe('audio.create', () => {
    it('POSTs to /v1/audio/generations', async () => {
      const fn = vi.fn().mockResolvedValue({
        ok: true, status: 200,
        headers: new Headers({ 'content-type': 'audio/mpeg' }),
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(4)),
      }) as unknown as typeof fetch;
      await c(fn).audio.create({ model: 'openai/tts', input: 'hi', voice: 'alloy' });
      expect(fn).toHaveBeenCalledWith('https://api.lunos.tech/v1/audio/generations', expect.objectContaining({ method: 'POST' }));
    });
  });
});
