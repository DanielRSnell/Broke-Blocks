import React, { useEffect, useRef } from 'react';

const { __ } = wp.i18n;

function AceEditor({ value, onChange, mode = 'html', theme = 'monokai', height = '400px', ...props }) {
  const editorRef = useRef(null);
  const aceEditorRef = useRef(null);

  useEffect(() => {
    if (!editorRef.current || !window.ace) {
      console.error('Ace editor or container not available');
      return;
    }

    // Initialize Ace Editor
    const editor = window.ace.edit(editorRef.current);
    aceEditorRef.current = editor;

    // Configure editor
    editor.setTheme(`ace/theme/${theme}`);
    editor.session.setMode(`ace/mode/${mode}`);

    editor.setOptions({
      fontSize: 14,
      fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
      showPrintMargin: false,
      wrap: true,
      enableBasicAutocompletion: true,
      enableLiveAutocompletion: true,
      enableSnippets: true,
      tabSize: 2,
      useSoftTabs: true
    });

    // Enable Emmet extension if available
    if (window.ace.require && mode === 'html') {
      try {
        const emmet = window.ace.require('ace/ext/emmet');
        editor.setOption('enableEmmet', true);
      } catch (e) {
        console.warn('Emmet extension not available:', e);
      }
    }

    // Beautify HTML on load if available
    let initialValue = value || '';
    if (window.html_beautify && initialValue && mode === 'html') {
      try {
        initialValue = window.html_beautify(initialValue, {
          indent_size: 2,
          indent_char: ' ',
          max_preserve_newlines: 2,
          preserve_newlines: true,
          indent_inner_html: true,
          wrap_line_length: 0
        });
      } catch (e) {
        console.warn('Initial beautification failed:', e);
      }
    }

    // Set initial value (beautified if HTML)
    editor.setValue(initialValue, -1);

    // Listen for changes
    editor.session.on('change', () => {
      const newValue = editor.getValue();
      if (newValue !== value && onChange) {
        onChange(newValue);
      }
    });

    // Add beautify command for manual use
    if (window.html_beautify) {
      editor.commands.addCommand({
        name: 'beautifyHTML',
        bindKey: { win: 'Ctrl-Alt-F', mac: 'Cmd-Alt-F' },
        exec: function(editor) {
          const content = editor.getValue();
          try {
            const beautified = window.html_beautify(content, {
              indent_size: 2,
              indent_char: ' ',
              max_preserve_newlines: 2,
              preserve_newlines: true,
              indent_inner_html: true,
              wrap_line_length: 0
            });
            editor.setValue(beautified, -1);
          } catch (e) {
            console.error('HTML beautification failed:', e);
          }
        }
      });
    }

    // Cleanup function
    return () => {
      if (aceEditorRef.current) {
        aceEditorRef.current.destroy();
        aceEditorRef.current = null;
      }
    };
  }, []);

  // Update value when prop changes
  useEffect(() => {
    if (aceEditorRef.current && aceEditorRef.current.getValue() !== value) {
      aceEditorRef.current.setValue(value || '', -1);
    }
  }, [value]);

  return (
    <div
      ref={editorRef}
      style={{
        width: '100%',
        height: height,
        ...props.style
      }}
    />
  );
}

export default AceEditor;