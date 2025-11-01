/**
 * Universal Editor Tweaks - Lucide Icons Integration
 * SVG icon registry and component system
 */

// Lucide Icon Registry - Core icons used in the editor tweaks
export const ICONS = {
  // UI Actions
  code: `<svg><path d="m18 16 4-4-4-4"/><path d="m6 8-4 4 4 4"/></svg>`,
  x: `<svg><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>`,
  plus: `<svg><path d="M5 12h14"/><path d="M12 5v14"/></svg>`,
  minus: `<svg><path d="M5 12h14"/></svg>`,

  // Navigation
  chevronLeft: `<svg><path d="m15 18-6-6 6-6"/></svg>`,
  chevronRight: `<svg><path d="m9 18 6-6-6-6"/></svg>`,
  chevronUp: `<svg><path d="m18 15-6-6-6 6"/></svg>`,
  chevronDown: `<svg><path d="m6 9 6 6 6-6"/></svg>`,

  // Content Actions
  copy: `<svg><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>`,
  download: `<svg><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7,10 12,15 17,10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>`,
  upload: `<svg><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17,8 12,3 7,8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>`,

  // Status
  check: `<svg><path d="M20 6 9 17l-5-5"/></svg>`,
  alertCircle: `<svg><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>`,
  info: `<svg><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>`,

  // Tools
  settings: `<svg><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>`,
  help: `<svg><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg>`,

  // Loading
  loader2: `<svg><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>`,

  // File Types
  fileText: `<svg><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>`,

  // Layout
  layout: `<svg><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><line x1="3" x2="21" y1="9" y2="9"/><line x1="9" x2="9" y1="21" y2="9"/></svg>`,
  sidebar: `<svg><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><line x1="9" x2="9" y1="3" y2="21"/></svg>`,

  // Social/External
  externalLink: `<svg><path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg>`
};

/**
 * Universal Icon Web Component
 */
export class UniversalIcon extends HTMLElement {
  static get observedAttributes() {
    return ['name', 'size', 'color', 'stroke-width'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
  }

  attributeChangedCallback() {
    this.render();
  }

  render() {
    const name = this.getAttribute('name') || 'help';
    const size = this.getAttribute('size') || 'md';
    const color = this.getAttribute('color') || 'currentColor';
    const strokeWidth = this.getAttribute('stroke-width') || '2';

    const iconSvg = ICONS[name] || ICONS.help;

    // Size classes map
    const sizeClasses = {
      xs: 'icon--xs',
      sm: 'icon--sm',
      md: 'icon--md',
      lg: 'icon--lg',
      xl: 'icon--xl'
    };

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: ${color};
        }

        .icon svg {
          width: 100%;
          height: 100%;
          stroke: currentColor;
          fill: none;
          stroke-width: ${strokeWidth};
          stroke-linecap: round;
          stroke-linejoin: round;
        }

        /* Icon Sizes */
        .icon--xs { width: 12px; height: 12px; }
        .icon--sm { width: 16px; height: 16px; }
        .icon--md { width: 20px; height: 20px; }
        .icon--lg { width: 24px; height: 24px; }
        .icon--xl { width: 32px; height: 32px; }
      </style>
      <div class="icon ${sizeClasses[size] || sizeClasses.md}">
        ${iconSvg}
      </div>
    `;
  }
}

/**
 * Create an icon element
 * @param {string} name - Icon name
 * @param {Object} options - Icon options
 * @returns {UniversalIcon} Icon element
 */
export function createIcon(name, options = {}) {
  const icon = document.createElement('universal-icon');
  icon.setAttribute('name', name);

  if (options.size) icon.setAttribute('size', options.size);
  if (options.color) icon.setAttribute('color', options.color);
  if (options.strokeWidth) icon.setAttribute('stroke-width', options.strokeWidth);
  if (options.className) icon.className = options.className;

  return icon;
}

/**
 * Get SVG string for an icon
 * @param {string} name - Icon name
 * @returns {string} SVG string
 */
export function getIconSvg(name) {
  return ICONS[name] || ICONS.help;
}

/**
 * Register the icon component
 */
export function registerIconComponent() {
  if (!customElements.get('universal-icon')) {
    customElements.define('universal-icon', UniversalIcon);
  }
}