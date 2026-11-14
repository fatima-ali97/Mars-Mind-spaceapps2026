import React, { useState } from 'react';
import { ChatMessage, MissionScenario } from '../../types/chat';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';

interface ChatbotWidgetProps {
  messages: ChatMessage[];
  isLoading: boolean;
  onSendMessage: (msg: string) => void;
  onClearHistory: () => void;
  suggestions: string[];
  scenarios: MissionScenario[];
  activeScenarioId: string;
  onSelectScenario: (scenarioId: string) => void;
  isStreamingMode: boolean;
  setIsStreamingMode: (enabled: boolean) => void;
  isMuted: boolean;
  setIsMuted: (muted: boolean) => void;
}

export const ChatbotWidget: React.FC<ChatbotWidgetProps> = ({
  messages,
  isLoading,
  onSendMessage,
  onClearHistory,
  suggestions,
  scenarios,
  activeScenarioId,
  onSelectScenario,
  isStreamingMode,
  setIsStreamingMode,
  isMuted,
  setIsMuted,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  const activeScenario = scenarios.find((s) => s.id === activeScenarioId) || scenarios[0];

  const handleExportMarkdown = () => {
    let md = `# Mars Mind Mission Log - ARES AI Transmission\n\n`;
    md += `**Date:** ${new Date().toISOString()}\n`;
    md += `**Scenario:** ${activeScenario?.name || 'Nominal'}\n\n---\n\n`;

    messages.forEach((m) => {
      const sender = m.role === 'assistant' ? 'ARES AI' : 'Mission Specialist';
      md += `### ${sender} [${new Date(m.timestamp).toLocaleTimeString()}]\n\n${m.content}\n\n`;
      if (m.telemetry && m.telemetry.length > 0) {
        md += `*Telemetry:*\n`;
        m.telemetry.forEach((t) => {
          md += `- **${t.label}:** ${t.value} (${t.status.toUpperCase()})\n`;
        });
        md += `\n`;
      }
    });

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mars-mind-chat-${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExecuteAction = (
    label: string,
    actionType: string,
    _payload?: Record<string, unknown>
  ) => {
    const actionPrompt = `Execute command: ${label} [${actionType}]`;
    onSendMessage(actionPrompt);
  };

  const filteredMessages = searchTerm.trim()
    ? messages.filter((m) => m.content.toLowerCase().includes(searchTerm.toLowerCase()))
    : messages;

  return (
    <div className="chatbot-container">
      {/* Header with Mission Scenario & Controls */}
      <div className="chatbot-header">
        <div className="bot-header-left">
          <div className="bot-status-ring">
            <span className="bot-avatar-emoji">🤖</span>
            <span className="bot-pulse-dot" />
          </div>
          <div>
            <div className="bot-header-title">
              ARES AI Specialist
              <span className={`scenario-badge badge-${activeScenario?.alert_level || 'nominal'}`}>
                {activeScenario?.alert_level?.toUpperCase() || 'NOMINAL'}
              </span>
            </div>
            <div className="bot-header-sub">
              Mission Context:{' '}
              <select
                className="scenario-select"
                value={activeScenarioId}
                onChange={(e) => onSelectScenario(e.target.value)}
              >
                {scenarios.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="bot-header-actions">
          <button
            type="button"
            className="bot-header-btn"
            onClick={() => setShowSearch(!showSearch)}
            title="Search conversation"
          >
            🔍 Search
          </button>
          <button
            type="button"
            className="bot-header-btn"
            onClick={handleExportMarkdown}
            title="Download conversation log as Markdown"
          >
            📥 Export Log
          </button>
          <button
            type="button"
            className="bot-header-btn danger-hover"
            onClick={onClearHistory}
            title="Reset Conversation"
          >
            Clear Log
          </button>
        </div>
      </div>

      {/* Optional Search Bar */}
      {showSearch && (
        <div className="chat-search-bar">
          <input
            type="text"
            className="chat-search-input"
            placeholder="Search transcripts in this session..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button className="clear-search-btn" onClick={() => setSearchTerm('')}>
              ✕
            </button>
          )}
        </div>
      )}

      {/* Messages */}
      <MessageList
        messages={filteredMessages}
        isLoading={isLoading}
        onSelectSuggestion={onSendMessage}
        onExecuteAction={handleExecuteAction}
      />

      {/* Input */}
      <ChatInput
        onSendMessage={onSendMessage}
        isLoading={isLoading}
        suggestions={suggestions}
        isStreamingMode={isStreamingMode}
        setIsStreamingMode={setIsStreamingMode}
        isMuted={isMuted}
        setIsMuted={setIsMuted}
      />
    </div>
  );
};
