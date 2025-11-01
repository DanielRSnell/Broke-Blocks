<?php
/**
 * Server-side rendering for the Universal Element block.
 *
 * @param array  $attributes Block attributes.
 * @param string $content    Block inner content (InnerBlocks for 'blocks' contentType).
 * @param object $block      Block instance.
 * @return string Rendered block output.
 *
 * NOTE: Testing adding WordPress block props to each element for theme.json support,
 * spacing controls, typography, colors, etc. This allows WordPress block supports
 * to work properly on the frontend.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

// Extract attributes
$tag_name = $attributes['tagName'] ?? 'div';
$content_type = $attributes['contentType'] ?? 'blocks';
$block_content = $attributes['content'] ?? '';
$global_attrs = $attributes['globalAttrs'] ?? array();
$is_self_closing = $attributes['isSelfClosing'] ?? false;
$class_name = $attributes['className'] ?? '';

// Extract Twig control attributes (they can be in attributes or globalAttrs)
// Check both camelCase (from block attributes) and lowercase (from HTML import in globalAttrs)
$set_variable = $attributes['setVariable'] ?? $global_attrs['setvariable'] ?? '';
$set_expression = $attributes['setExpression'] ?? $global_attrs['setexpression'] ?? '';
$loop_source = $attributes['loopSource'] ?? $global_attrs['loopsource'] ?? '';
$loop_variable = $attributes['loopVariable'] ?? $global_attrs['loopvariable'] ?? 'item';
$conditional_visibility = $attributes['conditionalVisibility'] ?? ( isset( $global_attrs['conditionalvisibility'] ) && ( $global_attrs['conditionalvisibility'] === 'true' || $global_attrs['conditionalvisibility'] === true ) );
$conditional_expression = $attributes['conditionalExpression'] ?? $global_attrs['conditionalexpression'] ?? '';

// Output Set Variable Twig before element
if ( ! empty( $set_variable ) && ! empty( $set_expression ) ) {
	echo '{% set ' . $set_variable . ' = ' . $set_expression . ' %}' . "\n";
}

// Output Conditional Visibility opening tag
if ( $conditional_visibility && ! empty( $conditional_expression ) ) {
	echo '{% if ' . $conditional_expression . ' %}' . "\n";
}

// Output Loop opening tag
if ( ! empty( $loop_source ) ) {
	echo '{% for ' . $loop_variable . ' in ' . $loop_source . ' %}' . "\n";
}

// Start with empty attributes array
$attrs = array();

// Add block ID if not already set in globalAttrs
if ( ! isset( $global_attrs['id'] ) ) {
	// Generate unique block ID using a hash of block data
	$block_data = wp_json_encode( array(
		'tag' => $tag_name,
		'content' => substr( $block_content, 0, 50 ),
		'attrs' => $global_attrs,
	) );
	$attrs['id'] = 'block-' . substr( md5( $block_data . microtime() ), 0, 8 );
}

// Add className if present
if ( ! empty( $class_name ) ) {
	$attrs['class'] = esc_attr( $class_name );
}

// Twig control attribute names (to filter out from HTML rendering)
$twig_control_attrs = array(
	'loopsource',
	'loopvariable',
	'conditionalvisibility',
	'conditionalexpression',
	'setvariable',
	'setexpression'
);

// Add/merge global attributes
foreach ( $global_attrs as $attr_name => $attr_value ) {
	if ( empty( $attr_name ) || empty( $attr_value ) ) {
		continue;
	}

	// Sanitize attribute name
	$attr_name = preg_replace( '/[^a-zA-Z0-9\-_]/', '', $attr_name );

	// Skip 'class' from globalAttrs - we use className attribute instead (WordPress official way)
	if ( $attr_name === 'class' ) {
		continue;
	}

	// Skip Twig control attributes - they should not be rendered as HTML attributes
	if ( in_array( strtolower( $attr_name ), $twig_control_attrs, true ) ) {
		continue;
	}

	// Don't escape Twig variables - they need to be compiled first
	// Check if attribute contains Twig syntax {{ }} or {% %}
	$has_twig = preg_match( '/\{\{.*?\}\}|\{%.*?%\}/', $attr_value );

	if ( $has_twig ) {
		// Leave Twig syntax as-is, it will be compiled by the_content filter
		$attrs[ $attr_name ] = $attr_value;
	} elseif ( $attr_name === 'href' || $attr_name === 'src' ) {
		$attrs[ $attr_name ] = esc_url( $attr_value );
	} else {
		$attrs[ $attr_name ] = esc_attr( $attr_value );
	}
}

// Build attribute string
$attr_string = '';
foreach ( $attrs as $attr_name => $attr_value ) {
	if ( ! empty( $attr_value ) ) {
		$attr_string .= ' ' . esc_attr( $attr_name ) . '="' . $attr_value . '"';
	}
}

// Determine final content based on contentType
$final_content = '';

switch ( $content_type ) {
	case 'blocks':
		// Use InnerBlocks content (passed as $content parameter)
		$final_content = $content;
		break;

	case 'text':
	case 'html':
		// Use block content attribute directly without sanitization
		// Gutenberg already sanitizes on save
		$final_content = $block_content;
		break;

	case 'empty':
	default:
		// No content for empty/self-closing elements
		$final_content = '';
		break;
}

// Elements that should have their content protected from Twig compilation
$protected_elements = array( 'code', 'pre', 'kbd', 'samp', 'var' );

// Check if this element needs content protection
$protect_content = in_array( $tag_name, $protected_elements, true );

// Allow override via data attributes
if ( isset( $global_attrs['data-allow-twig'] ) ) {
	$protect_content = false;
}
if ( isset( $global_attrs['data-no-twig'] ) ) {
	$protect_content = true;
}

// If content needs protection, escape Twig syntax so it displays literally
if ( $protect_content && ! empty( $final_content ) ) {
	$final_content = str_replace(
		array( '{{', '}}', '{%', '%}', '{#', '#}' ),
		array( '&#123;&#123;', '&#125;&#125;', '&#123;&#37;', '&#37;&#125;', '&#123;&#35;', '&#35;&#125;' ),
		$final_content
	);
}

// Render the element
if ( $is_self_closing ) {
	echo '<' . esc_attr( $tag_name ) . $attr_string . ' />';
} else {
	echo '<' . esc_attr( $tag_name ) . $attr_string . '>' . $final_content . '</' . esc_attr( $tag_name ) . '>';
}

// Output Loop closing tag (in reverse order)
if ( ! empty( $loop_source ) ) {
	echo "\n" . '{% endfor %}';
}

// Output Conditional Visibility closing tag
if ( $conditional_visibility && ! empty( $conditional_expression ) ) {
	echo "\n" . '{% endif %}';
}
