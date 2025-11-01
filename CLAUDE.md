# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Universal Block is a designless polymorphic WordPress Gutenberg block that can transform into any HTML element with full attribute control. It provides a flexible tag-based architecture supporting static HTML elements, dynamic content with Timber/Twig integration, and custom web components.

**IMPORTANT:** For a complete guide on Twig markup syntax and control attributes, see [llm-instructions.md](llm-instructions.md).

## Development Commands

```bash
# Install dependencies
npm install

# Development mode (watch mode with hot reload)
npm run start
# or
npm run dev

# Production build
npm run build

# Linting
npm run lint:js         # Lint JavaScript files
npm run lint:css        # Lint CSS files

# Formatting
npm run format:js       # Format JavaScript with Prettier

# Testing
npm run test            # Run unit tests
```

## Architecture

### Tag-Based System

The plugin uses a simplified tag-based architecture where blocks are defined by:
- **Tag Name**: The HTML element (p, div, h1, img, a, loop, if, set, etc.)
- **Content Type**: How content is handled (text, blocks, html, empty)
- **Attributes**: className (WordPress official) and globalAttrs (all other attributes)

Tag configurations were previously centralized but are now managed directly in the Edit component for simplicity.

### Content Types

1. **blocks**: InnerBlocks for container elements with nested blocks (div, section, article, etc.)
2. **text**: Rich text content (RichText component) for inline text elements (p, h1-h6, span, etc.)
3. **html**: Raw HTML content via Ace Editor with Emmet support (for complex markup, SVGs, etc.)
4. **empty**: Self-closing/void elements (img, hr, br, etc.)

### Dynamic Tags & Timber Integration

The plugin supports dynamic content processing through custom tags:

- **`<set>`**: Variable assignment (`<set variable="myVar" value="post.title" />`)
- **`<if>`**: Conditional rendering (`<if source="user.ID > 0">...</if>`)
- **`<loop>`**: Iteration over data (`<loop source="item in posts">...</loop>`)

**Processing Pipeline:**
1. Blocks render to HTML with dynamic tags ([includes/blocks/render-element.php](includes/blocks/render-element.php))
2. Dynamic tags parsed to Twig syntax ([includes/parser/class-dynamic-tag-parser.php](includes/parser/class-dynamic-tag-parser.php))
3. Twig compiled with Timber context (filter in [universal-block.php](universal-block.php) at priority 11)

The preview API ([includes/api/class-preview-api.php](includes/api/class-preview-api.php)) provides real-time preview of dynamic content in the editor.

### Dual Rendering System

**Editor (React):**
- Main edit component: [src/components/Edit.js](src/components/Edit.js)
- Toolbar controls: [src/components/TagNameToolbar.js](src/components/TagNameToolbar.js)
- Plain Classes Manager (always visible): [src/components/PlainClassesManager.js](src/components/PlainClassesManager.js)
- Context-aware panels for img and a tags
- Dynamic tag settings for loop/if/set
- HTML Import/Export via sidebar

**Frontend (PHP):**
- Server-side rendering: [includes/blocks/render-element.php](includes/blocks/render-element.php)
- No wrapper elements (direct HTML output)
- Automatic block IDs (`id="block-{hash}"`)
- Sanitization based on content type (wp_kses_post, extended for SVG)

### Key Components

**Core UI Components:**
- [Edit.js](src/components/Edit.js): Main editor component with contentType routing
- [TagNameToolbar.js](src/components/TagNameToolbar.js): Tag selection in block toolbar
- [PlainClassesManager.js](src/components/PlainClassesManager.js): Tokenized class management UI (always visible)
- [ImageSettingsPanel.js](src/components/ImageSettingsPanel.js): Media library picker for img tags
- [LinkSettingsPanel.js](src/components/LinkSettingsPanel.js): Post/page picker and URL management for a tags
- [DynamicTagSettings.js](src/components/DynamicTagSettings.js): Context-aware inputs for loop/if/set tags

**Sidebar Enhancements (React Apps):**
- [HtmlImportDrawer.js](assets/react-components/editor-tweaks/src/components/HtmlImportDrawer.js): Import HTML to blocks
- [AttributesEditorPopup.js](assets/react-components/editor-tweaks/src/components/AttributesEditorPopup.js): Edit globalAttrs
- [PreviewSettingsDrawer.js](assets/react-components/editor-tweaks/src/components/PreviewSettingsDrawer.js): Configure preview context

**Parsers (Standalone Libraries):**
- [lib/html2blocks.js](lib/html2blocks.js): HTML → Blocks parser
- [lib/blocks2html.js](lib/blocks2html.js): Blocks → HTML serializer

**PHP Backend:**
- [includes/blocks/render-element.php](includes/blocks/render-element.php): Block rendering logic
- [includes/parser/class-dynamic-tag-parser.php](includes/parser/class-dynamic-tag-parser.php): Dynamic tag processing
- [includes/api/class-preview-api.php](includes/api/class-preview-api.php): Preview REST API
- [includes/api/class-preview-settings-api.php](includes/api/class-preview-settings-api.php): Settings persistence
- [includes/editor/class-preview-context.php](includes/editor/class-preview-context.php): Auto-detect editing context
- [includes/editor/class-editor-tweaks.php](includes/editor/class-editor-tweaks.php): Editor customizations

### Parser System

The plugin includes a bidirectional parsing system for 100% consistent HTML ↔ Block conversion:

- **HTML to Blocks Parser**: [lib/html2blocks.js](lib/html2blocks.js) - Converts HTML markup to block structures
- **Blocks to HTML Parser**: [lib/blocks2html.js](lib/blocks2html.js) - Converts block structures back to HTML
- **Documentation**: [docs/parsers/](docs/parsers/) - Comprehensive parser documentation
  - [Parser Overview](docs/parsers/README.md) - System overview and roundtrip consistency
  - [HTML to Blocks](docs/parsers/html-to-blocks.md) - Forward conversion details
  - [Blocks to HTML](docs/parsers/blocks-to-html.md) - Reverse conversion details

**Key Features:**
- Structure preservation: Exact DOM hierarchy maintained
- Attribute preservation: All attributes preserved with proper escaping
- Custom element support: Dynamic tags (`<set>`, `<loop>`, `<if>`) handled correctly
- Roundtrip guarantee: HTML → Blocks → HTML produces structurally identical output

## Important Implementation Details

### Attribute Storage

- **globalAttrs**: Object storing all HTML attributes EXCEPT class (id, style, data-*, aria-*, href, src, etc.)
- **className**: WordPress-managed classes (official WordPress way, managed by PlainClassesManager)
- **content**: Text/HTML content (not used for blocks contentType)
- **tagName**: Current HTML element
- **contentType**: Content handling mode (blocks, text, html, empty)
- **blockContext**: Optional Timber context name for custom data filters
- **isDynamic**: Flag for dynamic preview mode

**CRITICAL:** Never add 'class' to globalAttrs. Classes are managed exclusively via the className attribute (WordPress official way). The PlainClassesManager UI manages className, not globalAttrs.

### Automatic Block IDs

All blocks automatically receive unique IDs:

**Editor (JavaScript):**
- `id="block-{clientId}"` - Uses WordPress block's unique client ID
- Set in [Edit.js](src/components/Edit.js) lines 49-52

**Frontend (PHP):**
- `id="block-{hash}"` - Uses MD5 hash of block data + microtime
- Set in [render-element.php](includes/blocks/render-element.php) lines 30-39

User can override by setting custom `id` in globalAttrs.

### Block Conversion

Users can convert between content types:

**HTML → Blocks:**
1. Click "Import HTML" button in sidebar (eye icon)
2. Paste HTML in Ace Editor
3. Click "Import" - HTML parsed to nested blocks using html2blocks.js

**Blocks → HTML:**
1. Select block with nested blocks (contentType: blocks)
2. Click "To HTML" button in Element Settings
3. Block tree serialized to HTML using blocks2html.js
4. ContentType changes to "html" with serialized content

Conversion buttons appear contextually based on contentType.

### Plain Classes Manager

Tokenized UI for managing CSS classes:

**Features:**
- Token-based display (pills/chips)
- Press Enter to add class
- Backspace to remove last class
- Paste multiple space-separated classes
- Auto-deduplication
- Clear all button
- Always visible (not in accordion)

**Location:** Top of InspectorControls in [Edit.js](src/components/Edit.js)

**Component:** [PlainClassesManager.js](src/components/PlainClassesManager.js)

### Image Settings Panel

Appears when `tagName === 'img'`:

**Features:**
- WordPress Media Library picker
- Visual preview with replace/remove buttons
- Automatic metadata (alt, width, height)
- Source URL display

**Component:** [ImageSettingsPanel.js](src/components/ImageSettingsPanel.js)

### Link Settings Panel

Appears when `tagName === 'a'`:

**Features:**
- External/Internal toggle
- Post Type selector (Page, Post, Product, etc.)
- Post/Page picker with search
- Manual URL input for external links
- Target="_blank" toggle with automatic rel="noopener noreferrer"
- ARIA label input
- Remove link button

**Component:** [LinkSettingsPanel.js](src/components/LinkSettingsPanel.js)

Uses WordPress data store to fetch posts:
```javascript
useSelect((select) => {
  const { getEntityRecords } = select('core');
  return getEntityRecords('postType', selectedPostType, {...});
}, [selectedPostType]);
```

### Dynamic Tag Settings

Context-aware inputs for dynamic tags:

**For `<loop>` tags:**
- Source input: "item in posts"

**For `<if>` tags:**
- Condition textarea: "user.ID > 0"

**For `<set>` tags:**
- Variable name input
- Value/Source input

**Component:** [DynamicTagSettings.js](src/components/DynamicTagSettings.js)

### Preview Context System

Test Timber/Twig templates with real data:

**Auto-Detection:**
- Detects current editing context from URL parameters
- Checks `$_GET['post']` first (most reliable)
- Falls back to global `$post`
- Enqueues context to `window.universal.preview`

**Manual Configuration:**
- Source Type: Post Type vs Taxonomy
- Context Type: Singular, Archive, Front Page
- Post Type: Page, Post, Product, etc.
- Post ID: Specific post selection
- Taxonomy: Category, Tag, Product Category, etc.
- Term ID: Specific term selection
- WooCommerce Pages: Shop, Cart, Checkout, My Account

**API Endpoint:** `POST /wp-json/universal-block/v1/preview-settings`

**Storage:** User meta (per-user settings)

**Documentation:** [docs/preview-context.md](docs/preview-context.md)

### Dynamic Processing

When `isDynamic` is enabled, the block fetches processed HTML from the preview API endpoint, which:
1. Serializes the block and children to HTML
2. Processes dynamic tags through the parser
3. Compiles Twig with full Timber context
4. Returns compiled HTML for preview

This enables WYSIWYG editing of dynamic content.

## File Structure Highlights

```
universal-block/
├── src/                              # React source files
│   ├── components/                   # UI components
│   │   ├── Edit.js                  # Main editor component
│   │   ├── Save.js                  # Save component (minimal)
│   │   ├── PlainClassesManager.js   # Class management UI
│   │   ├── ImageSettingsPanel.js    # Image controls
│   │   ├── LinkSettingsPanel.js     # Link controls
│   │   ├── TagNameToolbar.js        # Tag selector toolbar
│   │   └── DynamicTagSettings.js    # Loop/if/set inputs
│   ├── index.js                      # Main entry point
│   └── style.scss                    # Editor styles
├── includes/                         # PHP backend
│   ├── blocks/                       # Block rendering
│   │   └── render-element.php       # Server-side render
│   ├── parser/                       # Dynamic tag parser
│   │   └── class-dynamic-tag-parser.php
│   ├── api/                          # REST API endpoints
│   │   ├── class-preview-api.php    # Dynamic preview
│   │   └── class-preview-settings-api.php
│   ├── editor/                       # Editor customizations
│   │   ├── class-editor-tweaks.php  # Sidebar enhancements
│   │   └── class-preview-context.php # Context detection
│   └── admin/                        # Admin functionality
├── assets/                           # Static assets
│   ├── editor/                       # Editor-specific
│   │   ├── appender.css             # Block appender styles
│   │   └── appender.js              # Block appender script
│   ├── global/                       # Third-party libraries
│   │   ├── ace/                     # Ace Editor
│   │   ├── emmet/                   # Emmet
│   │   └── beautify/                # js-beautify
│   └── react-components/             # Standalone React apps
│       └── editor-tweaks/           # Sidebar React app
│           └── src/components/
│               ├── HtmlImportDrawer.js
│               ├── AttributesEditorPopup.js
│               └── PreviewSettingsDrawer.js
├── lib/                              # Standalone libraries
│   ├── html2blocks.js               # HTML → Blocks parser
│   └── blocks2html.js               # Blocks → HTML serializer
├── docs/                             # Documentation
│   ├── parsers/                     # Parser docs
│   │   ├── README.md
│   │   ├── html-to-blocks.md
│   │   └── blocks-to-html.md
│   ├── block-context.md             # Dynamic content guide
│   ├── preview-context.md           # Preview system
│   └── block-appender.md            # Appender customization
├── _legacy/                          # Archived legacy code
├── build/                            # Build output (generated)
├── universal-block.php               # Main plugin file
├── block.json                        # Block metadata
├── package.json                      # Node.js dependencies
└── README.md                         # User documentation
```

## REST API Endpoints

- `POST /wp-json/universal-block/v1/preview`: Full page context preview
- `POST /wp-json/universal-block/v1/dynamic-preview`: Individual block preview with Timber processing
- `POST /wp-json/universal-block/v1/preview-settings`: Save/retrieve preview configuration (user meta)

## Timber Context

The plugin extends Timber context with:
- `post` - Current post object (post.title, post.meta, post.thumbnail, post.author)
- `user` - Current user (user.ID, user.display_name, user.roles)
- `page_data` - Custom data via `universal_block/page_data` filter
- Test data for preview mode (test_array, user_count, is_featured)

Context is available in dynamic tags via Twig syntax: `{{ post.title }}`, `{{ user.display_name }}`

**Custom Context Filters:**
```php
// Add custom data to specific block context
add_filter('universal_block/context/product_gallery', function($context) {
    $context['products'] = Timber::get_posts(['post_type' => 'product']);
    return $context;
});
```

## Dependencies

**PHP:**
- WordPress 6.0+
- PHP 7.4+
- Timber/Twig 2.3+ (optional, for dynamic features)

**JavaScript:**
- @wordpress/scripts (build tooling)
- React 17+ (via WordPress)
- Ace Editor (HTML editing)
- js-beautify (HTML formatting)
- Emmet (HTML abbreviation expansion)
- Framer Motion (UI animations)

## Code Standards

- React functional components with hooks
- WordPress coding standards for PHP
- ESLint configuration via @wordpress/scripts
- Server-side sanitization for all output (wp_kses, esc_attr, esc_url)
- No inline styles in components (use style prop with objects)
- Always use WordPress data stores (not direct REST calls)

## Testing Dynamic Tags

Use the test file [test-dynamic-tags.php](test-dynamic-tags.php) to test dynamic tag parsing and Twig compilation outside the editor.

## Special Considerations

- **No wrapper elements**: The block renders direct HTML without WordPress wrapper divs (except in editor)
- **Self-closing tags**: Use proper self-closing syntax for void elements
- **Custom elements**: Tags with hyphens are treated as web components
- **Set tags are invisible**: They render variables but don't display in output
- **Context awareness**: Preview system analyzes available Twig context for better autocomplete
- **Class management**: NEVER use globalAttrs.class - always use className attribute
- **Block IDs**: Automatically generated but can be overridden via globalAttrs.id
- **Sidebar apps**: Use Framer Motion for animations, RemixIcon for icons

## Common Tasks

### Adding a New Settings Panel

1. Create component in `src/components/{Name}SettingsPanel.js`
2. Import in `Edit.js`
3. Add conditional render based on `tagName`
4. Follow ImageSettingsPanel or LinkSettingsPanel pattern

### Adding a New Dynamic Tag

1. Update `DynamicTagSettings.js` with new tag case
2. Update `class-dynamic-tag-parser.php` to handle parsing
3. Add documentation to `docs/block-context.md`

### Modifying Block Appender

1. Edit `assets/editor/appender.css` for styles
2. Edit `assets/editor/appender.js` for behavior
3. See `docs/block-appender.md` for details

### Adding Sidebar Feature

1. Create component in `assets/react-components/editor-tweaks/src/components/`
2. Import and integrate in `UniversalEditorTweaks.js`
3. Use Framer Motion for animations
4. Use RemixIcon for icons

## Documentation

- [llm-instructions.md](llm-instructions.md) - **LLM Markup Guide** - Complete reference for Twig syntax and control attributes
- [README.md](README.md) - User-facing documentation
- [docs/parsers/README.md](docs/parsers/README.md) - Parser system overview
- [docs/block-context.md](docs/block-context.md) - Timber/Twig integration
- [docs/preview-context.md](docs/preview-context.md) - Preview configuration
- [docs/block-appender.md](docs/block-appender.md) - Appender customization

## Troubleshooting

**Classes duplicating:** Ensure `class` is never in globalAttrs. Use className only.

**Block IDs not unique:** Check that microtime is included in hash generation.

**Preview not working:** Verify Timber is installed and preview settings are configured.

**HTML import failing:** Check browser console for parser errors. Verify html2blocks.js is loaded.

**Attributes not saving:** Ensure globalAttrs updates use spread operator: `{ ...globalAttrs, key: value }`
