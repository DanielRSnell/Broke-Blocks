# Dynamic Block Preview System

## Overview

The Dynamic Block Preview system allows Universal Blocks to display live Timber/Twig data in the Gutenberg editor. When preview mode is enabled, blocks fetch compiled HTML from the server using the current preview context (post, user, custom data) and display the rendered result in real-time.

**IMPORTANT:** Twig compilation **only occurs in the editor preview** via REST API. The frontend outputs raw Twig syntax (uncompiled) for external systems to process.

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                    EDITOR INITIALIZATION                     │
└─────────────────────────────────────────────────────────────┘
                              ↓
                    PHP Enqueue Assets
                    (broke-blocks.php)
                              ↓
              ┌───────────────┴───────────────┐
              ↓                               ↓
    ┌──────────────────┐           ┌──────────────────┐
    │ window.universal │           │  ubPreviewData   │
    │    .preview      │           │  (API config)    │
    └──────────────────┘           └──────────────────┘
              ↓                               ↓
    Auto-detected context          API URL + nonce
    - post_id: 42058
    - post_type: 'page'
    - type: 'singular'
    - meta: {...}

┌─────────────────────────────────────────────────────────────┐
│                    USER INTERACTION                          │
└─────────────────────────────────────────────────────────────┘
                              ↓
                    User clicks 🗄️ icon
                              ↓
                    dynamicPreview = true
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    PREVIEW RENDERING                         │
└─────────────────────────────────────────────────────────────┘
                              ↓
              1. Serialize block + children
                 wp.blocks.serialize(block)
                              ↓
              2. Extract preview context
                 window.universal.preview
                              ↓
              3. POST to /dynamic-preview
                 {
                   blockContent: "<!-- wp:... -->",
                   blockId: "abc-123",
                   context: {...}
                 }
                              ↓
              4. Backend processes:
                 - Render blocks → HTML (with Twig wrappers)
                 - Get Timber::context()
                 - Update context from preview settings
                 - Compile: Timber::compile_string($html, $context)
                              ↓
              5. Return compiled HTML
                 {
                   success: true,
                   content: "<div>...</div>",
                   debug_info: {...}
                 }
                              ↓
              6. Display in editor
                 dangerouslySetInnerHTML

┌─────────────────────────────────────────────────────────────┐
│                    SETTINGS MANAGEMENT                       │
└─────────────────────────────────────────────────────────────┘
    User opens PreviewSettingsDrawer (👁️ icon)
                              ↓
    Configure context:
    - Source: Post Type / Taxonomy
    - Post ID / Term ID
    - WooCommerce pages
                              ↓
    POST to /preview-settings
                              ↓
    Saved to user meta
                              ↓
    Updates window.universal.preview.settings
```

## Window Object Structure

### `window.universal.preview`

Auto-detected from current editing context (PHP enqueued):

```javascript
{
  type: 'singular',              // Context type (singular, archive, front_page)
  post_type: 'page',             // Post type being edited
  post_id: 42058,                // Current post ID
  template: '',                  // Template slug (if applicable)
  post_status: 'publish',        // Post status
  is_edit: true,                 // In edit mode

  // Post metadata
  meta: {
    title: 'About Us',
    slug: 'about-us',
    author: {
      id: 1,
      name: 'Admin',
      email: 'admin@example.com'
    },
    dates: {
      created: '2024-01-15 10:30:00',
      modified: '2024-01-20 14:45:00'
    }
  },

  // User preview settings (from settings drawer)
  settings: {
    enabled: false,
    auto_detect: true,
    source_type: 'post_type',    // 'post_type' or 'taxonomy'
    context_type: 'singular',
    post_type: 'page',
    post_id: 0,
    taxonomy: '',
    term_id: 0,
    woo_page: ''
  }
}
```

### `ubPreviewData`

Legacy data object for API configuration:

```javascript
{
  apiUrl: 'https://site.test/wp-json/universal-block/v1/',
  nonce: 'abc123xyz...',
  pageData: {},                  // Custom page data (filter)
  debugMode: true                // WP_DEBUG status
}
```

## API Endpoints

### 1. Dynamic Block Preview (Primary)

**Endpoint:** `POST /wp-json/universal-block/v1/dynamic-preview`

**File:** `includes/api/class-preview-api.php:49-70`

**Request:**
```json
{
  "blockContent": "<!-- wp:universal/element {\"tagName\":\"div\"} -->...",
  "blockId": "abc-123",
  "context": {
    "postId": 42058,
    "postType": "page",
    "currentUser": {
      "ID": 1,
      "display_name": "Admin"
    },
    "dynamic_block": true
  }
}
```

**Response:**
```json
{
  "success": true,
  "content": "<div id=\"block-abc123\">Hello Admin, viewing About Us</div>",
  "blockId": "abc-123",
  "context_used": {
    "post": {...},
    "user": {...},
    "test_array": [...]
  },
  "processing_time": "8.2ms",
  "original_length": 234,
  "processed_length": 456,
  "raw_html": "<div>...</div>",
  "debug_info": {
    "has_twig_controls": true,
    "has_twig_vars": true,
    "timber_context_keys": ["post", "user", "site"],
    "preview_post_id": 42058,
    "preview_context_type": "singular"
  }
}
```

**Preview API Processing Flow (Editor Only):**
1. Parse WordPress block markup with `do_blocks()`
2. Render block to HTML using `render-element.php` (includes Twig control wrappers from attributes)
3. Get base Timber context: `$context = Timber::context()`
4. Update context with preview settings:
   - Set correct `$context['post']` based on preview post ID
   - Set correct `$context['user']` from current user
   - Add custom data via filters
5. Compile Twig: `Timber::compile_string($html, $context)` **(Preview API only)**
6. Return compiled HTML with debug info

**Frontend Rendering (Public Pages):**
1. Parse WordPress block markup with `do_blocks()`
2. Render block to HTML using `render-element.php` (includes Twig control wrappers from attributes)
3. Output raw Twig syntax (e.g., `{{ post.title }}`, `{% for item in items %}`)
4. **NO compilation occurs** - Twig syntax output as-is for external processing

### 2. Preview Settings

**Endpoint:** `GET/POST /wp-json/universal-block/v1/preview-settings`

**File:** `includes/api/class-preview-settings-api.php`

**GET Response:**
```json
{
  "enabled": false,
  "auto_detect": true,
  "source_type": "post_type",
  "context_type": "singular",
  "post_type": "page",
  "post_id": 0,
  "taxonomy": "",
  "term_id": 0,
  "woo_page": ""
}
```

**POST:** Same structure, saves to user meta key `universal_block_preview_settings`

## Timber/Twig Context

### How Context is Assembled

The preview system builds Timber context using preview settings to populate real data:

```php
// 1. Get base Timber context
$context = Timber::context();

// 2. Update post based on preview settings
if (!empty($preview_post_id)) {
    $context['post'] = Timber::get_post($preview_post_id);
}

// 3. Current user is already in context from Timber
// $context['user'] is populated automatically

// 4. Add custom data via filters
$context = apply_filters('universal_block/page_data', $context);

// 5. Compile the block HTML with context
$compiled_html = Timber::compile_string($block_html, $context);
```

This means:
- **Preview Settings** → Controls which post/term loads into context
- **`Timber::context()`** → Provides base WordPress data (site, theme, user)
- **Preview Context** → Updates `$context['post']` with correct post from settings
- **`Timber::compile_string()`** → Processes all `{{ }}` Twig variables with real data

### Available Context Variables

```twig
{# Post object (from preview context) #}
{{ post.title }}
{{ post.content }}
{{ post.meta('custom_field') }}
{{ post.thumbnail.src }}
{{ post.author.name }}
{{ post.date }}
{{ post.categories }}

{# Current user #}
{{ user.display_name }}
{{ user.ID }}
{{ user.email }}
{{ user.roles }}

{# Test data (for preview/development) #}
{{ test_array }}              {# Array of test items #}
{{ user_count }}              {# 42 #}
{{ is_featured }}             {# true #}
{{ today }}                   {# Current date #}

{# Custom data (via filters) #}
{{ page_data.custom_key }}    {# Filter: universal_block/page_data #}
{{ user_data.custom_key }}    {# Filter: universal_block/user_data #}
```

### Twig Control Attributes

Twig controls are managed via block attributes in the Twig Controls Panel, not via custom tags:

**Loop Control:**
- Block attributes: `loopSource` (e.g., "posts") and `loopVariable` (e.g., "post")
- Renders as: `{% for post in posts %}...{% endfor %}`

**Conditional Visibility:**
- Block attribute: `conditionalExpression` (e.g., "user.ID > 0")
- Renders as: `{% if user.ID > 0 %}...{% endif %}`

**Set Variable:**
- Block attributes: `setVariable` (e.g., "myVar") and `setExpression` (e.g., "post.title")
- Renders as: `{% set myVar = post.title %}`

These controls wrap around the block's HTML output during rendering. On the frontend, the Twig control syntax is output as-is (uncompiled). In editor preview mode, the Twig is compiled with real data.

## Implementation Details

### React Components

#### 1. Edit Component (src/components/Edit.js)

**State Management:**
```javascript
const [previewHtml, setPreviewHtml] = useState('');
const [isLoadingPreview, setIsLoadingPreview] = useState(false);
const [previewError, setPreviewError] = useState(null);
```

**Preview Effect:**
```javascript
useEffect(() => {
  if (dynamicPreview) {
    fetchPreview();
  } else {
    setPreviewHtml('');
    setPreviewError(null);
  }
}, [dynamicPreview, attributes]);
```

**API Integration:**
```javascript
const fetchPreview = async () => {
  setIsLoadingPreview(true);
  setPreviewError(null);

  try {
    const blockData = wp.data.select('core/block-editor').getBlock(clientId);
    const blockMarkup = wp.blocks.serialize(blockData);
    const context = extractPreviewContext();

    const response = await apiFetch({
      path: '/universal-block/v1/dynamic-preview',
      method: 'POST',
      data: {
        blockContent: blockMarkup,
        blockId: clientId,
        context: context
      }
    });

    setPreviewHtml(response.content);
  } catch (error) {
    setPreviewError(error.message);
  } finally {
    setIsLoadingPreview(false);
  }
};
```

**Render Logic:**
```javascript
{dynamicPreview ? (
  <BlockPreview
    html={previewHtml}
    isLoading={isLoadingPreview}
    error={previewError}
    onRetry={fetchPreview}
  />
) : (
  // Normal editable content
  <TagElement {...props}>
    {children}
  </TagElement>
)}
```

#### 2. BlockPreview Component (src/components/BlockPreview.js)

**Props:**
```javascript
{
  html: string,           // Compiled HTML from server
  isLoading: boolean,     // Loading state
  error: string | null,   // Error message
  onRetry: function       // Retry callback
}
```

**Features:**
- Loading skeleton during fetch
- Error state with retry button
- Preview mode indicator badge
- Sanitized HTML rendering with `dangerouslySetInnerHTML`
- Styled container matching block appearance

### Utilities (src/utils/preview.js)

**1. Extract Preview Context:**
```javascript
export function extractPreviewContext() {
  const preview = window.universal?.preview || {};
  const ubData = window.ubPreviewData || {};

  return {
    postId: preview.post_id || 0,
    postType: preview.post_type || 'page',
    currentUser: preview.meta?.author || {},
    type: preview.type || 'singular',
    settings: preview.settings || {},
    dynamic_block: true
  };
}
```

**2. Fetch Dynamic Preview:**
```javascript
export async function fetchDynamicPreview(blockMarkup, blockId, context) {
  const response = await apiFetch({
    path: '/universal-block/v1/dynamic-preview',
    method: 'POST',
    data: {
      blockContent: blockMarkup,
      blockId: blockId,
      context: context
    }
  });

  if (!response.success) {
    throw new Error(response.message || 'Preview failed');
  }

  return response;
}
```

**3. Serialize Block for Preview:**
```javascript
export function serializeBlockForPreview(clientId) {
  const blockData = wp.data.select('core/block-editor').getBlock(clientId);

  if (!blockData) {
    throw new Error('Block not found');
  }

  return wp.blocks.serialize(blockData);
}
```

## Performance Considerations

### Optimization Strategies

1. **Debounced Refresh:**
   - Don't fetch on every attribute change
   - Use debounce (500ms) for auto-refresh
   - Only refresh when preview is visible

2. **Cache Strategy:**
   - Cache preview results by block content hash
   - Invalidate on attribute changes
   - Max cache size: 50 entries
   - TTL: 5 minutes

3. **Request Cancellation:**
   - Cancel in-flight requests when toggling off
   - Use AbortController for fetch cancellation
   - Prevent race conditions

4. **Lazy Loading:**
   - Only fetch preview when block is in viewport
   - Use Intersection Observer API
   - Reduce API calls for off-screen blocks

### Example Debounce Implementation:

```javascript
import { debounce } from '@wordpress/compose';

const debouncedFetchPreview = useMemo(
  () => debounce(fetchPreview, 500),
  []
);

useEffect(() => {
  if (dynamicPreview) {
    debouncedFetchPreview();
  }

  return () => {
    debouncedFetchPreview.cancel();
  };
}, [dynamicPreview, attributes]);
```

## Error Handling

### Common Error Scenarios

1. **Twig Syntax Errors:**
   ```
   Error: Twig syntax error on line 5: unexpected token "}"
   ```
   - Display error message in preview
   - Highlight line number if available
   - Suggest syntax fixes

2. **Missing Context Data:**
   ```
   Error: Variable "user.custom_field" does not exist
   ```
   - Show available context keys
   - Suggest using {% if %} checks
   - Link to Timber documentation

3. **Network Failures:**
   ```
   Error: Failed to fetch preview (Network error)
   ```
   - Show retry button
   - Display offline indicator
   - Cache last successful preview

4. **Timeout Errors:**
   ```
   Error: Preview request timed out
   ```
   - Increase timeout for complex blocks
   - Show progress indicator
   - Allow manual retry

### Error Display Component:

```javascript
function PreviewError({ error, onRetry }) {
  return (
    <div className="universal-block-preview-error">
      <Icon icon="warning" />
      <p>{error}</p>
      <Button onClick={onRetry}>Retry Preview</Button>
    </div>
  );
}
```

## Testing Checklist

### Functional Tests

- [ ] Toggle preview on/off works correctly
- [ ] Preview fetches and displays HTML
- [ ] Loading spinner shows during fetch
- [ ] Error messages display for failures
- [ ] Retry button works after errors
- [ ] Preview updates when attributes change
- [ ] Preview respects settings drawer configuration
- [ ] Nested blocks preview correctly
- [ ] Dynamic tags render with real data
- [ ] Twig syntax compiles properly

### Performance Tests

- [ ] Large block trees (50+ blocks) don't freeze UI
- [ ] Rapid toggling doesn't cause race conditions
- [ ] Multiple preview blocks don't overwhelm server
- [ ] Cache reduces redundant API calls
- [ ] Debounce prevents excessive requests
- [ ] Memory doesn't leak with repeated toggles

### Edge Cases

- [ ] No preview context available (fallback)
- [ ] Network offline (error handling)
- [ ] Server returns 500 error
- [ ] Invalid Twig syntax in content
- [ ] Missing Timber library
- [ ] Very large HTML output (10MB+)
- [ ] Special characters in content (escaped properly)
- [ ] Parent and child both have preview enabled

### Browser Compatibility

- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

## Future Enhancements

### Phase 2 Features

1. **Visual Preview Editor:**
   - Click-to-edit preview elements
   - Inline editing with live Twig updates
   - Visual Twig expression builder

2. **Preview Templates:**
   - Save/load preview configurations
   - Share preview contexts between users
   - Import/export preview settings

3. **Advanced Context:**
   - Query builder for custom loops
   - Multiple post/term selection
   - Custom data injection UI

4. **Performance Dashboard:**
   - Track preview render times
   - Identify slow Twig expressions
   - Optimize database queries

5. **Collaborative Preview:**
   - Share preview links
   - Real-time preview updates
   - Comment on preview output

## API Extensions

### Custom Context Filters

**Add custom data to preview context:**

```php
// In theme functions.php or plugin
add_filter('universal_block/page_data', function($data) {
    $data['products'] = Timber::get_posts([
        'post_type' => 'product',
        'posts_per_page' => 10
    ]);
    return $data;
});
```

**Add block-specific context:**

```php
add_filter('universal_block/context/product_gallery', function($context) {
    $context['featured_products'] = get_featured_products();
    return $context;
});
```

### Custom Twig Functions

**Add custom Twig functions to Timber:**

```php
// In theme functions.php
add_filter('timber/twig', function($twig) {
    // Add custom function
    $twig->addFunction(new \Twig\TwigFunction('get_featured_products', function() {
        return Timber::get_posts([
            'post_type' => 'product',
            'meta_key' => 'featured',
            'meta_value' => '1'
        ]);
    }));

    return $twig;
});
```

Then use in blocks: `{% for product in get_featured_products() %}...{% endfor %}`

## Troubleshooting

### Preview Not Loading

**Symptoms:** Toggle button works, but preview never appears

**Solutions:**
1. Check browser console for JavaScript errors
2. Verify REST API is accessible: `https://site.test/wp-json/universal-block/v1/`
3. Check nonce is valid: `console.log(ubPreviewData.nonce)`
4. Verify Timber library is installed
5. Check PHP error logs for server-side issues

### Preview Shows Old Content

**Symptoms:** Preview doesn't update when attributes change

**Solutions:**
1. Clear preview cache: Toggle off/on
2. Check debounce delay (may be too long)
3. Verify `useEffect` dependencies include `attributes`
4. Check network tab for API calls being made

### Twig Errors in Preview

**Symptoms:** Error messages about Twig syntax

**Solutions:**
1. Validate Twig syntax: Use online validator
2. Check variable names match context keys
3. Add null checks: `{% if post %}{{ post.title }}{% endif %}`
4. Escape special characters in expressions

### Performance Issues

**Symptoms:** Editor becomes slow with preview enabled

**Solutions:**
1. Reduce auto-refresh frequency (increase debounce)
2. Disable preview for nested blocks
3. Limit number of simultaneous preview blocks
4. Optimize Twig expressions (avoid complex loops)
5. Enable server-side caching

## Resources

### Documentation Links

- [Timber Documentation](https://timber.github.io/docs/)
- [Twig Syntax Reference](https://twig.symfony.com/doc/)
- [WordPress Block Editor Handbook](https://developer.wordpress.org/block-editor/)
- [REST API Handbook](https://developer.wordpress.org/rest-api/)

### Code References

- Preview API: `includes/api/class-preview-api.php`
- Block Renderer: `includes/blocks/render-element.php` (adds Twig control wrappers)
- Context Detection: `includes/editor/class-preview-context.php`
- Settings API: `includes/api/class-preview-settings-api.php`
- Twig Controls Panel: `src/components/TwigControlsPanel.js`

### Support

- GitHub Issues: [plugin repository]
- Documentation: `docs/` directory
- Code Examples: `docs/examples/` directory

---

**Last Updated:** 2025-01-04
**Version:** 1.0.0
**Status:** Planning Complete, Implementation In Progress
