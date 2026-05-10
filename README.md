# @lunos/sdk

TypeScript SDK for the [Lunos](https://lunos.tech) AI API gateway — a unified OpenAI-compatible API for multiple AI providers.

## Installation

```sh
npm install @lunos/sdk
```

## Usage

```ts
import Lunos from '@lunos/sdk';

const client = new Lunos({
  apiKey: process.env.LUNOS_API_KEY, // default
});

const completion = await client.chat.completions.create({
  model: 'openai/gpt-4o',
  messages: [{ role: 'user', content: 'Hello!' }],
});

console.log(completion.choices[0].message.content);
```

### Streaming

```ts
const stream = await client.chat.completions.create({
  model: 'openai/gpt-4o',
  messages: [{ role: 'user', content: 'Write a poem' }],
  stream: true,
});

for await (const chunk of stream) {
  process.stdout.write(chunk.choices[0]?.delta?.content || '');
}
```

### Embeddings

```ts
const response = await client.embeddings.create({
  model: 'openai/text-embedding-3-small',
  input: 'Your text here',
});

console.log(response.data[0].embedding);
```

### Image Generation

```ts
const image = await client.images.generate({
  model: 'google-imagen-4.0',
  prompt: 'A sunset over the ocean',
});

console.log(image.data[0].url);
```

### Audio Generation (TTS)

```ts
const response = await client.audio.create({
  model: 'openai/tts',
  input: 'Hello world',
  voice: 'alloy',
});

// response is a raw Response with binary audio data
const buffer = await response.arrayBuffer();
```

### List Models

```ts
const models = await client.models.list();
console.log(models.data);
```

### Check Balance

```ts
const balance = await client.balance.retrieve();
console.log(balance.data.balance);
```

## Error Handling

```ts
import Lunos, { APIError, RateLimitError } from '@lunos/sdk';

try {
  await client.chat.completions.create({ ... });
} catch (err) {
  if (err instanceof RateLimitError) {
    console.log('Rate limited, retry later');
  } else if (err instanceof APIError) {
    console.log(err.status, err.message);
  }
}
```

## Configuration

```ts
const client = new Lunos({
  apiKey: 'sk-...',
  baseURL: 'https://api.lunos.tech', // default
  timeout: 30_000,                    // 30s (default 60s)
  maxRetries: 3,                      // default 2
});
```

## Requirements

- Node.js >= 18 (or any runtime with global `fetch`)
- TypeScript >= 4.9

## License

MIT
