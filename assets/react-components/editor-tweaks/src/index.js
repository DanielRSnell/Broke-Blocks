import React from 'react';
import UniversalEditorTweaks from './components/UniversalEditorTweaks';
import './styles/main.css';

const { createElement: el } = wp.element;

// Initialize the React app
function initializeReactApp() {
  // Clean up any existing web components
  const existingComponents = document.querySelectorAll('universal-editor-tweaks');
  existingComponents.forEach(component => component.remove());

  // Create container for React app
  const container = document.createElement('div');
  container.id = 'universal-editor-tweaks-react';
  container.style.cssText = `
    position: fixed;
    bottom: 0;
    right: 0;
    z-index: 99999;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  `;

  document.body.appendChild(container);

  // Render React component using WordPress method
  wp.element.render(
    el(UniversalEditorTweaks),
    container
  );

  console.log('🚀 Universal Editor Tweaks (React) initialized');
}

// Wait for APIs to be ready
function waitForAPIs() {
  if (typeof wp !== 'undefined' &&
      wp.data &&
      wp.blocks &&
      wp.data.select('core/block-editor')) {

    initializeReactApp();
  } else {
    setTimeout(waitForAPIs, 100);
  }
}

// Initialize when DOM is ready
if (typeof wp !== 'undefined' && wp.domReady) {
  wp.domReady(() => {
    waitForAPIs();
  });
} else {
  // Fallback for when wp.domReady is not available
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', waitForAPIs);
  } else {
    waitForAPIs();
  }
}