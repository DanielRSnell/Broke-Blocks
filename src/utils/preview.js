/**
 * Preview Utilities
 * Helper functions for dynamic block preview functionality
 */

import apiFetch from '@wordpress/api-fetch';

/**
 * Extract preview context from window object
 *
 * @return {Object} Preview context for API requests
 */
export function extractPreviewContext() {
	const preview = window.universal?.preview || {};
	const ubData = window.ubPreviewData || {};

	return {
		postId: preview.post_id || 0,
		postType: preview.post_type || 'page',
		currentUser: preview.meta?.author || {},
		type: preview.type || 'singular',
		settings: preview.settings || {},
		meta: preview.meta || {},
		dynamic_block: true,
	};
}

/**
 * Serialize a block and its children to WordPress block markup
 *
 * @param {string} clientId Block client ID
 * @return {string} Serialized block markup
 */
export function serializeBlockForPreview(clientId) {
	const { getBlock } = wp.data.select('core/block-editor');
	const blockData = getBlock(clientId);

	if (!blockData) {
		throw new Error('Block not found');
	}

	// Serialize the block using WordPress function
	return wp.blocks.serialize(blockData);
}

/**
 * Fetch dynamic preview HTML from the server
 *
 * @param {string} blockMarkup Serialized block markup
 * @param {string} blockId     Block client ID
 * @param {Object} context     Preview context
 * @return {Promise<Object>} API response with compiled HTML
 */
export async function fetchDynamicPreview(blockMarkup, blockId, context) {
	try {
		const response = await apiFetch({
			path: '/universal-block/v1/dynamic-preview',
			method: 'POST',
			data: {
				blockContent: blockMarkup,
				blockId: blockId,
				context: context,
			},
		});

		if (!response.success) {
			throw new Error(response.message || 'Preview generation failed');
		}

		return response;
	} catch (error) {
		// Enhance error message for common issues
		if (error.message.includes('Twig')) {
			throw new Error(`Twig Syntax Error: ${error.message}`);
		}
		if (error.message.includes('fetch')) {
			throw new Error('Network error: Unable to fetch preview');
		}
		throw error;
	}
}

/**
 * Generate a cache key for preview results
 *
 * @param {string} blockMarkup Serialized block markup
 * @param {Object} context     Preview context
 * @return {string} Cache key hash
 */
export function generatePreviewCacheKey(blockMarkup, context) {
	// Simple hash function for cache keys
	const str = blockMarkup + JSON.stringify(context);
	let hash = 0;

	for (let i = 0; i < str.length; i++) {
		const char = str.charCodeAt(i);
		hash = (hash << 5) - hash + char;
		hash = hash & hash; // Convert to 32-bit integer
	}

	return `preview_${Math.abs(hash)}`;
}

/**
 * Simple in-memory cache for preview results
 */
class PreviewCache {
	constructor(maxSize = 50, ttl = 300000) {
		// 5 minutes TTL
		this.cache = new Map();
		this.maxSize = maxSize;
		this.ttl = ttl;
	}

	get(key) {
		const item = this.cache.get(key);

		if (!item) {
			return null;
		}

		// Check if expired
		if (Date.now() - item.timestamp > this.ttl) {
			this.cache.delete(key);
			return null;
		}

		return item.value;
	}

	set(key, value) {
		// Remove oldest item if cache is full
		if (this.cache.size >= this.maxSize) {
			const firstKey = this.cache.keys().next().value;
			this.cache.delete(firstKey);
		}

		this.cache.set(key, {
			value,
			timestamp: Date.now(),
		});
	}

	clear() {
		this.cache.clear();
	}

	has(key) {
		return this.cache.has(key);
	}
}

// Export singleton instance
export const previewCache = new PreviewCache();

/**
 * Check if preview context is available
 *
 * @return {boolean} True if preview context exists
 */
export function hasPreviewContext() {
	return !!(window.universal?.preview || window.ubPreviewData);
}

/**
 * Get debug info from preview response
 *
 * @param {Object} response API response
 * @return {string} Formatted debug info
 */
export function getPreviewDebugInfo(response) {
	if (!response.debug_info) {
		return '';
	}

	const { debug_info } = response;
	const lines = [];

	lines.push(`Processing Time: ${response.processing_time || 'N/A'}`);
	lines.push(
		`Original Length: ${response.original_length || 0} characters`
	);
	lines.push(
		`Processed Length: ${response.processed_length || 0} characters`
	);
	lines.push(`Has Set Tags: ${debug_info.has_set_tags ? 'Yes' : 'No'}`);
	lines.push(
		`Has Twig Variables: ${debug_info.has_twig_vars ? 'Yes' : 'No'}`
	);

	if (debug_info.timber_context_keys) {
		lines.push(
			`Context Keys: ${debug_info.timber_context_keys.join(', ')}`
		);
	}

	return lines.join('\n');
}
