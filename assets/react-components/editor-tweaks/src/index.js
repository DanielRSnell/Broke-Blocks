import React from 'react';
import UniversalEditorTweaks from './components/UniversalEditorTweaks';
import './styles/main.css';

const { createElement: el } = wp.element;

let reactContainer = null;
let isInitialized = false;

// Initialize the React app
function initializeReactApp() {
  if (isInitialized) {
    console.log('🔄 Universal Editor Tweaks: Already initialized');
    return;
  }

  // Clean up any existing web components
  const existingComponents = document.querySelectorAll('universal-editor-tweaks');
  existingComponents.forEach(component => component.remove());

  // Create container for React app
  reactContainer = document.createElement('div');
  reactContainer.id = 'universal-editor-tweaks-react';
  reactContainer.style.cssText = `
    position: fixed;
    bottom: 0;
    right: 0;
    z-index: 99999;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  `;

  document.body.appendChild(reactContainer);

  // Render React component using WordPress method
  wp.element.render(
    el(UniversalEditorTweaks),
    reactContainer
  );

  isInitialized = true;
  console.log('🚀 Universal Editor Tweaks (React) initialized');
}

// Clean up the React app
function cleanupReactApp() {
  if (!isInitialized) {
    return;
  }

  if (reactContainer) {
    wp.element.unmountComponentAtNode(reactContainer);
    reactContainer.remove();
    reactContainer = null;
  }

  isInitialized = false;
  console.log('🧹 Universal Editor Tweaks (React) cleaned up');
}

// Check if we're in a valid editing context
function shouldInitialize() {
  // Check for editor header elements
  const hasEditorHeader = document.querySelector('.editor-header, .edit-post-header, .edit-site-header');

  if (!hasEditorHeader) {
    return false;
  }

  // Make sure WordPress APIs are available
  if (typeof wp === 'undefined' || !wp.data || !wp.blocks || !wp.data.select('core/block-editor')) {
    return false;
  }

  // Check if we're in post/page editor (not FSE landing page)
  const editor = wp.data.select('core/editor');
  if (editor && typeof editor.getCurrentPostId === 'function' && editor.getCurrentPostId()) {
    return true;
  }

  return false;
}

// Check and update sidebar state
function checkAndUpdateSidebar() {
  if (shouldInitialize()) {
    initializeReactApp();
  } else {
    cleanupReactApp();
  }
}

// Set up MutationObserver to watch for editor changes
function setupObserver() {
  // Initial check
  checkAndUpdateSidebar();

  // Watch for DOM changes (FSE navigation)
  const observer = new MutationObserver(() => {
    checkAndUpdateSidebar();
  });

  // Observe body for changes
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  console.log('👀 Universal Editor Tweaks: Watching for editor context changes');
}

// Initialize when DOM is ready
if (typeof wp !== 'undefined' && wp.domReady) {
  wp.domReady(() => {
    setupObserver();
  });
} else {
  // Fallback for when wp.domReady is not available
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupObserver);
  } else {
    setupObserver();
  }
}