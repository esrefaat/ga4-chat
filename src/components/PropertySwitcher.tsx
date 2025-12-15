'use client';

import React, { useState, useEffect } from 'react';
import { GA4_PROPERTIES, GA4Property } from '@/lib/ga4-properties';
import { useCurrentUser } from '@/hooks/useCurrentUser';

interface PropertySwitcherProps {
  onPropertyChange?: (propertyId: string) => void;
}

export default function PropertySwitcher({ onPropertyChange }: PropertySwitcherProps) {
  const { user, isLoading: userLoading } = useCurrentUser();
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
  const [isOpen, setIsOpen] = useState(false);

  // Load selected property from user default or localStorage on mount
  useEffect(() => {
    if (userLoading || !user?.username) return;

    const storageKey = `ga4_selected_property_id_${user.username}`;

    // First, try user's default property
    if (user?.default_property_id && GA4_PROPERTIES.some(p => p.id === user.default_property_id)) {
      setSelectedPropertyId(user.default_property_id);
      localStorage.setItem(storageKey, user.default_property_id);
      return;
    }

    // Then try localStorage (user-specific)
    const saved = localStorage.getItem(storageKey);
    if (saved && GA4_PROPERTIES.some(p => p.id === saved)) {
      setSelectedPropertyId(saved);
      return;
    }

    // Finally, default to first property
    if (GA4_PROPERTIES.length > 0) {
      const firstPropertyId = GA4_PROPERTIES[0].id;
      setSelectedPropertyId(firstPropertyId);
      localStorage.setItem(storageKey, firstPropertyId);
    }
  }, [user, userLoading]);

  // Notify parent when property changes
  useEffect(() => {
    if (selectedPropertyId && onPropertyChange) {
      onPropertyChange(selectedPropertyId);
    }
  }, [selectedPropertyId, onPropertyChange]);

  const handlePropertySelect = (propertyId: string) => {
    if (!user?.username) return;
    
    setSelectedPropertyId(propertyId);
    const storageKey = `ga4_selected_property_id_${user.username}`;
    localStorage.setItem(storageKey, propertyId);
    setIsOpen(false);
    if (onPropertyChange) {
      onPropertyChange(propertyId);
    }
  };

  const selectedProperty = GA4_PROPERTIES.find(p => p.id === selectedPropertyId);

  if (GA4_PROPERTIES.length === 0) {
    return null;
  }

  return (
    <div style={{ position: 'relative' }}>
      <button
        className="property-switcher-btn"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          padding: '6px 12px',
          background: 'transparent',
          border: '1px solid currentColor',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '14px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          whiteSpace: 'nowrap',
          maxWidth: '200px',
          color: 'inherit',
        }}
        title={selectedProperty ? `${selectedProperty.name} (${selectedProperty.id})` : 'Select property'}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
          <path
            d="M3.5 5.25L7 8.75L10.5 5.25"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {selectedProperty ? selectedProperty.name : 'Select Property'}
        </span>
      </button>

      {isOpen && (
        <>
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 999,
            }}
            onClick={() => setIsOpen(false)}
          />
          <div
            style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              marginTop: '8px',
              background: 'var(--chat-bg, #ffffff)',
              border: '1px solid currentColor',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              zIndex: 1000,
              minWidth: '300px',
              maxWidth: '400px',
              maxHeight: '400px',
              overflowY: 'auto',
            }}
          >
              <div style={{ padding: '8px' }}>
              <div style={{ padding: '8px 12px', fontSize: '12px', fontWeight: '600', color: 'currentColor', opacity: 0.7, textTransform: 'uppercase' }}>
                Select Property
              </div>
              {GA4_PROPERTIES.map((property) => (
                <button
                  key={property.id}
                  onClick={() => handlePropertySelect(property.id)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    textAlign: 'left',
                    background: selectedPropertyId === property.id ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    color: 'currentColor',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                  }}
                  onMouseEnter={(e) => {
                    if (selectedPropertyId !== property.id) {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedPropertyId !== property.id) {
                      e.currentTarget.style.background = 'transparent';
                    }
                  }}
                >
                  <div style={{ fontWeight: selectedPropertyId === property.id ? '600' : '500' }}>
                    {property.name}
                  </div>
                  <div style={{ fontSize: '12px', opacity: 0.7 }}>
                    {property.id} • {property.accountName}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

