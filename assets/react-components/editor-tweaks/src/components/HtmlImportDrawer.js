import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AceEditor from './AceEditor';
import RemixIcon from './RemixIcon';

const { __ } = wp.i18n;

/**
 * HTML Import Drawer
 * Allows users to paste HTML and convert it to blocks
 */
export default function HtmlImportDrawer({ isOpen, onClose }) {
  const [htmlContent, setHtmlContent] = useState('');
  const [error, setError] = useState('');

  const handleInsert = () => {
    if (!htmlContent.trim()) {
      setError('Please enter some HTML content');
      return;
    }

    try {
      // Check if parser is available
      if (typeof window.universal === 'undefined' || typeof window.universal.html2blocks !== 'function') {
        setError('HTML parser not available. Please refresh the page.');
        return;
      }

      // Parse HTML to blocks
      const blocks = window.universal.html2blocks(htmlContent);

      if (!blocks || blocks.length === 0) {
        setError('Could not parse HTML. Please check your HTML syntax.');
        return;
      }

      // Insert blocks into editor
      window.universal.insertBlocks(blocks);

      // Close drawer and reset
      setHtmlContent('');
      setError('');
      onClose();
    } catch (err) {
      console.error('Error inserting blocks:', err);
      setError('Error inserting blocks: ' + err.message);
    }
  };

  const handleClear = () => {
    setHtmlContent('');
    setError('');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.5)',
              zIndex: 99999
            }}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            style={{
              position: 'fixed',
              top: 0,
              right: 0,
              width: '600px',
              maxWidth: '100%',
              height: '100vh',
              background: '#fff',
              zIndex: 100000,
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '-2px 0 8px rgba(0,0,0,0.1)'
            }}
          >
            {/* Header */}
            <div style={{
              padding: '20px',
              borderBottom: '1px solid #e0e0e0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>
                Import HTML as Blocks
              </h2>
              <button
                onClick={onClose}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '4px'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#f0f0f0'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <RemixIcon name="close-line" size={20} />
              </button>
            </div>

            {/* Content */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              {/* Description */}
              <div style={{ padding: '20px', borderBottom: '1px solid #e0e0e0' }}>
                <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>
                  Paste your HTML below and it will be converted to Universal Element blocks.
                </p>
              </div>

              {/* Editor */}
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <AceEditor
                  value={htmlContent}
                  onChange={setHtmlContent}
                  mode="html"
                  theme="monokai"
                  height="100%"
                />
              </div>

              {/* Error Message */}
              {error && (
                <div style={{
                  padding: '12px 20px',
                  background: '#fee',
                  borderTop: '1px solid #fcc',
                  color: '#c00',
                  fontSize: '14px'
                }}>
                  {error}
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{
              padding: '20px',
              borderTop: '1px solid #e0e0e0',
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={handleClear}
                style={{
                  padding: '8px 16px',
                  background: '#fff',
                  color: '#1e1e1e',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#f5f5f5'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#fff'}
              >
                Clear
              </button>
              <button
                onClick={handleInsert}
                style={{
                  padding: '8px 16px',
                  background: '#2271b1',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#135e96'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#2271b1'}
              >
                Insert Blocks
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
