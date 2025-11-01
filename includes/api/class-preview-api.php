<?php
/**
 * Preview API for context-aware dynamic tag processing
 *
 * @package UniversalBlock
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Universal_Block_Preview_API {

	/**
	 * Register REST API routes
	 */
	public function __construct() {
		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
	}

	/**
	 * Register the preview endpoint
	 */
	public function register_routes() {
		register_rest_route( 'universal-block/v1', '/preview', array(
			'methods' => 'POST',
			'callback' => array( $this, 'preview_endpoint' ),
			'permission_callback' => array( $this, 'preview_permissions' ),
			'args' => array(
				'allBlocks' => array(
					'required' => true,
					'type' => 'array',
					'description' => 'All blocks from the editor'
				),
				'targetBlockId' => array(
					'required' => true,
					'type' => 'string',
					'description' => 'ID of the block to preview'
				),
				'pageContext' => array(
					'required' => true,
					'type' => 'object',
					'description' => 'Page context data from editor'
				)
			)
		) );

		// New dynamic preview endpoint for block subtrees
		register_rest_route( 'universal-block/v1', '/dynamic-preview', array(
			'methods' => 'POST',
			'callback' => array( $this, 'dynamic_preview_endpoint' ),
			'permission_callback' => array( $this, 'preview_permissions' ),
			'args' => array(
				'blockContent' => array(
					'required' => true,
					'type' => 'string',
					'description' => 'Serialized content of the dynamic block and its children'
				),
				'blockId' => array(
					'required' => true,
					'type' => 'string',
					'description' => 'ID of the dynamic block'
				),
				'context' => array(
					'required' => true,
					'type' => 'object',
					'description' => 'Context data for processing'
				)
			)
		) );
	}

	/**
	 * Check permissions for preview endpoint
	 */
	public function preview_permissions( $request ) {
		// Must be able to edit posts
		return current_user_can( 'edit_posts' );
	}

	/**
	 * Handle preview request
	 */
	public function preview_endpoint( $request ) {
		$start_time = microtime( true );

		try {
			$all_blocks = $request->get_param( 'allBlocks' );
			$target_block_id = $request->get_param( 'targetBlockId' );
			$page_context = $request->get_param( 'pageContext' );

			// Set up the preview environment
			$this->setup_preview_context( $page_context );

			// Render all blocks together (like frontend)
			$full_content = $this->render_all_blocks( $all_blocks );

			// Apply dynamic tag processing
			$processed_content = $this->process_dynamic_content( $full_content );

			// Extract the specific block's preview
			$block_preview = $this->extract_block_preview(
				$processed_content,
				$target_block_id,
				$all_blocks
			);

			$processing_time = round( ( microtime( true ) - $start_time ) * 1000, 2 );

			return array(
				'success' => true,
				'html' => $block_preview,
				'context_used' => $this->get_context_summary( $page_context ),
				'processing_time' => $processing_time . 'ms',
				'blocks_processed' => count( $all_blocks )
			);

		} catch ( Exception $e ) {
			return new WP_Error(
				'preview_error',
				'Preview generation failed: ' . $e->getMessage(),
				array( 'status' => 500 )
			);
		}
	}

	/**
	 * Handle dynamic preview request for block subtrees
	 */
	public function dynamic_preview_endpoint( $request ) {
		$start_time = microtime( true );

		try {
			$block_content = $request->get_param( 'blockContent' );
			$block_id = $request->get_param( 'blockId' );
			$context = $request->get_param( 'context' );

			// Set up the preview environment
			$this->setup_dynamic_context( $context );

			// First convert block markup to actual HTML
			$rendered_html = do_blocks( $block_content );

			// Then process the HTML with dynamic tags and Timber
			$processed_html = $this->process_dynamic_content( $rendered_html );

			$processing_time = round( ( microtime( true ) - $start_time ) * 1000, 2 );

			return array(
				'success' => true,
				'content' => $processed_html,
				'blockId' => $block_id,
				'context_used' => $this->get_dynamic_context_summary( $context ),
				'processing_time' => $processing_time . 'ms',
				'original_length' => strlen( $block_content ),
				'processed_length' => strlen( $processed_html ),
				'raw_html' => $rendered_html, // For debugging
				'debug_info' => array(
					'has_set_tags' => strpos( $rendered_html, '<set' ) !== false,
					'has_twig_vars' => preg_match( '/\{\{.*?\}\}/', $rendered_html ),
					'has_twig_set' => preg_match( '/\{%\s*set.*?%\}/', $processed_html ),
					'timber_context_keys' => class_exists( '\Timber\Timber' ) ? array_keys( \Timber\Timber::context() ) : array()
				)
			);

		} catch ( Exception $e ) {
			return new WP_Error(
				'dynamic_preview_error',
				'Dynamic preview generation failed: ' . $e->getMessage(),
				array( 'status' => 500 )
			);
		}
	}

	/**
	 * Set up preview context to match frontend environment
	 */
	private function setup_preview_context( $page_context ) {
		global $post, $wp_query;

		// Set up post context
		if ( ! empty( $page_context['postId'] ) ) {
			$preview_post = get_post( $page_context['postId'] );
			if ( $preview_post ) {
				$post = $preview_post;
				setup_postdata( $preview_post );

				// Set up query context
				$wp_query->queried_object = $preview_post;
				$wp_query->queried_object_id = $preview_post->ID;
			}
		}

		// Set up user context
		if ( ! empty( $page_context['userId'] ) ) {
			wp_set_current_user( $page_context['userId'] );
		}

		// Override meta fields for preview
		if ( ! empty( $page_context['postMeta'] ) ) {
			$this->setup_meta_overrides( $page_context['postMeta'], $page_context['postId'] );
		}

		// Add global page data to Timber context
		if ( ! empty( $page_context['pageData'] ) ) {
			add_filter( 'timber/context', function( $context ) use ( $page_context ) {
				$context['page_data'] = $page_context['pageData'];
				if ( ! empty( $page_context['wpUserData'] ) ) {
					$context['user_data'] = $page_context['wpUserData'];
				}
				return $context;
			} );
		}
	}

	/**
	 * Set up meta field overrides for preview
	 */
	private function setup_meta_overrides( $meta_data, $post_id ) {
		foreach ( $meta_data as $meta_key => $meta_value ) {
			add_filter( 'get_post_metadata', function( $value, $object_id, $key, $single ) use ( $meta_data, $post_id ) {
				if ( $object_id == $post_id && isset( $meta_data[ $key ] ) ) {
					return $single ? array( $meta_data[ $key ] ) : array( array( $meta_data[ $key ] ) );
				}
				return $value;
			}, 10, 4 );
		}
	}

	/**
	 * Render all blocks as HTML
	 */
	private function render_all_blocks( $blocks ) {
		$content = '';

		foreach ( $blocks as $block ) {
			$content .= $this->render_single_block( $block );
		}

		return $content;
	}

	/**
	 * Render a single block recursively
	 */
	private function render_single_block( $block ) {
		// Add unique markers for block identification
		$block_start = '<!-- BLOCK_START:' . $block['clientId'] . ' -->';
		$block_end = '<!-- BLOCK_END:' . $block['clientId'] . ' -->';

		// Render the block
		$rendered = render_block( $block );

		// Render inner blocks if they exist
		if ( ! empty( $block['innerBlocks'] ) ) {
			$inner_content = '';
			foreach ( $block['innerBlocks'] as $inner_block ) {
				$inner_content .= $this->render_single_block( $inner_block );
			}
			$rendered = str_replace( '</div>', $inner_content . '</div>', $rendered );
		}

		return $block_start . $rendered . $block_end;
	}

	/**
	 * Process dynamic content with Timber
	 */
	private function process_dynamic_content( $content ) {
		// Use the same processing as the frontend
		if ( ! class_exists( '\Timber\Timber' ) ) {
			return $content;
		}

		// Get Timber context
		$context = \Timber\Timber::context();

		// Process dynamic tags if present
		if ( Universal_Block_Dynamic_Tag_Parser::has_dynamic_tags( $content ) ) {
			$validation = Universal_Block_Dynamic_Tag_Parser::validate_structure( $content );

			if ( $validation['valid'] ) {
				$content = Universal_Block_Dynamic_Tag_Parser::parse( $content );
			}
		}

		// Compile Twig syntax
		if ( preg_match( '/\{\{.*?\}\}|\{%.*?%\}/', $content ) ) {
			try {
				$content = \Timber\Timber::compile_string( $content, $context );
			} catch ( Exception $e ) {
				// Return content with error comment
				$content = '<!-- Twig Error: ' . esc_html( $e->getMessage() ) . ' -->' . $content;
			}
		}

		return $content;
	}

	/**
	 * Extract preview for specific block
	 */
	private function extract_block_preview( $content, $target_block_id, $all_blocks ) {
		$start_marker = '<!-- BLOCK_START:' . $target_block_id . ' -->';
		$end_marker = '<!-- BLOCK_END:' . $target_block_id . ' -->';

		$start_pos = strpos( $content, $start_marker );
		$end_pos = strpos( $content, $end_marker );

		if ( $start_pos !== false && $end_pos !== false ) {
			$start_pos += strlen( $start_marker );
			$block_content = substr( $content, $start_pos, $end_pos - $start_pos );

			// Clean up the content
			$block_content = trim( $block_content );

			// Remove any remaining block markers
			$block_content = preg_replace( '/<!-- BLOCK_(START|END):[^>]+ -->/', '', $block_content );

			return $block_content;
		}

		// Fallback: try to find the block in the original data
		$target_block = $this->find_block_by_id( $all_blocks, $target_block_id );
		if ( $target_block ) {
			return render_block( $target_block );
		}

		return '<!-- Block not found -->';
	}

	/**
	 * Find a block by client ID
	 */
	private function find_block_by_id( $blocks, $target_id ) {
		foreach ( $blocks as $block ) {
			if ( $block['clientId'] === $target_id ) {
				return $block;
			}

			if ( ! empty( $block['innerBlocks'] ) ) {
				$found = $this->find_block_by_id( $block['innerBlocks'], $target_id );
				if ( $found ) {
					return $found;
				}
			}
		}

		return null;
	}

	/**
	 * Get summary of context used in preview
	 */
	private function get_context_summary( $page_context ) {
		$summary = array();

		if ( ! empty( $page_context['postId'] ) ) {
			$summary['post'] = get_post( $page_context['postId'] )->post_title ?? 'Unknown';
		}

		if ( ! empty( $page_context['postMeta'] ) ) {
			$summary['meta_fields'] = count( $page_context['postMeta'] );
		}

		if ( ! empty( $page_context['pageData'] ) ) {
			$summary['page_data_keys'] = array_keys( $page_context['pageData'] );
		}

		if ( ! empty( $page_context['wpUserData'] ) ) {
			$summary['user_data'] = true;
		}

		return $summary;
	}

	/**
	 * Set up dynamic context for individual block processing
	 */
	private function setup_dynamic_context( $context ) {
		global $post, $wp_query;

		// Set up post context
		if ( ! empty( $context['postId'] ) ) {
			$preview_post = get_post( $context['postId'] );
			if ( $preview_post ) {
				$post = $preview_post;
				setup_postdata( $preview_post );

				// Set up query context
				$wp_query->queried_object = $preview_post;
				$wp_query->queried_object_id = $preview_post->ID;
			}
		}

		// Set up user context
		if ( ! empty( $context['currentUser'] ) ) {
			wp_set_current_user( $context['currentUser']['id'] );
		}

		// Add dynamic context to Timber
		if ( ! empty( $context['dynamic_block'] ) ) {
			add_filter( 'timber/context', function( $timber_context ) use ( $context ) {
				// Add preview mode flag
				$timber_context['preview_mode'] = true;
				$timber_context['dynamic_block'] = true;

				// Add page data from editor
				if ( ! empty( $context['pageData'] ) ) {
					$timber_context['page_data'] = $context['pageData'];
				}

				// Add user data from editor
				if ( ! empty( $context['wpUserData'] ) ) {
					$timber_context['user_data'] = $context['wpUserData'];
				}

				// Add test data for preview
				$timber_context['test_array'] = array(
					array( 'name' => 'Item 1', 'value' => 100, 'featured' => true ),
					array( 'name' => 'Item 2', 'value' => 200, 'featured' => false ),
					array( 'name' => 'Item 3', 'value' => 300, 'featured' => true ),
					array( 'name' => 'Item 4', 'value' => 400, 'featured' => false ),
					array( 'name' => 'Item 5', 'value' => 500, 'featured' => true )
				);

				// Add user count for testing
				$timber_context['user_count'] = 42;

				// Add featured status for testing
				$timber_context['is_featured'] = true;

				// Add current date
				$timber_context['today'] = current_time( 'Y-m-d' );

				return $timber_context;
			} );
		}
	}

	/**
	 * Get summary of context used in dynamic preview
	 */
	private function get_dynamic_context_summary( $context ) {
		$summary = array();

		if ( ! empty( $context['postId'] ) ) {
			$post = get_post( $context['postId'] );
			$summary['post'] = $post ? $post->post_title : 'Unknown';
		}

		if ( ! empty( $context['postType'] ) ) {
			$summary['post_type'] = $context['postType'];
		}

		if ( ! empty( $context['currentUser'] ) ) {
			$summary['user'] = $context['currentUser']['display_name'] ?? 'Unknown User';
		}

		if ( ! empty( $context['dynamic_block'] ) ) {
			$summary['dynamic_processing'] = true;
			$summary['test_data'] = 'Available (test_array, user_count, is_featured, today)';
		}

		return $summary;
	}
}

// Initialize the preview API
new Universal_Block_Preview_API();