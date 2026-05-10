// ─── Chat ────────────────────────────────────────────────────────────────────

export interface ChatCompletionMessageParam {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string | null;
  name?: string;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
}

export interface ToolCall {
  id: string;
  type: 'function';
  function: { name: string; arguments: string };
}

export interface Tool {
  type: 'function';
  function: { name: string; description?: string; parameters?: Record<string, unknown> };
}

export interface ChatCompletionCreateParams {
  model: string;
  messages: ChatCompletionMessageParam[];
  stream?: boolean;
  temperature?: number;
  top_p?: number;
  max_tokens?: number;
  stop?: string | string[];
  frequency_penalty?: number;
  presence_penalty?: number;
  tools?: Tool[];
  tool_choice?: 'none' | 'auto' | { type: 'function'; function: { name: string } };
  response_format?: { type: 'text' | 'json_object' };
  user?: string;
}

export interface ChatCompletionChoice {
  index: number;
  message: { role: string; content: string | null; tool_calls?: ToolCall[] };
  finish_reason: string | null;
}

export interface ChatCompletion {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: ChatCompletionChoice[];
  usage?: CompletionUsage;
}

export interface CompletionUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface ChatCompletionChunkChoice {
  index: number;
  delta: { role?: string; content?: string | null; tool_calls?: ToolCall[] };
  finish_reason: string | null;
}

export interface ChatCompletionChunk {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: ChatCompletionChunkChoice[];
  usage?: CompletionUsage | null;
}

// ─── Audio ───────────────────────────────────────────────────────────────────

export interface AudioGenerationParams {
  model: string;
  input: string;
  voice: string;
  response_format?: 'mp3' | 'opus' | 'aac' | 'flac' | 'wav';
  speed?: number;
  google_voice_config?: { voiceName?: string };
}

// ─── Images ──────────────────────────────────────────────────────────────────

export interface ImageGenerationParams {
  prompt: string;
  model?: string;
  n?: number;
  size?: string;
  quality?: 'standard' | 'hd';
  style?: 'vivid' | 'natural';
  response_format?: 'url' | 'b64_json';
  google_imagen_config?: { sampleCount?: number };
}

export interface ImageObject {
  url?: string;
  b64_json?: string;
}

export interface ImageGenerationResponse {
  created: number;
  data: ImageObject[];
  model: string;
  cost: number;
}

// ─── Embeddings ──────────────────────────────────────────────────────────────

export interface EmbeddingCreateParams {
  model: string;
  input: string | string[];
  encoding_format?: 'float' | 'base64';
  dimensions?: number;
  user?: string;
}

export interface EmbeddingObject {
  object: 'embedding';
  embedding: number[];
  index: number;
}

export interface EmbeddingResponse {
  object: 'list';
  data: EmbeddingObject[];
  model: string;
  usage: { prompt_tokens: number; total_tokens: number };
}

// ─── Models ──────────────────────────────────────────────────────────────────

export interface Model {
  id: string;
  object: string;
  created: number;
  owned_by: string;
}

export interface ModelListResponse {
  data: Model[];
}

export interface ModelListParams {
  input?: string;
  output?: string;
}

// ─── Balance ─────────────────────────────────────────────────────────────────

export interface BalanceResponse {
  success: boolean;
  message: string;
  data: {
    balance: number;
    email: string;
    alertBalance: number;
    enableAlert: number;
    updatedAt: string;
    isAlertEnabled: boolean;
    isBalanceLow: boolean;
  };
}

// ─── Shared ──────────────────────────────────────────────────────────────────

export interface RequestOptions {
  timeout?: number;
  maxRetries?: number;
  headers?: Record<string, string>;
  signal?: AbortSignal;
}
