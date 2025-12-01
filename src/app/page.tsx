'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useGA4Chat } from '@/hooks/useGA4Chat';
import { useAuth } from '@/hooks/useAuth';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import ChatMessage from '@/components/ChatMessage';
import ChatInput from '@/components/ChatInput';
import SavedQuestions from '@/components/SavedQuestions';
import ThemeToggle from '@/components/ThemeToggle';
import Link from 'next/link';
import '@/styles/chat.css';
import '@/styles/theme-toggle.css';

export default function Home() {
  const { messages, isLoading, sendToGA4, messagesEndRef } = useGA4Chat();
  const { isAuthenticated, isLoading: authLoading, logout } = useAuth();
  const { isAdmin } = useCurrentUser();
  const router = useRouter();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  // Handle saved question click
  const handleSavedQuestionClick = (question: string) => {
    sendToGA4(question);
  };

  // Show loading state while checking auth
  if (authLoading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner-large"></div>
        <div className="loading-text">Loading...</div>
      </div>
    );
  }

  // Don't render if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="app-layout">
      <SavedQuestions onQuestionClick={handleSavedQuestionClick} />
      
      <div className="chat-container">
        <div className="chat-header">
          <div className="header-content">
            <div className="header-title-section">
              <div className="header-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M3 3v18h18M7 16l4-4 4 4 6-6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <div>
                <h1>GA4 Analytics Chat</h1>
                <p className="header-subtitle">Ask questions about your data</p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {isAdmin && (
                <Link href="/settings" style={{ textDecoration: 'none' }}>
                  <button className="logout-btn" style={{ background: 'transparent', border: '1px solid currentColor' }}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ marginRight: '6px' }}>
                      <path
                        d="M8 1v6M8 9v6M1 8h6M9 8h6"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                    </svg>
                    <span>Settings</span>
                  </button>
                </Link>
              )}
              <ThemeToggle />
              <button className="logout-btn" onClick={logout}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M6 14H3a1 1 0 01-1-1V3a1 1 0 011-1h3M10 11l3-3-3-3M13 8H6"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
        
        <div className="chat-messages">
          {messages.length === 0 && (
            <div className="empty-chat-state">
              <div className="empty-chat-icon">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                </svg>
              </div>
              <h2>Welcome to GA4 Analytics Chat</h2>
              <p>Ask questions about your Google Analytics data to get started.</p>
              <div className="example-questions">
                <p className="example-label">Try asking:</p>
                <div className="example-chips">
                  <button
                    className="example-chip"
                    onClick={() => handleSavedQuestionClick('Show me pageviews for the last 7 days')}
                  >
                    Show me pageviews for the last 7 days
                  </button>
                  <button
                    className="example-chip"
                    onClick={() => handleSavedQuestionClick('What are my top traffic sources?')}
                  >
                    What are my top traffic sources?
                  </button>
                  <button
                    className="example-chip"
                    onClick={() => handleSavedQuestionClick('Show active users by country')}
                  >
                    Show active users by country
                  </button>
                </div>
              </div>
            </div>
          )}
          {messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))}
          <div ref={messagesEndRef} />
        </div>
        
        <ChatInput onSend={sendToGA4} isLoading={isLoading} />
      </div>
    </div>
  );
}

