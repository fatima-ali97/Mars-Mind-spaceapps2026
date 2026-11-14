import {
  ChatRequest,
  ChatResponse,
  MissionScenario,
  SystemHealth,
  TelemetryBadge,
  ActionItem,
} from '../types/chat';

const API_BASE = '/api';

export async function fetchHealth(): Promise<SystemHealth> {
  try {
    const res = await fetch(`${API_BASE}/health`);
    if (!res.ok) {
      throw new Error(`Health check returned status ${res.status}`);
    }
    return await res.json();
  } catch {
    return {
      status: 'offline',
      service: 'Mars Mind Backend',
      version: 'unknown',
    };
  }
}

export async function sendChatMessage(payload: ChatRequest): Promise<ChatResponse> {
  const res = await fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: 'Network error occurred' }));
    throw new Error(errorData.detail || `Server error (${res.status})`);
  }

  return await res.json();
}

export interface StreamCallbacks {
  onChunk: (chunk: string) => void;
  onDone: (data: {
    source: string;
    suggestions?: string[];
    telemetry?: TelemetryBadge[];
    actions?: ActionItem[];
  }) => void;
  onError: (error: Error) => void;
}

export async function streamChatMessage(
  payload: ChatRequest,
  callbacks: StreamCallbacks
): Promise<void> {
  try {
    const res = await fetch(`${API_BASE}/chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ detail: 'Streaming failed' }));
      throw new Error(errorData.detail || `Stream failed with status ${res.status}`);
    }

    if (!res.body) {
      throw new Error('ReadableStream not supported by browser response.');
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n\n');
      buffer = lines.pop() || '';

      for (const block of lines) {
        const trimmed = block.trim();
        if (trimmed.startsWith('data:')) {
          const jsonStr = trimmed.slice(5).trim();
          try {
            const parsed = JSON.parse(jsonStr);
            if (!parsed.done) {
              if (parsed.chunk) {
                callbacks.onChunk(parsed.chunk);
              }
            } else {
              callbacks.onDone({
                source: parsed.source,
                suggestions: parsed.suggestions,
                telemetry: parsed.telemetry,
                actions: parsed.actions,
              });
            }
          } catch {
            // ignore non-json SSE lines
          }
        }
      }
    }
  } catch (err: unknown) {
    callbacks.onError(err instanceof Error ? err : new Error(String(err)));
  }
}

export async function fetchChatSuggestions(): Promise<string[]> {
  try {
    const res = await fetch(`${API_BASE}/chat/suggestions`);
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export async function fetchScenarios(): Promise<MissionScenario[]> {
  try {
    const res = await fetch(`${API_BASE}/chat/scenarios`);
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}
