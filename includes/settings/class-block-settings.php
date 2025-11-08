<?php
/**
 * Block Settings Loader
 *
 * Loads and manages block editor settings from JSON configuration.
 * Checks theme directory first, falls back to plugin example.
 *
 * @package UniversalBlock
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Universal_Block_Settings {

	/**
	 * Cached settings array
	 *
	 * @var array|null
	 */
	private static $settings = null;

	/**
	 * Settings source ('theme', 'plugin', or 'default')
	 *
	 * @var string|null
	 */
	private static $source = null;

	/**
	 * Get block settings
	 *
	 * Loads from theme directory if available, otherwise uses plugin example.
	 * Caches result for performance.
	 *
	 * @return array Block settings configuration
	 */
	public static function get_settings() {
		if ( self::$settings !== null ) {
			return self::$settings;
		}

		self::load_settings();

		return self::$settings;
	}

	/**
	 * Get settings source
	 *
	 * @return string 'theme', 'plugin', or 'default'
	 */
	public static function get_source() {
		if ( self::$source === null ) {
			self::load_settings();
		}

		return self::$source;
	}

	/**
	 * Load settings from file
	 *
	 * Priority:
	 * 1. Active theme: {theme}/settings.json
	 * 2. Plugin example: {plugin}/block-settings.example.json
	 * 3. Hardcoded defaults
	 */
	private static function load_settings() {
		// Try theme directory first
		$theme_file = get_stylesheet_directory() . '/settings.json';

		if ( file_exists( $theme_file ) ) {
			$settings = self::parse_json_file( $theme_file );

			if ( $settings !== null ) {
				self::$settings = self::process_settings( $settings );
				self::$source = 'theme';
				return;
			}
		}

		// Fall back to plugin example
		$plugin_file = UNIVERSAL_BLOCK_PLUGIN_DIR . 'block-settings.example.json';

		if ( file_exists( $plugin_file ) ) {
			$settings = self::parse_json_file( $plugin_file );

			if ( $settings !== null ) {
				self::$settings = self::process_settings( $settings );
				self::$source = 'plugin';
				return;
			}
		}

		// Hardcoded defaults (all enabled)
		self::$settings = self::get_default_settings();
		self::$source = 'default';
	}

	/**
	 * Parse JSON file
	 *
	 * @param string $file_path Path to JSON file
	 * @return array|null Parsed array or null on error
	 */
	private static function parse_json_file( $file_path ) {
		$json_content = file_get_contents( $file_path );

		if ( $json_content === false ) {
			error_log( "Universal Block Settings: Could not read file: {$file_path}" );
			return null;
		}

		$settings = json_decode( $json_content, true );

		if ( json_last_error() !== JSON_ERROR_NONE ) {
			error_log( 'Universal Block Settings: JSON parse error: ' . json_last_error_msg() );
			return null;
		}

		return $settings;
	}

	/**
	 * Process settings
	 *
	 * Handles presets and applies defaults.
	 *
	 * @param array $settings Raw settings from JSON
	 * @return array Processed settings
	 */
	private static function process_settings( $settings ) {
		// Check if activePreset is set
		if ( ! empty( $settings['activePreset'] ) ) {
			$preset = null;

			// First, try to find preset in current settings
			if ( isset( $settings['presets'][ $settings['activePreset'] ] ) ) {
				$preset = $settings['presets'][ $settings['activePreset'] ];
			} else {
				// Fall back to plugin presets
				$plugin_file = UNIVERSAL_BLOCK_PLUGIN_DIR . 'block-settings.example.json';
				if ( file_exists( $plugin_file ) ) {
					$plugin_settings = self::parse_json_file( $plugin_file );
					if ( $plugin_settings && isset( $plugin_settings['presets'][ $settings['activePreset'] ] ) ) {
						$preset = $plugin_settings['presets'][ $settings['activePreset'] ];
					}
				}
			}

			// If we found a preset, merge it with any custom overrides
			if ( $preset ) {
				// Merge preset with any custom overrides in root inspectorControls
				if ( isset( $settings['inspectorControls'] ) ) {
					$preset['inspectorControls'] = array_replace_recursive(
						$preset['inspectorControls'] ?? array(),
						$settings['inspectorControls']
					);
				}

				if ( isset( $settings['blockControls'] ) ) {
					$preset['blockControls'] = array_replace_recursive(
						$preset['blockControls'] ?? array(),
						$settings['blockControls']
					);
				}

				return $preset;
			}
		}

		// No preset - use root config
		return array(
			'inspectorControls' => $settings['inspectorControls'] ?? array(),
			'blockControls' => $settings['blockControls'] ?? array(),
		);
	}

	/**
	 * Get default settings (all enabled)
	 *
	 * @return array Default settings configuration
	 */
	private static function get_default_settings() {
		return array(
			'inspectorControls' => array(
				'plainClassesManager' => array( 'enabled' => true ),
				'dynamicPreviewToggle' => array( 'enabled' => true ),
				'elementSettings' => array( 'enabled' => true ),
				'imageSettings' => array( 'enabled' => true ),
				'linkSettings' => array( 'enabled' => true ),
				'loopControls' => array( 'enabled' => true ),
				'conditionalVisibility' => array( 'enabled' => true ),
				'setVariable' => array( 'enabled' => true ),
			),
			'blockControls' => array(
				'tagNameToolbar' => array( 'enabled' => true ),
				'dynamicPreviewButton' => array( 'enabled' => true ),
			),
		);
	}

	/**
	 * Check if a panel is enabled
	 *
	 * @param string $panel_name Panel identifier (e.g., 'imageSettings')
	 * @return bool True if enabled, false otherwise
	 */
	public static function is_panel_enabled( $panel_name ) {
		$settings = self::get_settings();

		// Check inspectorControls first
		if ( isset( $settings['inspectorControls'][ $panel_name ] ) ) {
			return $settings['inspectorControls'][ $panel_name ]['enabled'] ?? true;
		}

		// Check blockControls
		if ( isset( $settings['blockControls'][ $panel_name ] ) ) {
			return $settings['blockControls'][ $panel_name ]['enabled'] ?? true;
		}

		// Default to enabled if not found
		return true;
	}

	/**
	 * Check if a specific control within a panel is enabled
	 *
	 * @param string $panel_name   Panel identifier
	 * @param string $control_name Control identifier
	 * @return bool True if enabled, false otherwise
	 */
	public static function is_control_enabled( $panel_name, $control_name ) {
		$settings = self::get_settings();

		if ( ! isset( $settings['inspectorControls'][ $panel_name ] ) ) {
			return true; // Default enabled if panel not configured
		}

		$panel = $settings['inspectorControls'][ $panel_name ];

		// Check if panel itself is disabled
		if ( isset( $panel['enabled'] ) && $panel['enabled'] === false ) {
			return false;
		}

		// Check specific control
		if ( isset( $panel['controls'][ $control_name ] ) ) {
			return $panel['controls'][ $control_name ]['enabled'] ?? true;
		}

		// Default enabled if control not configured
		return true;
	}

	/**
	 * Get allowed HTML tags
	 *
	 * @return array Empty array = all allowed, populated array = restricted list
	 */
	public static function get_allowed_tags() {
		$settings = self::get_settings();

		if ( ! isset( $settings['inspectorControls']['elementSettings']['controls']['tagName'] ) ) {
			return array(); // All allowed
		}

		return $settings['inspectorControls']['elementSettings']['controls']['tagName']['allowedTags'] ?? array();
	}

	/**
	 * Get allowed content types
	 *
	 * @return array Content types allowed (blocks, text, html, empty)
	 */
	public static function get_allowed_content_types() {
		$settings = self::get_settings();

		if ( ! isset( $settings['inspectorControls']['elementSettings']['controls']['contentType'] ) ) {
			return array( 'blocks', 'text', 'html', 'empty' ); // All allowed
		}

		return $settings['inspectorControls']['elementSettings']['controls']['contentType']['allowedTypes']
			?? array( 'blocks', 'text', 'html', 'empty' );
	}

	/**
	 * Get allowed post types for link settings
	 *
	 * @return array Empty array = all allowed, populated array = restricted list
	 */
	public static function get_allowed_post_types() {
		$settings = self::get_settings();

		if ( ! isset( $settings['inspectorControls']['linkSettings']['controls']['postTypeSelector'] ) ) {
			return array(); // All allowed
		}

		return $settings['inspectorControls']['linkSettings']['controls']['postTypeSelector']['allowedPostTypes']
			?? array();
	}

	/**
	 * Clear cached settings
	 *
	 * Useful for development/testing.
	 */
	public static function clear_cache() {
		self::$settings = null;
		self::$source = null;
	}
}
