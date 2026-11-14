import React, { useEffect, useRef } from 'react';
import { ChatMessage } from '../../types/chat';
import { MessageItem } from './MessageItem';

interface MessageListProps {
  messages: ChatMessage[];
  isLoading: boolean;
  onSelectSuggestion: (suggestion: string) => void;
  onExecuteAction: (label: string, actionType: string, payload?: Record<string, unknown>) => void;
}

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  isLoading,
  onSelectSuggestion,
  onExecuteAction,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  return (
    <div className="message-list-container" ref={scrollRef}>
      {messages.length === 0 ? (
        <div className="chat-empty-state">
          <div className="empty-icon">🪐</div>
          <h3>ARES Mission Support Online</h3>
          <p>
            Autonomous planetary assistant ready. Inquire about atmospheric synthesis,
            radiation dosimetry, ECLSS life support, or autonomous rover operations.
          </p>
          <div className="empty-starter-chips">
            <button
              className="starter-card-btn"
              onClick={() => onSelectSuggestion('What is the current atmospheric composition on Mars?')}
            >
              <span className="starter-title">Atmosphere & Pressure</span>
              <span className="starter-sub">CO2 profile, 612 Pa surface reading</span>
            </button>
            <button
              className="starter-card-btn"
              onClick={() => onSelectSuggestion('How does the habitat life support system recycle water?')}
            >
              <span className="starter-title">ECLSS Life Support</span>
              <span className="starter-sub">Vapor compression distillation & MOXIE</span>
            </button>
            <button
              className="starter-card-btn"
              onClick={() => onSelectSuggestion('What is the communication time delay between Earth and Mars?')}
            >
              <span className="starter-title">Comms & Relay Latency</span>
              <span className="starter-sub">12m 44s light time delay telemetry</span>
            </button>
          </div>
        </div>
      ) : (
        messages.map((msg) => (
          <MessageItem
            key={msg.id}
            message={msg}
            onSelectSuggestion={onSelectSuggestion}
            onExecuteAction={onExecuteAction}
          />
        ))
      )}

      {isLoading && (
        <div className="message-row assistant-row">
          <div className="message-avatar">🤖</div>
          <div className="message-bubble-wrap">
            <div className="message-bubble typing-indicator-bubble">
              <span className="typing-dot" />
              <span className="typing-dot" />
              <span className="typing-dot" />
              <span className="typing-label">ARES is synthesizing planetary telemetry...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
