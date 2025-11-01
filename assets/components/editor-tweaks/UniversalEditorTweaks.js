/**
 * Universal Editor Tweaks - Main Web Component
 * Modern, isolated editor enhancement component
 */

import { UniversalSidebar } from './components/UniversalSidebar.js';
import { registerIconComponent } from './utils/icons.js';
import { canvasManager } from './utils/canvas-manager.js';

export class UniversalEditorTweaks extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });

    // Component state
    this.isDrawerOpen = false;
    this.currentPanel = 'html-import';

    // References
    this.sidebar = null;
    this.drawer = null;
  }

  connectedCallback() {
    this.init();
  }

  disconnectedCallback() {
    this.cleanup();
  }

  async init() {
    // Register icon component first
    registerIconComponent();

    // Import and load styles
    await this.loadStyles();

    // Render component
    this.render();

    // Setup components
    this.setupSidebar();
    this.setupDrawer();

    // Setup event listeners
    this.setupEventListeners();

    // Initialize canvas manager integration
    this.setupCanvasIntegration();
  }

  async loadStyles() {
    // Load CSS files as text and inject into shadow DOM
    const styleFiles = [
      './styles/tokens.css',
      './styles/components.css',
      './styles/animations.css'
    ];

    try {
      const styles = await Promise.all(
        styleFiles.map(async (file) => {
          const response = await fetch(new URL(file, import.meta.url));
          return response.text();
        })
      );

      // Create combined style element
      const styleElement = document.createElement('style');
      styleElement.textContent = styles.join('\\n\\n');
      this.shadowRoot.appendChild(styleElement);
    } catch (error) {
      console.warn('Failed to load styles:', error);
      // Fallback: inject minimal inline styles
      this.injectFallbackStyles();
    }
  }

  injectFallbackStyles() {
    const fallbackStyles = `
      :host {
        --wp-admin-theme-color: #007cba;
        --wp-background: #f0f0f1;
        --wp-border: #c3c4c7;
        --sidebar-width: 60px;
        --drawer-width: 350px;
        --transition-drawer: 300ms cubic-bezier(0.4, 0, 0.2, 1);
      }

      .container {
        position: fixed;
        top: 0;
        left: 0;
        z-index: 99998;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      }

      .sidebar {
        position: fixed;
        top: 0;
        left: 0;
        width: var(--sidebar-width);
        height: 100vh;
        background: var(--wp-background);
        border-right: 1px solid var(--wp-border);
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 12px 0;
      }

      .drawer {
        position: fixed;
        top: 0;
        left: var(--sidebar-width);
        width: var(--drawer-width);
        height: 100vh;
        background: white;
        border-right: 1px solid var(--wp-border);
        transform: translateX(-100%);
        transition: transform var(--transition-drawer);
        display: flex;
        flex-direction: column;
      }

      .drawer--open {
        transform: translateX(0);
      }
    `;

    const styleElement = document.createElement('style');
    styleElement.textContent = fallbackStyles;
    this.shadowRoot.appendChild(styleElement);
  }

  render() {
    this.shadowRoot.innerHTML += `
      <div class="container">
        <!-- Sidebar -->
        <universal-sidebar id="main-sidebar"></universal-sidebar>

        <!-- Drawer -->
        <div class="drawer" id="main-drawer">
          <div class="drawer__header">
            <h3 class="drawer__title">Import HTML</h3>
            <button class="button button--ghost button--sm" id="close-drawer" aria-label="Close drawer">
              <universal-icon name="x" size="sm"></universal-icon>
            </button>
          </div>

          <div class="drawer__content">
            <div class="panel">
              <div class="panel__content">
                <textarea
                  class="textarea"
                  id="html-input"
                  placeholder="Paste your HTML here...

Examples:
• Complex components with nested elements
• SVG graphics with attributes
• Forms with inputs and labels
• Navigation menus
• Any HTML structure

The parser will convert it to Universal Blocks with proper nesting and clean WordPress block markup."
                  rows="12"
                ></textarea>

                <div class="button-group" style="margin-top: 16px;">
                  <button class="button button--primary" id="convert-insert-btn">
                    <universal-icon name="plus" size="sm"></universal-icon>
                    Convert & Insert
                  </button>
                  <button class="button button--secondary" id="copy-as-blocks-btn">
                    <universal-icon name="copy" size="sm"></universal-icon>
                    Copy as Blocks
                  </button>
                </div>

                <div class="help-text" style="margin-top: 16px; font-size: 13px; color: var(--wp-text-secondary); line-height: 1.4;">
                  <p><strong>Convert & Insert:</strong> Parses HTML and inserts blocks directly into the editor.</p>
                  <p><strong>Copy as Blocks:</strong> Generates block markup that can be pasted anywhere.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Get references
    this.sidebar = this.shadowRoot.getElementById('main-sidebar');
    this.drawer = this.shadowRoot.getElementById('main-drawer');
  }

  setupSidebar() {
    if (!this.sidebar) return;

    // Add HTML import button
    this.sidebar.addButton({
      id: 'html-import',
      icon: 'code',
      tooltip: 'Import HTML',
      action: 'toggle-drawer',
      slot: 'content'
    });

    // Add settings button (future)
    this.sidebar.addButton({
      id: 'settings',
      icon: 'settings',
      tooltip: 'Settings',
      action: 'open-settings',
      variant: 'secondary',
      slot: 'footer'
    });
  }

  setupDrawer() {
    // Drawer is already set up in render()
    // Additional setup can be added here
  }

  setupEventListeners() {
    // Sidebar button clicks
    this.sidebar?.addEventListener('sidebar:button-click', this.handleSidebarClick.bind(this));

    // Drawer controls
    const closeBtn = this.shadowRoot.getElementById('close-drawer');
    const convertBtn = this.shadowRoot.getElementById('convert-insert-btn');
    const copyBtn = this.shadowRoot.getElementById('copy-as-blocks-btn');

    closeBtn?.addEventListener('click', () => this.closeDrawer());
    convertBtn?.addEventListener('click', () => this.handleConvertAndInsert());
    copyBtn?.addEventListener('click', () => this.handleCopyAsBlocks());

    // Canvas manager events
    document.addEventListener('drawer:open', this.handleDrawerStateChange.bind(this));
    document.addEventListener('drawer:close', this.handleDrawerStateChange.bind(this));
  }

  setupCanvasIntegration() {
    // The canvas manager is already initialized
    // We just need to sync our drawer state with it
  }

  handleSidebarClick(event) {
    const { buttonId, action } = event.detail;

    switch (action) {
      case 'toggle-drawer':
        this.toggleDrawer();
        break;
      case 'open-settings':
        this.openSettings();
        break;
      default:
        // Dispatch custom event for external handling
        this.dispatchEvent(new CustomEvent('editor-tweaks:action', {
          detail: { buttonId, action },
          bubbles: true
        }));
    }
  }

  toggleDrawer() {
    if (this.isDrawerOpen) {
      this.closeDrawer();
    } else {
      this.openDrawer();
    }
  }

  openDrawer() {
    if (this.isDrawerOpen) return;

    this.isDrawerOpen = true;
    this.drawer?.classList.add('drawer--open');

    // Update sidebar button state
    this.sidebar?.updateButton('html-import', { active: true });

    // Trigger canvas push
    canvasManager.openDrawer();

    // Focus on textarea
    setTimeout(() => {
      const textarea = this.shadowRoot.getElementById('html-input');
      textarea?.focus();
    }, 100);
  }

  closeDrawer() {
    if (!this.isDrawerOpen) return;

    this.isDrawerOpen = false;
    this.drawer?.classList.remove('drawer--open');

    // Update sidebar button state
    this.sidebar?.updateButton('html-import', { active: false });

    // Trigger canvas pull
    canvasManager.closeDrawer();
  }

  openSettings() {
    // Future: Open settings panel
    console.log('Settings panel not yet implemented');
  }

  handleDrawerStateChange(event) {
    // Sync our state with canvas manager
    const { isDrawerOpen } = event.detail;

    if (isDrawerOpen !== this.isDrawerOpen) {
      if (isDrawerOpen) {
        this.openDrawer();
      } else {
        this.closeDrawer();
      }
    }
  }

  async handleConvertAndInsert() {
    const htmlInput = this.shadowRoot.getElementById('html-input');
    const htmlContent = htmlInput?.value.trim();

    if (!htmlContent) {
      this.showNotification('Please enter some HTML to convert.', 'warning');
      return;
    }

    try {
      // Use the globally available parser functions
      if (typeof window.parseHtmlToBlocks !== 'function' ||
          typeof window.generateBlockMarkup !== 'function' ||
          typeof window.insertBlockMarkupIntoEditor !== 'function') {
        throw new Error('HTML parser functions not available. Please ensure the legacy editor tweaks are loaded.');
      }

      const blocks = window.parseHtmlToBlocks(htmlContent);
      const blockMarkup = window.generateBlockMarkup(blocks);

      // Insert into editor
      window.insertBlockMarkupIntoEditor(blockMarkup);

      // Clear input and close drawer
      htmlInput.value = '';
      this.closeDrawer();

      this.showNotification('HTML converted and inserted successfully!', 'success');
    } catch (error) {
      console.error('Error converting HTML:', error);
      this.showNotification('Error converting HTML. Please check the console for details.', 'error');
    }
  }

  async handleCopyAsBlocks() {
    const htmlInput = this.shadowRoot.getElementById('html-input');
    const htmlContent = htmlInput?.value.trim();

    if (!htmlContent) {
      this.showNotification('Please enter some HTML to convert.', 'warning');
      return;
    }

    try {
      // Use the globally available parser functions
      if (typeof window.parseHtmlToBlocks !== 'function' ||
          typeof window.generateBlockMarkup !== 'function') {
        throw new Error('HTML parser functions not available. Please ensure the legacy editor tweaks are loaded.');
      }

      const blocks = window.parseHtmlToBlocks(htmlContent);
      const blockMarkup = window.generateBlockMarkup(blocks);

      await navigator.clipboard.writeText(blockMarkup);
      this.showNotification('Block markup copied to clipboard!', 'success');
    } catch (error) {
      console.error('Error converting HTML:', error);
      this.showNotification('Error converting HTML. Please check the console for details.', 'error');
    }
  }

  showNotification(message, type = 'info') {
    // Simple notification system
    // Future: Could be enhanced with a proper notification component

    // For now, use browser alert
    // In a real implementation, this would show a styled notification
    if (type === 'error') {
      alert('Error: ' + message);
    } else if (type === 'warning') {
      alert('Warning: ' + message);
    } else {
      alert(message);
    }
  }

  cleanup() {
    // Clean up canvas manager
    canvasManager.closeDrawer();

    // Remove event listeners
    document.removeEventListener('drawer:open', this.handleDrawerStateChange.bind(this));
    document.removeEventListener('drawer:close', this.handleDrawerStateChange.bind(this));
  }

  // Public API methods
  getState() {
    return {
      isDrawerOpen: this.isDrawerOpen,
      currentPanel: this.currentPanel
    };
  }

  // Method to programmatically control the component
  setDrawerOpen(open) {
    if (open) {
      this.openDrawer();
    } else {
      this.closeDrawer();
    }
  }
}

// Register the main component
if (!customElements.get('universal-editor-tweaks')) {
  customElements.define('universal-editor-tweaks', UniversalEditorTweaks);
}

// Export for external use
export default UniversalEditorTweaks;