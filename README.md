# Broke Blocks

A designless polymorphic WordPress Gutenberg block that can transform into any HTML element with full attribute control. Build anything from simple paragraphs to complex dynamic templates using a single, flexible block.

## Features

### Core Capabilities
- **🎯 Polymorphic HTML Elements**: Transform into any HTML tag (div, section, article, img, a, h1-h6, etc.)
- **🎨 Designless Architecture**: Zero injected styles - your theme controls the appearance
- **⚙️ Full Attribute Control**: Set any HTML attributes (id, class, style, data-*, aria-*, href, src, etc.)
- **🔄 Bidirectional Parsing**: Convert HTML ↔ Blocks with 100% structural consistency
- **🌲 Timber/Twig Integration**: Dynamic content with loop, if, and set tags
- **🎭 Custom Web Components**: Support for custom elements with hyphens
- **📦 No Wrapper Elements**: Direct HTML output, no WordPress wrapper divs

### Advanced Features
- **Plain Classes Manager**: Tokenized UI for easy CSS class management with Tailwind support
- **Image Settings Panel**: Visual media library picker with metadata
- **Link Settings Panel**: Post/page picker or external URL with target and ARIA controls
- **Preview Context System**: Test Timber/Twig templates with real post/WooCommerce data
- **Dynamic Tag Settings**: Context-aware inputs for loop, if, and set tags
- **HTML Import/Export**: Paste HTML to create blocks, export blocks to HTML
- **Automatic Block IDs**: Unique identifiers for targeting and debugging

## Installation

### Quick Start
1. Clone or download this repository into `wp-content/plugins/`
2. Install dependencies and build:
   ```bash
   cd universal-block
   npm install
   npm run build
   ```
3. Activate **Broke Blocks** in WordPress Admin → Plugins

### Requirements
- WordPress 6.0+
- PHP 7.4+
- Node.js 18+ (for development)
- Timber 2+ (for dynamic features - installed via Composer)

## Development

```bash
# Install dependencies
npm install

# Development mode (watch with hot reload)
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

## Usage

### Basic Usage

1. **Insert Block**: Add "Element" block in the editor
2. **Choose Tag**: Select from common tags (div, section, article, etc.) or enter custom tag
3. **Set Content Type**:
   - **Blocks**: Container with nested blocks (InnerBlocks)
   - **Text**: Rich text content (RichText)
   - **HTML**: Raw HTML via Ace Editor with Emmet support
   - **Empty**: Self-closing/void elements (img, hr, br)
4. **Add Classes**: Use the Plain Classes Manager for easy class management
5. **Configure Attributes**: Set id, data-*, aria-*, or any HTML attribute

### Content Types Explained

#### Blocks (Container)
Use for layout elements that contain other blocks:
```html
<div class="container mx-auto">
  <!-- Other blocks nested here -->
</div>
```

#### Text
Use for inline text elements:
```html
<h1>Welcome to My Site</h1>
<p>This is a paragraph of text.</p>
```

#### HTML
Use for complex markup, SVGs, or custom code:
```html
<svg viewBox="0 0 100 100">
  <circle cx="50" cy="50" r="40" />
</svg>
```

#### Empty
Use for self-closing elements:
```html
<img src="image.jpg" alt="Description" />
<hr />
```

### Dynamic Content with Timber

Use Twig control attributes for dynamic templating:

#### Set Variables
```html
<div setVariable="featured_image" setExpression="post.thumbnail.src"></div>
```

#### Conditional Rendering
```html
<div conditionalExpression="user.ID > 0">
  <p>Welcome back, {{ user.display_name }}!</p>
</div>
```

#### Loops
```html
<div loopSource="posts" loopVariable="item">
  <h2>{{ item.title }}</h2>
  <p>{{ item.excerpt }}</p>
</div>
```

**Learn more:**
- [docs/writing-dynamic-html.md](docs/writing-dynamic-html.md) - Complete dynamic content guide
- [docs/twig-helpers.md](docs/twig-helpers.md) - Using `fun` and `timber` helper objects

### Image Management

When tag is `<img>`, the Image Settings Panel appears:
- Visual media library picker
- Automatic alt text, width, and height
- Preview with replace/remove options

### Link Management

When tag is `<a>`, the Link Settings Panel appears:
- **Internal Links**: Select from posts/pages by post type
- **External Links**: Manual URL entry
- **Target Control**: Open in new tab with automatic `rel="noopener noreferrer"`
- **ARIA Labels**: Accessibility improvements

## HTML ↔ Block Conversion

### HTML to Blocks (Import)
1. Click **Import HTML** button in sidebar
2. Paste or write HTML in Ace Editor
3. Click **Import** - HTML is parsed into nested blocks

### Blocks to HTML (Export)
1. Select a block with nested content
2. Click **To HTML** button
3. Block tree converts to clean HTML string

Both conversions preserve:
- Exact DOM structure
- All attributes (including custom data-* and aria-*)
- Twig control attributes (loopSource, conditionalExpression, setVariable, etc.)

**Learn more:** [docs/lib-parsers.md](docs/lib-parsers.md)

## Dynamic Preview System

Test Timber/Twig templates with live data in the editor:

1. Click the **Database icon** in block toolbar to toggle dynamic preview
2. Preview uses `window.universal.preview` context with current page data
3. Renders with real Timber context (post, user, custom fields, WooCommerce)
4. Phase 1: UI toggle implemented (full preview functionality coming soon)

**Learn more:** [docs/dynamic-preview.md](docs/dynamic-preview.md)

## Architecture

### Tag-Based System
Blocks are defined by:
- **Tag Name**: HTML element (p, div, h1, img, loop, if, set)
- **Content Type**: How content is handled (text, blocks, html, empty)
- **Category**: Logical grouping (common, layout, text, media, dynamic, custom)

Configuration: [src/config/tags/](src/config/tags/)

### Dual Rendering

**Editor (React)**:
- Main component: [src/components/Edit.js](src/components/Edit.js)
- Tag selection toolbar
- Plain Classes Manager (always visible)
- Context-aware settings panels
- Dynamic preview mode

**Frontend (PHP)**:
- Server-side: [includes/blocks/render-element.php](includes/blocks/render-element.php)
- No wrapper elements
- Sanitization based on content type
- Dynamic tag processing via Timber

### Key Components

**UI Components**:
- [Edit.js](src/components/Edit.js) - Main editor with content type routing
- [TagControls.js](src/components/TagControls.js) - Tag selection UI
- [ClassesPanel.js](src/components/ClassesPanel.js) - CSS class management
- [AttributesPanel.js](src/components/AttributesPanel.js) - Global attributes editor
- [TwigControlsPanel.js](src/components/TwigControlsPanel.js) - Loop/if/set configuration
- [AceEditor.js](src/components/AceEditor.js) - HTML editor with Emmet support

**Utilities**:
- [lib/html2blocks.js](lib/html2blocks.js) - HTML → Blocks parser
- [lib/blocks2html.js](lib/blocks2html.js) - Blocks → HTML serializer
- [htmlToBlocks.js](src/utils/htmlToBlocks.js) - Parser integration
- [blocksToHtml.js](src/utils/blocksToHtml.js) - Serializer integration

**PHP Backend**:
- [includes/blocks/render-element.php](includes/blocks/render-element.php) - Block rendering
- [includes/parser/class-dynamic-tag-parser.php](includes/parser/class-dynamic-tag-parser.php) - Twig attribute processing
- [includes/blocks/class-block-processor.php](includes/blocks/class-block-processor.php) - Block tree processing
- [includes/twig/class-twig-helpers.php](includes/twig/class-twig-helpers.php) - Twig utility functions

## File Structure

```
universal-block/
├── src/                              # React source files
│   ├── components/                   # UI components
│   │   ├── Edit.js                  # Main editor component
│   │   ├── TagControls.js           # Tag selection UI
│   │   ├── ClassesPanel.js          # CSS class management
│   │   ├── AttributesPanel.js       # Attributes editor
│   │   ├── TwigControlsPanel.js     # Twig configuration
│   │   └── AceEditor.js             # HTML editor
│   ├── config/tags/                  # Tag configuration
│   │   ├── index.js                 # Tag definitions
│   │   └── categories.js            # Category groupings
│   ├── utils/                        # Utility functions
│   │   ├── htmlToBlocks.js          # HTML parser integration
│   │   └── blocksToHtml.js          # HTML serializer integration
│   └── index.js                      # Main entry point
├── includes/                         # PHP backend
│   ├── blocks/                       # Block rendering
│   │   ├── render-element.php       # Server-side render
│   │   └── class-block-processor.php # Block tree processing
│   ├── parser/                       # Twig attribute parser
│   │   └── class-dynamic-tag-parser.php
│   ├── twig/                         # Twig utilities
│   │   └── class-twig-helpers.php   # Helper functions
│   ├── editor/                       # Editor customizations
│   │   └── class-editor-tweaks.php  # Editor enhancements
│   └── admin/                        # Admin functionality
├── assets/                           # Static assets
│   ├── global/                       # Third-party libraries
│   │   ├── ace/                     # Ace Editor
│   │   ├── emmet/                   # Emmet abbreviations
│   │   └── beautify/                # HTML beautifier
│   └── react-components/             # Standalone React apps
│       └── editor-tweaks/           # Enhanced sidebar UI
│           ├── HtmlEditorPopup.js   # HTML editor modal
│           └── AceEditor.js         # Ace wrapper component
├── lib/                              # Standalone libraries
│   ├── html2blocks.js               # HTML to blocks parser
│   └── blocks2html.js               # Blocks to HTML serializer
├── package/                          # CLI tool for pattern generation
│   ├── src/                         # Parser implementations
│   │   ├── htmlToBlocks.js          # Node.js HTML parser
│   │   ├── blocksToHtml.js          # Node.js serializer
│   │   └── htmlToPattern.js         # Pattern file generator
│   ├── bin/cli.js                   # CLI entry point
│   ├── CONVERT.md                   # Conversion guide
│   └── CHANGELOG.md                 # Version history
├── docs/                             # Documentation
│   ├── lib-parsers.md               # Parser documentation
│   ├── writing-dynamic-html.md      # Dynamic content guide
│   └── dynamic-preview.md           # Preview system docs
├── _legacy/                          # Legacy code (archived)
├── build/                            # Build output (generated)
├── universal-block.php               # Main plugin file
├── block.json                        # Block metadata
├── package.json                      # Node.js dependencies
├── CLAUDE.md                         # AI development guide
└── README.md                         # This file
```

## Documentation

### Core Concepts
- [CLAUDE.md](CLAUDE.md) - Complete development guide and architecture overview
- [block.json](block.json) - Block registration and metadata

### Parsers & CLI
- [lib-parsers.md](docs/lib-parsers.md) - HTML ↔ Blocks conversion system
- [package/CONVERT.md](package/CONVERT.md) - CLI tool for HTML → PHP pattern conversion
- [package/CHANGELOG.md](package/CHANGELOG.md) - Version history and migration guide

### Dynamic Features
- [writing-dynamic-html.md](docs/writing-dynamic-html.md) - Timber/Twig integration guide
- [twig-helpers.md](docs/twig-helpers.md) - PHP functions and Timber methods in templates
- [dynamic-preview.md](docs/dynamic-preview.md) - Preview system with live data

## CLI Tool

Convert HTML files to WordPress PHP patterns:

```bash
# Install CLI globally
cd package
npm install
npm link

# Convert single file
universal-block convert hero.html --namespace=mytheme

# Convert directory
universal-block convert ./patterns -o ./theme/patterns --namespace=mytheme --category="featured"

# With full metadata
universal-block convert page.html \
  --namespace=mytheme \
  --category="pages,layouts" \
  --description="Custom page layout"
```

**Learn more:** [package/CONVERT.md](package/CONVERT.md)

## Timber Context & Twig Helpers

### Available Context Variables
- `post` - Current post object with meta, thumbnail, etc.
- `user` - Current user with ID, display_name, etc.
- `page_data` - Custom page data via filters
- `fun` - Call any PHP function (e.g., `fun.get_bloginfo('name')`)
- `timber` - Access Timber methods (e.g., `timber.get_posts()`)
- Test variables for preview mode

### Basic Usage

```html
<div loopSource="posts" loopVariable="post">
  <h2>{{ post.title }}</h2>
  <img src="{{ post.thumbnail.src }}" alt="{{ post.thumbnail.alt }}" />
  <p>By {{ post.author.display_name }}</p>
</div>
```

### Twig Helper Objects

Call WordPress functions and Timber methods directly in templates:

```twig
{# WordPress functions via fun object #}
<title>{{ fun.get_bloginfo('name') }}</title>
<span>${{ fun.number_format(product.price, 2) }}</span>

{# Timber methods via timber object #}
{% set related = timber.get_posts('category=' ~ post.category.slug) %}
```

See [docs/twig-helpers.md](docs/twig-helpers.md) for complete guide.

## Attribute Storage

- **globalAttrs**: All HTML attributes EXCEPT class (id, style, data-*, aria-*, href, src, etc.)
- **className**: WordPress-managed classes (CSS class string)
- **content**: Text/HTML content (not used for blocks contentType)
- **tagName**: Current HTML element
- **contentType**: Content handling mode (blocks, text, html, empty)
- **loopSource**: Twig loop expression (e.g., "posts", "items")
- **loopVariable**: Loop item variable name (default: "item")
- **conditionalExpression**: Twig conditional (e.g., "user.ID > 0")
- **setVariable**: Variable name for set tags
- **setExpression**: Variable value expression
- **dynamicPreview**: Flag for dynamic preview mode (Phase 1)

## Security & Sanitization

All output is sanitized on the server:
- `wp_kses_post()` for HTML content (with SVG support)
- `esc_attr()` for attributes
- `esc_url()` for href and src
- No user input rendered without sanitization

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- WordPress 6.0+ with Gutenberg block editor
- No IE11 support

## Contributing

Contributions welcome! The codebase is designed to be modular:

- React components are isolated in `src/components/`
- PHP classes follow WordPress coding standards
- Clear separation between editor and frontend
- Comprehensive inline documentation

### Code Standards
- React functional components with hooks
- WordPress coding standards for PHP
- ESLint configuration via @wordpress/scripts
- Server-side sanitization for all output

## Known Limitations

- Custom element tags (with hyphens) require browser support
- Dynamic features require Timber 2+ (Composer library)
- Preview context detection works in WordPress admin only
- Block IDs are regenerated on each page load (not persistent)

## Roadmap

### Editor Experience

- [ ] **Command Palette Integration** - Replace sidebar controls with keyboard-first command palette while keeping Gutenberg UI completely unmodified
- [ ] **Markdown/Rich Text Editor** - TipTap-based editor for single posts with automatic markdown-to-blocks conversion for enhanced editing experience
- [ ] **Enhanced Preview System** - Complete dynamic preview functionality with live data

### Architecture & Extensibility

- [ ] **Extensions System** - Plugin architecture for third-party extensions and custom functionality
- [ ] **Broke FSE Integration** - Full Site Editing support via [Broke FSE](https://github.com/DanielRSnell/broke-fse)
- [ ] **Component Library** - Reusable block patterns and components

### UI & Controls

- [ ] Block variation picker for common patterns
- [ ] CSS Grid/Flexbox visual controls
- [ ] Animation/transition helpers
- [ ] Design system preset management
- [ ] Multi-block selection and bulk operations

## License

GPL-2.0-or-later

## Credits

Built with:
- [WordPress Block Editor](https://developer.wordpress.org/block-editor/)
- [Timber](https://timber.github.io/docs/) (optional, for dynamic features)
- [Ace Editor](https://ace.c9.io/) (HTML editing)
- [Emmet](https://emmet.io/) (HTML abbreviations)
- [Framer Motion](https://www.framer.com/motion/) (UI animations)

---

**Need help?** Check [CLAUDE.md](CLAUDE.md) for complete development documentation or open an issue on GitHub.
