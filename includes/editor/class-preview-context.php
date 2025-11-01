<?php
/**
 * Preview Context Generator
 *
 * Detects the current editing context and generates preview data
 * for the block editor to use with Timber/Twig rendering.
 *
 * @package UniversalBlock
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Universal_Block_Preview_Context {

	/**
	 * Generate preview context for the current page
	 *
	 * @return array Preview context data
	 */
	public static function generate_context() {
		global $post;

		$context = array(
			'type'        => 'unknown',
			'post_type'   => '',
			'post_id'     => 0,
			'template'    => '',
			'is_edit'     => false,
			'settings'    => array(
				'enabled'     => false,
				'auto_detect' => true,
			),
		);

		// Check if we're in the block editor
		if ( ! is_admin() ) {
			return $context;
		}

		// Try to get post ID from various sources
		$post_id = 0;

		// First check URL parameter (most reliable for existing posts)
		if ( isset( $_GET['post'] ) && is_numeric( $_GET['post'] ) ) {
			$post_id = intval( $_GET['post'] );
		}

		// Check global $post
		if ( ! $post_id && isset( $post->ID ) ) {
			$post_id = $post->ID;
		}

		// Check current screen
		$screen = get_current_screen();

		// Detect editing context
		if ( $screen && ( $screen->base === 'post' || strpos( $screen->id, 'edit-' ) !== false ) ) {
			$context['is_edit'] = true;

			if ( $post_id ) {
				$post_object = get_post( $post_id );

				if ( $post_object ) {
					$context['post_id']   = $post_id;
					$context['post_type'] = $post_object->post_type;

					// Determine context type
					if ( $post_object->post_type === 'page' ) {
						// Check if it's the front page
						if ( get_option( 'page_on_front' ) == $post_id ) {
							$context['type'] = 'front_page';
						} elseif ( get_option( 'page_for_posts' ) == $post_id ) {
							$context['type'] = 'posts_page';
						} else {
							$context['type'] = 'singular';
						}
					} elseif ( $post_object->post_type === 'post' ) {
						$context['type'] = 'singular';
					} else {
						// Custom post type
						$context['type'] = 'singular';
					}

					// Get template
					$template = get_page_template_slug( $post_id );
					if ( $template ) {
						$context['template'] = $template;
					}

					// Add post status
					$context['post_status'] = $post_object->post_status;

					// Add additional meta
					$context['meta'] = array(
						'title'        => $post_object->post_title,
						'slug'         => $post_object->post_name,
						'author_id'    => $post_object->post_author,
						'parent_id'    => $post_object->post_parent,
						'menu_order'   => $post_object->menu_order,
						'date_created' => $post_object->post_date,
						'date_modified' => $post_object->post_modified,
					);
				}
			}
		}

		// Check for site editor / FSE
		if ( $screen && $screen->base === 'site-editor' ) {
			$context['type']    = 'template';
			$context['is_edit'] = true;
		}

		// Also process post data even if screen detection fails but we have a post ID
		if ( ! $context['is_edit'] && $post_id > 0 ) {
			$post_object = get_post( $post_id );

			if ( $post_object ) {
				$context['is_edit']   = true;
				$context['post_id']   = $post_id;
				$context['post_type'] = $post_object->post_type;

				// Determine context type
				if ( $post_object->post_type === 'page' ) {
					// Check if it's the front page
					if ( get_option( 'page_on_front' ) == $post_id ) {
						$context['type'] = 'front_page';
					} elseif ( get_option( 'page_for_posts' ) == $post_id ) {
						$context['type'] = 'posts_page';
					} else {
						$context['type'] = 'singular';
					}
				} elseif ( $post_object->post_type === 'post' ) {
					$context['type'] = 'singular';
				} else {
					// Custom post type
					$context['type'] = 'singular';
				}

				// Get template
				$template = get_page_template_slug( $post_id );
				if ( $template ) {
					$context['template'] = $template;
				}

				// Add post status
				$context['post_status'] = $post_object->post_status;

				// Add additional meta
				$context['meta'] = array(
					'title'         => $post_object->post_title,
					'slug'          => $post_object->post_name,
					'author_id'     => $post_object->post_author,
					'parent_id'     => $post_object->post_parent,
					'menu_order'    => $post_object->menu_order,
					'date_created'  => $post_object->post_date,
					'date_modified' => $post_object->post_modified,
				);
			}
		}

		return $context;
	}

	/**
	 * Get preview settings from user meta
	 *
	 * @return array Preview settings
	 */
	public static function get_user_settings() {
		$user_id = get_current_user_id();

		$settings = get_user_meta( $user_id, 'universal_block_preview_settings', true );

		if ( ! is_array( $settings ) ) {
			$settings = array(
				'enabled'     => false,
				'auto_detect' => true,
				'context_type' => '', // Can be overridden: 'singular', 'archive', 'custom'
				'custom_post_id' => 0,
			);
		}

		return $settings;
	}

	/**
	 * Save preview settings to user meta
	 *
	 * @param array $settings Preview settings
	 * @return bool Success
	 */
	public static function save_user_settings( $settings ) {
		$user_id = get_current_user_id();

		return update_user_meta( $user_id, 'universal_block_preview_settings', $settings );
	}

	/**
	 * Generate Timber context based on preview settings
	 *
	 * @param array $preview_context Preview context data
	 * @return array Timber context
	 */
	public static function generate_timber_context( $preview_context ) {
		$timber_context = \Timber\Timber::context();

		// If preview is not enabled or not in edit mode, return base context
		if ( ! $preview_context['settings']['enabled'] || ! $preview_context['is_edit'] ) {
			return $timber_context;
		}

		// Load preview post data
		if ( $preview_context['post_id'] > 0 ) {
			$timber_context['post'] = \Timber\Timber::get_post( $preview_context['post_id'] );
		}

		// Add preview-specific data
		$timber_context['is_preview'] = true;
		$timber_context['preview_type'] = $preview_context['type'];

		return $timber_context;
	}

	/**
	 * Enqueue preview context to editor
	 */
	public static function enqueue_preview_context() {
		// Only enqueue in block editor
		if ( ! is_admin() ) {
			return;
		}

		// Always generate context - it will detect if we're in an edit screen
		$context = self::generate_context();

		// Get user settings
		$settings = self::get_user_settings();
		$context['settings'] = $settings;

		// Always enqueue the context data, even if detection failed
		// This allows the React component to show appropriate messages
		wp_add_inline_script(
			'universal-block-editor',
			'window.universal = window.universal || {};' .
			'window.universal.preview = ' . wp_json_encode( $context ) . ';',
			'before'
		);
	}
}
