/**
 * Universal Block Debug Widget
 * Displays Timber context in a draggable, resizable widget on the frontend
 */

(function() {
	'use strict';

	// Wait for DOM to be ready
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', initDebugWidget);
	} else {
		initDebugWidget();
	}

	function initDebugWidget() {
		// Widget is already in the DOM from PHP, just get a reference
		const widget = document.getElementById('universal-block-debug-widget');
		if (!widget) {
			console.error('Debug widget not found in DOM');
			return;
		}

		// Initialize Ace Editor
		if (typeof ace === 'undefined') {
			console.error('Ace Editor not loaded');
			return;
		}

		const editor = ace.edit('debug-ace-editor');
		editor.setTheme('ace/theme/monokai');
		editor.session.setMode('ace/mode/json');
		editor.setReadOnly(true);
		editor.setShowPrintMargin(false);
		editor.setOptions({
			fontSize: '12px',
			wrap: true,
			displayIndentGuides: true
		});

		// Load and display context data from script tag
		const contextScript = document.getElementById('context-debug');
		if (contextScript) {
			try {
				// Parse and re-stringify with proper formatting
				const contextData = JSON.parse(contextScript.textContent);
				const formatted = JSON.stringify(contextData, null, 2);
				editor.setValue(formatted, -1);
			} catch (e) {
				editor.setValue('Error loading context: ' + e.message, -1);
			}
		} else {
			editor.setValue('// No context data available', -1);
		}

		// Widget controls
		const minimizeBtn = document.getElementById('debug-widget-minimize');
		const closeBtn = document.getElementById('debug-widget-close');

		let isMinimized = false;
		minimizeBtn.addEventListener('click', function() {
			isMinimized = !isMinimized;
			widget.classList.toggle('minimized', isMinimized);
			minimizeBtn.textContent = isMinimized ? '+' : '−';
			minimizeBtn.title = isMinimized ? 'Maximize' : 'Minimize';
		});

		closeBtn.addEventListener('click', function() {
			widget.style.display = 'none';
		});

		// Make widget draggable
		makeDraggable(widget, widget.querySelector('.debug-widget-header'));
	}

	function makeDraggable(element, handle) {
		let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

		handle.addEventListener('mousedown', dragMouseDown);

		function dragMouseDown(e) {
			e.preventDefault();
			pos3 = e.clientX;
			pos4 = e.clientY;
			document.addEventListener('mouseup', closeDragElement);
			document.addEventListener('mousemove', elementDrag);
		}

		function elementDrag(e) {
			e.preventDefault();
			pos1 = pos3 - e.clientX;
			pos2 = pos4 - e.clientY;
			pos3 = e.clientX;
			pos4 = e.clientY;
			element.style.top = (element.offsetTop - pos2) + 'px';
			element.style.left = (element.offsetLeft - pos1) + 'px';
			element.style.right = 'auto';
			element.style.bottom = 'auto';
		}

		function closeDragElement() {
			document.removeEventListener('mouseup', closeDragElement);
			document.removeEventListener('mousemove', elementDrag);
		}
	}
})();
