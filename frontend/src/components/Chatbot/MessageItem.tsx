import React from 'react';
import { ChatMessage } from '../../types/chat';

interface MessageItemProps {
  message: ChatMessage;
  onSelectSuggestion?: (suggestion: string) => void;
}

export const MessageItem: React.FC<MessageItemProps> = ({ message, onSelectSuggestion }) => {
  const isAssistant = message.role === 'assistant';

  // Format simple markdown into clean HTML/JSX
  const renderFormattedContent = (text: string) => {
    return text.split('\n').map((line, idx) => {
      if (line.startsWith('- ')) {
        const itemContent = line.slice(2);
        return (
          <li key={idx} className="chat-bullet">
            {formatBold(itemContent)}
          </li>
        );
      }
      if (line.trim() === '') {
        return <div key={idx} className="chat-line-break" />;
      }
      return (
        <p key={idx} className="chat-paragraph">
          {formatBold(line)}
        </p>
      );
    });
  };

  const formatBold = (str: string) => {
    const parts = str.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i}>{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  return (
    <div className={`message-row ${isAssistant ? 'assistant-row' : 'user-row'}`}>
      <div className="message-avatar">
        {isAssistant ? '🤖' : '👨‍🚀'}
      </div>

      <div className="message-bubble-wrap">
        <div className="message-meta">
          <span className="message-sender">{isAssistant ? 'ARES Specialist' : 'Mission Specialist'}</span>
          {message.source && <span className="message-source-tag">{message.source}</span>}
          <span className="message-time">
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        <div className="message-bubble">
          {renderFormattedContent(message.content)}
        </div>

        {isAssistant && message.suggestions && message.suggestions.length > 0 && onSelectSuggestion && (
          <div className="message-suggestions">
            <span className="suggestions-prompt">Suggested next queries:</span>
            <div className="suggestions-list">
              {message.suggestions.map((sug, idx) => (
                <button
                  key={idx}
                  className="suggestion-chip"
                  onClick={() => onSelectSuggestion(sug)}
                >
                  {sug}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

