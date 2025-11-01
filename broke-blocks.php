<?php
/**
 * Plugin Name:       Broke Blocks
 * Description:       A designless polymorphic block that can be any HTML element.
 * Requires at least: 6.0
 * Requires PHP:      7.4
 * Version:           0.2.0
 * Author:            Broke
 * Author URI:        https://broke.dev
 * License:           GPL-2.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       universal-block
 * Domain Path:       /languages
 *
 * @package           universal-block
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

// Load Composer dependencies.
require_once __DIR__ . '/vendor/autoload.php';

// Initialize Timber.
if ( ! class_exists( '\Timber\Timber' ) ) {
	\Timber\Timber::init();
}

// Add custom Twig function for calling PHP functions/methods
// add_filter( 'timber/twig', function( $twig ) {
// 	// Add fn() function to call any callable
// 	$twig->addFunction( new \Twig\TwigFunction( 'fn', function( $callable, ...$args ) {
// 		if ( is_string( $callable ) && strpos( $callable, '::' ) !== false ) {
// 			// Handle Class::method syntax
// 			$parts = explode( '::', $callable );
// 			if ( count( $parts ) === 2 && class_exists( $parts[0] ) && method_exists( $parts[0], $parts[1] ) ) {
// 				return call_user_func_array( [ $parts[0], $parts[1] ], $args );
// 			}
// 		} elseif ( is_callable( $callable ) ) {
// 			return call_user_func_array( $callable, $args );
// 		}
// 		return null;
// 	} ) );

// 	return $twig;
// } );

define( 'UNIVERSAL_BLOCK_VERSION', '0.2.1' );
define( 'UNIVERSAL_BLOCK_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
define( 'UNIVERSAL_BLOCK_PLUGIN_URL', plugin_dir_url( __FILE__ ) );

/**
 * Registers the block using the metadata loaded from the `block.json` file.
 * Behind the scenes, it registers also all assets so they can be enqueued
 * through the block editor in the corresponding context.
 *
 * @see https://developer.wordpress.org/reference/functions/register_block_type/
 */
function universal_block_init() {
	register_block_type( __DIR__ . '/block.json' );
}
add_action( 'init', 'universal_block_init' );

/**
 * Remove the automatic wp-block-{name} class from universal/element blocks
 */
function universal_block_remove_default_class( $generated_class_name, $block_name ) {
	if ( 'universal/element' === $block_name ) {
		return '';
	}
	return $generated_class_name;
}
add_filter( 'block_default_classname', 'universal_block_remove_default_class', 10, 2 );

/**
 * Load plugin text domain for translations.
 */
function universal_block_load_textdomain() {
	load_plugin_textdomain(
		'universal-block',
		false,
		dirname( plugin_basename( __FILE__ ) ) . '/languages'
	);
}
add_action( 'init', 'universal_block_load_textdomain' );

/**
 * Enqueue block assets for the editor.
 */
function universal_block_enqueue_block_editor_assets() {
	$asset_file = include( UNIVERSAL_BLOCK_PLUGIN_DIR . 'build/index.asset.php' );

	// Enqueue Ace Editor
	wp_enqueue_script(
		'ace-editor',
		UNIVERSAL_BLOCK_PLUGIN_URL . 'assets/global/ace/src-min-noconflict/ace.js',
		array(),
		UNIVERSAL_BLOCK_VERSION
	);

	// Enqueue Ace Emmet extension
	wp_enqueue_script(
		'ace-ext-emmet',
		UNIVERSAL_BLOCK_PLUGIN_URL . 'assets/global/ace/src-min-noconflict/ext-emmet.js',
		array( 'ace-editor' ),
		UNIVERSAL_BLOCK_VERSION
	);

	// Enqueue Ace Beautify extension
	wp_enqueue_script(
		'ace-ext-beautify',
		UNIVERSAL_BLOCK_PLUGIN_URL . 'assets/global/ace/src-min-noconflict/ext-beautify.js',
		array( 'ace-editor' ),
		UNIVERSAL_BLOCK_VERSION
	);

	// Enqueue HTML Beautifier
	wp_enqueue_script(
		'js-beautify-html',
		UNIVERSAL_BLOCK_PLUGIN_URL . 'assets/global/js-beautify/beautify-html.min.js',
		array(),
		UNIVERSAL_BLOCK_VERSION
	);

	// Enqueue Emmet
	wp_enqueue_script(
		'emmet-core',
		UNIVERSAL_BLOCK_PLUGIN_URL . 'assets/global/emmet-core/emmet.js',
		array(),
		UNIVERSAL_BLOCK_VERSION
	);

	// Enqueue HTML to Blocks Parser
	wp_enqueue_script(
		'universal-html2blocks',
		UNIVERSAL_BLOCK_PLUGIN_URL . 'lib/html2blocks.js',
		array(),
		UNIVERSAL_BLOCK_VERSION
	);

	// Enqueue Blocks to HTML Parser
	wp_enqueue_script(
		'universal-blocks2html',
		UNIVERSAL_BLOCK_PLUGIN_URL . 'lib/blocks2html.js',
		array(),
		UNIVERSAL_BLOCK_VERSION
	);

	wp_enqueue_script(
		'universal-block-editor',
		UNIVERSAL_BLOCK_PLUGIN_URL . 'build/index.js',
		array_merge( $asset_file['dependencies'], array( 'ace-editor', 'js-beautify-html', 'emmet-core', 'universal-html2blocks', 'universal-blocks2html' ) ),
		UNIVERSAL_BLOCK_VERSION
	);

	// Pass preview data to the editor
	wp_localize_script( 'universal-block-editor', 'ubPreviewData', array(
		'apiUrl' => rest_url( 'universal-block/v1/' ),
		'nonce' => wp_create_nonce( 'wp_rest' ),
		'pageData' => apply_filters( 'universal_block_page_data', array() ),
		'debugMode' => defined( 'WP_DEBUG' ) && WP_DEBUG
	) );

	if ( file_exists( UNIVERSAL_BLOCK_PLUGIN_DIR . 'build/index.css' ) ) {
		wp_enqueue_style(
			'universal-block-editor-style',
			UNIVERSAL_BLOCK_PLUGIN_URL . 'build/index.css',
			array(),
			UNIVERSAL_BLOCK_VERSION
		);
	}
}
add_action( 'enqueue_block_editor_assets', 'universal_block_enqueue_block_editor_assets' );

/**
 * Include additional functionality.
 */
require_once UNIVERSAL_BLOCK_PLUGIN_DIR . 'includes/admin/class-admin.php';
require_once UNIVERSAL_BLOCK_PLUGIN_DIR . 'includes/editor/class-editor-tweaks.php';
require_once UNIVERSAL_BLOCK_PLUGIN_DIR . 'includes/editor/class-preview-context.php';
require_once UNIVERSAL_BLOCK_PLUGIN_DIR . 'includes/parser/class-dynamic-tag-parser.php';
require_once UNIVERSAL_BLOCK_PLUGIN_DIR . 'includes/api/class-preview-api.php';
require_once UNIVERSAL_BLOCK_PLUGIN_DIR . 'includes/api/class-preview-settings-api.php';
require_once UNIVERSAL_BLOCK_PLUGIN_DIR . 'includes/blocks/class-block-processor.php';
require_once UNIVERSAL_BLOCK_PLUGIN_DIR . 'includes/twig/class-twig-helpers.php';
require_once UNIVERSAL_BLOCK_PLUGIN_DIR . 'includes/helpers/class-fullscreen-admin.php';
require_once UNIVERSAL_BLOCK_PLUGIN_DIR . 'includes/helpers/class-context-viewer.php';

/**
 * Initialize editor tweaks.
 */
EditorTweaks::init();

/**
 * Initialize fullscreen admin mode.
 */
Fullscreen_Admin::init();

/**
 * Initialize context viewer (frontend only, with ?context=true).
 */
Universal_Block_Context_Viewer::init();

/**
 * Enqueue preview context to editor.
 */
add_action( 'enqueue_block_editor_assets', array( 'Universal_Block_Preview_Context', 'enqueue_preview_context' ) );

/**
 * Process Twig and dynamic tags in block output
 * This runs for each individual block as it's rendered
 */
add_filter( 'render_block', array( 'Universal_Block_Processor', 'process_block' ), 10, 2 );

/**
 * Disable WordPress filters that break Twig syntax
 * Priority 8 runs before most content filters
 */
add_filter( 'the_content', function( $content ) {
	// Check if content has Twig syntax or DSL tags
	if ( preg_match( '/\{[{%].*?[}%]\}|<(set|loop|if)\s+/i', $content ) ) {
		// Remove filters that break Twig syntax
		remove_filter( 'the_content', 'wptexturize' );
		remove_filter( 'the_content', 'wpautop' );
		remove_filter( 'the_content', 'wp_filter_content_tags' );
	}
	return $content;
}, 8 );

/**
 * Also process the_content for classic themes
 * Priority 11 runs after do_blocks() at priority 9.
 */
add_filter( 'the_content', array( 'Universal_Block_Processor', 'process_content' ), 11 );

/**
 * Start output buffering to capture entire page HTML (including FSE template parts)
 * This runs early in the WordPress lifecycle, only on frontend
 */
add_action( 'template_redirect', function() {
	// Only buffer on frontend (not admin, not AJAX, not REST API)
	if ( is_admin() || wp_doing_ajax() || ( defined( 'REST_REQUEST' ) && REST_REQUEST ) ) {
		return;
	}

	// Only buffer if Timber is available
	if ( ! class_exists( '\Timber\Timber' ) ) {
		return;
	}

	// Start output buffering (without callback for now)
	ob_start();
}, 1 );

/**
 * Process the entire page HTML output (FSE + content) with Twig compilation
 * This runs at the very end, capturing all rendered output including FSE template parts
 * Priority 100 allows ShortPixel (priority 10) to wrap our buffer, then we compile after
 */
add_action( 'shutdown', function() {
	// Only process on frontend
	if ( is_admin() || wp_doing_ajax() || ( defined( 'REST_REQUEST' ) && REST_REQUEST ) ) {
		return;
	}

	// Only process if Timber is available
	if ( ! class_exists( '\Timber\Timber' ) ) {
		return;
	}

	// Collect all output buffer levels (in case other plugins also use buffering)
	$final_html = '';
	$levels = ob_get_level();

	// Get all buffer contents
	for ( $i = 0; $i < $levels; $i++ ) {
		$buffer = ob_get_clean();
		if ( $buffer !== false ) {
			$final_html = $buffer . $final_html; // Prepend since we're going backwards
		}
	}

	// If no buffered content, bail
	if ( empty( $final_html ) ) {
		return;
	}

	// Only compile if HTML contains Twig syntax
	if ( ! preg_match( '/\{[{%].*?[}%]\}/', $final_html ) ) {
		echo $final_html;
		return;
	}

	try {
		// Get Timber context
		$context = \Timber\Timber::context();

		// Compile Twig
		echo \Timber\Timber::compile_string( $final_html, $context );

	} catch ( Exception $e ) {
		// Log error
		error_log( 'Universal Block Twig error: ' . $e->getMessage() );

		// Show error if debug mode
		if ( defined( 'WP_DEBUG' ) && WP_DEBUG && defined( 'WP_DEBUG_DISPLAY' ) && WP_DEBUG_DISPLAY ) {
			echo '<div style="background: #ffebee; border: 2px solid #c62828; padding: 20px; margin: 20px; font-family: monospace;">';
			echo '<h2 style="color: #c62828; margin-top: 0;">Twig Compilation Error</h2>';
			echo '<p><strong>Message:</strong> ' . esc_html( $e->getMessage() ) . '</p>';
			echo '<p><strong>File:</strong> ' . esc_html( $e->getFile() ) . '</p>';
			echo '<p><strong>Line:</strong> ' . esc_html( $e->getLine() ) . '</p>';
			echo '</div>';
		}

		// Output original HTML
		echo $final_html;
	}
}, 0 ); // Priority 0 = run as early as possible during shutdown