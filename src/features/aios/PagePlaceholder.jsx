import React from 'react';

/**
 * Stream 2 placeholder — renders the page chrome so the Layout's sidebar /
 * header / brand tokens are visible end-to-end. Stream 3 swaps each
 * AiosX.jsx body to the real content.
 */
export default function PagePlaceholder({ title, description }) {
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="mb-6">
        <h1 className="text-[24px] sm:text-[28px] font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
          {title}
        </h1>
        {description && (
          <p className="text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>
            {description}
          </p>
        )}
      </div>
      <div className="card p-6 sm:p-8">
        <div className="empty-state">
          <p className="empty-state-text">Placeholder shell</p>
          <p className="empty-state-hint">
            Stream 2 (chassis) shipped. Live content arrives in Stream 3.
          </p>
        </div>
      </div>
    </div>
  );
}
