<?php
/**
 * Preview Settings REST API
 *
 * Handles saving and retrieving preview settings for the block editor.
 *
 * @package UniversalBlock
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Universal_Block_Preview_Settings_API {

	/**
	 * Register REST routes
	 */
	public static function register_routes() {
		register_rest_route(
			'universal-block/v1',
			'/preview-settings',
			array(
				'methods'             => 'GET',
				'callback'            => array( __CLASS__, 'get_settings' ),
				'permission_callback' => array( __CLASS__, 'check_permissions' ),
			)
		);

		register_rest_route(
			'universal-block/v1',
			'/preview-settings',
			array(
				'methods'             => 'POST',
				'callback'            => array( __CLASS__, 'save_settings' ),
				'permission_callback' => array( __CLASS__, 'check_permissions' ),
				'args'                => array(
					'enabled'      => array(
						'type'     => 'boolean',
						'required' => false,
					),
					'auto_detect'  => array(
						'type'     => 'boolean',
						'required' => false,
					),
					'source_type'  => array(
						'type'     => 'string',
						'required' => false,
					),
					'context_type' => array(
						'type'     => 'string',
						'required' => false,
					),
					'post_type'    => array(
						'type'     => 'string',
						'required' => false,
					),
					'post_id'      => array(
						'type'     => 'integer',
						'required' => false,
					),
					'taxonomy'     => array(
						'type'     => 'string',
						'required' => false,
					),
					'term_id'      => array(
						'type'     => 'integer',
						'required' => false,
					),
					'woo_page'     => array(
						'type'     => 'string',
						'required' => false,
					),
				),
			)
		);
	}

	/**
	 * Check permissions for REST API
	 */
	public static function check_permissions() {
		return current_user_can( 'edit_posts' );
	}

	/**
	 * Get preview settings
	 */
	public static function get_settings( $request ) {
		$settings = Universal_Block_Preview_Context::get_user_settings();

		return rest_ensure_response( $settings );
	}

	/**
	 * Save preview settings
	 */
	public static function save_settings( $request ) {
		$settings = $request->get_params();

		// Remove any non-setting params
		unset( $settings['_locale'] );

		$success = Universal_Block_Preview_Context::save_user_settings( $settings );

		if ( $success ) {
			return rest_ensure_response(
				array(
					'success'  => true,
					'settings' => $settings,
				)
			);
		}

		return new WP_Error(
			'save_failed',
			__( 'Failed to save preview settings', 'universal-block' ),
			array( 'status' => 500 )
		);
	}
}

// Register routes
add_action( 'rest_api_init', array( 'Universal_Block_Preview_Settings_API', 'register_routes' ) );
