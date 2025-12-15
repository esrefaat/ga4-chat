'use client';

import React, { useState, useEffect, useCallback } from 'react';

interface SavedQuestion {
  id: number;
  question: string;
  usage_count?: number;
  created_at: string;
}

interface SavedQuestionsProps {
  onQuestionClick: (question: string) => void;
  onQuestionSent?: (question: string) => void;
}

export default function SavedQuestions({ onQuestionClick, onQuestionSent }: SavedQuestionsProps) {
  const [savedQuestions, setSavedQuestions] = useState<SavedQuestion[]>([]);
  const [isOpen, setIsOpen] = useState(true);
  const [loading, setLoading] = useState(true);

  // Load saved questions from API
  const loadSavedQuestions = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/saved-searches?limit=20');
      if (response.ok) {
        const data = await response.json();
        setSavedQuestions(data.searches || []);
      } else {
        console.error('Failed to load saved questions');
      }
    } catch (error) {
      console.error('Error loading saved questions:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSavedQuestions();
  }, [loadSavedQuestions]);

  // Add a new saved question
  const addQuestion = useCallback(async (question: string) => {
    if (!question.trim()) return;
    
    try {
      const response = await fetch('/api/saved-searches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: question.trim() }),
      });

      if (response.ok) {
        // Reload questions to get the latest list
        await loadSavedQuestions();
      } else {
        const data = await response.json();
        // Don't show error if it's just a duplicate
        if (data.error && !data.error.includes('already saved')) {
          console.error('Failed to save question:', data.error);
        }
      }
    } catch (error) {
      console.error('Error saving question:', error);
    }
  }, [loadSavedQuestions]);

  // Delete a saved question
  const deleteQuestion = useCallback(async (id: number) => {
    try {
      const response = await fetch(`/api/saved-searches?id=${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Remove from local state immediately for better UX
        setSavedQuestions((prev) => prev.filter((q) => q.id !== id));
      } else {
        const data = await response.json();
        console.error('Failed to delete question:', data.error);
        // Reload on error to sync with server
        await loadSavedQuestions();
      }
    } catch (error) {
      console.error('Error deleting question:', error);
      await loadSavedQuestions();
    }
  }, [loadSavedQuestions]);

  // Delete all saved questions
  const deleteAllQuestions = useCallback(async () => {
    if (!confirm('Clear all saved questions?')) return;

    try {
      const response = await fetch('/api/saved-searches?all=true', {
        method: 'DELETE',
      });

      if (response.ok) {
        setSavedQuestions([]);
      } else {
        const data = await response.json();
        console.error('Failed to delete all questions:', data.error);
        await loadSavedQuestions();
      }
    } catch (error) {
      console.error('Error deleting all questions:', error);
      await loadSavedQuestions();
    }
  }, [loadSavedQuestions]);

  // Increment usage count when a question is clicked
  const handleQuestionClick = useCallback(async (question: SavedQuestion) => {
    // Call the increment endpoint
    try {
      const response = await fetch('/api/saved-searches', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: question.id }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Failed to increment usage count:', errorData.error || 'Unknown error');
      } else {
        // Reload to update the order after successful increment
        await loadSavedQuestions();
      }
    } catch (error) {
      console.error('Error incrementing usage count:', error);
    }
    
    // Call the original onClick handler
    onQuestionClick(question.question);
  }, [onQuestionClick, loadSavedQuestions]);

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
                onClick={deleteAllQuestions}
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
          {loading ? (
            <div className="empty-state">
              <div className="loading-spinner-small"></div>
              <p>Loading saved questions...</p>
            </div>
          ) : savedQuestions.length === 0 ? (
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
                    onClick={() => handleQuestionClick(question)}
                    title="Click to use this question"
                  >
                    <span className="question-text">{question.question}</span>
                    <div className="question-meta">
                      {question.usage_count && question.usage_count > 0 && (
                        <span className="question-usage" title="Times used">
                          {question.usage_count}x
                        </span>
                      )}
                      <span className="question-time">
                        {new Date(question.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
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

