export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  source?: string;
  suggestions?: string[];
}

export interface ChatRequest {
  message: string;
  history?: Array<{
    role: string;
    content: string;
    timestamp?: string;
  }>;
  mission_context?: string;
}

export interface ChatResponse {
  reply: string;
  source: string;
  timestamp: string;
  suggestions?: string[];
}

export interface SystemHealth {
  status: 'operational' | 'degraded' | 'offline';
  service: string;
  version: string;
  timestamp?: string;
}

