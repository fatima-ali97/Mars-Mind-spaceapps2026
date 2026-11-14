import React, { useEffect, useRef } from 'react';
import { ChatMessage } from '../../types/chat';
import { MessageItem } from './MessageItem';

interface MessageListProps {
  messages: ChatMessage[];
  isLoading: boolean;
  onSelectSuggestion: (suggestion: string) => void;
}

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  isLoading,
  onSelectSuggestion,
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
            Ask any question regarding Mars surface conditions, life support recycling,
            rover operations, or communication windows.
          </p>
        </div>
      ) : (
        messages.map((msg) => (
          <MessageItem
            key={msg.id}
            message={msg}
            onSelectSuggestion={onSelectSuggestion}
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
              <span className="typing-label">ARES is analyzing telemetry...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

