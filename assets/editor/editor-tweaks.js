/**
 * Universal Block - Editor Tweaks JavaScript
 * Handles DOM manipulation and interactive elements for the Gutenberg editor
 */

(function() {
    'use strict';


    /**
     * Generate WordPress block markup from block data
     */
    function generateBlockMarkup(blocks) {
        function blockToMarkup(block, level = 0) {
            const { name, attributes, innerBlocks = [] } = block;
            const indent = '    '.repeat(level); // 4 spaces per level

            // Clean up attributes - remove empty values and format properly
            const cleanedAttributes = {};
            Object.keys(attributes).forEach(key => {
                const value = attributes[key];
                if (value !== null && value !== undefined && value !== '') {
                    // Skip empty objects and unnecessary false booleans
                    if (typeof value === 'object' && Object.keys(value).length === 0) {
                        return;
                    }
                    if (key === 'selfClosing' && value === false) {
                        return;
                    }
                    cleanedAttributes[key] = value;
                }
            });

            const attributesJson = Object.keys(cleanedAttributes).length > 0
                ? ' ' + JSON.stringify(cleanedAttributes)
                : '';

            let markup = '';

            if (innerBlocks.length > 0) {
                // Container block with inner blocks
                markup += `${indent}<!-- wp:${name}${attributesJson} -->\n`;

                // Add inner blocks
                innerBlocks.forEach(innerBlock => {
                    markup += blockToMarkup(innerBlock, level + 1);
                });

                markup += `${indent}<!-- /wp:${name} -->\n`;
            } else {
                // Blocks without inner content
                if (attributes.selfClosing || ['img', 'hr'].includes(attributes.tagName)) {
                    // True self-closing blocks (like images)
                    markup += `${indent}<!-- wp:${name}${attributesJson} /-->\n`;
                } else {
                    // Regular blocks use self-closing syntax when they have no inner blocks
                    markup += `${indent}<!-- wp:${name}${attributesJson} /-->\n`;
                }
            }

            return markup;
        }

        return blocks.map(block => blockToMarkup(block, 0)).join('\n').trim();
    }

    /**
     * Parse HTML content into universal blocks
     * Delegates to the global parser from window.UniversalBlockParsers
     */
    function parseHtmlToBlocks(htmlContent) {
        console.log('🔄 parseHtmlToBlocks called with:', htmlContent?.substring(0, 100) + '...');

        // Use the global parser from src/utils/htmlToBlocks.js
        if (window.UniversalBlockParsers && window.UniversalBlockParsers.parseHTMLToBlocks) {
            console.log('✅ Using global parser from window.UniversalBlockParsers.parseHTMLToBlocks 2');
            console.log(`${htmlContent}`)
            const blocks = window.UniversalBlockParsers.parseHTMLToBlocks(htmlContent);
            console.log('📦 Parser returned', blocks?.length || 0, 'blocks:', blocks);
            return blocks;
        }

        // Fallback if global parser not loaded (shouldn't happen in normal operation)
        console.error('❌ Global parser not available! This is a loading order issue.');
        console.error('window.UniversalBlockParsers:', window.UniversalBlockParsers);
        return [];
    }


    /**
     * Insert block markup into the Gutenberg editor
     */
    function insertBlockMarkupIntoEditor(blockMarkup) {
        if (!wp || !wp.data || !wp.blocks) {
            console.error('WordPress block editor not available');
            return false;
        }

        const { dispatch, select } = wp.data;

        try {
            // Parse the block markup using WordPress's built-in parser
            const blocks = wp.blocks.parse(blockMarkup);

            if (!blocks || blocks.length === 0) {
                console.error('No valid blocks parsed from markup:', blockMarkup);
                return false;
            }

            console.log('🔍 Parsed blocks:', blocks);

            // Get more reliable insertion point
            const selectedBlockClientId = select('core/block-editor').getSelectedBlockClientId();
            const insertionPoint = select('core/block-editor').getBlockInsertionPoint();

            console.log('🔍 Selected block ID:', selectedBlockClientId);
            console.log('🔍 Insertion point:', insertionPoint);

            // Insert blocks at the insertion point
            if (insertionPoint) {
                dispatch('core/block-editor').insertBlocks(
                    blocks,
                    insertionPoint.index,
                    insertionPoint.rootClientId
                );
            } else {
                // Fallback: insert at the end
                dispatch('core/block-editor').insertBlocks(blocks);
            }

            console.log('✅ Successfully inserted blocks:', blocks);
            return true;

        } catch (error) {
            console.error('❌ Error inserting block markup into editor:', error);
            return false;
        }
    }

    /**
     * Insert blocks into the Gutenberg editor (legacy function - kept for compatibility)
     */
    function insertBlocksIntoEditor(blocks) {
        if (!wp || !wp.data || !wp.blocks) {
            console.error('WordPress block editor not available');
            return;
        }

        const { dispatch, select } = wp.data;
        const { createBlocksFromInnerBlocksTemplate } = wp.blocks;

        try {
            // Convert our block data to actual block instances
            const blockInstances = blocks.map(blockData => {
                return wp.blocks.createBlock(
                    blockData.name,
                    blockData.attributes,
                    blockData.innerBlocks ? blockData.innerBlocks.map(innerBlock =>
                        wp.blocks.createBlock(innerBlock.name, innerBlock.attributes)
                    ) : []
                );
            });

            // Get current block index for insertion
            const currentBlockIndex = select('core/block-editor').getSelectedBlockIndex();
            const insertIndex = currentBlockIndex >= 0 ? currentBlockIndex + 1 : 0;

            // Insert blocks into editor
            dispatch('core/block-editor').insertBlocks(blockInstances, insertIndex);

            console.log('Successfully inserted blocks:', blockInstances);

        } catch (error) {
            console.error('Error inserting blocks into editor:', error);
            throw error;
        }
    }

    /**
     * Initialize when DOM is ready
     */
    function initEditorTweaks() {
        // Wait for Gutenberg to be ready
        if (typeof wp !== 'undefined' && wp.data && wp.data.select('core/editor')) {
            // Always expose parser functions globally for React component access
            window.parseHtmlToBlocks = parseHtmlToBlocks;
            window.generateBlockMarkup = generateBlockMarkup;
            window.insertBlockMarkupIntoEditor = insertBlockMarkupIntoEditor;

            // Create global function for React compatibility
            window.parseHTMLToBlocks = function(htmlContent) {
                const blocks = parseHtmlToBlocks(htmlContent);
                return generateBlockMarkup(blocks);
            };

            // Mark that legacy functions are ready
            window.universalBlockLegacyReady = true;

            console.log('🔧 Universal Block parser functions ready');
        } else {
            // Retry after a short delay
            setTimeout(initEditorTweaks, 100);
        }
    }

    // Initialize when DOM is loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initEditorTweaks);
    } else {
        initEditorTweaks();
    }

    // Also try to initialize when wp is available
    if (typeof wp !== 'undefined' && wp.domReady) {
        wp.domReady(initEditorTweaks);
    }
})();