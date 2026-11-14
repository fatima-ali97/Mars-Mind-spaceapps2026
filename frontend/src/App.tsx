import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { MissionOverview } from './components/MissionOverview';
import { ChatbotWidget } from './components/Chatbot/ChatbotWidget';
import { ChatMessage, SystemHealth } from './types/chat';
import { fetchHealth, sendChatMessage, fetchChatSuggestions } from './services/api';
import './App.css';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'chat'>('overview');
  const [health, setHealth] = useState<SystemHealth>({
    status: 'operational',
    service: 'Mars Mind Backend',
    version: '0.1.0',
  });
  const [isBotDrawerOpen, setIsBotDrawerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      role: 'assistant',
      content:
        'Welcome to **Mars Mind Mission Control**! I am **ARES**, your onboard AI specialist. ' +
        'I can provide real-time updates on Jezero surface telemetry, habitat life support, radiation levels, and rover operations. ' +
        'What would you like to explore?',
      timestamp: new Date().toISOString(),
      source: 'ARES-Autonomous',
      suggestions: [
        'What is the current atmospheric composition on Mars?',
        'How does the habitat life support system recycle water?',
        'What is the communication time delay between Earth and Mars?',
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

  useEffect(() => {
    loadHealth();
    loadSuggestions();
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

    try {
      const response = await sendChatMessage({
        message: userText,
        history: messages.map((m) => ({
          role: m.role,
          content: m.content,
          timestamp: m.timestamp,
        })),
        mission_context: 'mars_surface_jezero',
      });

      const botMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: response.reply,
        timestamp: response.timestamp || new Date().toISOString(),
        source: response.source,
        suggestions: response.suggestions,
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      const errorMsg: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: `⚠️ **Communication Link Error:** Unable to reach Mars Mind Backend (${errorMessage}). Please verify that the Python backend is running on \`http://127.0.0.1:8000\`.`,
        timestamp: new Date().toISOString(),
        source: 'Comm-Relay-Alert',
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        role: 'assistant',
        content: 'Conversation history reset. System telemetry standing by. How can ARES assist you?',
        timestamp: new Date().toISOString(),
        source: 'ARES-Core',
        suggestions: suggestions.slice(0, 3),
      },
    ]);
  };

  const handleTriggerPromptFromOverview = (prompt: string) => {
    // Switch to chat tab or open drawer and send prompt
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
            />
          </div>
        )}
      </main>

      {/* Floating launcher for fast access from any screen */}
      {activeTab === 'overview' && (
        <button
          className="floating-chat-trigger"
          onClick={() => setIsBotDrawerOpen(!isBotDrawerOpen)}
          title="Toggle ARES AI Assistant"
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
              <button
                className="close-drawer-btn"
                onClick={() => setIsBotDrawerOpen(false)}
              >
                ✕ Close
              </button>
            </div>
            <ChatbotWidget
              messages={messages}
              isLoading={isLoading}
              onSendMessage={handleSendMessage}
              onClearHistory={handleClearHistory}
              suggestions={suggestions}
            />
          </div>
        </div>
      )}

      <footer className="footer">
        <div className="footer-content">
          <span>Mars Mind Platform • NASA Space Apps Challenge 2026</span>
          <span className="footer-links">
            <a href="https://github.com" target="_blank" rel="noreferrer">
              Repository
            </a>
            {' • '}
            <a href="http://127.0.0.1:8000/docs" target="_blank" rel="noreferrer">
              FastAPI Docs
            </a>
          </span>
        </div>
      </footer>
    </div>
  );
};

