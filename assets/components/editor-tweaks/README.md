# Universal Editor Tweaks - Web Component System

A modern, isolated web component system for enhancing the WordPress Gutenberg editor with clean UI and powerful HTML import functionality.

## 🎯 Features

- **Shadow DOM Isolation** - Zero CSS conflicts with global styles
- **Gutenberg Design Language** - Native WordPress admin styling
- **Canvas Push Behavior** - Drawer pushes content instead of overlaying
- **Modular Architecture** - Clean, maintainable component system
- **Lucide Icons** - Modern, consistent iconography
- **Responsive Design** - Works across all screen sizes
- **Accessibility First** - ARIA attributes, keyboard navigation

## 🚀 Quick Start

### Gutenberg Integration

The web component system is **automatically loaded** in WordPress Gutenberg when this plugin is active. No manual initialization required!

The system:
1. Loads legacy parser functions for HTML conversion
2. Initializes the new web component interface
3. Provides a seamless upgrade from the old sidebar

### Manual Usage (Development/Testing)

```html
<!-- Add the component to your page -->
<universal-editor-tweaks></universal-editor-tweaks>

<!-- Or initialize via JavaScript -->
<script type="module">
  import { initUniversalEditorTweaks } from './index.js';
  initUniversalEditorTweaks();
</script>
```

### Current Status

✅ **Active in Gutenberg** - Web component loads automatically
✅ **Parser Integration** - Uses existing HTML parser functions
✅ **Canvas Push** - Drawer pushes editor content instead of overlay
✅ **Legacy Fallback** - Gracefully falls back if web components not supported

### Manual Control

```javascript
// Get component instance
const editorTweaks = document.querySelector('universal-editor-tweaks');

// Control drawer
editorTweaks.setDrawerOpen(true);  // Open drawer
editorTweaks.setDrawerOpen(false); // Close drawer
editorTweaks.toggleDrawer();       // Toggle state

// Get current state
const state = editorTweaks.getState();
console.log(state); // { isDrawerOpen: false, currentPanel: 'html-import' }
```

## 🏗️ Architecture

### Component Hierarchy

```
UniversalEditorTweaks (main)
├── UniversalSidebar
│   └── Icon buttons with tooltips
├── Drawer Panel
│   ├── Header with close button
│   ├── Content area (HTML textarea)
│   └── Action buttons
└── Utilities
    ├── CanvasManager (push/pull behavior)
    ├── IconSystem (Lucide icons)
    └── DesignTokens (CSS custom properties)
```

### File Structure

```
assets/components/editor-tweaks/
├── UniversalEditorTweaks.js        # Main component
├── index.js                        # Entry point
├── demo.html                       # Interactive demo
├── components/
│   └── UniversalSidebar.js         # Sidebar component
├── styles/
│   ├── tokens.css                  # Design tokens
│   ├── components.css              # Component styles
│   └── animations.css              # Transitions
└── utils/
    ├── icons.js                    # Lucide icon system
    └── canvas-manager.js           # Canvas management
```

## 🎨 Design System

### Design Tokens

The component uses WordPress admin design tokens:

```css
:host {
  --wp-admin-theme-color: #007cba;
  --wp-background: #f0f0f1;
  --wp-border: #c3c4c7;
  --spacing-md: 12px;
  --radius-md: 6px;
  --transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
}
```

### Component Classes

```css
.button              /* Base button */
.button--primary     /* Primary action button */
.button--secondary   /* Secondary button */
.button--ghost       /* Minimal button */
.button--icon        /* Icon-only button */

.panel               /* Content panel */
.panel__header       /* Panel header */
.panel__content      /* Panel content area */

.textarea            /* Form textarea */
.button-group        /* Button grouping */
```

## 🔧 Canvas Management

The canvas manager handles smooth push/pull animations:

```javascript
import { canvasManager } from './utils/canvas-manager.js';

// Control canvas behavior
canvasManager.openDrawer();   // Push canvas right
canvasManager.closeDrawer();  // Pull canvas back
canvasManager.toggleDrawer(); // Toggle state

// Responsive behavior
canvasManager.setDrawerWidth(400);    // Update drawer width
canvasManager.setSidebarWidth(50);    // Update sidebar width
```

### Canvas Events

```javascript
// Listen for canvas state changes
document.addEventListener('drawer:open', (event) => {
  console.log('Drawer opened:', event.detail);
});

document.addEventListener('drawer:close', (event) => {
  console.log('Drawer closed:', event.detail);
});
```

## 🎯 Icon System

Built-in Lucide icon integration:

```javascript
import { createIcon } from './utils/icons.js';

// Create icon elements
const codeIcon = createIcon('code', { size: 'md' });
const closeIcon = createIcon('x', { size: 'sm', color: '#666' });

// Available icons
// UI: code, x, plus, minus, chevronLeft, chevronRight
// Actions: copy, download, upload, check, settings
// Status: alertCircle, info, loader2
// Layout: layout, sidebar, externalLink
```

### Custom Icon Component

```html
<!-- Use in HTML -->
<universal-icon name="code" size="md"></universal-icon>
<universal-icon name="settings" size="lg" color="#007cba"></universal-icon>
```

## 📱 Responsive Behavior

The component automatically adapts to different screen sizes:

- **Mobile (< 768px)**: Full-width drawer overlay
- **Tablet (768px - 1200px)**: Standard 350px drawer
- **Desktop (> 1200px)**: Wider 400px drawer

## ♿ Accessibility

- **Keyboard Navigation**: All controls are keyboard accessible
- **ARIA Labels**: Proper labeling for screen readers
- **Focus Management**: Logical focus order and visible focus indicators
- **Reduced Motion**: Respects `prefers-reduced-motion` setting

## 🔌 WordPress Integration

### Editor Integration

The component automatically detects WordPress Gutenberg context:

```javascript
// Waits for WordPress to be ready
if (typeof wp !== 'undefined' && wp.data && wp.data.select('core/editor')) {
  // Initialize component
}
```

### HTML Parser Integration

Uses the existing HTML parser from the plugin:

```javascript
// Import existing parser functions
const { parseHtmlToBlocks, generateBlockMarkup } = await import('../../editor/editor-tweaks.js');

// Convert HTML to blocks
const blocks = parseHtmlToBlocks(htmlContent);
const blockMarkup = generateBlockMarkup(blocks);
```

## 🧪 Testing

### Demo Environment

Open `demo.html` in a browser to test the component:

1. **Interactive Controls**: Test all component functions
2. **Sample HTML**: Pre-loaded test content
3. **State Inspection**: View component state in real-time
4. **Canvas Behavior**: See push/pull animations

### Manual Testing

```javascript
// Test drawer functionality
const component = document.querySelector('universal-editor-tweaks');

component.setDrawerOpen(true);   // Should open drawer and push canvas
component.setDrawerOpen(false);  // Should close drawer and pull canvas
component.toggleDrawer();        // Should toggle current state

// Test HTML conversion
const textarea = component.shadowRoot.getElementById('html-input');
textarea.value = '<div class="test">Hello World</div>';
// Click "Convert & Insert" button to test parser integration
```

## 🔄 Migration Guide

To replace the current HTML editor tweaks:

1. **Remove old files**:
   ```
   /assets/editor/editor-tweaks.js
   /assets/editor/editor-tweaks.css
   ```

2. **Update PHP enqueue**:
   ```php
   // Instead of old files, enqueue:
   wp_enqueue_script(
     'universal-editor-tweaks',
     plugin_dir_url(__FILE__) . 'assets/components/editor-tweaks/index.js',
     ['wp-blocks', 'wp-element'],
     '1.0.0',
     true
   );
   ```

3. **Test functionality**:
   - HTML import and conversion
   - Canvas push behavior
   - Icon display
   - Responsive design

## 🚧 Future Enhancements

- Settings panel for configuration
- Multiple drawer panels (HTML, Templates, Snippets)
- Drag & drop file support
- Block template library
- Custom theme support
- Plugin API for extensions

## 📝 API Reference

### UniversalEditorTweaks

| Method | Description |
|--------|-------------|
| `setDrawerOpen(boolean)` | Open/close drawer |
| `toggleDrawer()` | Toggle drawer state |
| `getState()` | Get current component state |

### Events

| Event | Description | Detail |
|-------|-------------|---------|
| `editor-tweaks:action` | Sidebar button clicked | `{ buttonId, action }` |
| `drawer:open` | Drawer opened | `{ isDrawerOpen, drawerWidth }` |
| `drawer:close` | Drawer closed | `{ isDrawerOpen, drawerWidth }` |

### CSS Custom Properties

| Property | Description | Default |
|----------|-------------|---------|
| `--sidebar-width` | Sidebar width | `60px` |
| `--drawer-width` | Drawer width | `350px` |
| `--wp-admin-theme-color` | Primary color | `#007cba` |
| `--transition-drawer` | Drawer animation | `300ms cubic-bezier(0.4, 0, 0.2, 1)` |