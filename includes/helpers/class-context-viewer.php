<?php
/**
 * Context Viewer Widget
 *
 * Displays a frontend widget when ?context=true is in the URL
 * Shows the Timber context as JSON in a read-only Ace editor
 *
 * @package UniversalBlock
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Universal_Block_Context_Viewer {

	/**
	 * Initialize the context viewer
	 */
	public static function init() {
		// Only load on frontend with ?context=true
		if ( ! is_admin() && isset( $_GET['context'] ) && $_GET['context'] === 'true' ) {
			add_action( 'wp_enqueue_scripts', array( __CLASS__, 'enqueue_assets' ) );
			add_action( 'wp_footer', array( __CLASS__, 'render_widget' ) );
		}
	}

	/**
	 * Enqueue assets for the context viewer
	 */
	public static function enqueue_assets() {
		// Enqueue Ace Editor
		wp_enqueue_script(
			'ace-editor',
			UNIVERSAL_BLOCK_PLUGIN_URL . 'assets/global/ace/src-min-noconflict/ace.js',
			array(),
			UNIVERSAL_BLOCK_VERSION,
			true
		);

		// Enqueue context viewer CSS
		wp_enqueue_style(
			'universal-context-viewer',
			UNIVERSAL_BLOCK_PLUGIN_URL . 'assets/frontend/context-viewer.css',
			array(),
			UNIVERSAL_BLOCK_VERSION
		);

		// Enqueue context viewer JS
		wp_enqueue_script(
			'universal-context-viewer',
			UNIVERSAL_BLOCK_PLUGIN_URL . 'assets/frontend/context-viewer.js',
			array( 'ace-editor' ),
			UNIVERSAL_BLOCK_VERSION,
			true
		);
	}

	/**
	 * Serialize context for JSON output
	 * Handles Timber objects and prevents circular references
	 */
	private static function serialize_context( $data, $depth = 0, &$seen = array() ) {
		// Prevent infinite recursion
		if ( $depth > 5 ) {
			return '[max depth reached]';
		}

		// Handle arrays
		if ( is_array( $data ) ) {
			$result = array();
			foreach ( $data as $key => $value ) {
				$result[ $key ] = self::serialize_context( $value, $depth + 1, $seen );
			}
			return $result;
		}

		// Handle objects
		if ( is_object( $data ) ) {
			$hash = spl_object_hash( $data );

			// Check for circular reference
			if ( isset( $seen[ $hash ] ) ) {
				return '[circular reference]';
			}

			$seen[ $hash ] = true;

			// Get class name for type detection
			$class_name = get_class( $data );

			// Handle Timber\Post
			if ( strpos( $class_name, 'Timber\Post' ) !== false || is_a( $data, 'Timber\Post' ) ) {
				$result = array(
					'_type' => 'Timber\Post',
					'ID' => $data->ID ?? null,
					'post_title' => $data->post_title ?? $data->title ?? null,
					'post_name' => $data->post_name ?? $data->slug ?? null,
					'post_type' => $data->post_type ?? null,
					'post_status' => $data->post_status ?? null,
					'post_date' => $data->post_date ?? null,
					'post_excerpt' => isset( $data->post_excerpt ) ? wp_trim_words( $data->post_excerpt, 20 ) : null,
					'link' => method_exists( $data, 'link' ) ? $data->link() : null,
					'thumbnail' => method_exists( $data, 'thumbnail' ) ? '[Image]' : null,
					'categories' => method_exists( $data, 'categories' ) ? '[Categories]' : null,
					'tags' => method_exists( $data, 'tags' ) ? '[Tags]' : null,
				);
				unset( $seen[ $hash ] );
				return $result;
			}

			// Handle Timber\User
			if ( strpos( $class_name, 'Timber\User' ) !== false || is_a( $data, 'Timber\User' ) ) {
				$result = array(
					'_type' => 'Timber\User',
					'ID' => $data->ID ?? null,
					'user_login' => $data->user_login ?? null,
					'display_name' => $data->display_name ?? null,
					'user_email' => $data->user_email ?? null,
					'roles' => $data->roles ?? null,
				);
				unset( $seen[ $hash ] );
				return $result;
			}

			// Handle Timber\Site
			if ( strpos( $class_name, 'Timber\Site' ) !== false || is_a( $data, 'Timber\Site' ) ) {
				$result = array(
					'_type' => 'Timber\Site',
					'name' => $data->name ?? null,
					'title' => $data->title ?? null,
					'url' => $data->url ?? null,
					'description' => $data->description ?? null,
					'admin_email' => $data->admin_email ?? null,
					'language' => $data->language ?? null,
					'charset' => $data->charset ?? null,
				);
				unset( $seen[ $hash ] );
				return $result;
			}

			// Handle Timber\Term
			if ( strpos( $class_name, 'Timber\Term' ) !== false || is_a( $data, 'Timber\Term' ) ) {
				$result = array(
					'_type' => 'Timber\Term',
					'id' => $data->id ?? $data->term_id ?? null,
					'name' => $data->name ?? null,
					'slug' => $data->slug ?? null,
					'taxonomy' => $data->taxonomy ?? null,
					'description' => $data->description ?? null,
					'link' => method_exists( $data, 'link' ) ? $data->link() : null,
				);
				unset( $seen[ $hash ] );
				return $result;
			}

			// Handle Timber\Image
			if ( strpos( $class_name, 'Timber\Image' ) !== false || is_a( $data, 'Timber\Image' ) ) {
				$result = array(
					'_type' => 'Timber\Image',
					'ID' => $data->ID ?? null,
					'src' => $data->src ?? null,
					'alt' => $data->alt ?? null,
					'width' => $data->width ?? null,
					'height' => $data->height ?? null,
				);
				unset( $seen[ $hash ] );
				return $result;
			}

			// Handle other Timber objects with to_array()
			if ( method_exists( $data, 'to_array' ) ) {
				$array = $data->to_array();
				$array['_type'] = $class_name;
				$result = self::serialize_context( $array, $depth + 1, $seen );
				unset( $seen[ $hash ] );
				return $result;
			}

			// Handle WP_Post
			if ( $data instanceof WP_Post ) {
				$result = array(
					'_type' => 'WP_Post',
					'ID' => $data->ID,
					'post_title' => $data->post_title,
					'post_name' => $data->post_name,
					'post_type' => $data->post_type,
					'post_status' => $data->post_status,
					'post_date' => $data->post_date,
				);
				unset( $seen[ $hash ] );
				return $result;
			}

			// Handle WP_User
			if ( $data instanceof WP_User ) {
				$result = array(
					'_type' => 'WP_User',
					'ID' => $data->ID,
					'user_login' => $data->user_login,
					'display_name' => $data->display_name,
					'user_email' => $data->user_email,
					'roles' => $data->roles,
				);
				unset( $seen[ $hash ] );
				return $result;
			}

			// Handle generic objects with __toString (but add type info)
			if ( method_exists( $data, '__toString' ) ) {
				unset( $seen[ $hash ] );
				return array(
					'_type' => $class_name,
					'_value' => (string) $data,
				);
			}

			// Try to get public properties
			$result = array(
				'_type' => $class_name,
			);
			$reflection = new ReflectionClass( $data );
			$properties = $reflection->getProperties( ReflectionProperty::IS_PUBLIC );

			foreach ( $properties as $property ) {
				$name = $property->getName();
				try {
					$result[ $name ] = self::serialize_context( $property->getValue( $data ), $depth + 1, $seen );
				} catch ( Exception $e ) {
					$result[ $name ] = '[error reading property]';
				}
			}

			unset( $seen[ $hash ] );
			return $result;
		}

		// Return primitive types as-is
		return $data;
	}

	/**
	 * Render the context data as JSON in a script tag
	 */
	public static function render_widget() {
		if ( ! class_exists( '\Timber\Timber' ) ) {
			return;
		}

		// Get Timber context
		$context = \Timber\Timber::context();

		// Add state to context
		$context['state'] = $context;

		// Convert Timber objects to arrays for JSON serialization
		$context_data = self::serialize_context( $context );

		// Output JSON in script tag for JavaScript to read
		?>
		<script type="application/json" id="timber-context">
		<?php echo wp_json_encode( $context_data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES ); ?>
		</script>
		<?php
	}
}
