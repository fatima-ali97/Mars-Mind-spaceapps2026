import React from 'react';
import { ChatMessage } from '../../types/chat';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';

interface ChatbotWidgetProps {
  messages: ChatMessage[];
  isLoading: boolean;
  onSendMessage: (msg: string) => void;
  onClearHistory: () => void;
  suggestions: string[];
}

export const ChatbotWidget: React.FC<ChatbotWidgetProps> = ({
  messages,
  isLoading,
  onSendMessage,
  onClearHistory,
  suggestions,
}) => {
  return (
    <div className="chatbot-container">
      <div className="chatbot-header">
        <div className="bot-header-left">
          <div className="bot-status-ring">
            <span className="bot-avatar-emoji">🤖</span>
            <span className="bot-pulse-dot" />
          </div>
          <div>
            <div className="bot-header-title">ARES AI Assistant</div>
            <div className="bot-header-sub">Mars Exploration Intelligence Unit</div>
          </div>
        </div>

        <div className="bot-header-actions">
          <button
            type="button"
            className="bot-header-btn"
            onClick={onClearHistory}
            title="Reset Conversation"
          >
            Clear Log
          </button>
        </div>
      </div>

      <MessageList
        messages={messages}
        isLoading={isLoading}
        onSelectSuggestion={onSendMessage}
      />

      <ChatInput
        onSendMessage={onSendMessage}
        isLoading={isLoading}
        suggestions={suggestions}
      />
    </div>
  );
};

