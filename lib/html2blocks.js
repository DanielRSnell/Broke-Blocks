/**
 * HTML to Universal Blocks Parser
 *
 * Converts HTML to universal/element blocks with simplified structure
 * Exposed as window.universal.html2blocks()
 */

/**
 * Parse HTML string to universal/element blocks
 * @param {string} html - HTML string to parse
 * @returns {Array} Array of block objects
 */
function html2blocks(html) {
	if (!html || typeof html !== 'string') {
		return [];
	}

	// Use DOMParser to preserve custom elements like <set>, <loop>, <if>
	// innerHTML can mangle unknown elements, DOMParser treats them as proper elements
	const parser = new DOMParser();
	const doc = parser.parseFromString(html.trim(), 'text/html');

	// Get body content (DOMParser wraps in <html><body>)
	const temp = doc.body;

	// Parse child nodes
	const blocks = [];
	Array.from(temp.childNodes).forEach(node => {
		const block = parseNode(node);
		if (block) {
			blocks.push(block);
		}
	});

	return blocks;
}

/**
 * Parse a DOM node to a block object
 * @param {Node} node - DOM node to parse
 * @returns {Object|null} Block object or null
 */
function parseNode(node) {
	// Skip comments and empty text nodes
	if (node.nodeType === Node.COMMENT_NODE) {
		return null;
	}

	// Handle text nodes
	if (node.nodeType === Node.TEXT_NODE) {
		const text = node.textContent.trim();
		if (!text) return null;

		// Wrap text in a paragraph
		return createBlock('p', 'text', text, { className: '', globalAttrs: {} });
	}

	// Handle element nodes
	if (node.nodeType === Node.ELEMENT_NODE) {
		const tagName = node.tagName.toLowerCase();

		const attributes = getAttributes(node);

		// Determine content type
		const contentType = determineContentType(node, tagName);

		// Create block based on content type
		if (contentType === 'empty') {
			return createBlock(tagName, 'empty', '', attributes);
		}

		if (contentType === 'text') {
			const textContent = node.textContent.trim();
			return createBlock(tagName, 'text', textContent, attributes);
		}

		if (contentType === 'html') {
			const htmlContent = node.innerHTML;
			return createBlock(tagName, 'html', htmlContent, attributes);
		}

		if (contentType === 'blocks') {
			// Parse child nodes recursively
			const innerBlocks = [];
			Array.from(node.childNodes).forEach(child => {
				const childBlock = parseNode(child);
				if (childBlock) {
					innerBlocks.push(childBlock);
				}
			});

			return createBlock(tagName, 'blocks', '', attributes, innerBlocks);
		}
	}

	return null;
}

/**
 * Determine content type based on element's children
 * @param {Element} element - DOM element
 * @param {string} tagName - Tag name
 * @returns {string} Content type: 'blocks', 'text', 'html', or 'empty'
 */
function determineContentType(element, tagName) {
	// SVG elements always use HTML content type
	if (tagName === 'svg') {
		return 'html';
	}

	// Check if element has any children
	if (!element.hasChildNodes()) {
		return 'empty';
	}

	// Count child node types
	let hasElementChildren = false;
	let hasTextChildren = false;

	Array.from(element.childNodes).forEach(node => {
		if (node.nodeType === Node.ELEMENT_NODE) {
			hasElementChildren = true;
		} else if (node.nodeType === Node.TEXT_NODE && node.textContent.trim() !== '') {
			hasTextChildren = true;
		}
	});

	// Mixed content (text + elements) = HTML
	if (hasElementChildren && hasTextChildren) {
		return 'html';
	}

	// Only element children = blocks
	if (hasElementChildren && !hasTextChildren) {
		return 'blocks';
	}

	// Only text children = text
	if (!hasElementChildren && hasTextChildren) {
		return 'text';
	}

	// No meaningful children = empty
	return 'empty';
}

/**
 * Decode HTML entities in a string
 * @param {string} str - String with HTML entities
 * @returns {string} Decoded string
 */
function decodeHtmlEntities(str) {
	const textarea = document.createElement('textarea');
	textarea.innerHTML = str;
	return textarea.value;
}

/**
 * Get all attributes from an element
 * @param {Element} element - DOM element
 * @returns {Object} Object with className, globalAttrs, blockName, and Twig control attributes
 */
function getAttributes(element) {
	const attrs = {};
	let className = '';
	let blockName = '';
	const twigAttrs = {};

	// Twig control attribute names (lowercase for matching)
	const twigControlAttrs = {
		'loopsource': 'loopSource',
		'loopvariable': 'loopVariable',
		'conditionalvisibility': 'conditionalVisibility',
		'conditionalexpression': 'conditionalExpression',
		'setvariable': 'setVariable',
		'setexpression': 'setExpression'
	};

	Array.from(element.attributes).forEach(attr => {
		// Decode HTML entities in attribute values
		const decodedValue = decodeHtmlEntities(attr.value);
		const attrNameLower = attr.name.toLowerCase();

		// Handle class separately for WordPress className
		if (attr.name === 'class') {
			className = decodedValue;
		}
		// Extract block name from data-block-name (don't add to globalAttrs)
		else if (attr.name === 'data-block-name') {
			blockName = decodedValue;
		}
		// Convert style to data-style
		else if (attr.name === 'style') {
			attrs['data-style'] = decodedValue;
		}
		// Extract Twig control attributes separately (match lowercase to camelCase)
		else if (twigControlAttrs[attrNameLower]) {
			const camelCaseName = twigControlAttrs[attrNameLower];
			// Convert conditionalVisibility to boolean
			if (camelCaseName === 'conditionalVisibility') {
				twigAttrs[camelCaseName] = decodedValue === 'true' || decodedValue === '1';
			} else {
				twigAttrs[camelCaseName] = decodedValue;
			}
		}
		// All other attributes go to globalAttrs
		else {
			attrs[attr.name] = decodedValue;
		}
	});

	return { className, globalAttrs: attrs, blockName, ...twigAttrs };
}

/**
 * Create a block object
 * @param {string} tagName - HTML tag name
 * @param {string} contentType - Content type (blocks, text, html, empty)
 * @param {string} content - Text/HTML content (for text/html type)
 * @param {Object} attributeData - Object with className, globalAttrs, and blockName
 * @param {Array} innerBlocks - Child blocks (for blocks type)
 * @returns {Object} Block object
 */
function createBlock(tagName, contentType, content = '', attributeData = {}, innerBlocks = []) {
	const {
		className = '',
		globalAttrs = {},
		blockName = '',
		loopSource,
		loopVariable,
		conditionalVisibility,
		conditionalExpression,
		setVariable,
		setExpression
	} = attributeData;

	const block = {
		name: 'universal/element',
		attributes: {
			tagName: tagName,
			contentType: contentType,
			globalAttrs: globalAttrs
		},
		innerBlocks: innerBlocks || []
	};

	// Add metadata with block name if present (prioritize data-block-name over tagName)
	if (blockName) {
		block.attributes.metadata = { name: blockName };
	}

	// Add className if present
	if (className) {
		block.attributes.className = className;
	}

	// Add content for text and html types
	if ((contentType === 'text' || contentType === 'html') && content) {
		block.attributes.content = content;
	}

	// Add Twig control attributes if present
	if (loopSource) {
		block.attributes.loopSource = loopSource;
	}
	if (loopVariable) {
		block.attributes.loopVariable = loopVariable;
	}
	// If conditionalExpression exists, enable conditionalVisibility
	if (conditionalExpression) {
		block.attributes.conditionalVisibility = true;
		block.attributes.conditionalExpression = conditionalExpression;
	} else if (conditionalVisibility !== undefined) {
		block.attributes.conditionalVisibility = conditionalVisibility;
	}
	if (setVariable) {
		block.attributes.setVariable = setVariable;
	}
	if (setExpression) {
		block.attributes.setExpression = setExpression;
	}

	return block;
}

/**
 * Generate WordPress block markup from block data
 * @param {Array} blocks - Array of block objects
 * @returns {string} WordPress block markup
 */
function generateBlockMarkup(blocks) {
	if (!blocks || !Array.isArray(blocks)) {
		return '';
	}

	const serializeBlock = (block) => {
		const { name, attributes, innerBlocks } = block;

		// Serialize attributes to JSON
		const attrsJson = Object.keys(attributes).length > 0
			? ' ' + JSON.stringify(attributes)
			: '';

		// Check if block has inner blocks
		const hasInnerBlocks = innerBlocks && innerBlocks.length > 0;

		if (hasInnerBlocks) {
			// Self-closing comment with inner blocks
			const innerMarkup = innerBlocks.map(serializeBlock).join('\n');
			return `<!-- wp:${name}${attrsJson} -->\n${innerMarkup}\n<!-- /wp:${name} -->`;
		} else {
			// Self-closing block
			return `<!-- wp:${name}${attrsJson} /-->`;
		}
	};

	return blocks.map(serializeBlock).join('\n\n');
}

/**
 * Insert blocks into the WordPress editor at current position
 * @param {Array} blocks - Array of block objects
 * @returns {void}
 */
function insertBlocks(blocks) {
	if (!blocks || !Array.isArray(blocks) || blocks.length === 0) {
		console.error('No blocks to insert');
		return;
	}

	// Check if WordPress editor is available
	if (typeof wp === 'undefined' || !wp.data) {
		console.error('WordPress editor not available');
		return;
	}

	const { select, dispatch } = wp.data;
	const { createBlock } = wp.blocks;

	// Recursively convert block data to WordPress blocks
	const convertBlockData = (data) => {
		const innerBlocks = data.innerBlocks && data.innerBlocks.length > 0
			? data.innerBlocks.map(convertBlockData)
			: [];
		return createBlock(data.name, data.attributes, innerBlocks);
	};

	// Convert all blocks
	const wpBlocks = blocks.map(convertBlockData);

	// Get current block selection
	const selectedBlockId = select('core/block-editor').getSelectedBlockClientId();
	const rootClientId = select('core/block-editor').getBlockRootClientId(selectedBlockId);

	// Insert blocks after current selection or at end
	if (selectedBlockId) {
		const blockIndex = select('core/block-editor').getBlockIndex(selectedBlockId);
		dispatch('core/block-editor').insertBlocks(wpBlocks, blockIndex + 1, rootClientId);
	} else {
		dispatch('core/block-editor').insertBlocks(wpBlocks);
	}
}

// Expose to window
if (typeof window !== 'undefined') {
	window.universal = window.universal || {};
	window.universal.html2blocks = html2blocks;
	window.universal.generateBlockMarkup = generateBlockMarkup;
	window.universal.insertBlocks = insertBlocks;
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
	module.exports = { html2blocks, generateBlockMarkup, insertBlocks };
}
