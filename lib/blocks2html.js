/**
 * Blocks to HTML Parser
 *
 * Converts Universal Block structures back to HTML
 * Mirrors html2blocks.js for consistent roundtrip conversion
 * Exposed as window.universal.blocks2html()
 */

/**
 * Convert an array of blocks to HTML string
 * @param {Array} blocks - Array of block objects
 * @returns {string} HTML string
 */
function blocks2html(blocks) {
	if (!blocks || !Array.isArray(blocks)) {
		return '';
	}

	return blocks.map(block => blockToHTML(block)).join('\n');
}

/**
 * Convert a single block to HTML
 * @param {Object} block - Block object
 * @returns {string} HTML string
 */
function blockToHTML(block) {
	if (!block || block.name !== 'universal/element') {
		return '';
	}

	const { attributes, innerBlocks } = block;
	const {
		tagName = 'div',
		contentType = 'text',
		content = '',
		globalAttrs = {},
		className = '',
		metadata = {},
		loopSource = '',
		loopVariable = 'item',
		conditionalVisibility = false,
		conditionalExpression = '',
		setVariable = '',
		setExpression = ''
	} = attributes;

	// Build attributes string
	let attributesString = '';

	// Add data-block-name if metadata.name exists
	if (metadata && metadata.name) {
		attributesString += ` data-block-name="${escapeAttribute(metadata.name)}"`;
	}

	// Add className if present
	if (className) {
		attributesString += ` class="${escapeAttribute(className)}"`;
	}

	// Add Twig control attributes
	if (loopSource) {
		attributesString += ` loopSource="${escapeAttribute(loopSource)}"`;
	}
	if (loopSource && loopVariable !== 'item') {
		attributesString += ` loopVariable="${escapeAttribute(loopVariable)}"`;
	}
	if (conditionalExpression) {
		attributesString += ` conditionalExpression="${escapeAttribute(conditionalExpression)}"`;
	}
	if (setVariable) {
		attributesString += ` setVariable="${escapeAttribute(setVariable)}"`;
	}
	if (setExpression) {
		attributesString += ` setExpression="${escapeAttribute(setExpression)}"`;
	}

	// Add global attributes
	Object.entries(globalAttrs).forEach(([name, value]) => {
		// Convert data-style back to style
		if (name === 'data-style') {
			attributesString += ` style="${escapeAttribute(value)}"`;
		} else if (name && value !== undefined && value !== '') {
			attributesString += ` ${escapeAttributeName(name)}="${escapeAttribute(value)}"`;
		}
	});

	// Handle different content types
	let innerContent = '';

	switch (contentType) {
		case 'text':
		case 'html':
			innerContent = content || '';
			break;

		case 'blocks':
			// Recursively convert inner blocks to HTML
			if (innerBlocks && innerBlocks.length > 0) {
				innerContent = blocks2html(innerBlocks);
			}
			break;

		case 'empty':
		default:
			innerContent = '';
			break;
	}

	// Generate HTML
	const shouldBeSelfClosing = contentType === 'empty' || isVoidElement(tagName);

	if (shouldBeSelfClosing) {
		return `<${tagName}${attributesString} />`;
	} else {
		return `<${tagName}${attributesString}>${innerContent}</${tagName}>`;
	}
}

/**
 * Check if a tag name is a void element
 * Must match the logic in html2blocks.js for consistent roundtrip
 * @param {string} tagName - HTML tag name
 * @returns {boolean}
 */
function isVoidElement(tagName) {
	const voidElements = [
		'img', 'br', 'hr', 'input', 'meta', 'link', 'area', 'base',
		'col', 'embed', 'source', 'track', 'wbr'
	];
	return voidElements.includes(tagName.toLowerCase());
}

/**
 * Escape HTML attribute value
 * @param {string} value - Attribute value
 * @returns {string} Escaped value
 */
function escapeAttribute(value) {
	if (typeof value !== 'string') {
		value = String(value);
	}
	return value
		.replace(/&/g, '&amp;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#x27;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;');
}

/**
 * Escape HTML attribute name
 * @param {string} name - Attribute name
 * @returns {string} Escaped name
 */
function escapeAttributeName(name) {
	// Only allow letters, numbers, hyphens, and underscores
	return name.replace(/[^a-zA-Z0-9\-_]/g, '');
}

// Expose to window
if (typeof window !== 'undefined') {
	window.universal = window.universal || {};
	window.universal.blocks2html = blocks2html;
	window.universal.blocksToHtml = blocks2html; // Alias for consistency
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
	module.exports = { blocks2html };
}
