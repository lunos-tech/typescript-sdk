# @lunos/sdk

[![npm version](https://img.shields.io/npm/v/@lunos/sdk.svg)](https://www.npmjs.com/package/@lunos/sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

The official TypeScript/JavaScript SDK for the [Lunos](https://lunos.tech) AI API gateway — one unified, OpenAI-compatible interface to multiple AI providers.

## Installation

```sh
npm install @lunos/sdk
```

## Quick start

```ts
import Lunos from "@lunos/sdk";

const client = new Lunos({
  apiKey: process.env.LUNOS_API_KEY,
});

const completion = await client.chat.completions.create({
  model: "openai/gpt-4o",
  messages: [{ role: "user", content: "Hello!" }],
});

console.log(completion.choices[0].message.content);
```

## Configuration

```ts
const client = new Lunos({
  apiKey: "sk-...",                    // Required. Defaults to env LUNOS_API_KEY
  baseURL: "https://api.lunos.tech",  // Optional. Defaults to env LUNOS_BASE_URL
  appId: "my-service-v1",             // Optional. Sent as X-App-ID for analytics
  timeout: 30_000,                    // Optional. Default 60s
  maxRetries: 3,                      // Optional. Default 2
});
```

## Usage

### Chat completions

```ts
const response = await client.chat.completions.create({
  model: "openai/gpt-4o",
  messages: [
    { role: "system", content: "You are a helpful assistant." },
    { role: "user", content: "Explain quantum computing in one sentence." },
  ],
  temperature: 0.7,
  max_tokens: 256,
});
```

### Streaming

```ts
const stream = await client.chat.completions.create({
  model: "openai/gpt-4o",
  messages: [{ role: "user", content: "Write a haiku about code" }],
  stream: true,
});

for await (const chunk of stream) {
  process.stdout.write(chunk.choices[0]?.delta?.content ?? "");
}
```

### Multimodal (vision)

```ts
const response = await client.chat.completions.create({
  model: "openai/gpt-4o",
  messages: [
    {
      role: "user",
      content: [
        { type: "text", text: "What's in this image?" },
        { type: "image_url", image_url: { url: "https://example.com/photo.jpg" } },
      ],
    },
  ],
});
```

### Structured outputs

```ts
const response = await client.chat.completions.create({
  model: "openai/gpt-4o",
  messages: [{ role: "user", content: "Weather in Tokyo" }],
  response_format: {
    type: "json_schema",
    json_schema: {
      name: "weather",
      strict: true,
      schema: {
        type: "object",
        properties: {
          location: { type: "string" },
          temperature: { type: "number" },
        },
        required: ["location", "temperature"],
        additionalProperties: false,
      },
    },
  },
});
```

### Tool & function calling

```ts
const response = await client.chat.completions.create({
  model: "openai/gpt-4o",
  messages: [{ role: "user", content: "What's the weather in Paris?" }],
  tools: [
    {
      type: "function",
      function: {
        name: "get_weather",
        description: "Get current weather for a location",
        parameters: {
          type: "object",
          properties: { location: { type: "string" } },
          required: ["location"],
        },
      },
    },
  ],
});
```

### Web search

```ts
const response = await client.chat.completions.create({
  model: "openai/gpt-4o",
  messages: [{ role: "user", content: "Latest AI news this week" }],
  tools: [{ type: "web_search" }],
});
```

### Observability

```ts
const response = await client.chat.completions.create({
  model: "openai/gpt-4o",
  messages: [{ role: "user", content: "Debug this request" }],
  observability: true, // Stores request/response details in Lunos dashboard
});
```

### Embeddings

```ts
const response = await client.embeddings.create({
  model: "openai/text-embedding-3-small",
  input: "The quick brown fox",
});

console.log(response.data[0].embedding); // number[]
```

### Image generation

```ts
const response = await client.images.generate({
  model: "google-imagen-4.0",
  prompt: "A serene mountain lake at sunset",
});

console.log(response.data[0].url);
```

### Audio generation (TTS)

```ts
const response = await client.audio.create({
  model: "openai/tts",
  input: "Hello from Lunos!",
  voice: "alloy",
});

// Response is raw binary audio
const buffer = await response.arrayBuffer();
```

### List models

```ts
const models = await client.models.list();
// Filter by capability
const imageModels = await client.models.list({ output: "image" });
```

### Check balance

```ts
const balance = await client.balance.retrieve();
console.log(`$${balance.data.balance}`);
```

## Error handling

All errors extend `LunosError`. HTTP errors are mapped to specific classes:

```ts
import Lunos, { RateLimitError, AuthenticationError, APIError } from "@lunos/sdk";

try {
  await client.chat.completions.create({ model: "gpt-4o", messages: [] });
} catch (err) {
  if (err instanceof RateLimitError) {
    // Retry after backoff
  } else if (err instanceof AuthenticationError) {
    // Invalid API key
  } else if (err instanceof APIError) {
    console.error(err.status, err.message);
  }
}
```

| Status | Error class |
|--------|-------------|
| 400 | `BadRequestError` |
| 401 | `AuthenticationError` |
| 403 | `PermissionDeniedError` |
| 404 | `NotFoundError` |
| 422 | `UnprocessableEntityError` |
| 429 | `RateLimitError` |
| ≥500 | `InternalServerError` |
| Network | `APIConnectionError` |
| Timeout | `APIConnectionTimeoutError` |

## Retries

Requests that fail with 408, 409, 429, or ≥500 are automatically retried with exponential backoff (default: 2 retries).

```ts
// Disable retries
const client = new Lunos({ apiKey: "sk-...", maxRetries: 0 });

// Per-request override
await client.chat.completions.create(
  { model: "gpt-4o", messages: [{ role: "user", content: "Hi" }] },
  { maxRetries: 5 },
);
```

## Requirements

- Node.js ≥ 18 (or any runtime with global `fetch`)
- TypeScript ≥ 4.9

Works in Node.js, Deno, Bun, Cloudflare Workers, and Vercel Edge Runtime.

## License

MIT

