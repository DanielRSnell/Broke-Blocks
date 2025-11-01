<?php
/**
 * Block Processor
 *
 * Handles processing of Universal Blocks including dynamic tag parsing and Twig compilation.
 *
 * @package UniversalBlock
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Universal_Block_Processor {

	/**
	 * Process a single block through the render pipeline
	 *
	 * @param string $block_content The block content HTML
	 * @param array  $block         The block data
	 * @return string Processed block content
	 */
	public static function process_block( $block_content, $block ) {
		// Only process our universal/element blocks
		if ( $block['blockName'] !== 'universal/element' ) {
			return $block_content;
		}

		// DON'T process DSL or Twig at block level - let the_content filter handle it
		// This ensures all blocks are rendered first, then DSL is parsed, then Twig is compiled
		return $block_content;
	}

	/**
	 * Process the_content for classic themes
	 *
	 * @param string $content The post content
	 * @return string Processed content
	 */
	public static function process_content( $content ) {
		// Only process if Timber is available
		if ( ! class_exists( '\Timber\Timber' ) ) {
			return $content;
		}

		// Skip Twig compilation if ?twig=false
		if ( isset( $_GET['twig'] ) && $_GET['twig'] === 'false' ) {
			return $content;
		}

		// Only compile if content has Twig syntax
		if ( ! preg_match( '/\{[{%].*?[}%]\}/', $content ) ) {
			return $content;
		}

		try {
			// Get Timber context
			$context = \Timber\Timber::context();

			// Compile Twig
			return \Timber\Timber::compile_string( $content, $context );

		} catch ( Exception $e ) {
			// Log error
			error_log( 'Universal Block Twig error: ' . $e->getMessage() );

			// Show error if debug mode
			if ( defined( 'WP_DEBUG' ) && WP_DEBUG && defined( 'WP_DEBUG_DISPLAY' ) && WP_DEBUG_DISPLAY ) {
				$error_html = '<div style="background: #ffebee; border: 2px solid #c62828; padding: 20px; margin: 20px; font-family: monospace;">';
				$error_html .= '<h3 style="color: #c62828; margin-top: 0;">Twig Compilation Error</h3>';
				$error_html .= '<p><strong>Message:</strong> ' . esc_html( $e->getMessage() ) . '</p>';
				$error_html .= '<p><strong>File:</strong> ' . esc_html( $e->getFile() ) . '</p>';
				$error_html .= '<p><strong>Line:</strong> ' . esc_html( $e->getLine() ) . '</p>';
				$error_html .= '</div>';
				return $error_html . $content;
			}

			// Return original content on error
			return $content;
		}
	}
}
