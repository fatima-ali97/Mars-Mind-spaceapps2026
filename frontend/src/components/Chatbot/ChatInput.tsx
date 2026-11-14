import React, { useState, KeyboardEvent } from 'react';

interface ChatInputProps {
  onSendMessage: (msg: string) => void;
  isLoading: boolean;
  suggestions: string[];
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  isLoading,
  suggestions,
}) => {
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    onSendMessage(input.trim());
    setInput('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="chat-input-wrapper">
      {suggestions.length > 0 && (
        <div className="input-suggestions-drawer">
          <span className="drawer-label">Quick topics:</span>
          <div className="drawer-scroll">
            {suggestions.slice(0, 3).map((sug, i) => (
              <button
                key={i}
                type="button"
                className="input-suggestion-pill"
                onClick={() => onSendMessage(sug)}
                disabled={isLoading}
              >
                {sug}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="chat-input-row">
        <input
          type="text"
          className="chat-text-input"
          placeholder="Ask ARES about Mars mission telemetry, ECLSS, AutoNav, or weather..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
        />
        <button
          type="button"
          className="chat-send-btn"
          onClick={handleSend}
          disabled={!input.trim() || isLoading}
        >
          {isLoading ? (
            <span className="btn-spinner" />
          ) : (
            <span>Send ➔</span>
          )}
        </button>
      </div>
      <div className="chat-input-footer">
        <span>Press <kbd>Enter</kbd> to submit query</span>
        <span>ARES Core • Space Apps 2026</span>
      </div>
    </div>
  );
};

