export interface TelemetryBadge {
  label: string;
  value: string;
  status: 'nominal' | 'warning' | 'alert' | 'critical';
  subsystem?: string;
}

export interface ActionItem {
  label: string;
  action_type: 'diagnostic' | 'alert_ack' | 'telemetry_query' | 'override';
  payload?: Record<string, unknown>;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  source?: string;
  suggestions?: string[];
  telemetry?: TelemetryBadge[];
  actions?: ActionItem[];
  isStreaming?: boolean;
}

export interface ChatRequest {
  message: string;
  history?: Array<{
    role: string;
    content: string;
    timestamp?: string;
  }>;
  mission_context?: string;
  stream?: boolean;
}

export interface ChatResponse {
  reply: string;
  source: string;
  timestamp: string;
  suggestions?: string[];
  telemetry?: TelemetryBadge[];
  actions?: ActionItem[];
}

export interface MissionScenario {
  id: string;
  name: string;
  description: string;
  alert_level: 'nominal' | 'advisory' | 'warning' | 'emergency';
  parameters: Record<string, string>;
}

export interface SystemHealth {
  status: 'operational' | 'degraded' | 'offline';
  service: string;
  version: string;
  ai_provider?: string;
  timestamp?: string;
}
