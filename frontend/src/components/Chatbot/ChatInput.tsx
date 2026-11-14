import React, { useState, useEffect, useRef, KeyboardEvent } from 'react';
import { soundManager } from '../../services/soundEffects';

interface ChatInputProps {
  onSendMessage: (msg: string) => void;
  isLoading: boolean;
  suggestions: string[];
  isStreamingMode: boolean;
  setIsStreamingMode: (enabled: boolean) => void;
  isMuted: boolean;
  setIsMuted: (muted: boolean) => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  isLoading,
  suggestions,
  isStreamingMode,
  setIsStreamingMode,
  isMuted,
  setIsMuted,
}) => {
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Initialize Web Speech Recognition if supported
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
          let transcript = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            transcript += event.results[i][0].transcript;
          }
          setInput(transcript);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognition.onerror = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      }
    }
  }, []);

  const handleToggleVoice = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in this browser. Please use Chrome/Edge.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch {
        setIsListening(false);
      }
    }
  };

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    if (!isMuted) {
      soundManager.playSendChirp();
    }
    onSendMessage(input.trim());
    setInput('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleToggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    soundManager.setMuted(nextMuted);
  };

  return (
    <div className="chat-input-wrapper">
      {/* Quick topics bar */}
      {suggestions.length > 0 && (
        <div className="input-suggestions-drawer">
          <span className="drawer-label">Quick topics:</span>
          <div className="drawer-scroll">
              {
                suggestions.slice(0, 4).map((sug, i) => (
                  <button
                    key={i}
                    type="button"
                    className="input-suggestion-pill"
                    onClick={() => {
                      if (!isMuted) soundManager.playSendChirp();
                      onSendMessage(sug);
                    }}
                    disabled={isLoading}
                  >
                    {sug}
                  </button>
                ))
              }
          </div>
        </div>
      )}

      {/* Main input controls */}
      <div className="chat-input-row">
        {/* Voice Input Button */}
        <button
          type="button"
          className={`chat-voice-btn ${isListening ? 'listening' : ''}`}
          onClick={handleToggleVoice}
          title={isListening ? 'Listening... click to stop' : 'Click to speak to ARES'}
          disabled={isLoading}
        >
          {isListening ? '🎙️🔴' : '🎙️'}
        </button>

        <input
          type="text"
          className="chat-text-input"
          placeholder={
            isListening
              ? 'Listening to transmission...'
              : 'Ask ARES about Mars mission telemetry, ECLSS, AutoNav, or weather...'
          }
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
          title="Transmit message"
        >
          {isLoading ? <span className="btn-spinner" /> : <span>Transmit ➔</span>}
        </button>
      </div>

      {/* Input controls & options footer */}
      <div className="chat-input-footer">
        <div className="footer-left-controls">
          <label className="toggle-label" title="Enable real-time token streaming">
            <input
              type="checkbox"
              checked={isStreamingMode}
              onChange={(e) => setIsStreamingMode(e.target.checked)}
            />
            <span>Live Stream (SSE)</span>
          </label>

          <button
            type="button"
            className="sound-toggle-btn"
            onClick={handleToggleMute}
            title={isMuted ? 'Unmute radio sound effects' : 'Mute radio sound effects'}
          >
            {isMuted ? '🔇 Audio Muted' : '🔊 Radio Audio'}
          </button>
        </div>

        <div className="footer-right-hints">
          <span>Press <kbd>Enter</kbd> to transmit</span>
          <span>ARES Core v0.2.0</span>
        </div>
      </div>
    </div>
  );
};
