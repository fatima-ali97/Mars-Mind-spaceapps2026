import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { MissionOverview } from './components/MissionOverview';
import { ChatbotWidget } from './components/Chatbot/ChatbotWidget';
import { ChatMessage, SystemHealth, MissionScenario } from './types/chat';
import {
  fetchHealth,
  sendChatMessage,
  streamChatMessage,
  fetchChatSuggestions,
  fetchScenarios,
} from './services/api';
import { soundManager } from './services/soundEffects';
import './App.css';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'chat'>('overview');
  const [health, setHealth] = useState<SystemHealth>({
    status: 'operational',
    service: 'Mars Mind Backend',
    version: '0.2.0',
    ai_provider: 'mock',
  });
  const [isBotDrawerOpen, setIsBotDrawerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreamingMode, setIsStreamingMode] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [scenarios, setScenarios] = useState<MissionScenario[]>([
    {
      id: 'nominal',
      name: 'Expedition Sol 142 - Nominal',
      description: 'Standard Martian summer operations',
      alert_level: 'nominal',
      parameters: {},
    },
  ]);
  const [activeScenarioId, setActiveScenarioId] = useState<string>('nominal');

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      role: 'assistant',
      content:
      'Greetings, Explorer! I am **ARES**, your onboard Autonomous Resource & Exploration Specialist. ' +
        'I monitor real-time surface meteorology at Jezero Crater, closed-loop ECLSS life support, and autonomous rover operations. ' +
        'Select a mission scenario or inquire below to begin telemetry analysis.',
      timestamp: new Date().toISOString(),
      source: 'ARES-Autonomous Core',
      suggestions: [
        'What is the current atmospheric composition on Mars?',
        'How does the habitat life support system recycle water?',
        'What is the communication time delay between Earth and Mars?',
      ],
      telemetry: [
        { label: 'Surface Pressure', value: '612 Pa', status: 'nominal', subsystem: 'ATMOSPHERE' },
        { label: 'ECLSS O2 Partial', value: '21.1 kPa', status: 'nominal', subsystem: 'ECLSS' },
        { label: 'DSN Light Delay', value: '12m 44s', status: 'nominal', subsystem: 'COMMS' },
      ],
    },
  ]);

  const loadHealth = async () => {
    const res = await fetchHealth();
    setHealth(res);
  };

  const loadSuggestions = async () => {
    const data = await fetchChatSuggestions();
    if (data && data.length > 0) {
      setSuggestions(data);
    }
  };

  const loadScenarios = async () => {
    const data = await fetchScenarios();
    if (data && data.length > 0) {
      setScenarios(data);
    }
  };

  useEffect(() => {
    loadHealth();
    loadSuggestions();
    loadScenarios();
    const interval = setInterval(loadHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleSendMessage = async (userText: string) => {
    if (!userText.trim()) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: userText,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

      const historyPayload = messages.map((m) => ({
        role: m.role,
        content: m.content,
        timestamp: m.timestamp,
      }));

        if(isStreamingMode) {
          // Streaming Mode via Server-Sent Events (SSE)
          const assistantMsgId = `assistant-${Date.now()}`;
          const placeholderMsg: ChatMessage = {
            id: assistantMsgId,
            role: 'assistant',
            content: '',
            timestamp: new Date().toISOString(),
            source: 'ARES (Streaming)',
            isStreaming: true,
          };

      setMessages((prev) => [...prev, placeholderMsg]);

await streamChatMessage(
  {
    message: userText,
    history: historyPayload,
    mission_context: activeScenarioId,
    stream: true,
  },
  {
    onChunk: (chunk: string) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsgId
            ? { ...m, content: m.content + chunk, isStreaming: true }
            : m
        )
      );
    },
    onDone: (data) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsgId
            ? {
              ...m,
              source: data.source,
              suggestions: data.suggestions,
              telemetry: data.telemetry,
              actions: data.actions,
              isStreaming: false,
            }
            : m
        )
      );
      setIsLoading(false);
      if (!isMuted) soundManager.playReceiveBeep();
    },
    onError: (err: Error) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsgId
            ? {
              ...m,
              content: `⚠️ **Relay Transmission Interrupted:** ${err.message}. Verify that the Python backend is active.`,
              source: 'Comm-Relay-Alert',
              isStreaming: false,
            }
            : m
        )
      );
      setIsLoading(false);
      if (!isMuted) soundManager.playAlertTone();
    },
  }
);
    } else {
  // Standard Direct Mode
  try {
    const response = await sendChatMessage({
      message: userText,
      history: historyPayload,
      mission_context: activeScenarioId,
    });

    const botMsg: ChatMessage = {
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      content: response.reply,
      timestamp: response.timestamp || new Date().toISOString(),
      source: response.source,
      suggestions: response.suggestions,
      telemetry: response.telemetry,
      actions: response.actions,
    };

    setMessages((prev) => [...prev, botMsg]);
    if (!isMuted) soundManager.playReceiveBeep();
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    const errorMsg: ChatMessage = {
      id: `error-${Date.now()}`,
      role: 'assistant',
      content: `⚠️ **Communication Link Offline:** ${errorMessage}. Please verify backend service on \`http://127.0.0.1:8000\`.`,
      timestamp: new Date().toISOString(),
      source: 'Comm-Relay-Alert',
    };
    setMessages((prev) => [...prev, errorMsg]);
    if (!isMuted) soundManager.playAlertTone();
  } finally {
    setIsLoading(false);
  }
}
  };

const handleClearHistory = () => {
  setMessages([
    {
      id: `welcome-${Date.now()}`,
      role: 'assistant',
      content: 'Transcript cleared. Planetary telemetry standing by. How can ARES assist your expedition?',
      timestamp: new Date().toISOString(),
      source: 'ARES-Core',
      suggestions: suggestions.slice(0, 3),
    },
  ]);
};

const handleTriggerPromptFromOverview = (prompt: string) => {
  setActiveTab('chat');
  handleSendMessage(prompt);
};

return (
  <div className="app-layout">
    <Navbar
      health={health}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      onRefreshHealth={loadHealth}
    />

    <main className="main-content">
      {activeTab === 'overview' && (
        <MissionOverview onAskChatbot={handleTriggerPromptFromOverview} />
      )}

      {activeTab === 'chat' && (
        <div className="chat-fullview-wrapper">
          <ChatbotWidget
            messages={messages}
            isLoading={isLoading}
            onSendMessage={handleSendMessage}
            onClearHistory={handleClearHistory}
            suggestions={suggestions}
            scenarios={scenarios}
            activeScenarioId={activeScenarioId}
            onSelectScenario={setActiveScenarioId}
            isStreamingMode={isStreamingMode}
            setIsStreamingMode={setIsStreamingMode}
            isMuted={isMuted}
            setIsMuted={setIsMuted}
          />
        </div>
      )}
    </main>

    {/* Floating launcher for fast access from overview */}
    {activeTab === 'overview' && (
      <button
        className="floating-chat-trigger"
        onClick={() => setIsBotDrawerOpen(!isBotDrawerOpen)}
        title="Open ARES AI Assistant"
      >
        <span className="floating-icon">🤖</span>
        <span className="floating-label">Ask ARES</span>
      </button>
    )}

    {/* Slide-out quick drawer */}
    {isBotDrawerOpen && activeTab === 'overview' && (
      <div className="chat-drawer-backdrop" onClick={() => setIsBotDrawerOpen(false)}>
        <div className="chat-drawer" onClick={(e) => e.stopPropagation()}>
          <div className="chat-drawer-close-bar">
            <span>ARES Fast Comms Drawer</span>
              <button className="close-drawer-btn" onClick={() => setIsBotDrawerOpen(false)}>
                ✕ Close
              </button>
          </div>
          <ChatbotWidget
            messages={messages}
            isLoading={isLoading}
            onSendMessage={handleSendMessage}
            onClearHistory={handleClearHistory}
            suggestions={suggestions}
            scenarios={scenarios}
            activeScenarioId={activeScenarioId}
            onSelectScenario={setActiveScenarioId}
            isStreamingMode={isStreamingMode}
            setIsStreamingMode={setIsStreamingMode}
            isMuted={isMuted}
            setIsMuted={setIsMuted}
          />
        </div>
      </div>
    )}

    <footer className="footer">
      <div className="footer-content">
        <span>Mars Mind Platform • NASA Space Apps Challenge 2026</span>
        <span className="footer-links">
            <a href="http://127.0.0.1:8000/docs" target="_blank" rel="noreferrer">
              FastAPI Swagger Docs ↗
            </a>
            {' • '}
            <span>AI Engine: {health.ai_provider?.toUpperCase() || 'AUTONOMOUS'}</span>
        </span>
      </div>
    </footer>
  </div>
);
};
