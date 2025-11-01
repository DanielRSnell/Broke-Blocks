# Writing Dynamic HTML for Universal Block

## Overview

Universal Block allows you to write HTML that will be converted to Gutenberg blocks with full dynamic/Twig capabilities. This guide shows you how to write HTML that leverages Set variables, Loops, Conditional visibility, and Twig templating.

## Quick Start

You can write regular HTML and add special attributes to make elements dynamic:

```html
<div setVariable="posts" setExpression="timber.get_posts({post_type: 'post'})">
  <div loopSource="posts" loopVariable="item">
    <h2>{{ item.title }}</h2>
  </div>
</div>
```

When imported, this becomes Gutenberg blocks that render as:

```twig
{% set posts = timber.get_posts({post_type: 'post'}) %}
{% for item in posts %}
  <h2>{{ item.title }}</h2>
{% endfor %}
```

## Dynamic Attributes

### Set Variable: `setVariable` + `setExpression`

Define a Twig variable that can be used throughout your template.

**Attributes:**
- `setVariable` - The variable name to create
- `setExpression` - The Twig expression to assign to the variable

**Example:**
```html
<div setVariable="recent_posts" setExpression="timber.get_posts({post_type: 'post', posts_per_page: 6})">
  <!-- Now you can use {{ recent_posts }} in child blocks -->
</div>
```

**Renders as:**
```twig
{% set recent_posts = timber.get_posts({post_type: 'post', posts_per_page: 6}) %}
<div>
  <!-- children here -->
</div>
```

**Use Cases:**
- Fetch posts/data once and reuse
- Store computed values
- Create reusable variables for loops/conditionals

---

### Loop: `loopSource` + `loopVariable`

Repeat an element for each item in a collection.

**Attributes:**
- `loopSource` - The collection to loop over (variable name or expression)
- `loopVariable` - The name of the variable for each item (default: `item`)

**Example:**
```html
<div loopSource="recent_posts" loopVariable="post">
  <h2>{{ post.title }}</h2>
  <p>{{ post.preview }}</p>
</div>
```

**Renders as:**
```twig
{% for post in recent_posts %}
<div>
  <h2>{{ post.title }}</h2>
  <p>{{ post.preview }}</p>
</div>
{% endfor %}
```

**Use Cases:**
- Display lists of posts
- Iterate over custom data
- Render repeating UI elements

---

### Conditional Visibility: `conditionalVisibility` + `conditionalExpression`

Show/hide elements based on a condition.

**Attributes:**
- `conditionalVisibility` - Set to `"true"` to enable (optional if `conditionalExpression` is present)
- `conditionalExpression` - The Twig condition to evaluate

**Example:**
```html
<img src="{{ post.thumbnail.src }}" conditionalExpression="post.thumbnail" />
<div conditionalExpression="not recent_posts">
  <p>No posts found</p>
</div>
```

**Renders as:**
```twig
{% if post.thumbnail %}
<img src="{{ post.thumbnail.src }}" />
{% endif %}

{% if not recent_posts %}
<div>
  <p>No posts found</p>
</div>
{% endif %}
```

**Use Cases:**
- Hide elements when data is missing
- Show error/empty states
- Conditional UI based on user state

---

## Twig Variables in Content & Attributes

You can use Twig variables anywhere in your HTML:

### In Text Content:
```html
<h2>{{ item.title }}</h2>
<p>Posted on {{ item.date }}</p>
```

### In Attributes:
```html
<img src="{{ item.thumbnail.src }}" alt="{{ item.title }}" />
<a href="{{ item.link }}">Read More</a>
```

### With Filters:
```html
<p>{{ item.content|excerpt(50) }}</p>
<span>{{ item.date|date('F j, Y') }}</span>
```

---

## Complete Example: Blog Posts Grid

```html
<div class="container mx-auto p-8">
  <div setVariable="recent_posts" setExpression="timber.get_posts({post_type: 'post', posts_per_page: 6})">
    <h1 class="text-3xl font-bold mb-6">Recent Blog Posts</h1>

    <!-- Grid: Only shows if posts exist -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6" conditionalExpression="recent_posts">
      <!-- Card: Repeats for each post -->
      <article class="bg-white rounded-lg shadow-md overflow-hidden" loopSource="recent_posts" loopVariable="post">

        <!-- Thumbnail: Only shows if post has featured image -->
        <img
          src="{{ post.thumbnail.src }}"
          alt="{{ post.title }}"
          class="w-full h-48 object-cover"
          conditionalExpression="post.thumbnail"
        />

        <div class="p-6">
          <!-- Title -->
          <h2 class="text-xl font-semibold mb-2">{{ post.title }}</h2>

          <!-- Excerpt: Only shows if available -->
          <p class="text-gray-600 mb-4" conditionalExpression="post.preview">
            {{ post.preview }}
          </p>

          <!-- Meta -->
          <div class="flex items-center justify-between text-sm text-gray-500">
            <span>{{ post.date }}</span>
            <a href="{{ post.link }}" class="text-blue-600 hover:underline">
              Read More →
            </a>
          </div>
        </div>
      </article>
    </div>

    <!-- Empty State: Only shows if no posts -->
    <div class="bg-yellow-100 border-l-4 border-yellow-500 p-4" conditionalExpression="not recent_posts">
      <p class="font-bold">No Posts Found</p>
      <p>Check back later for new content.</p>
    </div>
  </div>
</div>
```

**This generates:**

```twig
<div class="container mx-auto p-8">
  {% set recent_posts = timber.get_posts({post_type: 'post', posts_per_page: 6}) %}
  <div>
    <h1 class="text-3xl font-bold mb-6">Recent Blog Posts</h1>

    {% if recent_posts %}
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      {% for post in recent_posts %}
      <article class="bg-white rounded-lg shadow-md overflow-hidden">
        {% if post.thumbnail %}
        <img src="{{ post.thumbnail.src }}" alt="{{ post.title }}" class="w-full h-48 object-cover" />
        {% endif %}

        <div class="p-6">
          <h2 class="text-xl font-semibold mb-2">{{ post.title }}</h2>

          {% if post.preview %}
          <p class="text-gray-600 mb-4">{{ post.preview }}</p>
          {% endif %}

          <div class="flex items-center justify-between text-sm text-gray-500">
            <span>{{ post.date }}</span>
            <a href="{{ post.link }}" class="text-blue-600 hover:underline">Read More →</a>
          </div>
        </div>
      </article>
      {% endfor %}
    </div>
    {% endif %}

    {% if not recent_posts %}
    <div class="bg-yellow-100 border-l-4 border-yellow-500 p-4">
      <p class="font-bold">No Posts Found</p>
      <p>Check back later for new content.</p>
    </div>
    {% endif %}
  </div>
</div>
```

---

## How It Works

### 1. HTML Import

When you import HTML into Gutenberg:
1. Parser reads HTML attributes
2. Detects dynamic attributes (`setVariable`, `loopSource`, `conditionalExpression`)
3. Converts to Universal Block with appropriate settings
4. Removes dynamic attributes from final HTML (they become block settings)

### 2. Gutenberg Editor

In the editor:
- Blocks render as normal HTML (no dynamic data yet)
- Inspector controls show enabled/configured for dynamic blocks
- Block names show dynamic type: `div | Loop`, `h2 | If`, etc.
- Optional: Enable "Dynamic Preview" to see live data

### 3. Frontend Rendering

On the frontend:
1. Blocks render to HTML
2. Dynamic attributes output Twig syntax:
   - `setVariable` → `{% set ... %}`
   - `loopSource` → `{% for ... %}`
   - `conditionalExpression` → `{% if ... %}`
3. Entire page content processes through Twig compiler
4. Timber context provides data (posts, user, etc.)
5. Final HTML output with real data

---

## Available Timber Context

When writing Twig expressions, you have access to:

### Post Data
```twig
{{ post.title }}
{{ post.content }}
{{ post.preview }}
{{ post.link }}
{{ post.date }}
{{ post.thumbnail.src }}
{{ post.author.name }}
```

### Custom Post Meta
Access custom fields using Timber's `meta()` method:

```twig
{{ post.meta('custom_field_key') }}
{{ post.meta('_product_price') }}
{{ item.meta('featured_badge') }}
```

**Example:**
```html
<div loopSource="posts" loopVariable="item">
  <h2>{{ item.title }}</h2>
  <span class="price">${{ item.meta('price') }}</span>
  <div conditionalExpression="item.meta('is_featured')">
    <span class="badge">Featured</span>
  </div>
</div>
```

### User Data
```twig
{{ user.ID }}
{{ user.display_name }}
{{ user.email }}
```

### Timber Functions
```twig
timber.get_posts({post_type: 'post'})
timber.get_post(123)
timber.get_terms({taxonomy: 'category'})
```

### PHP Functions (via `fun` helper)
```twig
fun.get_option('site_title')
fun.get_field('custom_field', post.ID)
```

### Pattern: Server-Side Data Processing

For complex data that requires server-side processing, use the global `timber/context` filter:

**Theme functions.php:**
```php
add_filter('timber/context', function($context) {
    // Add custom data available to all pages
    if (is_product()) {
        global $product;

        // Process WooCommerce product gallery
        $gallery = [];
        foreach ($product->get_gallery_image_ids() as $image_id) {
            $gallery[] = [
                'url' => wp_get_attachment_image_url($image_id, 'full'),
                'alt' => get_post_meta($image_id, '_wp_attachment_image_alt', true),
            ];
        }

        $context['product_gallery'] = $gallery;
    }

    return $context;
});
```

**HTML Template:**
```html
<div loopSource="product_gallery" loopVariable="image">
  <img src="{{ image.url }}" alt="{{ image.alt }}" />
</div>
```

**When to use `timber/context` filter:**
- WooCommerce product data (galleries, variations, etc.)
- ACF Flexible Content or Repeater fields with complex structure
- External API calls (weather, stock prices, etc.)
- Data needs processing/transformation in PHP
- Complex queries that should be cached server-side

---

## Best Practices

### 1. Naming Conventions

Use descriptive variable names:
```html
<!-- Good -->
<div setVariable="recent_posts" ...>
<div loopVariable="post" ...>

<!-- Avoid -->
<div setVariable="p" ...>
<div loopVariable="x" ...>
```

### 2. Nesting Structure

Set variables at the parent level:
```html
<section setVariable="posts" setExpression="...">
  <!-- Set at parent -->
  <div loopSource="posts" loopVariable="post">
    <!-- Loop in child -->
    <h2>{{ post.title }}</h2>
  </div>
</section>
```

### 3. Conditional Fallbacks

Always provide empty states:
```html
<div conditionalExpression="posts">
  <!-- Content when posts exist -->
</div>
<div conditionalExpression="not posts">
  <!-- Empty state -->
</div>
```

### 4. Attribute Safety

Twig variables in attributes work automatically:
```html
<!-- These compile correctly -->
<img src="{{ post.thumbnail.src }}" />
<a href="{{ post.link }}">Link</a>
```

---

## Common Patterns

### Pattern: Post Grid with Categories

```html
<div setVariable="posts" setExpression="timber.get_posts({post_type: 'post', posts_per_page: 9})">
  <div loopSource="posts" loopVariable="post">
    <article>
      <h2>{{ post.title }}</h2>
      <div loopSource="post.categories" loopVariable="category">
        <span>{{ category.name }}</span>
      </div>
    </article>
  </div>
</div>
```

### Pattern: User-Specific Content

```html
<div conditionalExpression="user.ID">
  <p>Welcome back, {{ user.display_name }}!</p>
</div>
<div conditionalExpression="not user.ID">
  <p>Please log in to continue.</p>
</div>
```

### Pattern: Custom Field Data (Simple Meta)

```html
<div loopSource="posts" loopVariable="post">
  <h2>{{ post.title }}</h2>
  <span class="price">${{ post.meta('price') }}</span>
  <div conditionalExpression="post.meta('is_featured')">
    <span class="badge">Featured</span>
  </div>
</div>
```

### Pattern: ACF Fields (Simple)

```html
<div setVariable="hero_image" setExpression="fun.get_field('hero_image', post.ID)">
  <img src="{{ hero_image.url }}" conditionalExpression="hero_image" />
</div>
```

---

## Troubleshooting

### Issue: Variables not working

**Problem:** `{{ post.title }}` shows as literal text

**Solution:** Ensure Timber is installed and active

---

### Issue: Loop not repeating

**Problem:** Only one item shows instead of all

**Check:**
1. Is `loopSource` attribute on the correct element?
2. Does the variable exist? (Check with Set Variable first)
3. Is the collection actually an array?

---

### Issue: Conditional not hiding

**Problem:** Element shows when it shouldn't

**Check:**
1. Is `conditionalExpression` attribute present?
2. Is the expression valid Twig syntax?
3. Try inverting with `not` to test

---

## For LLMs Writing HTML

When generating HTML for Universal Block:

1. **Always use semantic HTML** - Use proper tags (`article`, `section`, `header`, etc.)
2. **Add classes for styling** - Include Tailwind or CSS classes
3. **Use descriptive variable names** - `recent_posts`, `featured_items`, not `x`, `arr`
4. **Include empty states** - Always provide `conditionalExpression="not varName"` fallbacks
5. **Set variables at parent level** - Define data once, use in children
6. **Use proper Twig syntax** - `{{ }}` for output, valid property access
7. **Add alt text and accessibility** - Don't forget `alt`, `aria-label`, etc.
8. **Think in components** - Structure HTML in logical, reusable sections

### Example Template for LLM:

```html
<CONTAINER setVariable="DATA_VAR" setExpression="TIMBER_EXPRESSION">

  <div conditionalExpression="DATA_VAR">
    <REPEATING_ELEMENT loopSource="DATA_VAR" loopVariable="ITEM_VAR">
      <!-- Use {{ ITEM_VAR.property }} here -->

      <CONDITIONAL_ELEMENT conditionalExpression="ITEM_VAR.property">
        <!-- Conditional content -->
      </CONDITIONAL_ELEMENT>
    </REPEATING_ELEMENT>
  </div>

  <div conditionalExpression="not DATA_VAR">
    <!-- Empty state -->
  </div>

</CONTAINER>
```

---

## Additional Resources

- [Timber Documentation](https://timber.github.io/docs/) - Full Timber/Twig reference and context filters
- [Twig Documentation](https://twig.symfony.com/doc/) - Twig syntax and filters
- [Parser Documentation](./parsers/README.md) - How HTML converts to blocks
- [Dynamic Preview Guide](./dynamic-preview.md) - Live preview in editor (future feature)
