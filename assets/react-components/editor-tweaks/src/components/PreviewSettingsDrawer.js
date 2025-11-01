import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import RemixIcon from './RemixIcon';

const { __ } = wp.i18n;
const { apiFetch } = wp;

/**
 * Preview Settings Drawer
 * Clean, minimal interface for configuring preview context
 */
export default function PreviewSettingsDrawer({ isOpen, onClose }) {
  const [settings, setSettings] = useState({
    enabled: false,
    auto_detect: true,
    source_type: 'post_type', // 'post_type' or 'taxonomy'
    context_type: 'singular',
    post_type: 'page',
    post_id: 0,
    taxonomy: '',
    term_id: 0,
    woo_page: '' // WooCommerce specific pages
  });
  const [detectedContext, setDetectedContext] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Load preview context from window.universal.preview
  useEffect(() => {
    if (window.universal && window.universal.preview) {
      setDetectedContext(window.universal.preview);

      // Sync settings from context
      if (window.universal.preview.settings) {
        setSettings(prevSettings => ({
          ...prevSettings,
          ...window.universal.preview.settings,
          // Use detected values if auto-detect is on
          context_type: window.universal.preview.settings.auto_detect && window.universal.preview.type !== 'unknown'
            ? window.universal.preview.type
            : prevSettings.context_type,
          post_type: window.universal.preview.settings.auto_detect && window.universal.preview.post_type
            ? window.universal.preview.post_type
            : prevSettings.post_type,
          post_id: window.universal.preview.settings.auto_detect && window.universal.preview.post_id
            ? window.universal.preview.post_id
            : prevSettings.post_id
        }));
      }
    }
  }, [isOpen]);

  const updateSetting = async (key, value) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    await saveSettings(newSettings);
  };

  const saveSettings = async (newSettings) => {
    setIsSaving(true);

    try {
      const response = await apiFetch({
        path: '/universal-block/v1/preview-settings',
        method: 'POST',
        data: newSettings
      });

      if (response.success) {
        if (window.universal && window.universal.preview) {
          window.universal.preview.settings = newSettings;
        }
      }
    } catch (error) {
      console.error('Error saving preview settings:', error);
    } finally {
      setIsSaving(false);
    }
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
              borderBottom: '1px solid #e5e7eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <h2 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#111827' }}>
                Preview Settings
              </h2>
              <button
                onClick={onClose}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '6px',
                  color: '#6b7280'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#f3f4f6'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <RemixIcon name="close-line" size={18} />
              </button>
            </div>

            {/* Content */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {/* Enable Preview Section */}
              <div style={{
                padding: '20px',
                borderBottom: '1px solid #e5e7eb',
                background: settings.enabled ? '#f0f9ff' : '#fff'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '14px', fontWeight: '500', color: '#111827', marginBottom: '2px' }}>
                      Enable Preview
                    </div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>
                      Show live Timber/Twig data in editor
                    </div>
                  </div>
                  <label style={{ position: 'relative', display: 'inline-block', width: '44px', height: '24px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={settings.enabled}
                      onChange={(e) => updateSetting('enabled', e.target.checked)}
                      style={{ opacity: 0, width: 0, height: 0 }}
                    />
                    <span style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: settings.enabled ? '#3b82f6' : '#d1d5db',
                      borderRadius: '12px',
                      transition: '0.2s'
                    }}>
                      <span style={{
                        position: 'absolute',
                        height: '18px',
                        width: '18px',
                        left: settings.enabled ? '23px' : '3px',
                        bottom: '3px',
                        background: 'white',
                        borderRadius: '50%',
                        transition: '0.2s',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                      }} />
                    </span>
                  </label>
                </div>
              </div>

              {/* Context Configuration */}
              <div style={{ padding: '20px' }}>
                {/* Auto-Detect Toggle */}
                <div style={{ marginBottom: '24px' }}>
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    padding: '12px',
                    background: '#f9fafb',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb'
                  }}>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: '500', color: '#111827', marginBottom: '2px' }}>
                        Auto-Detect Context
                      </div>
                      <div style={{ fontSize: '11px', color: '#6b7280' }}>
                        Use current page being edited
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.auto_detect}
                      onChange={(e) => updateSetting('auto_detect', e.target.checked)}
                      style={{
                        width: '18px',
                        height: '18px',
                        cursor: 'pointer',
                        accentColor: '#3b82f6'
                      }}
                    />
                  </label>
                </div>

                {/* Manual Configuration */}
                {!settings.auto_detect && (
                  <div style={{
                    padding: '16px',
                    background: '#fefce8',
                    border: '1px solid #fde047',
                    borderRadius: '8px',
                    marginBottom: '24px'
                  }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                      <RemixIcon name="information-line" size={16} style={{ color: '#ca8a04', marginTop: '2px' }} />
                      <div style={{ fontSize: '12px', color: '#854d0e', lineHeight: '1.5' }}>
                        Auto-detect is off. Manually configure preview context below.
                      </div>
                    </div>
                  </div>
                )}

                {/* Source Type Selection */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                    Source Type
                  </label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => updateSetting('source_type', 'post_type')}
                      disabled={settings.auto_detect}
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        fontSize: '13px',
                        fontWeight: '500',
                        border: settings.source_type === 'post_type' ? '2px solid #3b82f6' : '1px solid #d1d5db',
                        borderRadius: '6px',
                        background: settings.auto_detect ? '#f9fafb' : (settings.source_type === 'post_type' ? '#eff6ff' : '#fff'),
                        color: settings.auto_detect ? '#9ca3af' : (settings.source_type === 'post_type' ? '#1e40af' : '#111827'),
                        cursor: settings.auto_detect ? 'not-allowed' : 'pointer'
                      }}
                    >
                      Post Type
                    </button>
                    <button
                      onClick={() => updateSetting('source_type', 'taxonomy')}
                      disabled={settings.auto_detect}
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        fontSize: '13px',
                        fontWeight: '500',
                        border: settings.source_type === 'taxonomy' ? '2px solid #3b82f6' : '1px solid #d1d5db',
                        borderRadius: '6px',
                        background: settings.auto_detect ? '#f9fafb' : (settings.source_type === 'taxonomy' ? '#eff6ff' : '#fff'),
                        color: settings.auto_detect ? '#9ca3af' : (settings.source_type === 'taxonomy' ? '#1e40af' : '#111827'),
                        cursor: settings.auto_detect ? 'not-allowed' : 'pointer'
                      }}
                    >
                      Taxonomy
                    </button>
                  </div>
                </div>

                {/* Post Type Configuration */}
                {settings.source_type === 'post_type' && (
                  <>
                    {/* Context Type */}
                    <div style={{ marginBottom: '16px' }}>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                        Context Type
                      </label>
                      <select
                        value={settings.context_type}
                        onChange={(e) => updateSetting('context_type', e.target.value)}
                        disabled={settings.auto_detect}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          fontSize: '13px',
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                          background: settings.auto_detect ? '#f9fafb' : '#fff',
                          color: settings.auto_detect ? '#9ca3af' : '#111827',
                          cursor: settings.auto_detect ? 'not-allowed' : 'pointer'
                        }}
                      >
                        <option value="singular">Singular (Single Post/Page)</option>
                        <option value="archive">Archive</option>
                        <option value="front_page">Front Page</option>
                        <option value="posts_page">Posts Page</option>
                        <option value="search">Search</option>
                        <option value="404">404</option>
                      </select>
                    </div>

                    {/* Post Type */}
                    {(settings.context_type === 'singular' || settings.context_type === 'archive') && (
                      <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                          Post Type
                        </label>
                        <select
                          value={settings.post_type}
                          onChange={(e) => updateSetting('post_type', e.target.value)}
                          disabled={settings.auto_detect}
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            fontSize: '13px',
                            border: '1px solid #d1d5db',
                            borderRadius: '6px',
                            background: settings.auto_detect ? '#f9fafb' : '#fff',
                            color: settings.auto_detect ? '#9ca3af' : '#111827',
                            cursor: settings.auto_detect ? 'not-allowed' : 'pointer'
                          }}
                        >
                          <optgroup label="WordPress">
                            <option value="page">Page</option>
                            <option value="post">Post</option>
                          </optgroup>
                          <optgroup label="WooCommerce">
                            <option value="product">Product</option>
                          </optgroup>
                        </select>
                      </div>
                    )}

                    {/* Post ID (for singular) */}
                    {settings.context_type === 'singular' && (
                      <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                          Post ID
                        </label>
                        <input
                          type="number"
                          value={settings.post_id}
                          onChange={(e) => updateSetting('post_id', parseInt(e.target.value) || 0)}
                          disabled={settings.auto_detect}
                          placeholder="Enter post ID..."
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            fontSize: '13px',
                            border: '1px solid #d1d5db',
                            borderRadius: '6px',
                            background: settings.auto_detect ? '#f9fafb' : '#fff',
                            color: settings.auto_detect ? '#9ca3af' : '#111827',
                            fontFamily: 'ui-monospace, monospace'
                          }}
                        />
                      </div>
                    )}

                    {/* WooCommerce Special Pages */}
                    <div style={{ marginBottom: '16px' }}>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                        WooCommerce Pages
                      </label>
                      <select
                        value={settings.woo_page}
                        onChange={(e) => updateSetting('woo_page', e.target.value)}
                        disabled={settings.auto_detect}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          fontSize: '13px',
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                          background: settings.auto_detect ? '#f9fafb' : '#fff',
                          color: settings.auto_detect ? '#9ca3af' : '#111827',
                          cursor: settings.auto_detect ? 'not-allowed' : 'pointer'
                        }}
                      >
                        <option value="">None</option>
                        <option value="shop">Shop (Main Store)</option>
                        <option value="cart">Cart</option>
                        <option value="checkout">Checkout</option>
                        <option value="my_account">My Account</option>
                        <option value="thank_you">Thank You (Order Received)</option>
                      </select>
                    </div>
                  </>
                )}

                {/* Taxonomy Configuration */}
                {settings.source_type === 'taxonomy' && (
                  <>
                    {/* Taxonomy */}
                    <div style={{ marginBottom: '16px' }}>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                        Taxonomy
                      </label>
                      <select
                        value={settings.taxonomy}
                        onChange={(e) => updateSetting('taxonomy', e.target.value)}
                        disabled={settings.auto_detect}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          fontSize: '13px',
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                          background: settings.auto_detect ? '#f9fafb' : '#fff',
                          color: settings.auto_detect ? '#9ca3af' : '#111827',
                          cursor: settings.auto_detect ? 'not-allowed' : 'pointer'
                        }}
                      >
                        <option value="">Select taxonomy...</option>
                        <optgroup label="WordPress">
                          <option value="category">Category</option>
                          <option value="post_tag">Tag</option>
                        </optgroup>
                        <optgroup label="WooCommerce">
                          <option value="product_cat">Product Category</option>
                          <option value="product_tag">Product Tag</option>
                        </optgroup>
                      </select>
                    </div>

                    {/* Term ID */}
                    {settings.taxonomy && (
                      <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                          Term ID
                        </label>
                        <input
                          type="number"
                          value={settings.term_id}
                          onChange={(e) => updateSetting('term_id', parseInt(e.target.value) || 0)}
                          disabled={settings.auto_detect}
                          placeholder="Enter term ID..."
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            fontSize: '13px',
                            border: '1px solid #d1d5db',
                            borderRadius: '6px',
                            background: settings.auto_detect ? '#f9fafb' : '#fff',
                            color: settings.auto_detect ? '#9ca3af' : '#111827',
                            fontFamily: 'ui-monospace, monospace'
                          }}
                        />
                      </div>
                    )}
                  </>
                )}

                {/* Detected Info */}
                {settings.auto_detect && detectedContext && detectedContext.post_id > 0 && (
                  <div style={{
                    marginTop: '24px',
                    padding: '12px',
                    background: '#f0fdf4',
                    border: '1px solid #86efac',
                    borderRadius: '8px'
                  }}>
                    <div style={{ fontSize: '12px', fontWeight: '500', color: '#166534', marginBottom: '8px' }}>
                      Currently Detected:
                    </div>
                    <div style={{ fontSize: '11px', color: '#15803d', fontFamily: 'ui-monospace, monospace', lineHeight: '1.6' }}>
                      Type: {detectedContext.type}<br/>
                      Post Type: {detectedContext.post_type}<br/>
                      Post ID: {detectedContext.post_id}
                      {detectedContext.meta && detectedContext.meta.title && (
                        <>
                          <br/>Title: {detectedContext.meta.title}
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div style={{
              padding: '16px 20px',
              borderTop: '1px solid #e5e7eb',
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end',
              alignItems: 'center',
              background: '#f9fafb'
            }}>
              {isSaving && (
                <span style={{ fontSize: '12px', color: '#6b7280' }}>
                  Saving...
                </span>
              )}
              <button
                onClick={onClose}
                style={{
                  padding: '8px 16px',
                  background: '#111827',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '500'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#1f2937'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#111827'}
              >
                Done
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
