<?php
/**
 * Twig Helper Functions
 *
 * @package universal-block
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Magic function wrapper for Twig
 */
class TwigMagicFunction {
	public function __call( $name, $arguments ) {
		if ( function_exists( $name ) ) {
			return call_user_func_array( $name, $arguments );
		}
		return null;
	}
}

/**
 * Timber wrapper for Twig
 */
class TwigTimberWrapper {
	public function __call( $name, $arguments ) {
		return call_user_func_array( array( '\Timber\Timber', $name ), $arguments );
	}
}

/**
 * Add magic functions to Timber context
 */
add_filter( 'timber/context', function ( $context ) {
	$context['fun'] = new TwigMagicFunction();
	$context['timber'] = new TwigTimberWrapper();
	return $context;
} );
