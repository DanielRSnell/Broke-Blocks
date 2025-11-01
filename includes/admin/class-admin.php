<?php
/**
 * Admin functionality for Universal Block.
 *
 * @package universal-block
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Universal_Block_Admin {

	/**
	 * Constructor.
	 */
	public function __construct() {
		add_action( 'admin_init', array( $this, 'admin_init' ) );
		add_action( 'admin_menu', array( $this, 'admin_menu' ) );
	}

	/**
	 * Initialize admin functionality.
	 */
	public function admin_init() {
		// Register settings if needed
	}

	/**
	 * Add admin menu items.
	 */
	public function admin_menu() {
		// Add settings page if needed in the future
	}

	/**
	 * Get plugin information.
	 *
	 * @return array Plugin information.
	 */
	public static function get_plugin_info() {
		return array(
			'name'        => __( 'Universal Block', 'universal-block' ),
			'version'     => UNIVERSAL_BLOCK_VERSION,
			'description' => __( 'A designless polymorphic block that can be any HTML element.', 'universal-block' ),
		);
	}
}

new Universal_Block_Admin();