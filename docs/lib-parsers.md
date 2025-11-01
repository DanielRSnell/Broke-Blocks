# Lib Parsers Documentation

## Overview

The `/lib` directory contains two essential JavaScript parser files that enable bidirectional conversion between HTML and Gutenberg block structures. These parsers work together to provide seamless HTML import/export functionality.

## Files

- **`html2blocks.js`** - Converts HTML markup to Universal Block structures
- **`blocks2html.js`** - Converts Universal Block structures back to HTML

Both files are exposed globally via `window.universal` and support Node.js module exports.

---

## html2blocks.js

Converts HTML strings into Universal Block (Gutenberg) block objects.

### Global API

```javascript
// Available globally in the editor
window.universal.html2blocks(html)
window.universal.generateBlockMarkup(blocks)
window.universal.insertBlocks(blocks)
```

### Main Functions

#### `html2blocks(html)`

Converts HTML string to an array of block objects.

**Parameters:**
- `html` (string) - HTML markup to parse

**Returns:**
- Array of block objects

**Example:**
```javascript
const html = `
<div class="container">
  <h1>Hello World</h1>
  <p>This is a paragraph</p>
</div>
`;

const blocks = window.universal.html2blocks(html);
// Returns array of block objects
```

**Process:**
1. Uses `DOMParser` (not `innerHTML`) to preserve custom elements like `<set>`, `<loop>`, `<if>`
2. Recursively parses DOM tree structure
3. Determines content type for each element
4. Extracts attributes (including Twig control attributes)
5. Creates block objects with proper structure

---

#### `generateBlockMarkup(blocks)`

Converts block objects to WordPress block markup format.

**Parameters:**
- `blocks` (Array) - Array of block objects

**Returns:**
- String of WordPress block markup

**Example:**
```javascript
const blocks = [
  {
    name: 'universal/element',
    attributes: { tagName: 'div', contentType: 'blocks' },
    innerBlocks: [...]
  }
];

const markup = window.universal.generateBlockMarkup(blocks);
// Returns: <!-- wp:universal/element {...} -->...<!-- /wp:universal/element -->
```

**Output Format:**
```
<!-- wp:universal/element {"tagName":"div","contentType":"blocks"} -->
  <!-- wp:universal/element {"tagName":"h1","contentType":"text","content":"Hello"} /-->
<!-- /wp:universal/element -->
```

---

#### `insertBlocks(blocks)`

Inserts block objects directly into the WordPress editor at the current cursor position.

**Parameters:**
- `blocks` (Array) - Array of block objects to insert

**Returns:**
- `void`

**Example:**
```javascript
const blocks = window.universal.html2blocks('<div class="card">...</div>');
window.universal.insertBlocks(blocks);
// Blocks are inserted into editor after current selection
```

**Behavior:**
- Inserts after currently selected block
- If no selection, inserts at end of document
- Preserves parent/child (root client ID) context
- Uses WordPress `wp.data` API internally

---

### Helper Functions

#### `parseNode(node)`

Recursively parses a DOM node to a block object.

**Parameters:**
- `node` (Node) - DOM node to parse

**Returns:**
- Block object or `null`

**Handles:**
- Comment nodes (skipped)
- Text nodes (wrapped in `<p>` blocks)
- Element nodes (converted to blocks)

---

#### `determineContentType(element, tagName)`

Analyzes an element's children to determine the appropriate content type.

**Parameters:**
- `element` (Element) - DOM element
- `tagName` (string) - Tag name

**Returns:**
- String: `'blocks'`, `'text'`, `'html'`, or `'empty'`

**Logic:**
```javascript
// SVG elements always use HTML
if (tagName === 'svg') return 'html';

// No children
if (!element.hasChildNodes()) return 'empty';

// Mixed content (text + elements)
if (hasElementChildren && hasTextChildren) return 'html';

// Only element children
if (hasElementChildren && !hasTextChildren) return 'blocks';

// Only text children
if (!hasElementChildren && hasTextChildren) return 'text';

// Default
return 'empty';
```

**Content Type Meanings:**
- **`blocks`** - Contains child Universal Blocks (uses InnerBlocks)
- **`text`** - Contains plain text content (uses RichText)
- **`html`** - Contains mixed HTML content (uses Ace Editor)
- **`empty`** - Self-closing/void element (no content)

---

#### `getAttributes(element)`

Extracts all attributes from an element, separating classes, styles, and Twig controls.

**Parameters:**
- `element` (Element) - DOM element

**Returns:**
```javascript
{
  className: 'card featured',           // WordPress className
  globalAttrs: {                        // All other HTML attributes
    id: 'my-card',
    'data-custom': 'value',
    'data-style': 'color: red;'         // style → data-style
  },
  loopSource: 'posts',                  // Twig control attributes
  loopVariable: 'post',
  conditionalVisibility: true,
  conditionalExpression: 'posts',
  setVariable: 'myVar',
  setExpression: 'timber.get_posts()'
}
```

**Special Handling:**
- `class` → `className` (WordPress convention)
- `style` → `data-style` (avoid conflicts)
- Twig attributes mapped from lowercase to camelCase:
  - `loopsource` → `loopSource`
  - `loopvariable` → `loopVariable`
  - `conditionalvisibility` → `conditionalVisibility`
  - `conditionalexpression` → `conditionalExpression`
  - `setvariable` → `setVariable`
  - `setexpression` → `setExpression`
- HTML entities are decoded
- `conditionalVisibility` converted to boolean

---

#### `createBlock(tagName, contentType, content, attributeData, innerBlocks)`

Creates a properly structured block object.

**Parameters:**
- `tagName` (string) - HTML element name
- `contentType` (string) - Content type
- `content` (string) - Text/HTML content
- `attributeData` (Object) - Extracted attributes
- `innerBlocks` (Array) - Child blocks

**Returns:**
- Block object

**Example:**
```javascript
const block = createBlock(
  'div',
  'blocks',
  '',
  {
    className: 'container',
    globalAttrs: { id: 'main' },
    loopSource: 'posts',
    loopVariable: 'post'
  },
  [childBlock1, childBlock2]
);

// Returns:
{
  name: 'universal/element',
  attributes: {
    tagName: 'div',
    contentType: 'blocks',
    className: 'container',
    globalAttrs: { id: 'main' },
    loopSource: 'posts',
    loopVariable: 'post'
  },
  innerBlocks: [...]
}
```

**Special Logic:**
- Auto-enables `conditionalVisibility: true` when `conditionalExpression` exists
- Only adds `content` for text/html content types
- Properly nests `innerBlocks` for blocks content type

---

#### `decodeHtmlEntities(str)`

Decodes HTML entities in attribute values.

**Parameters:**
- `str` (string) - String with HTML entities

**Returns:**
- Decoded string

**Example:**
```javascript
decodeHtmlEntities('&lt;div&gt;')
// Returns: '<div>'

decodeHtmlEntities('&quot;Hello&quot;')
// Returns: '"Hello"'
```

---

## blocks2html.js

Converts Universal Block structures back to clean HTML markup.

### Global API

```javascript
// Available globally
window.universal.blocks2html(blocks)
window.universal.blocksToHtml(blocks)  // Alias
```

### Main Functions

#### `blocks2html(blocks)`

Converts an array of block objects to HTML string.

**Parameters:**
- `blocks` (Array) - Array of block objects

**Returns:**
- String of HTML markup

**Example:**
```javascript
const blocks = [
  {
    name: 'universal/element',
    attributes: {
      tagName: 'div',
      contentType: 'blocks',
      className: 'container',
      globalAttrs: { id: 'main' }
    },
    innerBlocks: [...]
  }
];

const html = window.universal.blocks2html(blocks);
// Returns: <div class="container" id="main">...</div>
```

---

#### `blockToHTML(block)`

Converts a single block to HTML recursively.

**Parameters:**
- `block` (Object) - Block object

**Returns:**
- HTML string

**Process:**
1. Validates block is `universal/element`
2. Extracts attributes and content
3. Builds HTML attributes string
4. Handles content based on content type:
   - `text`/`html` - Uses `content` attribute
   - `blocks` - Recursively converts `innerBlocks`
   - `empty` - No content
5. Generates opening/closing tags or self-closing tag

**Example:**
```javascript
const html = blockToHTML({
  name: 'universal/element',
  attributes: {
    tagName: 'img',
    contentType: 'empty',
    globalAttrs: { src: 'photo.jpg', alt: 'Photo' }
  },
  innerBlocks: []
});
// Returns: <img src="photo.jpg" alt="Photo" />
```

---

### Helper Functions

#### `isVoidElement(tagName)`

Checks if a tag is a self-closing void element.

**Parameters:**
- `tagName` (string) - HTML tag name

**Returns:**
- Boolean

**Void Elements:**
```javascript
['img', 'br', 'hr', 'input', 'meta', 'link', 'area',
 'base', 'col', 'embed', 'source', 'track', 'wbr']
```

**Example:**
```javascript
isVoidElement('img')  // true
isVoidElement('div')  // false
```

---

#### `escapeAttribute(value)`

Escapes HTML special characters in attribute values.

**Parameters:**
- `value` (string) - Attribute value

**Returns:**
- Escaped string

**Escapes:**
- `&` → `&amp;`
- `"` → `&quot;`
- `'` → `&#x27;`
- `<` → `&lt;`
- `>` → `&gt;`

**Example:**
```javascript
escapeAttribute('Say "Hello"')
// Returns: 'Say &quot;Hello&quot;'
```

---

#### `escapeAttributeName(name)`

Sanitizes attribute names to only allow safe characters.

**Parameters:**
- `name` (string) - Attribute name

**Returns:**
- Sanitized string

**Allowed Characters:**
- Letters (a-z, A-Z)
- Numbers (0-9)
- Hyphens (-)
- Underscores (_)

**Example:**
```javascript
escapeAttributeName('data-my@attr!')
// Returns: 'data-myattr'
```

---

## Roundtrip Consistency

Both parsers are designed to work together for consistent roundtrip conversion:

```javascript
// Original HTML
const originalHTML = `
<div class="card" id="card-1">
  <h2>Title</h2>
  <p>Description</p>
</div>
`;

// HTML → Blocks
const blocks = window.universal.html2blocks(originalHTML);

// Blocks → HTML
const convertedHTML = window.universal.blocks2html(blocks);

// convertedHTML is structurally identical to originalHTML
```

### What's Preserved:

✅ **DOM structure** - Parent/child relationships maintained
✅ **All attributes** - id, class, data-*, aria-*, etc.
✅ **Content** - Text, HTML, and nested blocks
✅ **Twig controls** - loopSource, conditionalExpression, etc.
✅ **Custom elements** - Web components, Twig tags
✅ **Void elements** - Proper self-closing syntax

### Known Differences:

- **Whitespace normalization** - Extra whitespace may be trimmed
- **Attribute order** - May differ (HTML spec allows this)
- **Quote style** - Always uses double quotes
- **Self-closing syntax** - Void elements use ` />`
- **Entity encoding** - May normalize entity encoding

---

## Integration with Universal Block

### Import Flow

1. User pastes/imports HTML
2. `html2blocks()` parses to block objects
3. `insertBlocks()` inserts into editor
4. Gutenberg renders blocks in editor

### Export Flow

1. User clicks "To HTML" button
2. Editor serializes current blocks
3. `blocks2html()` converts to HTML
4. HTML displayed in Ace Editor modal

### HTML Import Drawer

Location: `assets/react-components/editor-tweaks/src/components/HtmlImportDrawer.js`

Uses `window.universal.html2blocks()` and `window.universal.insertBlocks()`:

```javascript
const blocks = window.universal.html2blocks(htmlInput);
window.universal.insertBlocks(blocks);
```

### Block Conversion Panel

Location: `src/components/Edit.js`

Conversion buttons in Element Settings panel:

**Blocks → HTML:**
```javascript
const convertToHtml = () => {
  const allBlocks = select('core/block-editor').getBlocks();
  const html = window.universal.blocks2html(allBlocks);
  // Display in modal
};
```

**HTML → Blocks:**
```javascript
const convertToBlocks = () => {
  const blocks = window.universal.html2blocks(content);
  // Replace current block with converted blocks
};
```

---

## Usage Examples

### Example 1: Import HTML with Twig Controls

```javascript
const html = `
<div setVariable="posts" setExpression="timber.get_posts({post_type: 'post'})">
  <div loopSource="posts" loopVariable="post">
    <h2>{{ post.title }}</h2>
    <p conditionalExpression="post.thumbnail">
      <img src="{{ post.thumbnail.src }}" />
    </p>
  </div>
</div>
`;

const blocks = window.universal.html2blocks(html);
window.universal.insertBlocks(blocks);
```

**Result:**
- Outer `<div>` block with `setVariable="posts"`, `setExpression="..."`
- Middle `<div>` block with `loopSource="posts"`, `loopVariable="post"`
- Inner `<h2>` block with text content
- Conditional `<p>` block with `conditionalExpression="post.thumbnail"`

---

### Example 2: Export Blocks to HTML

```javascript
const blocks = wp.data.select('core/block-editor').getBlocks();
const html = window.universal.blocks2html(blocks);

console.log(html);
// Clean HTML output ready for copy/paste or storage
```

---

### Example 3: Generate WordPress Block Markup

```javascript
const html = '<div class="hero"><h1>Welcome</h1></div>';
const blocks = window.universal.html2blocks(html);
const markup = window.universal.generateBlockMarkup(blocks);

console.log(markup);
// <!-- wp:universal/element {...} -->
//   <!-- wp:universal/element {...} /-->
// <!-- /wp:universal/element -->

// Can be saved to post_content in database
```

---

## Technical Notes

### Why DOMParser Instead of innerHTML?

`DOMParser` is used because:
- ✅ Preserves custom elements like `<set>`, `<loop>`, `<if>`
- ✅ Handles malformed HTML more gracefully
- ✅ Doesn't execute scripts (security)
- ✅ Works with SVG and other namespaced elements

`innerHTML` would mangle unknown elements:
```javascript
// innerHTML mangles custom elements
div.innerHTML = '<set variable="x">text</set>';
// Result: '<set>text</set>' (attributes lost!)

// DOMParser preserves them
const doc = new DOMParser().parseFromString(...);
// Result: Full <set> element with attributes intact
```

### Content Type Detection Logic

Content type determines how blocks render in the editor:

| Content Type | Children | Editor Component | Use Case |
|-------------|----------|------------------|----------|
| `blocks` | Only elements | InnerBlocks | Containers with child blocks |
| `text` | Only text | RichText | Headings, paragraphs |
| `html` | Mixed (text + elements) | Ace Editor | Complex markup, SVG |
| `empty` | None | None | Self-closing tags (img, hr) |

### Performance Considerations

- **Large HTML documents** - May take time to parse (use loading states)
- **Deep nesting** - Recursive parsing handles any depth
- **Many blocks** - `insertBlocks()` handles batching automatically
- **Repeated conversions** - No caching (always fresh conversion)

---

## Browser Compatibility

Both files are vanilla JavaScript (ES6+) and work in:
- ✅ Chrome 60+
- ✅ Firefox 55+
- ✅ Safari 11+
- ✅ Edge 79+

**Dependencies:**
- `DOMParser` (native browser API)
- `wp.data`, `wp.blocks` (WordPress editor only)

---

## Debugging

### Enable Logging

Add console logs to trace parsing:

```javascript
// In html2blocks.js
function parseNode(node) {
  console.log('Parsing node:', node.nodeName, node);
  // ...
}

// In blocks2html.js
function blockToHTML(block) {
  console.log('Converting block:', block.attributes.tagName);
  // ...
}
```

### Test Roundtrip Conversion

```javascript
const testHTML = '<div class="test"><p>Hello</p></div>';
const blocks = window.universal.html2blocks(testHTML);
const outputHTML = window.universal.blocks2html(blocks);

console.log('Input:', testHTML);
console.log('Blocks:', blocks);
console.log('Output:', outputHTML);

// Compare structure
const inputDoc = new DOMParser().parseFromString(testHTML, 'text/html');
const outputDoc = new DOMParser().parseFromString(outputHTML, 'text/html');
console.log('Match:', inputDoc.body.innerHTML === outputDoc.body.innerHTML);
```

### Common Issues

**Issue: Attributes missing after conversion**
- Check if attribute is in Twig control list
- Verify `getAttributes()` is extracting correctly

**Issue: Content type wrong**
- Review `determineContentType()` logic
- Check if element has expected children

**Issue: Nested blocks not appearing**
- Ensure `innerBlocks` array is populated
- Verify recursive parsing in `parseNode()`

---

## Related Documentation

- [Parser Overview](parsers/README.md) - System architecture
- [HTML to Blocks](parsers/html-to-blocks.md) - Detailed forward conversion
- [Blocks to HTML](parsers/blocks-to-html.md) - Detailed reverse conversion
- [Writing Dynamic HTML](writing-dynamic-html.md) - Using Twig controls

---

## Module Exports

Both files support Node.js module exports for testing:

```javascript
// CommonJS
const { html2blocks } = require('./lib/html2blocks.js');
const { blocks2html } = require('./lib/blocks2html.js');

// Usage in tests
const blocks = html2blocks('<div>Test</div>');
expect(blocks).toHaveLength(1);
```
