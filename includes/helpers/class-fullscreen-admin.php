<?php
/**
 * Fullscreen Admin Mode
 *
 * Provides a distraction-free fullscreen admin interface when ?mode=full is added to the URL.
 *
 * @package universal-block
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Class Fullscreen_Admin
 *
 * Handles fullscreen admin mode functionality.
 */
class Fullscreen_Admin {

	/**
	 * Initialize the fullscreen admin mode.
	 */
	public static function init() {
		add_action( 'admin_print_styles', [ __CLASS__, 'inject_fullscreen_styles' ] );
	}

	/**
	 * Inject fullscreen admin styles and scripts when mode=full is present.
	 */
	public static function inject_fullscreen_styles() {
		// Check only for fullscreen mode parameter
		if ( ! isset( $_GET['mode'] ) || $_GET['mode'] !== 'full' ) {
			return;
		}

		// Add the full-screen class to body
		add_filter( 'admin_body_class', function ( $classes ) {
			return $classes . ' full-screen';
		} );

		// Add fullscreen styles
		self::output_styles();

		// Add JavaScript to persist mode=full across admin links
		self::output_scripts();
	}

	/**
	 * Output fullscreen mode styles.
	 */
	private static function output_styles() {
		?>
		<style>
			:root {
				--background: hsl(240 10% 3.9%);
			}

			html {
				margin-top: 0 !important;
				padding-top: 0 !important;
			}

			.notice {
				display: none !important;
			}

			body.full-screen #wpadminbar {
				display: none !important;
			}

			body.full-screen #adminmenuback,
			body.full-screen #adminmenuwrap {
				display: none !important;
			}

			body.full-screen #wpcontent,
			body.full-screen #wpfooter {
				margin-left: 0 !important;
			}

			#wpfooter {
				display: none !important;
			}

			#wpcontent,
			#wpbody,
			#wpbody-content {
				height: 100% !important;
			}

			/* WindPress app specific adjustments */
			#windpress-app .max-h\:calc\(100vh-80px-var\(--wp-admin--admin-bar--height\)\) {
				height: 100vh !important;
			}

			#windpress-app .h\:calc\(100vh-80px-var\(--wp-admin--admin-bar--height\)\) {
				height: 100vh !important;
			}

			#windpress-app {
				padding: 0 !important;
				margin: 0 !important;
			}

			#windpress-app > div {
				top: 0 !important;
				left: 0 !important;
			}

			.acf-form-fields::-webkit-scrollbar {
				display: none;
			}

			#windpress-app .px\:40 {
				padding-left: 0 !important;
				padding-right: 0 !important;
			}

			#windpress-app .max-h\:calc\(100vh-80px-var\(--wp-admin--admin-bar--height\)\) {
				max-height: 100vh !important;
			}

			#windpress-app .my\:40 {
				margin-top: 0 !important;
				margin-bottom: 0 !important;
			}
		</style>
		<?php
	}

	/**
	 * Output JavaScript to persist mode=full across admin navigation.
	 */
	private static function output_scripts() {
		?>
		<script>
			document.addEventListener('DOMContentLoaded', function() {
				function updateAdminLinks() {
					// Get all links in the admin area
					const adminLinks = document.querySelectorAll('a');

					adminLinks.forEach(function(link) {
						const href = link.getAttribute('href');

						// Skip if no href, or if it's an external link, or already has mode=full
						if (!href ||
							(href.startsWith('http') && !href.includes(window.location.hostname)) ||
							href.includes('mode=full')) {
							return;
						}

						// Parse the URL to handle hash fragments properly
						let url = href;
						let hash = '';

						// Extract hash if present
						const hashIndex = url.indexOf('#');
						if (hashIndex !== -1) {
							hash = url.substring(hashIndex);
							url = url.substring(0, hashIndex);
						}

						// Add mode=full to the URL
						const separator = url.includes('?') ? '&' : '?';
						const newHref = url + separator + 'mode=full' + hash;

						link.setAttribute('href', newHref);
					});
				}

				// Initial update
				updateAdminLinks();

				// Watch for dynamic content changes (for SPAs like WindPress)
				const observer = new MutationObserver(function(mutations) {
					mutations.forEach(function(mutation) {
						if (mutation.addedNodes.length) {
							updateAdminLinks();
						}
					});
				});

				// Start observing the document with the configured parameters
				observer.observe(document.body, {
					childList: true,
					subtree: true
				});
			});
		</script>
		<?php
	}
}
