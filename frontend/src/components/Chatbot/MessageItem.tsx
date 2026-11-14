import React, { useState } from 'react';
import { ChatMessage } from '../../types/chat';
import { soundManager } from '../../services/soundEffects';

interface MessageItemProps {
  message: ChatMessage;
  onSelectSuggestion?: (suggestion: string) => void;
  onExecuteAction?: (label: string, actionType: string, payload?: Record<string, unknown>) => void;
}

  export const MessageItem: React.FC<MessageItemProps> = ({
    message,
    onSelectSuggestion,
    onExecuteAction,
  }) => {
    const isAssistant = message.role === 'assistant';
    const [copied, setCopied] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);

    const handleCopy = () => {
      navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };

    const handleSpeak = () => {
      if (isSpeaking) {
        soundManager.stopSpeaking();
        setIsSpeaking(false);
      } else {
        setIsSpeaking(true);
        soundManager.speakText(message.content, () => setIsSpeaking(false));
      }
    };

    // Format markdown callouts and bold formatting
    const renderFormattedContent = (text: string) => {
      return text.split('\n').map((line, idx) => {
        // GitHub style alerts
        if (line.startsWith('> [!WARNING]')) {
          return (
            <div key={idx} className="callout callout-warning">
              <span className="callout-icon">⚠️</span>
              <span>{line.replace('> [!WARNING]', '').trim()}</span>
            </div>
          );
        }
        if (line.startsWith('> [!CAUTION]')) {
          return (
            <div key={idx} className="callout callout-caution">
              <span className="callout-icon">☢️</span>
              <span>{line.replace('> [!CAUTION]', '').trim()}</span>
            </div>
          );
        }
        if (line.startsWith('> [!NOTE]')) {
          return (
            <div key={idx} className="callout callout-note">
              <span className="callout-icon">ℹ️</span>
              <span>{line.replace('> [!NOTE]', '').trim()}</span>
            </div>
          );
        }
        if (line.startsWith('> ')) {
          return (
            <blockquote key={idx} className="chat-quote">
              {formatBold(line.slice(2))}
            </blockquote>
          );
        }
        if (line.startsWith('- ')) {
          return (
            <li key={idx} className="chat-bullet">
              {formatBold(line.slice(2))}
            </li>
          );
        }
        if (/^\d+\.\s/.test(line)) {
          return (
            <li key={idx} className="chat-num-bullet">
              {formatBold(line.replace(/^\d+\.\s/, ''))}
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
      const parts = str.split(/(\*\*.*?\*\*|\$.*?\$|`.*?`)/g);
      return parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i}>{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith('`') && part.endsWith('`')) {
          return <code key={i} className="inline-code">{part.slice(1, -1)}</code>;
        }
        if (part.startsWith('$') && part.endsWith('$')) {
          return <span key={i} className="math-pill">{part.slice(1, -1)}</span>;
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

            {/* Action buttons for copying and text-to-speech */}
            <div className="message-actions-bar">
              <button
                type="button"
                className="meta-action-btn"
                onClick={handleCopy}
                title="Copy message to clipboard"
              >
                {copied ? '✓ Copied' : '📋 Copy'}
              </button>
              {isAssistant && (
                <button
                  type="button"
                  className={`meta-action-btn ${isSpeaking ? 'active-speaking' : ''}`}
                  onClick={handleSpeak}
                  title={isSpeaking ? 'Stop speaking' : 'Read aloud with synthetic voice'}
                >
                  {isSpeaking ? '⏹ Stop' : '🔊 Audio'}
                </button>
              )}
            </div>
          </div>

          <div className="message-bubble">
            {renderFormattedContent(message.content)}
            {message.isStreaming && <span className="streaming-cursor" />}
          </div>

          {/* Embedded Telemetry Badges */}
          {isAssistant && message.telemetry && message.telemetry.length > 0 && (
            <div className="telemetry-badges-row">
              <div className="telemetry-badges-header">TELEMETRY ATTACHMENT:</div>
              <div className="telemetry-badges-list">
                {message.telemetry.map((t, idx) => (
                  <div key={idx} className={`telemetry-chip chip-${t.status}`}>
                    <span className="chip-subsystem">{t.subsystem || 'SYS'}</span>
                    <span className="chip-label">{t.label}:</span>
                    <span className="chip-value">{t.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Embedded Action Items */}
          {isAssistant && message.actions && message.actions.length > 0 && onExecuteAction && (
            <div className="message-actions-prompts">
              <span className="action-prompts-title">Recommended Operations:</span>
              <div className="action-prompts-list">
                {message.actions.map((act, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className="action-prompt-btn"
                    onClick={() => onExecuteAction(act.label, act.action_type, act.payload)}
                  >
                    ⚡ {act.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Suggested Queries */}
          {isAssistant && message.suggestions && message.suggestions.length > 0 && onSelectSuggestion && (
            <div className="message-suggestions">
              <span className="suggestions-prompt">Suggested follow-ups:</span>
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
