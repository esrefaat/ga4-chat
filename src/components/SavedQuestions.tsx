'use client';

import React, { useState, useEffect } from 'react';

interface SavedQuestion {
  id: string;
  question: string;
  timestamp: Date;
}

interface SavedQuestionsProps {
  onQuestionClick: (question: string) => void;
  onQuestionSent?: (question: string) => void;
}

export default function SavedQuestions({ onQuestionClick, onQuestionSent }: SavedQuestionsProps) {
  const [savedQuestions, setSavedQuestions] = useState<SavedQuestion[]>([]);
  const [isOpen, setIsOpen] = useState(true);

  // Load saved questions from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('ga4_saved_questions');
    if (saved) {
      try {
        const parsed = JSON.parse(saved).map((q: any) => ({
          ...q,
          timestamp: new Date(q.timestamp),
        }));
        setSavedQuestions(parsed);
      } catch (e) {
        console.error('Error loading saved questions:', e);
      }
    }
  }, []);

  // Save questions to localStorage
  const saveQuestions = (questions: SavedQuestion[]) => {
    localStorage.setItem('ga4_saved_questions', JSON.stringify(questions));
    setSavedQuestions(questions);
  };

  // Add a new saved question
  const addQuestion = React.useCallback((question: string) => {
    if (!question.trim()) return;
    
    setSavedQuestions((prev) => {
      // Check if question already exists
      const exists = prev.some(
        (q) => q.question.toLowerCase() === question.trim().toLowerCase()
      );

      if (!exists) {
        const newQuestion: SavedQuestion = {
          id: Date.now().toString(),
          question: question.trim(),
          timestamp: new Date(),
        };
        const updated = [newQuestion, ...prev].slice(0, 20); // Keep max 20
        localStorage.setItem('ga4_saved_questions', JSON.stringify(updated));
        return updated;
      }
      return prev;
    });
  }, []);

  // Delete a saved question
  const deleteQuestion = (id: string) => {
    const updated = savedQuestions.filter((q) => q.id !== id);
    saveQuestions(updated);
  };

  // Listen for question sent events
  useEffect(() => {
    const handleQuestionSent = (event: CustomEvent<string>) => {
      addQuestion(event.detail);
    };
    
    window.addEventListener('questionSent' as any, handleQuestionSent as EventListener);
    return () => {
      window.removeEventListener('questionSent' as any, handleQuestionSent as EventListener);
    };
  }, [addQuestion]);

  return (
    <div
      className={`saved-questions-sidebar ${
        isOpen ? 'open' : 'closed'
      }`}
    >
      <div className="saved-questions-header">
        <button
          className="toggle-sidebar-btn"
          onClick={() => setIsOpen(!isOpen)}
          aria-label={isOpen ? 'Close sidebar' : 'Open sidebar'}
        >
          {isOpen ? (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path
                d="M12.5 15L7.5 10L12.5 5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path
                d="M7.5 15L12.5 10L7.5 5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </button>
        {isOpen && (
          <>
            <h2>Saved Questions</h2>
            {savedQuestions.length > 0 && (
              <button
                className="clear-all-btn"
                onClick={() => {
                  if (confirm('Clear all saved questions?')) {
                    saveQuestions([]);
                  }
                }}
                title="Clear all"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M4 4L12 12M12 4L4 12"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            )}
          </>
        )}
      </div>

      {isOpen && (
        <div className="saved-questions-content">
          {savedQuestions.length === 0 ? (
            <div className="empty-state">
              <svg
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="empty-icon"
              >
                <path
                  d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M17 21v-8H7v8M7 3v5h5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <p>No saved questions yet</p>
              <p className="empty-hint">
                Questions you ask will be saved here for quick access
              </p>
            </div>
          ) : (
            <div className="questions-list">
              {savedQuestions.map((question) => (
                <div key={question.id} className="saved-question-item">
                  <button
                    className="question-text-btn"
                    onClick={() => onQuestionClick(question.question)}
                    title="Click to use this question"
                  >
                    <span className="question-text">{question.question}</span>
                    <span className="question-time">
                      {question.timestamp.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </button>
                  <button
                    className="delete-question-btn"
                    onClick={() => deleteQuestion(question.id)}
                    title="Delete question"
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path
                        d="M3.5 3.5L10.5 10.5M10.5 3.5L3.5 10.5"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

