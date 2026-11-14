import { ChatRequest, ChatResponse, SystemHealth } from '../types/chat';

const API_BASE = '/api';

export async function fetchHealth(): Promise<SystemHealth> {
  try {
    const res = await fetch(`${API_BASE}/health`);
    if (!res.ok) {
      throw new Error(`Health check returned status ${res.status}`);
    }
    return await res.json();
  } catch (err) {
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

export async function fetchChatSuggestions(): Promise<string[]> {
  try {
    const res = await fetch(`${API_BASE}/chat/suggestions`);
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

