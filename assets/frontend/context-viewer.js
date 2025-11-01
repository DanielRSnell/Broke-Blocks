/**
 * Context Viewer Widget
 *
 * Shows Timber context in a drawer with Ace Editor when ?context=true
 */
(function() {
    'use strict';

    // Wait for DOM and Ace to load
    window.addEventListener('DOMContentLoaded', function() {
        if (!window.ace) {
            console.error('Context Viewer: Ace Editor not loaded');
            return;
        }

        // Check if context data exists in DOM
        const contextScript = document.getElementById('timber-context');
        if (!contextScript) {
            console.error('Context Viewer: No context data found');
            return;
        }

        initContextViewer();
    });

    function initContextViewer() {
        // Read context from DOM script tag
        const contextScript = document.getElementById('timber-context');
        let contextData;

        try {
            contextData = JSON.parse(contextScript.textContent);
        } catch (e) {
            console.error('Context Viewer: Failed to parse context JSON', e);
            return;
        }

        // Create widget HTML
        const widget = document.createElement('div');
        widget.className = 'universal-context-widget';
        widget.innerHTML = `
            <button class="universal-context-toggle" title="View Timber Context">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M16 18l2-2-4-4-4 4-2-2"/>
                    <rect x="3" y="3" width="18" height="18" rx="2"/>
                </svg>
                <span>Context</span>
            </button>
        `;

        // Create drawer HTML
        const drawer = document.createElement('div');
        drawer.className = 'universal-context-drawer';
        drawer.innerHTML = `
            <div class="universal-context-drawer-overlay"></div>
            <div class="universal-context-drawer-content">
                <div class="universal-context-drawer-header">
                    <div class="universal-context-drawer-title">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M16 18l2-2-4-4-4 4-2-2"/>
                            <rect x="3" y="3" width="18" height="18" rx="2"/>
                        </svg>
                        <h2>Timber Context</h2>
                    </div>
                    <div class="universal-context-drawer-meta">
                        <span class="universal-context-url">${window.location.href}</span>
                    </div>
                    <button class="universal-context-close" title="Close">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18"/>
                            <line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                    </button>
                </div>
                <div class="universal-context-drawer-body">
                    <div id="universal-context-editor"></div>
                </div>
                <div class="universal-context-drawer-footer">
                    <button class="universal-context-copy" title="Copy to clipboard">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                        </svg>
                        Copy JSON
                    </button>
                    <span class="universal-context-info">Read-only view</span>
                </div>
            </div>
        `;

        // Append to body
        document.body.appendChild(widget);
        document.body.appendChild(drawer);

        // Initialize Ace Editor
        const editor = ace.edit('universal-context-editor');
        editor.setTheme('ace/theme/monokai');
        editor.session.setMode('ace/mode/json');
        editor.setReadOnly(true);
        editor.setOptions({
            fontSize: '14px',
            showPrintMargin: false,
            highlightActiveLine: false,
            showGutter: true,
            displayIndentGuides: true,
            wrap: true
        });

        // Set context data - it's already formatted from the script tag
        editor.setValue(contextScript.textContent.trim(), -1);

        // Toggle drawer
        const toggleBtn = widget.querySelector('.universal-context-toggle');
        const overlay = drawer.querySelector('.universal-context-drawer-overlay');
        const closeBtn = drawer.querySelector('.universal-context-close');
        const copyBtn = drawer.querySelector('.universal-context-copy');

        function openDrawer() {
            drawer.classList.add('is-open');
            document.body.style.overflow = 'hidden';
        }

        function closeDrawer() {
            drawer.classList.remove('is-open');
            document.body.style.overflow = '';
        }

        toggleBtn.addEventListener('click', openDrawer);
        overlay.addEventListener('click', closeDrawer);
        closeBtn.addEventListener('click', closeDrawer);

        // ESC key to close
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && drawer.classList.contains('is-open')) {
                closeDrawer();
            }
        });

        // Copy to clipboard
        copyBtn.addEventListener('click', function() {
            const text = editor.getValue();

            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(text).then(function() {
                    showCopySuccess(copyBtn);
                }).catch(function(err) {
                    console.error('Failed to copy:', err);
                    fallbackCopy(text, copyBtn);
                });
            } else {
                fallbackCopy(text, copyBtn);
            }
        });

        function fallbackCopy(text, button) {
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();

            try {
                document.execCommand('copy');
                showCopySuccess(button);
            } catch (err) {
                console.error('Fallback copy failed:', err);
            }

            document.body.removeChild(textarea);
        }

        function showCopySuccess(button) {
            const originalText = button.innerHTML;
            button.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="20 6 9 17 4 12"/>
                </svg>
                Copied!
            `;
            button.classList.add('is-success');

            setTimeout(function() {
                button.innerHTML = originalText;
                button.classList.remove('is-success');
            }, 2000);
        }

        // Auto-open if ?context=true is in URL (for first time)
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('context') === 'true') {
            // Small delay to ensure everything is loaded
            setTimeout(openDrawer, 100);
        }
    }
})();
