/**
 * Block Settings Hooks
 *
 * React hooks and utilities for accessing block settings configuration.
 * Settings are loaded from theme's block-settings.json or plugin defaults.
 */

/**
 * Get default settings (all panels enabled)
 *
 * @return {Object} Default settings object
 */
function getDefaultSettings() {
	return {
		inspectorControls: {
			plainClassesManager: { enabled: true },
			dynamicPreviewToggle: { enabled: true },
			elementSettings: { enabled: true },
			imageSettings: { enabled: true },
			linkSettings: { enabled: true },
			loopControls: { enabled: true },
			conditionalVisibility: { enabled: true },
			setVariable: { enabled: true },
		},
		blockControls: {
			tagNameToolbar: { enabled: true },
			dynamicPreviewButton: { enabled: true },
		},
	};
}

/**
 * Get block settings from window object
 *
 * Settings are enqueued by PHP via wp_localize_script
 *
 * @return {Object} Block settings configuration
 */
export function useBlockSettings() {
	return window.ubBlockSettings?.settings || getDefaultSettings();
}

/**
 * Check if a panel is enabled
 *
 * @param {string} panelName Panel identifier (e.g., 'imageSettings', 'loopControls')
 * @return {boolean} True if panel is enabled
 */
export function isPanelEnabled(panelName) {
	const settings = useBlockSettings();

	// Check inspectorControls first
	if (settings.inspectorControls?.[panelName]) {
		return settings.inspectorControls[panelName].enabled !== false;
	}

	// Check blockControls
	if (settings.blockControls?.[panelName]) {
		return settings.blockControls[panelName].enabled !== false;
	}

	// Default to enabled if not configured
	return true;
}

/**
 * Check if a specific control within a panel is enabled
 *
 * @param {string} panelName   Panel identifier
 * @param {string} controlName Control identifier
 * @return {boolean} True if control is enabled
 */
export function isControlEnabled(panelName, controlName) {
	const settings = useBlockSettings();

	const panel = settings.inspectorControls?.[panelName];

	if (!panel) {
		return true; // Default enabled if panel not configured
	}

	// Check if panel itself is disabled
	if (panel.enabled === false) {
		return false;
	}

	// Check specific control
	if (panel.controls?.[controlName]) {
		return panel.controls[controlName].enabled !== false;
	}

	// Default enabled if control not configured
	return true;
}

/**
 * Get allowed HTML tags
 *
 * @return {Array} Array of allowed tag names, or empty array for all allowed
 */
export function getAllowedTags() {
	return window.ubBlockSettings?.allowedTags || [];
}

/**
 * Get allowed content types
 *
 * @return {Array} Array of allowed content types (blocks, text, html, empty)
 */
export function getAllowedContentTypes() {
	return (
		window.ubBlockSettings?.allowedContentTypes || [
			'blocks',
			'text',
			'html',
			'empty',
		]
	);
}

/**
 * Get allowed post types for link settings
 *
 * @return {Array} Array of allowed post type slugs, or empty array for all allowed
 */
export function getAllowedPostTypes() {
	return window.ubBlockSettings?.allowedPostTypes || [];
}

/**
 * Get settings source
 *
 * @return {string} 'theme', 'plugin', or 'default'
 */
export function getSettingsSource() {
	return window.ubBlockSettings?.source || 'default';
}

/**
 * Check if tag is allowed
 *
 * @param {string} tagName HTML tag name
 * @return {boolean} True if tag is allowed
 */
export function isTagAllowed(tagName) {
	const allowedTags = getAllowedTags();

	// Empty array = all tags allowed
	if (allowedTags.length === 0) {
		return true;
	}

	return allowedTags.includes(tagName);
}

/**
 * Check if content type is allowed
 *
 * @param {string} contentType Content type (blocks, text, html, empty)
 * @return {boolean} True if content type is allowed
 */
export function isContentTypeAllowed(contentType) {
	const allowedTypes = getAllowedContentTypes();
	return allowedTypes.includes(contentType);
}

/**
 * Get panel's initialOpen state
 *
 * @param {string} panelName Panel identifier
 * @return {boolean} True if panel should be initially open
 */
export function isPanelInitiallyOpen(panelName) {
	const settings = useBlockSettings();
	const panel = settings.inspectorControls?.[panelName];

	if (!panel) {
		return false; // Default closed
	}

	return panel.initialOpen === true;
}
