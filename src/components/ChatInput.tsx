import React, { useState, KeyboardEvent, useRef, useEffect } from 'react';

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading: boolean;
}

export default function ChatInput({ onSend, isLoading }: ChatInputProps) {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  }, [input]);

  const handleSend = () => {
    if (input.trim() && !isLoading) {
      const question = input.trim();
      onSend(question);
      
      // Dispatch event to save question
      window.dispatchEvent(new CustomEvent('questionSent', { detail: question }));
      
      setInput('');
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="chat-input-container">
      <div className="chat-input-wrapper">
        <textarea
          ref={textareaRef}
          className="chat-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="Ask about your Google Analytics data..."
          disabled={isLoading}
          rows={1}
        />
        <button
          className="send-button"
          onClick={handleSend}
          disabled={isLoading || !input.trim()}
        >
          {isLoading ? (
            <span className="loading-spinner">⏳</span>
          ) : (
            <span>Send</span>
          )}
        </button>
      </div>
      {isLoading && (
        <div className="typing-indicator">
          Analyzing GA4 data...
        </div>
      )}
    </div>
  );
}

