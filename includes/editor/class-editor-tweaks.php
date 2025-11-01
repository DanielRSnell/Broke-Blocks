<?php
/**
 * Editor Tweaks - Customizations for the Gutenberg editor interface
 *
 * @package universal-block
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Class EditorTweaks
 *
 * Handles customizations and tweaks for the Gutenberg block editor interface.
 */
class EditorTweaks {

	/**
	 * Initialize the editor tweaks.
	 */
	public static function init() {
		add_action( 'enqueue_block_editor_assets', [ __CLASS__, 'enqueue_editor_assets' ] );
	}

	/**
	 * Enqueue editor-specific assets (CSS/JS).
	 */
	public static function enqueue_editor_assets() {
		// Check if React components exist
		$react_js_file = UNIVERSAL_BLOCK_PLUGIN_URL . 'assets/components/editor-tweaks/universal-editor-tweaks-react.js';
		$react_js_path = UNIVERSAL_BLOCK_PLUGIN_DIR . 'assets/components/editor-tweaks/universal-editor-tweaks-react.js';
		$react_css_file = UNIVERSAL_BLOCK_PLUGIN_URL . 'assets/components/editor-tweaks/universal-editor-tweaks-react.css';
		$react_css_path = UNIVERSAL_BLOCK_PLUGIN_DIR . 'assets/components/editor-tweaks/universal-editor-tweaks-react.css';

		if ( file_exists( $react_js_path ) && file_exists( $react_css_path ) ) {
			// Load legacy assets first (for parser functions)
			self::enqueue_legacy_assets();

			// Enqueue Universal Block API before React
			self::enqueue_universal_block_api();

			// Load React component system (bundled with all dependencies including Remix Icons)
			wp_enqueue_style(
				'universal-editor-tweaks-react',
				$react_css_file,
				[],
				UNIVERSAL_BLOCK_VERSION . '-' . filemtime( $react_css_path )
			);

			wp_enqueue_script(
				'universal-editor-tweaks-react',
				$react_js_file,
				[ 'wp-element', 'wp-components', 'wp-i18n', 'wp-dom-ready', 'universal-block-editor-tweaks-js', 'universal-block-api' ],
				UNIVERSAL_BLOCK_VERSION . '-' . filemtime( $react_js_path ),
				true
			);
		} else {
			// Fallback to legacy system only
			self::enqueue_legacy_assets();

			// Always enqueue Universal Block API
			self::enqueue_universal_block_api();
		}
	}

	/**
	 * Enqueue legacy editor assets (fallback).
	 */
	private static function enqueue_legacy_assets() {
		// Enqueue Lucide Icons CDN
		wp_enqueue_script(
			'lucide-icons',
			'https://unpkg.com/lucide@0.454.0/dist/umd/lucide.min.js',
			[],
			'0.454.0',
			true
		);

		// Enqueue Appender CSS (always load for better appender experience)
		$appender_css_file = UNIVERSAL_BLOCK_PLUGIN_URL . 'assets/editor/appender.css';
		$appender_css_path = UNIVERSAL_BLOCK_PLUGIN_DIR . 'assets/editor/appender.css';

		if ( file_exists( $appender_css_path ) ) {
			wp_enqueue_style(
				'universal-block-appender',
				$appender_css_file,
				[],
				UNIVERSAL_BLOCK_VERSION
			);
		}

		// Enqueue Appender JS (always load for better appender experience)
		$appender_js_file = UNIVERSAL_BLOCK_PLUGIN_URL . 'assets/editor/appender.js';
		$appender_js_path = UNIVERSAL_BLOCK_PLUGIN_DIR . 'assets/editor/appender.js';

		if ( file_exists( $appender_js_path ) ) {
			wp_enqueue_script(
				'universal-block-appender',
				$appender_js_file,
				[ 'wp-dom-ready', 'wp-data' ],
				UNIVERSAL_BLOCK_VERSION,
				true
			);
		}

		$css_file = UNIVERSAL_BLOCK_PLUGIN_URL . 'assets/editor/editor-tweaks.css';
		$css_path = UNIVERSAL_BLOCK_PLUGIN_DIR . 'assets/editor/editor-tweaks.css';

		// Enqueue CSS if it exists
		if ( file_exists( $css_path ) ) {
			wp_enqueue_style(
				'universal-block-editor-tweaks',
				$css_file,
				[],
				UNIVERSAL_BLOCK_VERSION
			);
		}

		$js_file = UNIVERSAL_BLOCK_PLUGIN_URL . 'assets/editor/editor-tweaks.js';
		$js_path = UNIVERSAL_BLOCK_PLUGIN_DIR . 'assets/editor/editor-tweaks.js';

		// Enqueue JavaScript if it exists
		if ( file_exists( $js_path ) ) {
			// Use file modification time for cache busting in development
			$version = defined( 'WP_DEBUG' ) && WP_DEBUG ? filemtime( $js_path ) : UNIVERSAL_BLOCK_VERSION;

			wp_enqueue_script(
				'universal-block-editor-tweaks-js',
				$js_file,
				[ 'wp-blocks', 'wp-editor', 'wp-element', 'wp-dom-ready', 'lucide-icons' ],
				$version,
				true
			);
		}
	}


	/**
	 * Enqueue Universal Block API for global access.
	 */
	private static function enqueue_universal_block_api() {
		$api_file = UNIVERSAL_BLOCK_PLUGIN_URL . 'assets/js/universal-block-api.js';
		$api_path = UNIVERSAL_BLOCK_PLUGIN_DIR . 'assets/js/universal-block-api.js';

		// Enqueue API if it exists
		if ( file_exists( $api_path ) ) {
			wp_enqueue_script(
				'universal-block-api',
				$api_file,
				[ 'wp-blocks', 'wp-data', 'wp-dom-ready' ],
				UNIVERSAL_BLOCK_VERSION,
				true
			);
		}
	}

	/**
	 * Add custom sidebar to Gutenberg interface.
	 *
	 * This creates a 60px wide sidebar in the editor interface.
	 */
	public static function add_custom_sidebar() {
		// This will be implemented via CSS for now
		// Future: Could be enhanced with React components if needed
	}
}