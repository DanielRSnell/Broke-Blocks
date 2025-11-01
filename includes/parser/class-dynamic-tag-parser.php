<?php
/**
 * Dynamic Tag Parser
 *
 * Parses custom HTML elements (loop, if, set) into Twig syntax for processing by Timber.
 *
 * @package UniversalBlock
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Universal_Block_Dynamic_Tag_Parser {

	/**
	 * Parse dynamic tags in content and convert to Twig syntax
	 *
	 * @param string $content The content containing dynamic tags
	 * @return string The content with dynamic tags converted to Twig
	 */
	public static function parse( $content ) {
		if ( empty( $content ) ) {
			return $content;
		}

		// Parse in order: set first (variables), then if (conditionals), then loop (iterations)
		$content = self::parse_set_tags( $content );
		$content = self::parse_if_tags( $content );
		$content = self::parse_loop_tags( $content );

		return $content;
	}

	/**
	 * Parse <set> tags into Twig {% set %} syntax
	 *
	 * @param string $content The content to parse
	 * @return string The parsed content
	 */
	private static function parse_set_tags( $content ) {
		// Simple pattern to match <set> tags with value and variable attributes in any order
		$pattern = '/<set\s+([^>]*)>/i';

		$content = preg_replace_callback( $pattern, function( $matches ) {
			$attributes = $matches[1];

			// Extract variable and value using separate patterns
			// Support both 'value' and 'source' as aliases
			preg_match( '/variable=["\']([^"\']+)["\']/i', $attributes, $var_matches );
			// Add 's' modifier to make . match newlines for multi-line attribute values
			preg_match( '/(value|source)=(["\'])(.+?)\2(?=\s|\/|$)/is', $attributes, $val_matches );

			if ( ! empty( $var_matches[1] ) && ! empty( $val_matches[3] ) ) {
				$variable = trim( $var_matches[1] );
				$value = trim( $val_matches[3] );

				// Simple string replacement - no escaping, no decoding
				// Just convert directly to Twig syntax
				return '{% set ' . $variable . ' = ' . $value . ' %}';
			}

			// If we can't parse the attributes, return the original
			return $matches[0];
		}, $content );

		// Remove any closing </set> tags
		$content = preg_replace( '/<\/set\s*>/i', '', $content );

		return $content;
	}

	/**
	 * Parse <if> tags into Twig {% if %} syntax
	 *
	 * @param string $content The content to parse
	 * @return string The parsed content
	 */
	private static function parse_if_tags( $content ) {
		// Match opening <if> tags with source or condition attribute (and any other attributes)
		$content = preg_replace_callback(
			'/<if\s+[^>]*?(source|condition)=["\']([^"\']+)["\'][^>]*?>/i',
			function( $matches ) {
				$condition = trim( $matches[2] );
				// Simple string replacement - no escaping, no decoding
				return '{% if ' . $condition . ' %}';
			},
			$content
		);

		// Match closing </if> tags
		$content = preg_replace( '/<\/if\s*>/i', '{% endif %}', $content );

		return $content;
	}

	/**
	 * Parse <loop> tags into Twig {% for %} syntax
	 *
	 * @param string $content The content to parse
	 * @return string The parsed content
	 */
	private static function parse_loop_tags( $content ) {
		// Match opening <loop> tags with source attribute
		$content = preg_replace_callback(
			'/<loop\s+source=["\']([^"\']+)["\']\s*>/i',
			function( $matches ) {
				$source = trim( $matches[1] );

				// If source starts with "for ", strip it (allow both syntaxes)
				if ( preg_match( '/^for\s+(.+)$/i', $source, $for_matches ) ) {
					$source = $for_matches[1];
				}

				// If source doesn't contain " in ", assume it's just the collection name
				// and default to "item in {source}"
				if ( stripos( $source, ' in ' ) === false ) {
					return '{% for item in ' . $source . ' %}';
				} else {
					// Source already has "item in collection" format
					return '{% for ' . $source . ' %}';
				}
			},
			$content
		);

		// Match closing </loop> tags
		$content = preg_replace( '/<\/loop\s*>/i', '{% endfor %}', $content );

		return $content;
	}

	/**
	 * Check if content contains dynamic tags
	 *
	 * @param string $content The content to check
	 * @return bool True if content has dynamic tags
	 */
	public static function has_dynamic_tags( $content ) {
		if ( empty( $content ) ) {
			return false;
		}

		// Check for any of our dynamic tags
		$has_tags = (
			preg_match( '/<(loop|if|set)\s+/i', $content ) ||
			preg_match( '/<\/(loop|if)\s*>/i', $content )
		);

		// Debug output
		if ( defined( 'WP_DEBUG' ) && WP_DEBUG && $has_tags ) {
			error_log( 'Dynamic Tag Parser: has_dynamic_tags() = true' );
		}

		return $has_tags;
	}

	/**
	 * Validate that dynamic tags are properly nested and closed
	 *
	 * @param string $content The content to validate
	 * @return array Array with 'valid' boolean and 'errors' array
	 */
	public static function validate_structure( $content ) {
		$result = array(
			'valid' => true,
			'errors' => array()
		);

		if ( empty( $content ) ) {
			return $result;
		}

		// Stack to track opening tags
		$tag_stack = array();

		// Find all dynamic tags
		preg_match_all( '/<(\/?)(\w+)(?:\s+[^>]*)?>/i', $content, $matches, PREG_SET_ORDER );

		foreach ( $matches as $match ) {
			$is_closing = ! empty( $match[1] );
			$tag_name = strtolower( $match[2] );

			// Only process our dynamic tags
			if ( ! in_array( $tag_name, array( 'loop', 'if', 'set' ), true ) ) {
				continue;
			}

			if ( $tag_name === 'set' ) {
				// Set tags are self-closing, don't add to stack
				continue;
			}

			if ( $is_closing ) {
				// Closing tag
				if ( empty( $tag_stack ) ) {
					$result['valid'] = false;
					$result['errors'][] = "Unexpected closing tag: </{$tag_name}>";
				} else {
					$last_tag = array_pop( $tag_stack );
					if ( $last_tag !== $tag_name ) {
						$result['valid'] = false;
						$result['errors'][] = "Mismatched tags: expected </{$last_tag}> but found </{$tag_name}>";
					}
				}
			} else {
				// Opening tag
				$tag_stack[] = $tag_name;
			}
		}

		// Check for unclosed tags
		if ( ! empty( $tag_stack ) ) {
			$result['valid'] = false;
			foreach ( $tag_stack as $unclosed_tag ) {
				$result['errors'][] = "Unclosed tag: <{$unclosed_tag}>";
			}
		}

		return $result;
	}

	/**
	 * Get information about dynamic tags in content for debugging
	 *
	 * @param string $content The content to analyze
	 * @return array Information about found dynamic tags
	 */
	public static function get_tag_info( $content ) {
		$info = array(
			'has_dynamic_tags' => false,
			'tags_found' => array(),
			'validation' => array()
		);

		if ( empty( $content ) ) {
			return $info;
		}

		$info['has_dynamic_tags'] = self::has_dynamic_tags( $content );
		$info['validation'] = self::validate_structure( $content );

		// Count different types of tags
		preg_match_all( '/<(loop|if|set)\s+/i', $content, $matches );
		if ( ! empty( $matches[1] ) ) {
			$info['tags_found'] = array_count_values( array_map( 'strtolower', $matches[1] ) );
		}

		return $info;
	}
}