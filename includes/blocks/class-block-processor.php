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
	 * Note: Twig compilation has been removed from frontend rendering.
	 * Blocks now output raw Twig syntax. Compilation only occurs in
	 * the editor preview via REST API.
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

		// No processing needed - blocks output raw Twig syntax
		return $block_content;
	}
}
