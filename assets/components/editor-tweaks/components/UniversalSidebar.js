/**
 * Universal Sidebar Component
 * Clean, modular sidebar with icon buttons
 */

import { createIcon } from '../utils/icons.js';

export class UniversalSidebar extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });

    // Component state
    this.buttons = [];
  }

  connectedCallback() {
    this.render();
    this.setupEventListeners();
  }

  disconnectedCallback() {
    this.cleanup();
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        /* Import design tokens */
        :host {
          /* Colors */
          --wp-admin-theme-color: #007cba;
          --wp-admin-theme-color-darker: #005a87;
          --wp-background: #f0f0f1;
          --wp-border: #c3c4c7;
          --wp-text-secondary: #757575;

          /* Spacing */
          --spacing-sm: 8px;
          --spacing-md: 12px;

          /* Layout */
          --sidebar-width: 60px;
          --z-sidebar: 99998;

          /* Shadows */
          --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06);

          /* Transitions */
          --transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);

          /* Border Radius */
          --radius-md: 6px;
        }

        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        .sidebar {
          position: fixed;
          top: 0;
          left: 0;
          width: var(--sidebar-width);
          height: 100vh;
          background-color: var(--wp-background);
          border-right: 1px solid var(--wp-border);
          box-shadow: var(--shadow-sm);
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: var(--spacing-md) 0;
          z-index: var(--z-sidebar);
        }

        .sidebar__content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--spacing-sm);
          flex: 1;
        }

        .sidebar__footer {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--spacing-sm);
        }

        .sidebar-button {
          width: 40px;
          height: 40px;
          padding: 0;
          border: none;
          border-radius: var(--radius-md);
          background-color: var(--wp-admin-theme-color);
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all var(--transition-fast);
          position: relative;
          outline: none;
        }

        .sidebar-button:hover {
          background-color: var(--wp-admin-theme-color-darker);
          transform: translateY(-1px);
        }

        .sidebar-button:active {
          transform: translateY(0);
        }

        .sidebar-button:focus-visible {
          box-shadow: 0 0 0 2px var(--wp-admin-theme-color);
        }

        .sidebar-button--secondary {
          background-color: transparent;
          color: var(--wp-text-secondary);
          border: 1px solid var(--wp-border);
        }

        .sidebar-button--secondary:hover {
          background-color: var(--wp-background);
          color: var(--wp-admin-theme-color);
        }

        .sidebar-button universal-icon {
          width: 20px;
          height: 20px;
        }

        /* Tooltip styles */
        .sidebar-button::after {
          content: attr(data-tooltip);
          position: absolute;
          left: calc(100% + 8px);
          top: 50%;
          transform: translateY(-50%);
          background-color: #1e1e1e;
          color: white;
          padding: 6px 8px;
          border-radius: 4px;
          font-size: 12px;
          white-space: nowrap;
          opacity: 0;
          pointer-events: none;
          transition: opacity var(--transition-fast);
          z-index: 1000;
        }

        .sidebar-button:hover::after {
          opacity: 1;
        }

        .sidebar-button::before {
          content: '';
          position: absolute;
          left: calc(100% + 2px);
          top: 50%;
          transform: translateY(-50%);
          width: 0;
          height: 0;
          border-top: 5px solid transparent;
          border-bottom: 5px solid transparent;
          border-right: 6px solid #1e1e1e;
          opacity: 0;
          transition: opacity var(--transition-fast);
          z-index: 1000;
        }

        .sidebar-button:hover::before {
          opacity: 1;
        }

        /* Active state for toggle buttons */
        .sidebar-button--active {
          background-color: var(--wp-admin-theme-color-darker);
        }

        .sidebar-button--active.sidebar-button--secondary {
          background-color: var(--wp-admin-theme-color);
          color: white;
          border-color: var(--wp-admin-theme-color);
        }
      </style>

      <div class="sidebar">
        <div class="sidebar__content">
          <slot name="content"></slot>
        </div>
        <div class="sidebar__footer">
          <slot name="footer"></slot>
        </div>
      </div>
    `;
  }

  setupEventListeners() {
    // Handle button clicks
    this.shadowRoot.addEventListener('click', this.handleButtonClick.bind(this));
  }

  handleButtonClick(event) {
    const button = event.target.closest('.sidebar-button');
    if (!button) return;

    // Dispatch custom event
    const customEvent = new CustomEvent('sidebar:button-click', {
      detail: {
        buttonId: button.dataset.id,
        action: button.dataset.action,
        button: button
      },
      bubbles: true
    });

    this.dispatchEvent(customEvent);
  }

  /**
   * Add a button to the sidebar
   * @param {Object} options - Button configuration
   */
  addButton(options = {}) {
    const {
      id,
      icon = 'help',
      tooltip = '',
      action = '',
      variant = 'primary',
      slot = 'content',
      active = false
    } = options;

    const button = document.createElement('button');
    button.className = `sidebar-button ${variant === 'secondary' ? 'sidebar-button--secondary' : ''} ${active ? 'sidebar-button--active' : ''}`;
    button.dataset.id = id;
    button.dataset.action = action;
    button.setAttribute('data-tooltip', tooltip);
    button.setAttribute('slot', slot);
    button.setAttribute('aria-label', tooltip);

    // Add icon
    const iconElement = createIcon(icon, { size: 'md' });
    button.appendChild(iconElement);

    // Add to component
    this.appendChild(button);

    // Store reference
    this.buttons.push({ id, button, options });

    return button;
  }

  /**
   * Remove a button from the sidebar
   * @param {string} id - Button ID
   */
  removeButton(id) {
    const buttonData = this.buttons.find(b => b.id === id);
    if (buttonData) {
      buttonData.button.remove();
      this.buttons = this.buttons.filter(b => b.id !== id);
    }
  }

  /**
   * Update button state
   * @param {string} id - Button ID
   * @param {Object} updates - Updates to apply
   */
  updateButton(id, updates = {}) {
    const buttonData = this.buttons.find(b => b.id === id);
    if (!buttonData) return;

    const { button } = buttonData;

    if (updates.active !== undefined) {
      button.classList.toggle('sidebar-button--active', updates.active);
    }

    if (updates.tooltip) {
      button.setAttribute('data-tooltip', updates.tooltip);
      button.setAttribute('aria-label', updates.tooltip);
    }

    if (updates.disabled !== undefined) {
      button.disabled = updates.disabled;
    }
  }

  /**
   * Get button by ID
   * @param {string} id - Button ID
   * @returns {HTMLElement|null} Button element
   */
  getButton(id) {
    const buttonData = this.buttons.find(b => b.id === id);
    return buttonData ? buttonData.button : null;
  }

  /**
   * Clear all buttons
   */
  clearButtons() {
    this.buttons.forEach(({ button }) => button.remove());
    this.buttons = [];
  }

  cleanup() {
    this.clearButtons();
  }
}

// Register the component
if (!customElements.get('universal-sidebar')) {
  customElements.define('universal-sidebar', UniversalSidebar);
}