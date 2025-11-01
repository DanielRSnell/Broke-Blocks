/**
 * Universal Editor Tweaks - Entry Point
 * Initializes the web component system
 */

import UniversalEditorTweaks from './UniversalEditorTweaks.js';

/**
 * Initialize the Universal Editor Tweaks
 */
function initUniversalEditorTweaks() {
  // Check if we're in the Gutenberg editor
  if (typeof wp === 'undefined' || !wp.data || !wp.data.select('core/editor')) {
    // Not in editor context, try again later
    setTimeout(initUniversalEditorTweaks, 100);
    return;
  }

  // Check if already initialized
  if (document.querySelector('universal-editor-tweaks')) {
    return;
  }

  // Create and append the main component
  const editorTweaks = document.createElement('universal-editor-tweaks');
  document.body.appendChild(editorTweaks);

  // Global access for debugging/external control
  window.universalEditorTweaks = editorTweaks;

  console.log('Universal Editor Tweaks initialized');
}

/**
 * Cleanup function for removing the component
 */
function cleanupUniversalEditorTweaks() {
  const existing = document.querySelector('universal-editor-tweaks');
  if (existing) {
    existing.remove();
  }

  delete window.universalEditorTweaks;
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initUniversalEditorTweaks);
} else {
  initUniversalEditorTweaks();
}

// Also try to initialize when wp is available
if (typeof wp !== 'undefined' && wp.domReady) {
  wp.domReady(initUniversalEditorTweaks);
}

// Export for manual control
export { initUniversalEditorTweaks, cleanupUniversalEditorTweaks, UniversalEditorTweaks };