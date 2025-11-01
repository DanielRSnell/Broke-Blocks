/**
 * Universal Block Appender Enhancement
 * Improves appender behavior and adds visual feedback
 */

(function() {
	'use strict';

	// Wait for DOM to be ready
	wp.domReady(function() {
		console.log('Universal Block Appender Enhancement loaded');

		// Add class to body for CSS targeting
		document.body.classList.add('universal-block-enhanced');

		// Monitor for block selection changes
		let previousSelectedBlock = null;

		const checkBlockSelection = () => {
			const selectedBlock = document.querySelector('.block-editor-block-list__block.is-selected[data-type="universal/element"]');

			if (selectedBlock !== previousSelectedBlock) {
				// Clean up previous selection
				if (previousSelectedBlock) {
					previousSelectedBlock.classList.remove('universal-block-active');
				}

				// Mark new selection
				if (selectedBlock) {
					selectedBlock.classList.add('universal-block-active');
				}

				previousSelectedBlock = selectedBlock;
			}
		};

		// Watch for changes using MutationObserver
		const observer = new MutationObserver(checkBlockSelection);
		const editorCanvas = document.querySelector('.editor-styles-wrapper') || document.body;

		observer.observe(editorCanvas, {
			attributes: true,
			attributeFilter: ['class'],
			subtree: true
		});

		// Initial check
		checkBlockSelection();

		// Also listen to WordPress data store changes for more reliable detection
		if (wp.data) {
			wp.data.subscribe(() => {
				checkBlockSelection();
			});
		}
	});
})();
