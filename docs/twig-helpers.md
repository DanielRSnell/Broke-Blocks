# Twig Helpers

The Twig Helpers system provides magic function access and Timber utilities directly in your Twig templates through the `fun` and `timber` objects.

## Overview

Located in [includes/twig/class-twig-helpers.php](../includes/twig/class-twig-helpers.php), this system adds two special objects to the Timber context:

- **`fun`** - Call any PHP function directly from Twig
- **`timber`** - Access Timber static methods

Both are automatically added to every Timber context via the `timber/context` filter.

## The `fun` Object

The `fun` object allows you to call any PHP function that exists in your WordPress environment.

### Usage

```twig
{# Call WordPress functions #}
{{ fun.get_bloginfo('name') }}
{{ fun.wp_get_attachment_image(123, 'large') }}

{# Use PHP functions #}
{{ fun.date('Y-m-d') }}
{{ fun.number_format(1234.56, 2) }}
{{ fun.strtoupper('hello') }}

{# Custom theme functions #}
{{ fun.my_custom_helper() }}
```

### Safety

The `fun` object only calls functions that actually exist using `function_exists()`. If a function doesn't exist, it returns `null` silently.

### Common Use Cases

#### WordPress Functions

```twig
{# Site information #}
<title>{{ fun.get_bloginfo('name') }}</title>
<meta name="description" content="{{ fun.get_bloginfo('description') }}">

{# URLs #}
<link rel="stylesheet" href="{{ fun.get_stylesheet_uri() }}">
<img src="{{ fun.get_template_directory_uri() }}/images/logo.svg">

{# Post meta #}
<span>{{ fun.get_post_meta(post.ID, 'custom_field', true) }}</span>

{# Shortcodes #}
{{ fun.do_shortcode('[contact-form-7 id="123"]') }}
```

#### PHP Functions

```twig
{# String manipulation #}
{{ fun.strtoupper(post.title) }}
{{ fun.substr(post.excerpt, 0, 100) }}
{{ fun.str_replace('old', 'new', content) }}

{# Numbers #}
${{ fun.number_format(product.price, 2) }}
{{ fun.round(rating, 1) }}

{# Dates #}
{{ fun.date('F j, Y', post.post_date) }}

{# Arrays #}
{{ fun.count(items) }}
```

#### Custom Theme Functions

```twig
{# Assuming you have these functions in your theme #}
{{ fun.get_reading_time(post.ID) }}
{{ fun.format_phone_number(contact.phone) }}
{{ fun.get_svg_icon('arrow-right') }}
```

## The `timber` Object

The `timber` object provides access to Timber's static methods, making it easy to fetch additional data within templates.

### Usage

```twig
{# Get posts #}
{% set latest = timber.get_posts('post_type=post&posts_per_page=5') %}

{# Get terms #}
{% set categories = timber.get_terms('category') %}

{# Get single post #}
{% set featured = timber.get_post(123) %}

{# Get user #}
{% set author = timber.get_user(post.post_author) %}
```

### Common Use Cases

#### Fetching Related Posts

```twig
{# Get posts in same category #}
{% set categories = post.categories %}
{% if categories %}
  {% set related = timber.get_posts({
    'post_type': 'post',
    'category__in': categories|map(c => c.id),
    'post__not_in': [post.ID],
    'posts_per_page': 3
  }) %}

  {% if related %}
    <aside class="related-posts">
      <h3>Related Articles</h3>
      {% for item in related %}
        <article>
          <h4>{{ item.title }}</h4>
          <a href="{{ item.link }}">Read more</a>
        </article>
      {% endfor %}
    </aside>
  {% endif %}
{% endif %}
```

#### Loading Additional Data

```twig
{# Get specific posts by ID #}
{% set featured_ids = [123, 456, 789] %}
{% set featured_posts = timber.get_posts({
  'post__in': featured_ids,
  'orderby': 'post__in'
}) %}

{# Get all terms from a taxonomy #}
{% set tags = timber.get_terms({
  'taxonomy': 'post_tag',
  'hide_empty': true,
  'number': 20
}) %}

{# Get user by ID #}
{% set guest_author = timber.get_user(post.meta('guest_author_id')) %}
```

#### Dynamic Menus and Sidebars

```twig
{# Get menu dynamically #}
{% set footer_menu = timber.get_menu('footer-menu') %}
{% if footer_menu %}
  <nav>
    {% for item in footer_menu.items %}
      <a href="{{ item.link }}">{{ item.title }}</a>
    {% endfor %}
  </nav>
{% endif %}
```

## Implementation Details

### TwigMagicFunction Class

```php
class TwigMagicFunction {
    public function __call( $name, $arguments ) {
        if ( function_exists( $name ) ) {
            return call_user_func_array( $name, $arguments );
        }
        return null;
    }
}
```

This class uses PHP's magic `__call()` method to intercept any method call and attempt to execute it as a function. It's safe because it checks `function_exists()` first.

### TwigTimberWrapper Class

```php
class TwigTimberWrapper {
    public function __call( $name, $arguments ) {
        return call_user_func_array( array( '\\Timber\\Timber', $name ), $arguments );
    }
}
```

This class proxies calls to Timber's static methods, allowing you to use `timber.get_posts()` instead of having to use Twig's function syntax.

### Context Filter

```php
add_filter( 'timber/context', function ( $context ) {
    $context['fun'] = new TwigMagicFunction();
    $context['timber'] = new TwigTimberWrapper();
    return $context;
} );
```

The helpers are added to every Timber context automatically via the `timber/context` filter, making them available in all templates.

## Best Practices

### Do Use `fun` For:
- WordPress core functions
- Well-tested theme utility functions
- Simple data transformations
- Formatting output

### Don't Use `fun` For:
- Complex business logic (move to PHP)
- Database queries (use WP_Query or Timber in PHP)
- Functions that modify state (hooks, updates)
- Security-sensitive operations

### Performance Considerations

```twig
{# ❌ Bad - queries database on every loop iteration #}
{% for post in posts %}
  {% set author = timber.get_user(post.post_author) %}
  {{ author.name }}
{% endfor %}

{# ✅ Good - access pre-loaded relationship #}
{% for post in posts %}
  {{ post.author.name }}
{% endfor %}

{# ✅ Good - fetch once before loop #}
{% set author_ids = posts|map(p => p.post_author)|unique %}
{% set authors = timber.get_users(author_ids) %}
```

### Security

The `fun` object provides direct access to PHP functions, so be careful with user input:

```twig
{# ❌ Dangerous - executing arbitrary user input #}
{{ fun[user_input]() }}

{# ✅ Safe - hardcoded function names #}
{{ fun.esc_html(user_input) }}
```

Always sanitize and validate data, especially when displaying user-generated content.

## Examples

### Product Card with Custom Formatting

```html
<div class="product-card" loopSource="products" loopVariable="product">
  <img src="{{ product.thumbnail.src }}" alt="{{ product.title }}">
  <h3>{{ product.title }}</h3>

  {# Format price with custom function #}
  <span class="price">{{ fun.format_currency(product.meta('price')) }}</span>

  {# Display sale badge if on sale #}
  {% if fun.is_on_sale(product.ID) %}
    <span class="badge">Sale</span>
  {% endif %}

  {# Get related products #}
  {% set related = timber.get_posts({
    'post_type': 'product',
    'posts_per_page': 3,
    'meta_query': [{
      'key': 'category',
      'value': product.meta('category')
    }]
  }) %}
</div>
```

### Author Bio with Social Links

```html
<div class="author-bio">
  {% set author = timber.get_user(post.post_author) %}

  <img src="{{ fun.get_avatar_url(author.ID) }}" alt="{{ author.name }}">
  <h4>{{ author.name }}</h4>
  <p>{{ author.description }}</p>

  <div class="social-links">
    {% if author.meta('twitter') %}
      <a href="https://twitter.com/{{ author.meta('twitter') }}">
        {{ fun.get_svg_icon('twitter') }}
      </a>
    {% endif %}

    {% if author.meta('linkedin') %}
      <a href="{{ author.meta('linkedin') }}">
        {{ fun.get_svg_icon('linkedin') }}
      </a>
    {% endif %}
  </div>

  {# Author's recent posts #}
  {% set recent = timber.get_posts({
    'author': author.ID,
    'posts_per_page': 3,
    'post__not_in': [post.ID]
  }) %}

  {% if recent %}
    <h5>More from {{ author.name }}</h5>
    {% for item in recent %}
      <a href="{{ item.link }}">{{ item.title }}</a>
    {% endfor %}
  {% endif %}
</div>
```

## Related Documentation

- [Writing Dynamic HTML](writing-dynamic-html.md) - Complete guide to Twig attributes and dynamic content
- [Dynamic Preview](dynamic-preview.md) - Testing dynamic templates in the editor
- [Timber Documentation](https://timber.github.io/docs/v2/) - Official Timber/Twig documentation

## Extending the System

You can add your own helper objects by hooking into the same `timber/context` filter:

```php
// In your theme's functions.php
add_filter( 'timber/context', function( $context ) {
    // Add custom helper object
    $context['theme'] = new MyThemeHelpers();

    // Add custom data
    $context['site_options'] = get_option( 'my_theme_options' );

    return $context;
}, 20 ); // Priority 20 runs after Universal Block's helpers
```

Then use in Twig:

```twig
{{ theme.get_hero_image() }}
{{ site_options.footer_text }}
```
