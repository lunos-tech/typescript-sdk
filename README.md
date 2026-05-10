# @lunos/sdk

[![npm version](https://img.shields.io/npm/v/@lunos/sdk.svg)](https://www.npmjs.com/package/@lunos/sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

The official TypeScript/JavaScript SDK for the [Lunos](https://lunos.tech) AI API gateway — one unified, OpenAI-compatible interface to multiple AI providers.

## Installation

```sh
npm install @lunos/sdk
```

## Quick start

The simplest way to get started. Create a client with your API key and make a chat completion request. The response follows the OpenAI format — your answer is in `choices[0].message.content`.

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

All options are optional except `apiKey`. The SDK reads `LUNOS_API_KEY` and `LUNOS_BASE_URL` from environment variables automatically, so you can often instantiate with just `new Lunos()`.

| Option | Default | Description |
|--------|---------|-------------|
| `apiKey` | `env.LUNOS_API_KEY` | Your Lunos secret key |
| `baseURL` | `https://api.lunos.tech` | API base URL |
| `appId` | — | Identifies your app in Lunos analytics dashboard |
| `timeout` | `60000` | Request timeout in milliseconds |
| `maxRetries` | `2` | Auto-retry count for transient failures |
| `defaultHeaders` | — | Extra headers sent with every request |
| `fetch` | `globalThis.fetch` | Custom fetch implementation |

```ts
const client = new Lunos({
  apiKey: "sk-...",
  appId: "my-service-v1",  // Shows up in your Lunos usage analytics
  timeout: 30_000,         // 30 second timeout
  maxRetries: 3,           // Retry up to 3 times on 429/5xx
});
```

## Usage

### Chat completions

Send a conversation (array of messages) to a model and get a response. Each message has a `role` (`system`, `user`, or `assistant`) and `content`. The system message sets the AI's behavior, user messages are your input, and assistant messages are prior AI responses for multi-turn context.

```ts
const response = await client.chat.completions.create({
  model: "openai/gpt-4o",
  messages: [
    { role: "system", content: "You are a helpful assistant." },
    { role: "user", content: "Explain quantum computing in one sentence." },
  ],
  temperature: 0.7,  // Controls randomness (0 = deterministic, 2 = very random)
  max_tokens: 256,   // Limits response length
});
```

### Streaming

For real-time output (like a chatbot typing), set `stream: true`. Instead of waiting for the full response, you receive chunks as they're generated. Each chunk contains a `delta` with partial content.

```ts
const stream = await client.chat.completions.create({
  model: "openai/gpt-4o",
  messages: [{ role: "user", content: "Write a haiku about code" }],
  stream: true,
});

// Iterate over chunks as they arrive from the model
for await (const chunk of stream) {
  const text = chunk.choices[0]?.delta?.content ?? "";
  process.stdout.write(text); // Print each token immediately
}
```

### Multimodal (vision)

Some models can understand images. Pass `content` as an array of parts — mix text and image URLs. The model will analyze the image and respond based on your text prompt.

```ts
const response = await client.chat.completions.create({
  model: "openai/gpt-4o",
  messages: [
    {
      role: "user",
      content: [
        { type: "text", text: "What's in this image?" },
        {
          type: "image_url",
          image_url: { url: "https://example.com/photo.jpg" },
        },
      ],
    },
  ],
});
```

### Structured outputs

When you need the model to return data in a specific JSON shape (for database writes, form filling, or API responses), provide a JSON Schema. The model's output will strictly conform to your schema — no parsing surprises.

```ts
const response = await client.chat.completions.create({
  model: "openai/gpt-4o",
  messages: [{ role: "user", content: "Weather in Tokyo" }],
  response_format: {
    type: "json_schema",
    json_schema: {
      name: "weather",       // Schema identifier
      strict: true,          // Enforce exact match to schema
      schema: {
        type: "object",
        properties: {
          location: { type: "string" },
          temperature: { type: "number" },
        },
        required: ["location", "temperature"],
        additionalProperties: false,  // No extra fields allowed
      },
    },
  },
});

// response.choices[0].message.content is valid JSON matching your schema
const data = JSON.parse(response.choices[0].message.content!);
// { location: "Tokyo", temperature: 22 }
```

### Tool & function calling

Tools let the model request actions from your application. You define available functions with their parameters. The model doesn't execute them — it returns a `tool_calls` array telling you which function to call and with what arguments. You execute the function and send results back.

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

// Check if the model wants to call a tool
const toolCall = response.choices[0].message.tool_calls?.[0];
if (toolCall) {
  const args = JSON.parse(toolCall.function.arguments);
  // Execute your function: getWeather(args.location)
  // Then send the result back in a follow-up message with role: "tool"
}
```

### Web search

Give the model access to real-time web information. Add `{ type: "web_search" }` to tools and the model will automatically search the web when it needs current data, then synthesize results into its response.

```ts
const response = await client.chat.completions.create({
  model: "openai/gpt-4o",
  messages: [{ role: "user", content: "Latest AI news this week" }],
  tools: [{ type: "web_search" }],  // Model searches the web automatically
});

// Response includes grounded answers with information from the web
```

### Observability

Enable request tracing for debugging. When `observability: true`, Lunos stores the full request/response payload linked to the query log. View it in **Dashboard → Logs → Detail**.

```ts
const response = await client.chat.completions.create({
  model: "openai/gpt-4o",
  messages: [{ role: "user", content: "Debug this request" }],
  observability: true,  // Stores full request/response in Lunos dashboard
});
```

### Embeddings

Convert text into numeric vectors for semantic search, RAG, clustering, or similarity matching. The returned `embedding` array can be stored in a vector database (Pinecone, Weaviate, pgvector, etc.) for retrieval.

```ts
const response = await client.embeddings.create({
  model: "openai/text-embedding-3-small",
  input: "The quick brown fox",
  dimensions: 512,  // Optional: reduce vector size to save storage
});

// response.data[0].embedding → number[] (your vector)
console.log(response.data[0].embedding.length); // 512
```

### Image generation

Generate images from text prompts. The response contains either a URL to the generated image or base64-encoded data, depending on `response_format`.

```ts
const response = await client.images.generate({
  model: "google-imagen-4.0",
  prompt: "A serene mountain lake at sunset",
  n: 1,                      // Number of images to generate
  response_format: "url",    // "url" or "b64_json"
});

console.log(response.data[0].url);  // URL to the generated image
console.log(response.cost);         // Cost in credits
```

### Audio generation (TTS)

Convert text to speech. The response is raw binary audio data (not JSON), so use `.arrayBuffer()` or pipe it to a file.

```ts
const response = await client.audio.create({
  model: "openai/tts",
  input: "Hello from Lunos!",
  voice: "alloy",              // Voice: alloy, echo, fable, onyx, nova, shimmer
  response_format: "mp3",     // mp3, opus, aac, flac, wav
  speed: 1.0,                 // 0.25 to 4.0
});

// Write audio to file (Node.js example)
import { writeFileSync } from "fs";
writeFileSync("output.mp3", Buffer.from(await response.arrayBuffer()));
```

### List models

Retrieve available models with their pricing and capabilities. Use filters to find models that support specific input/output modalities.

```ts
// Get all models
const all = await client.models.list();

// Filter: only models that output images
const imageModels = await client.models.list({ output: "image" });

// Filter: models that accept text+image input and output text
const visionModels = await client.models.list({ input: "text,image", output: "text" });
```

### Check balance

Retrieve your current credit balance and alert settings. Useful for monitoring usage programmatically or building billing dashboards.

```ts
const balance = await client.balance.retrieve();

console.log(`Balance: $${balance.data.balance}`);
console.log(`Low balance alert: ${balance.data.isBalanceLow}`);
```

## Error handling

All errors extend `LunosError`. HTTP errors are mapped to specific classes so you can handle each case precisely. The `status` property contains the HTTP code, and `message` has the error description from the API.

```ts
import Lunos, { RateLimitError, AuthenticationError, APIError } from "@lunos/sdk";

try {
  await client.chat.completions.create({ model: "gpt-4o", messages: [] });
} catch (err) {
  if (err instanceof RateLimitError) {
    // 429 — you've hit the rate limit, wait and retry
  } else if (err instanceof AuthenticationError) {
    // 401 — invalid or expired API key
  } else if (err instanceof APIError) {
    // Any other API error
    console.error(`Error ${err.status}: ${err.message}`);
  }
}
```

| Status | Error class | When it happens |
|--------|-------------|-----------------|
| 400 | `BadRequestError` | Invalid request parameters |
| 401 | `AuthenticationError` | Missing/invalid/expired API key |
| 403 | `PermissionDeniedError` | Insufficient permissions |
| 404 | `NotFoundError` | Endpoint or resource not found |
| 422 | `UnprocessableEntityError` | Valid JSON but semantic error |
| 429 | `RateLimitError` | Too many requests |
| ≥500 | `InternalServerError` | Server-side failure |
| — | `APIConnectionError` | Network connectivity issue |
| — | `APIConnectionTimeoutError` | Request exceeded timeout |

## Retries

Transient failures (408, 409, 429, ≥500, and network errors) are automatically retried with exponential backoff. Non-retryable errors (400, 401, 403, 404, 422) fail immediately.

```ts
// Disable retries globally
const client = new Lunos({ apiKey: "sk-...", maxRetries: 0 });

// Override per-request (useful for time-sensitive operations)
await client.chat.completions.create(
  { model: "gpt-4o", messages: [{ role: "user", content: "Hi" }] },
  { maxRetries: 5, timeout: 120_000 },
);
```

## Requirements

- **Node.js** ≥ 18 (or any runtime with global `fetch`)
- **TypeScript** ≥ 4.9

Works in Node.js, Deno, Bun, Cloudflare Workers, and Vercel Edge Runtime.

## License

MIT
