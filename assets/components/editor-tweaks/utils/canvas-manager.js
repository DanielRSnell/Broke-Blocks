/**
 * Universal Editor Tweaks - Canvas Manager
 * Handles canvas push/pull behavior for drawer interactions
 */

export class CanvasManager {
  constructor() {
    this.isDrawerOpen = false;
    this.canvasSelector = '.interface-interface-skeleton__body';
    this.drawerWidth = 350;
    this.sidebarWidth = 60;
    this.transitionDuration = 300;

    // Initialize
    this.init();
  }

  init() {
    this.canvas = document.querySelector(this.canvasSelector);
    if (!this.canvas) {
      // Fallback selectors for different WordPress versions
      const fallbackSelectors = [
        '.edit-post-layout',
        '.edit-site-layout',
        '.block-editor',
        '#wpbody-content'
      ];

      for (const selector of fallbackSelectors) {
        this.canvas = document.querySelector(selector);
        if (this.canvas) break;
      }
    }

    if (this.canvas) {
      this.setupCanvas();
    } else {
      console.warn('Canvas element not found. Canvas push behavior disabled.');
    }
  }

  setupCanvas() {
    // Add transition styles if not already present
    if (!this.canvas.style.transition) {
      this.canvas.style.transition = `margin-left ${this.transitionDuration}ms cubic-bezier(0.4, 0, 0.2, 1)`;
    }

    // Set initial margin for sidebar
    this.canvas.style.marginLeft = `${this.sidebarWidth}px`;
  }

  /**
   * Open the drawer and push canvas
   */
  openDrawer() {
    if (!this.canvas || this.isDrawerOpen) return;

    this.isDrawerOpen = true;
    const totalOffset = this.sidebarWidth + this.drawerWidth;

    // Apply push transformation
    this.canvas.style.marginLeft = `${totalOffset}px`;

    // Add CSS class for additional styling if needed
    this.canvas.classList.add('universal-drawer-open');

    // Dispatch custom event
    this.dispatchEvent('drawer:open');
  }

  /**
   * Close the drawer and pull canvas back
   */
  closeDrawer() {
    if (!this.canvas || !this.isDrawerOpen) return;

    this.isDrawerOpen = false;

    // Reset to sidebar-only offset
    this.canvas.style.marginLeft = `${this.sidebarWidth}px`;

    // Remove CSS class
    this.canvas.classList.remove('universal-drawer-open');

    // Dispatch custom event
    this.dispatchEvent('drawer:close');
  }

  /**
   * Toggle drawer state
   */
  toggleDrawer() {
    if (this.isDrawerOpen) {
      this.closeDrawer();
    } else {
      this.openDrawer();
    }
  }

  /**
   * Update drawer width (useful for responsive behavior)
   * @param {number} width - New drawer width in pixels
   */
  setDrawerWidth(width) {
    this.drawerWidth = width;

    // If drawer is open, update the canvas position
    if (this.isDrawerOpen) {
      const totalOffset = this.sidebarWidth + this.drawerWidth;
      this.canvas.style.marginLeft = `${totalOffset}px`;
    }
  }

  /**
   * Update sidebar width
   * @param {number} width - New sidebar width in pixels
   */
  setSidebarWidth(width) {
    this.sidebarWidth = width;

    // Update canvas position
    if (this.canvas) {
      const totalOffset = this.isDrawerOpen
        ? this.sidebarWidth + this.drawerWidth
        : this.sidebarWidth;
      this.canvas.style.marginLeft = `${totalOffset}px`;
    }
  }

  /**
   * Handle responsive behavior
   */
  handleResize() {
    const screenWidth = window.innerWidth;

    // Mobile: Use overlay instead of push
    if (screenWidth < 768) {
      this.setDrawerWidth(screenWidth); // Full width drawer
      if (this.canvas && this.isDrawerOpen) {
        // On mobile, use overlay (no canvas push)
        this.canvas.style.marginLeft = `${this.sidebarWidth}px`;
      }
    } else if (screenWidth >= 1200) {
      // Large screens: Wider drawer
      this.setDrawerWidth(400);
    } else {
      // Default width
      this.setDrawerWidth(350);
    }
  }

  /**
   * Dispatch custom events
   * @param {string} eventName - Event name
   * @param {Object} detail - Event detail
   */
  dispatchEvent(eventName, detail = {}) {
    const event = new CustomEvent(eventName, {
      detail: {
        isDrawerOpen: this.isDrawerOpen,
        drawerWidth: this.drawerWidth,
        sidebarWidth: this.sidebarWidth,
        ...detail
      },
      bubbles: true
    });

    document.dispatchEvent(event);
  }

  /**
   * Cleanup and restore original state
   */
  destroy() {
    if (this.canvas) {
      // Reset canvas margin
      this.canvas.style.marginLeft = '';
      this.canvas.style.transition = '';
      this.canvas.classList.remove('universal-drawer-open');
    }

    this.isDrawerOpen = false;
  }

  /**
   * Get current state
   */
  getState() {
    return {
      isDrawerOpen: this.isDrawerOpen,
      drawerWidth: this.drawerWidth,
      sidebarWidth: this.sidebarWidth,
      canvasElement: this.canvas
    };
  }
}

/**
 * Animation helper for smooth transitions
 */
export class AnimationHelper {
  /**
   * Animate element with CSS transforms
   * @param {HTMLElement} element - Element to animate
   * @param {Object} from - Starting styles
   * @param {Object} to - Ending styles
   * @param {number} duration - Animation duration in ms
   * @returns {Promise} Promise that resolves when animation completes
   */
  static animate(element, from, to, duration = 300) {
    return new Promise((resolve) => {
      // Apply starting styles
      Object.assign(element.style, from);

      // Force reflow
      element.offsetHeight;

      // Apply transition
      element.style.transition = `all ${duration}ms cubic-bezier(0.4, 0, 0.2, 1)`;

      // Apply ending styles
      Object.assign(element.style, to);

      // Clean up after animation
      setTimeout(() => {
        element.style.transition = '';
        resolve();
      }, duration);
    });
  }

  /**
   * Slide element in from left
   * @param {HTMLElement} element - Element to animate
   * @param {number} duration - Animation duration in ms
   */
  static slideInFromLeft(element, duration = 300) {
    return this.animate(
      element,
      { transform: 'translateX(-100%)', opacity: '0' },
      { transform: 'translateX(0)', opacity: '1' },
      duration
    );
  }

  /**
   * Slide element out to left
   * @param {HTMLElement} element - Element to animate
   * @param {number} duration - Animation duration in ms
   */
  static slideOutToLeft(element, duration = 300) {
    return this.animate(
      element,
      { transform: 'translateX(0)', opacity: '1' },
      { transform: 'translateX(-100%)', opacity: '0' },
      duration
    );
  }
}

// Create singleton instance
export const canvasManager = new CanvasManager();

// Handle responsive behavior
window.addEventListener('resize', () => {
  canvasManager.handleResize();
});

// Initialize responsive behavior
canvasManager.handleResize();