/**
 * Universal Block API - Global utilities for block manipulation and editor control
 * Similar to gbStyleBlockUtils but specifically for Universal Blocks
 */

// Enhanced Universal Block utilities
window.universalBlockUtils = {
    // Check if a block is a Universal Block
    isUniversalBlock(blockName) {
        return blockName === 'universal/element';
    },

    // Check if a block supports inner blocks
    supportsInnerBlocks(blockName) {
        if (typeof wp === 'undefined' || !wp.blocks) return false;

        try {
            const blockType = wp.blocks.getBlockType(blockName);

            // For Universal Blocks, check if elementType is container
            if (this.isUniversalBlock(blockName)) {
                return true; // Universal blocks can potentially be containers
            }

            return !!(blockType && (
                blockType.allowedBlocks || // Explicitly allows specific blocks
                blockType.supports?.inserter !== false || // General inserter support
                blockName.includes('group') || // Common container blocks
                blockName.includes('column') ||
                blockName.includes('container') ||
                blockName.includes('section')
            ));
        } catch (error) {
            return false;
        }
    },

    // Get selected block information with Universal Block specific data
    getSelectedBlockInfo() {
        if (typeof wp === 'undefined' || !wp.data) return null;

        try {
            const { select } = wp.data;
            const { getSelectedBlockClientId, getSelectedBlock } = select('core/block-editor');

            const selectedBlockId = getSelectedBlockClientId();
            if (!selectedBlockId) return null;

            const selectedBlock = getSelectedBlock();
            const isUniversal = this.isUniversalBlock(selectedBlock.name);
            const supportsInner = this.supportsInnerBlocks(selectedBlock.name);

            // Extract Universal Block specific attributes
            const universalData = isUniversal ? {
                elementType: selectedBlock.attributes.elementType,
                tagName: selectedBlock.attributes.tagName,
                className: selectedBlock.attributes.className,
                globalAttrs: selectedBlock.attributes.globalAttrs,
                content: selectedBlock.attributes.content,
                isContainer: selectedBlock.attributes.elementType === 'container'
            } : null;

            return {
                clientId: selectedBlockId,
                block: selectedBlock,
                isUniversalBlock: isUniversal,
                universalData: universalData,
                supportsInnerBlocks: supportsInner,
                hasInnerBlocks: selectedBlock.innerBlocks && selectedBlock.innerBlocks.length > 0
            };
        } catch (error) {
            console.error('Error getting selected block info:', error);
            return null;
        }
    },

    // Get all Universal Blocks in the editor
    getAllUniversalBlocks() {
        if (typeof wp === 'undefined' || !wp.data) return [];

        try {
            const { select } = wp.data;
            const { getBlocks } = select('core/block-editor');

            const findUniversalBlocks = (blocks) => {
                let universalBlocks = [];

                blocks.forEach(block => {
                    if (this.isUniversalBlock(block.name)) {
                        universalBlocks.push(block);
                    }

                    // Recursively check inner blocks
                    if (block.innerBlocks && block.innerBlocks.length > 0) {
                        universalBlocks = universalBlocks.concat(findUniversalBlocks(block.innerBlocks));
                    }
                });

                return universalBlocks;
            };

            return findUniversalBlocks(getBlocks());
        } catch (error) {
            console.error('Error getting Universal Blocks:', error);
            return [];
        }
    },

    // Copy styles and attributes from one Universal Block to clipboard
    copyUniversalBlockStyles(blockClientId = null) {
        const blockInfo = blockClientId ?
            this.getBlockInfoById(blockClientId) :
            this.getSelectedBlockInfo();

        if (!blockInfo || !blockInfo.isUniversalBlock) {
            console.warn('Selected block is not a Universal Block');
            return false;
        }

        const { universalData } = blockInfo;

        // Store in global clipboard (same as your edit component)
        if (typeof window.universalBlockClipboard === 'undefined') {
            window.universalBlockClipboard = {
                classes: '',
                attributes: {},
                styles: {}
            };
        }

        window.universalBlockClipboard.classes = universalData.className || '';
        window.universalBlockClipboard.attributes = { ...universalData.globalAttrs };

        console.log('🎯 Copied Universal Block styles:', {
            classes: window.universalBlockClipboard.classes,
            attributes: window.universalBlockClipboard.attributes
        });

        return true;
    },

    // Paste styles to selected Universal Block
    pasteUniversalBlockStyles(blockClientId = null) {
        if (typeof window.universalBlockClipboard === 'undefined') {
            console.warn('No styles copied yet');
            return false;
        }

        const blockInfo = blockClientId ?
            this.getBlockInfoById(blockClientId) :
            this.getSelectedBlockInfo();

        if (!blockInfo || !blockInfo.isUniversalBlock) {
            console.warn('Selected block is not a Universal Block');
            return false;
        }

        try {
            const { dispatch } = wp.data;
            const { updateBlockAttributes } = dispatch('core/block-editor');

            const updates = {};

            if (window.universalBlockClipboard.classes !== undefined) {
                updates.className = window.universalBlockClipboard.classes;
            }

            if (Object.keys(window.universalBlockClipboard.attributes).length > 0) {
                updates.globalAttrs = { ...window.universalBlockClipboard.attributes };
            }

            if (Object.keys(updates).length > 0) {
                updateBlockAttributes(blockInfo.clientId, updates);
                console.log('🎯 Pasted Universal Block styles to:', blockInfo.clientId);
                return true;
            }

            return false;
        } catch (error) {
            console.error('Error pasting styles:', error);
            return false;
        }
    },

    // Get block info by client ID
    getBlockInfoById(clientId) {
        if (typeof wp === 'undefined' || !wp.data) return null;

        try {
            const { select } = wp.data;
            const { getBlock } = select('core/block-editor');

            const block = getBlock(clientId);
            if (!block) return null;

            const isUniversal = this.isUniversalBlock(block.name);
            const supportsInner = this.supportsInnerBlocks(block.name);

            const universalData = isUniversal ? {
                elementType: block.attributes.elementType,
                tagName: block.attributes.tagName,
                className: block.attributes.className,
                globalAttrs: block.attributes.globalAttrs,
                content: block.attributes.content,
                isContainer: block.attributes.elementType === 'container'
            } : null;

            return {
                clientId: clientId,
                block: block,
                isUniversalBlock: isUniversal,
                universalData: universalData,
                supportsInnerBlocks: supportsInner,
                hasInnerBlocks: block.innerBlocks && block.innerBlocks.length > 0
            };
        } catch (error) {
            console.error('Error getting block by ID:', error);
            return null;
        }
    }
};

// Smart Universal Block insertion - automatically chooses best insertion method
window.universalInsertBlock = function(blockMarkup, options = {}) {
    // Check if we're in the block editor
    if (typeof wp === 'undefined' || !wp.data || !wp.blocks) {
        console.warn('WordPress block editor not available');
        return false;
    }

    try {
        // Parse the block markup string into block objects
        const blocks = wp.blocks.parse(blockMarkup);

        if (!blocks || blocks.length === 0) {
            console.warn('No valid blocks found in markup');
            return false;
        }

        // Get selected block information
        const selectedBlockInfo = window.universalBlockUtils.getSelectedBlockInfo();

        // Determine insertion method based on context and options
        if (options.mode === 'swap' && selectedBlockInfo) {
            return window.universalSwapBlock(blockMarkup);
        } else if (options.mode === 'inner' && selectedBlockInfo?.supportsInnerBlocks) {
            return window.universalInsertAsInnerBlock(blockMarkup);
        } else if (selectedBlockInfo?.supportsInnerBlocks && options.preferInner !== false) {
            // Auto-insert as inner block if possible (unless explicitly disabled)
            return window.universalInsertAsInnerBlock(blockMarkup);
        } else {
            // Default: insert after selected block or at end
            const { select, dispatch } = wp.data;
            const { getSelectedBlockClientId, getBlockInsertionPoint } = select('core/block-editor');
            const { insertBlocks } = dispatch('core/block-editor');

            const selectedBlockId = getSelectedBlockClientId();
            const insertionPoint = getBlockInsertionPoint();

            if (selectedBlockId) {
                // Insert after the selected block
                insertBlocks(blocks, insertionPoint.index + 1, insertionPoint.rootClientId);
            } else {
                // Insert at the end if no block is selected
                insertBlocks(blocks);
            }

            console.log('🎯 Inserted blocks after selected block');
            return true;
        }

    } catch (error) {
        console.error('Error inserting Universal Block:', error);
        return false;
    }
};

// Insert blocks as inner children of selected block
window.universalInsertAsInnerBlock = function(blockMarkup) {
    if (typeof wp === 'undefined' || !wp.data || !wp.blocks) {
        return false;
    }

    try {
        const blocks = wp.blocks.parse(blockMarkup);

        if (!blocks || blocks.length === 0) {
            return false;
        }

        const selectedBlockInfo = window.universalBlockUtils.getSelectedBlockInfo();

        if (!selectedBlockInfo) {
            console.warn('No block selected');
            return false;
        }

        if (!selectedBlockInfo.supportsInnerBlocks) {
            console.warn('Selected block does not support inner blocks');
            return false;
        }

        const { dispatch } = wp.data;
        const { insertBlocks } = dispatch('core/block-editor');

        // Insert as inner blocks at the end of existing inner blocks
        const insertIndex = selectedBlockInfo.hasInnerBlocks ?
            selectedBlockInfo.block.innerBlocks.length : 0;

        insertBlocks(blocks, insertIndex, selectedBlockInfo.clientId);

        console.log('🎯 Inserted as inner blocks');
        return true;

    } catch (error) {
        console.error('Error inserting as inner block:', error);
        return false;
    }
};

// Swap selected block with new block(s)
window.universalSwapBlock = function(blockMarkup) {
    if (typeof wp === 'undefined' || !wp.data || !wp.blocks) {
        return false;
    }

    try {
        const blocks = wp.blocks.parse(blockMarkup);

        if (!blocks || blocks.length === 0) {
            return false;
        }

        const selectedBlockInfo = window.universalBlockUtils.getSelectedBlockInfo();

        if (!selectedBlockInfo) {
            console.warn('No block selected to swap');
            return false;
        }

        const { dispatch } = wp.data;
        const { replaceBlocks } = dispatch('core/block-editor');

        // Replace the selected block with new blocks
        replaceBlocks(selectedBlockInfo.clientId, blocks);

        console.log('🎯 Swapped selected block');
        return true;

    } catch (error) {
        console.error('Error swapping block:', error);
        return false;
    }
};

// Control Universal Editor Tweaks web component width
window.universalControlEditorWidth = function(isDrawerOpen) {
    try {
        // Use the existing editorWidthChange function
        if (typeof window.editorWidthChange === 'function') {
            window.editorWidthChange(isDrawerOpen);
            console.log(`🎯 Universal Editor width controlled: ${isDrawerOpen ? 'drawer open' : 'drawer closed'}`);
            return true;
        } else {
            console.warn('editorWidthChange function not available');
            return false;
        }
    } catch (error) {
        console.error('❌ Error controlling editor width:', error);
        return false;
    }
};

// Convenience functions for common editor width changes
window.universalExpandEditor = function() {
    return window.universalControlEditorWidth(true);
};

window.universalCollapseEditor = function() {
    return window.universalControlEditorWidth(false);
};

// Helper function to create Universal Block markup
window.universalCreateBlockMarkup = function(elementType = 'text', attributes = {}) {
    const defaultAttributes = {
        elementType: elementType,
        tagName: elementType === 'heading' ? 'h2' : elementType === 'link' ? 'a' : 'p',
        content: '',
        className: '',
        globalAttrs: {},
        selfClosing: ['image', 'rule'].includes(elementType)
    };

    const mergedAttributes = { ...defaultAttributes, ...attributes };
    const attributesJson = JSON.stringify(mergedAttributes);

    return `<!-- wp:universal/element ${attributesJson} /-->`;
};

// Batch operations for multiple Universal Blocks
window.universalBatchOperations = {
    // Apply styles to all Universal Blocks of a specific element type
    applyStylesToElementType(elementType, styles = {}) {
        const allBlocks = window.universalBlockUtils.getAllUniversalBlocks();
        const targetBlocks = allBlocks.filter(block =>
            block.attributes.elementType === elementType
        );

        if (targetBlocks.length === 0) {
            console.warn(`No Universal Blocks of type "${elementType}" found`);
            return 0;
        }

        try {
            const { dispatch } = wp.data;
            const { updateBlockAttributes } = dispatch('core/block-editor');

            targetBlocks.forEach(block => {
                updateBlockAttributes(block.clientId, styles);
            });

            console.log(`🎯 Applied styles to ${targetBlocks.length} blocks of type "${elementType}"`);
            return targetBlocks.length;
        } catch (error) {
            console.error('Error applying batch styles:', error);
            return 0;
        }
    },

    // Get statistics about Universal Blocks in the editor
    getStatistics() {
        const allBlocks = window.universalBlockUtils.getAllUniversalBlocks();
        const stats = {
            total: allBlocks.length,
            byType: {},
            withClasses: 0,
            withAttributes: 0
        };

        allBlocks.forEach(block => {
            const elementType = block.attributes.elementType;
            stats.byType[elementType] = (stats.byType[elementType] || 0) + 1;

            if (block.attributes.className) {
                stats.withClasses++;
            }

            if (block.attributes.globalAttrs && Object.keys(block.attributes.globalAttrs).length > 0) {
                stats.withAttributes++;
            }
        });

        return stats;
    }
};

// Initialize the API when WordPress is ready
if (typeof wp !== 'undefined' && wp.domReady) {
    // wp.domReady(() => {
    //     console.log('🚀 Universal Block API initialized');

    //     // Log API methods for discoverability
    //     console.log('Available Universal Block API methods:', {
    //         'universalBlockUtils': Object.keys(window.universalBlockUtils),
    //         'universalInsertBlock': 'Insert blocks with smart positioning',
    //         'universalControlEditorWidth': 'Control editor drawer width',
    //         'universalCreateBlockMarkup': 'Create Universal Block markup',
    //         'universalBatchOperations': Object.keys(window.universalBatchOperations)
    //     });
    // });
}