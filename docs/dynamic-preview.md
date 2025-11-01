# Dynamic Preview System

## Overview

The Dynamic Preview system allows you to enable live Twig/Timber data preview for any block and its children directly in the Gutenberg editor. When enabled, the block will render with real data from your configured preview context instead of static placeholder content.

## How It Works

### User Flow

1. User creates/imports blocks with Twig controls (Set, Loop, If)
2. Blocks render normally in editor (static, no dynamic data)
3. User selects any block (parent/container or individual element)
4. User clicks the **Database icon** 🗄️ in the block toolbar
5. Icon toggles on (pressed state indicates preview is active)
6. System will process that block + all children with live Timber data
7. User can toggle OFF to return to editing mode

### Key Features

✅ **Toggle on any block** - Works on containers or individual elements
✅ **All Twig features work** - Set variables, Loops, Conditionals process together
✅ **Context-aware** - Uses `window.universal.preview` for page context
✅ **Visual indicator** - Database icon shows pressed state when active
✅ **Non-functional (Phase 1)** - Currently just toggles state, rendering coming soon

## Current Implementation (Phase 1)

### Block Attribute

Added to `block.json`:
```json
"dynamicPreview": {
  "type": "boolean",
  "default": false
}
```

### Toolbar Icon

Database icon appears in the block toolbar (after tag name selector):
- **Icon**: Database/cylinder icon (🗄️)
- **Label**: "Toggle Dynamic Preview"
- **State**: Toggles `dynamicPreview` attribute on/off
- **Visual**: Shows pressed state when enabled

### Location

The icon appears in `BlockControls` → `ToolbarGroup`, making it easily accessible for any selected block.

## Preview Context System

The dynamic preview system integrates with `window.universal.preview` which provides page context information for live data rendering.

### `window.universal.preview` Structure

```javascript
{
  // Auto-detected context information
  type: 'singular',           // Context type: singular, archive, front_page, etc.
  post_type: 'page',          // Post type being edited (if applicable)
  post_id: 42058,             // Post ID being edited (if applicable)
  template: '',               // Page template slug (if applicable)
  post_status: 'publish',     // Post status
  is_edit: true,              // Whether we're in edit mode

  // Post metadata (when available)
  meta: {
    title: 'Page Title',
    slug: 'page-slug',
    author_id: 1,
    parent_id: 0,
    menu_order: 0,
    date_created: '2024-01-01 00:00:00',
    date_modified: '2024-01-15 10:30:00'
  },

  // User-configured settings
  settings: {
    enabled: false,           // Whether preview is globally enabled
    auto_detect: true,        // Use auto-detected context vs manual
    source_type: 'post_type', // 'post_type' or 'taxonomy'

    // Post Type settings
    context_type: 'singular', // singular, archive, front_page, etc.
    post_type: 'page',        // page, post, product, etc.
    post_id: 0,               // Specific post ID (for singular)

    // Taxonomy settings
    taxonomy: '',             // category, post_tag, product_cat, etc.
    term_id: 0,               // Specific term ID

    // WooCommerce settings
    woo_page: ''              // shop, cart, checkout, my_account, thank_you
  }
}
```

### Context Detection

**Auto-Detection Priority:**
1. URL Parameter - `$_GET['post']`
2. Global Post - `$post` object
3. Screen Detection - `get_current_screen()`

**Example Auto-Detected Contexts:**

Editing a Page:
```javascript
{
  type: 'singular',
  post_type: 'page',
  post_id: 42058,
  is_edit: true,
  meta: { title: 'About Us', ... }
}
```

Full Site Editor (No Context):
```javascript
{
  type: 'unknown',
  is_edit: false
}
```

### Manual Configuration

Users can configure custom preview contexts via the Preview Settings drawer (eye icon in sidebar):

**Product Page Context:**
```javascript
settings: {
  enabled: true,
  auto_detect: false,
  source_type: 'post_type',
  context_type: 'singular',
  post_type: 'product',
  post_id: 456
}
```

**Category Archive Context:**
```javascript
settings: {
  enabled: true,
  auto_detect: false,
  source_type: 'taxonomy',
  taxonomy: 'category',
  term_id: 5
}
```

## REST API Integration

The system uses the existing preview API endpoints:

### `/wp-json/universal-block/v1/preview`

Processes an entire page of blocks together:

**Request:**
```json
{
  "allBlocks": [...],           // All blocks from editor
  "targetBlockId": "abc-123",   // Block to preview
  "pageContext": {              // window.universal.preview data
    "postId": 42058,
    "postType": "page",
    "postMeta": {...},
    "pageData": {...}
  }
}
```

**Response:**
```json
{
  "success": true,
  "html": "<div>...</div>",     // Compiled HTML for target block
  "context_used": {...},        // Summary of context
  "processing_time": "12.5ms",
  "blocks_processed": 5
}
```

### `/wp-json/universal-block/v1/dynamic-preview`

Processes a single block + children:

**Request:**
```json
{
  "blockContent": "<!-- wp:universal/element {...} -->...",
  "blockId": "abc-123",
  "context": {                  // Simplified context
    "postId": 42058,
    "postType": "page",
    "currentUser": {...},
    "dynamic_block": true
  }
}
```

**Response:**
```json
{
  "success": true,
  "content": "<div>...</div>",  // Compiled HTML
  "processing_time": "8.2ms",
  "debug_info": {
    "has_twig_vars": true,
    "timber_context_keys": ["post", "user", "test_array"]
  }
}
```

## Processing Pipeline

When a block has `dynamicPreview: true`, the system will:

1. **Serialize block + children** to HTML (using block serializer)
2. **Send to preview API** with `window.universal.preview` context
3. **Server processes** through Twig compilation:
   - Renders blocks to HTML
   - Processes Twig attributes (loopSource, conditionalExpression, setVariable)
   - Compiles with Timber context
4. **Returns compiled HTML** with real data
5. **Replaces editor view** with preview HTML

## Available Timber Context

When preview is enabled, Twig templates have access to:

```twig
{# Current post data #}
{{ post.title }}
{{ post.content }}
{{ post.meta('custom_field') }}

{# User data #}
{{ user.display_name }}
{{ user.ID }}

{# Test data (for preview mode) #}
{{ test_array }}        {# Array of test items #}
{{ user_count }}        {# Sample count: 42 #}
{{ is_featured }}       {# Boolean: true #}
{{ today }}             {# Current date #}

{# Custom page data from preview settings #}
{{ page_data.custom_field }}

{# Timber functions #}
timber.get_posts({post_type: 'post'})
fun.get_field('acf_field', post.ID)
```

## Example Use Cases

### Blog Posts Grid with Preview

```html
<div setVariable="recent_posts" setExpression="timber.get_posts({post_type: 'post', posts_per_page: 6})">
  <div class="grid" conditionalExpression="recent_posts">
    <article loopSource="recent_posts" loopVariable="post">
      <h2>{{ post.title }}</h2>
      <img src="{{ post.thumbnail.src }}" conditionalExpression="post.thumbnail" />
      <p>{{ post.preview }}</p>
    </article>
  </div>
</div>
```

**With Preview Enabled:**
- Select the parent `<div>` (outer container)
- Click database icon in toolbar
- Preview shows real posts with actual titles, images, and content
- Turn off to resume editing

### Product Category Loop

```html
<div loopSource="products" loopVariable="product">
  <div class="product-card">
    <h3>{{ product.title }}</h3>
    <p class="price">${{ product.meta('price') }}</p>
    <img src="{{ product.thumbnail.src }}" />
  </div>
</div>
```

**With Custom Context:**
1. Open Preview Settings (eye icon)
2. Configure: Taxonomy → `product_cat` → Term ID: 15
3. Enable preview globally
4. Select the loop block
5. Click database icon for live product data

## Benefits

✅ **WYSIWYG for dynamic content** - See real data while editing
✅ **Test different contexts** - Switch contexts to test various scenarios
✅ **Scoped preview** - Enable only on blocks you want to preview
✅ **Parent-level activation** - Preview entire sections at once
✅ **No extra configuration** - Uses existing Twig controls
✅ **Flexible** - Works with Set, Loop, and Conditional controls

## Future Implementation (Phase 2+)

### Planned Features

1. **Actual rendering** - Replace block content with preview HTML
2. **Auto-refresh** - Update preview when child blocks change
3. **Loading states** - Show spinner while fetching preview
4. **Error handling** - Display Twig compilation errors inline
5. **Cache previews** - Avoid excessive API calls
6. **Edit mode toggle** - Switch between preview and edit modes
7. **Nested preview** - Handle parent/child preview relationships

### Display Options Under Consideration

**Option A: Replace Block Content**
- Swap editor view with compiled HTML
- Can't edit while previewing
- Simple implementation

**Option B: Modal/Popup**
- Show preview in popup window
- Can edit and preview simultaneously
- More complex UI

**Option C: Side-by-Side Split View**
- Left: Editable blocks
- Right: Dynamic preview
- Best UX but most complex

**Option D: Iframe Overlay**
- Preview renders in iframe on top
- Can toggle visibility
- Good isolation

## Technical Considerations

### Serialization
- Uses block serializer (blocks → HTML)
- Includes all child blocks recursively
- Preserves Twig syntax in serialized output

### Refresh Strategy
- **Manual** (Phase 1): User clicks icon to toggle
- **Debounced auto-refresh** (Future): Updates after editing pause
- **Manual refresh button** (Future): Explicit refresh control

### Performance
- Large sections may be slow to process
- Consider timeout/loading states
- May limit preview to reasonable block counts

### State Management
- `dynamicPreview` stored in block attributes
- Persists with block data
- Toggles independently per block

## Related Documentation

- [Preview Context System](preview-context.md) - Detailed guide to `window.universal.preview`
- [Writing Dynamic HTML](writing-dynamic-html.md) - Guide to using Twig controls
- [Timber Documentation](https://timber.github.io/docs/) - Twig/Timber reference

## Debugging

### Check if Preview is Enabled

```javascript
// In browser console
const block = wp.data.select('core/block-editor').getSelectedBlock();
console.log('Dynamic Preview:', block?.attributes?.dynamicPreview);
```

### Check Preview Context

```javascript
// View current page context
console.log(window.universal.preview);

// Check if global preview is enabled
if (window.universal?.preview?.settings?.enabled) {
  console.log('Global preview enabled');
}
```

### API Testing

```javascript
// Test preview endpoint directly
wp.apiFetch({
  path: '/wp-json/universal-block/v1/dynamic-preview',
  method: 'POST',
  data: {
    blockContent: '<!-- wp:universal/element {...} -->...',
    blockId: 'test-123',
    context: window.universal.preview
  }
}).then(response => console.log(response));
```

## Notes

- Preview uses the same processing as frontend (`the_content` filter)
- Ensures preview matches frontend exactly
- No need to duplicate Twig compilation logic
- Preview is completely optional - doesn't affect normal editing workflow
- Database icon is visible on all blocks when selected
