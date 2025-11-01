import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AceEditor from './AceEditor';
import RemixIcon from './RemixIcon';

const { __ } = wp.i18n;
const { select, dispatch } = wp.data;

/**
 * HTML Editor Popup
 *
 * Full-screen popup editor for editing HTML content of selected block
 */
export default function HtmlEditorPopup({ isOpen, onClose }) {
  const [htmlContent, setHtmlContent] = useState('');
  const [selectedBlockId, setSelectedBlockId] = useState(null);
  const [editorRef, setEditorRef] = useState(null);

  // Get selected block and its content when popup opens
  useEffect(() => {
    if (!isOpen) return;

    const blockId = select('core/block-editor').getSelectedBlockClientId();
    if (!blockId) {
      console.warn('No block selected');
      onClose();
      return;
    }

    const block = select('core/block-editor').getBlock(blockId);
    if (!block || block.name !== 'universal/element') {
      console.warn('Selected block is not a universal/element block');
      onClose();
      return;
    }

    const { attributes } = block;

    // Check if block has HTML content type
    if (attributes?.uiState?.selectedContentType !== 'html' && attributes?.contentType !== 'html') {
      console.warn('Selected block does not have HTML content type');
      onClose();
      return;
    }

    setSelectedBlockId(blockId);
    setHtmlContent(attributes?.content || '');
  }, [isOpen, onClose]);

  // Save content back to block
  const handleSave = () => {
    if (!selectedBlockId) return;

    dispatch('core/block-editor').updateBlockAttributes(selectedBlockId, {
      content: htmlContent
    });

    onClose();
  };

  // Beautify HTML
  const handleBeautify = () => {
    if (!window.html_beautify) {
      console.error('html_beautify not available');
      return;
    }

    try {
      const beautified = window.html_beautify(htmlContent, {
        indent_size: 2,
        indent_char: ' ',
        max_preserve_newlines: 2,
        preserve_newlines: true,
        indent_inner_html: true,
        wrap_line_length: 0
      });
      setHtmlContent(beautified);
    } catch (e) {
      console.error('Beautification failed:', e);
    }
  };

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          zIndex: 999999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => e.stopPropagation()}
          style={{
            width: '100%',
            maxWidth: '1400px',
            height: '90vh',
            backgroundColor: '#1e1e1e',
            borderRadius: '8px',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)'
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px 20px',
              borderBottom: '1px solid #333',
              backgroundColor: '#252525'
            }}
          >
            <h2 style={{
              margin: 0,
              fontSize: '18px',
              fontWeight: '600',
              color: '#fff'
            }}>
              {__('HTML Editor', 'universal-block')}
            </h2>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={handleBeautify}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#333',
                  color: '#fff',
                  border: '1px solid #555',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
                title={__('Beautify HTML (Ctrl+Alt+F)', 'universal-block')}
              >
                <RemixIcon name="ri-magic-line" size={16} color="#fff" />
                {__('Beautify', 'universal-block')}
              </button>

              <button
                onClick={handleSave}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#0073aa',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <RemixIcon name="ri-save-line" size={16} color="#fff" />
                {__('Save', 'universal-block')}
              </button>

              <button
                onClick={onClose}
                style={{
                  padding: '8px',
                  backgroundColor: '#333',
                  color: '#fff',
                  border: '1px solid #555',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title={__('Close (Esc)', 'universal-block')}
              >
                <RemixIcon name="ri-close-line" size={20} color="#fff" />
              </button>
            </div>
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

          {/* Footer with keyboard shortcuts */}
          <div
            style={{
              padding: '12px 20px',
              borderTop: '1px solid #333',
              backgroundColor: '#252525',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <div style={{
              fontSize: '12px',
              color: '#999'
            }}>
              {__('Keyboard shortcuts: Tab = Emmet expansion, Ctrl+Alt+F (Cmd+Alt+F) = Beautify', 'universal-block')}
            </div>
            <div style={{
              fontSize: '12px',
              color: '#666'
            }}>
              {__('Press Esc to close', 'universal-block')}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
